import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { buildPaginatedResponse } from '../common/dto/paginated-response.dto';
import { AuthenticatedUser } from '../common/interfaces/jwt-payload.interface';
import { Product } from '../products/product.entity';
import { ProductsService } from '../products/products.service';
import { CancelSaleDto } from './dto/cancel-sale.dto';
import {
  CreateSaleDto,
  SaleItemPricingMode,
  SaleItemResponseDto,
  SaleResponseDto,
} from './dto/create-sale.dto';
import { QuerySalesDto } from './dto/query-sales.dto';
import { SaleItem } from './sale-item.entity';
import { Sale, SaleStatus } from './sale.entity';

type PreparedSaleItem = {
  product: Product;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  pricingMode: SaleItemPricingMode;
};

@Injectable()
export class SalesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Sale)
    private readonly salesRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private readonly saleItemsRepository: Repository<SaleItem>,
    private readonly productsService: ProductsService,
  ) {}

  async create(
    dto: CreateSaleDto,
    currentUser: AuthenticatedUser,
  ): Promise<SaleResponseDto> {
    const discountTotal = dto.discountTotal ?? 0;

    if (discountTotal < 0) {
      throw new BadRequestException('Discount total must be non-negative');
    }

    const preparedItems = await this.prepareItems(dto.items);
    const subtotal = preparedItems.reduce(
      (sum, item) => sum + item.lineTotal,
      0,
    );

    if (discountTotal > subtotal) {
      throw new BadRequestException('Discount total cannot exceed subtotal');
    }

    const total = subtotal - discountTotal;

    const sale = await this.dataSource.transaction(async (manager) => {
      const saleRepository = manager.getRepository(Sale);
      const saleItemRepository = manager.getRepository(SaleItem);
      const productRepository = manager.getRepository(Product);

      const saleEntity = saleRepository.create({
        id: randomUUID(),
        occurredAt: new Date(dto.occurredAt),
        createdByUserId: currentUser.sub,
        subtotal: subtotal.toFixed(2),
        discountTotal: discountTotal.toFixed(2),
        total: total.toFixed(2),
        hasDiscount: discountTotal > 0,
        notes: dto.notes,
        status: SaleStatus.COMPLETED,
      });

      const savedSale = await saleRepository.save(saleEntity);

      for (const item of preparedItems) {
        item.product.stockQuantity -= item.quantity;
        await productRepository.save(item.product);

        const saleItem = saleItemRepository.create({
          id: randomUUID(),
          saleId: savedSale.id,
          productId: item.product.id,
          quantity: item.quantity,
          productNameSnapshot: item.product.name,
          productBarcodeSnapshot: item.product.barcode ?? null,
          unitPrice: item.unitPrice.toFixed(2),
          discountAmount: '0.00',
          lineTotal: item.lineTotal.toFixed(2),
        });

        await saleItemRepository.save(saleItem);
      }

      return saleRepository.findOneOrFail({
        where: { id: savedSale.id },
        relations: { items: true },
      });
    });

    return this.toResponseDto(sale);
  }

  async findAll(query: QuerySalesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const queryBuilder = this.salesRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.items', 'items')
      .where('1=1');

    if (query.from) {
      queryBuilder.andWhere('sale.occurred_at >= :from', { from: query.from });
    }

    if (query.to) {
      queryBuilder.andWhere('sale.occurred_at <= :to', { to: query.to });
    }

    if (query.search) {
      queryBuilder.andWhere('LOWER(sale.notes) LIKE LOWER(:search)', {
        search: `%${query.search}%`,
      });
    }

    queryBuilder.orderBy('sale.occurred_at', 'DESC');
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [sales, total] = await queryBuilder.getManyAndCount();
    return buildPaginatedResponse(
      sales.map((sale) => this.toResponseDto(sale)),
      total,
      page,
      limit,
    );
  }

  async findOne(id: string): Promise<SaleResponseDto> {
    return this.toResponseDto(await this.getById(id));
  }

  async cancel(
    id: string,
    dto: CancelSaleDto,
    currentUser: AuthenticatedUser,
  ): Promise<SaleResponseDto> {
    const cancelledSale = await this.dataSource.transaction(async (manager) => {
      const saleRepository = manager.getRepository(Sale);
      const productRepository = manager.getRepository(Product);

      const sale = await saleRepository.findOne({
        where: { id },
        relations: { items: true },
      });

      if (!sale) {
        throw new NotFoundException('Sale not found');
      }

      if (sale.status === SaleStatus.CANCELLED) {
        throw new BadRequestException('Sale is already cancelled');
      }

      for (const item of sale.items ?? []) {
        const product = await productRepository.findOne({
          where: { id: item.productId },
        });

        if (!product) {
          throw new NotFoundException('Product from sale item was not found');
        }

        product.stockQuantity += item.quantity;
        await productRepository.save(product);
      }

      sale.status = SaleStatus.CANCELLED;
      sale.cancelledAt = new Date();
      sale.cancelledByUserId = currentUser.sub;
      sale.cancellationReason = dto.reason;

      await saleRepository.save(sale);

      return saleRepository.findOneOrFail({
        where: { id: sale.id },
        relations: { items: true },
      });
    });

    return this.toResponseDto(cancelledSale);
  }

  async getSummary(query: QuerySalesDto) {
    const queryBuilder = this.salesRepository.createQueryBuilder('sale');
    queryBuilder.where('sale.status = :status', {
      status: SaleStatus.COMPLETED,
    });

    if (query.from) {
      queryBuilder.andWhere('sale.occurred_at >= :from', { from: query.from });
    }

    if (query.to) {
      queryBuilder.andWhere('sale.occurred_at <= :to', { to: query.to });
    }

    const [sales, items] = await Promise.all([
      queryBuilder.getMany(),
      this.saleItemsRepository
        .createQueryBuilder('item')
        .leftJoin('item.sale', 'sale')
        .where('sale.status = :status', { status: SaleStatus.COMPLETED })
        .getMany(),
    ]);

    const totalSold = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const subtotal = sales.reduce(
      (sum, sale) => sum + Number(sale.subtotal ?? 0),
      0,
    );
    const discountTotal = sales.reduce(
      (sum, sale) => sum + Number(sale.discountTotal),
      0,
    );
    const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      totalSold: totalSold.toFixed(2),
      subtotal: subtotal.toFixed(2),
      discountTotal: discountTotal.toFixed(2),
      tickets: sales.length,
      totalUnits,
    };
  }

  toResponseDto(sale: Sale): SaleResponseDto {
    return {
      id: sale.id,
      occurredAt: sale.occurredAt,
      createdByUserId: sale.createdByUserId,
      subtotal: sale.subtotal,
      discountTotal: sale.discountTotal,
      total: sale.total,
      hasDiscount: sale.hasDiscount,
      notes: sale.notes,
      status: sale.status,
      cancelledAt: sale.cancelledAt,
      cancelledByUserId: sale.cancelledByUserId,
      cancellationReason: sale.cancellationReason,
      items: (sale.items ?? []).map((item) => this.mapSaleItem(item)),
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt,
    };
  }

  private async prepareItems(
    items: CreateSaleDto['items'],
  ): Promise<PreparedSaleItem[]> {
    const preparedItems: PreparedSaleItem[] = [];

    for (const item of items) {
      const product = await this.productsService.findEntityById(item.productId);

      if (!product.isActive) {
        throw new BadRequestException(`Product ${product.name} is inactive`);
      }

      if (product.stockQuantity < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product ${product.name}`,
        );
      }

      const pricingMode = item.pricingMode ?? SaleItemPricingMode.SALE;
      const unitPrice =
        pricingMode === SaleItemPricingMode.REGULAR
          ? Number(product.regularPrice)
          : Number(product.salePrice ?? product.regularPrice);

      preparedItems.push({
        product,
        quantity: item.quantity,
        unitPrice,
        lineTotal: unitPrice * item.quantity,
        pricingMode,
      });
    }

    return preparedItems;
  }

  private async getById(id: string): Promise<Sale> {
    const sale = await this.salesRepository.findOne({
      where: { id },
      relations: { items: true },
    });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    return sale;
  }

  private mapSaleItem(item: SaleItem): SaleItemResponseDto {
    return {
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      productNameSnapshot: item.productNameSnapshot,
      productBarcodeSnapshot: item.productBarcodeSnapshot,
      unitPrice: item.unitPrice,
      discountAmount: item.discountAmount,
      lineTotal: item.lineTotal,
    };
  }
}
