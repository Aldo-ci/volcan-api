import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Brackets, Repository } from 'typeorm';
import { buildPaginatedResponse } from '../common/dto/paginated-response.dto';
import { ProductCategoriesService } from '../product-categories/product-categories.service';
import { CreateProductDto, ProductResponseDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    private readonly categoriesService: ProductCategoriesService,
  ) {}

  async create(dto: CreateProductDto): Promise<ProductResponseDto> {
    const salePrice = dto.salePrice ?? dto.regularPrice;
    this.validatePrices(dto.regularPrice, salePrice);
    await this.ensureUnique(dto.barcode);
    await this.ensureCategoryExists(dto.categoryId);

    const product = this.productsRepository.create({
      id: randomUUID(),
      barcode: dto.barcode,
      name: dto.name,
      description: dto.description,
      imageUrl: dto.imageUrl ?? '',
      categoryId: dto.categoryId,
      regularPrice: dto.regularPrice.toFixed(2),
      salePrice: salePrice.toFixed(2),
      stockQuantity: dto.stockQuantity ?? 0,
      minimumStock: dto.minimumStock ?? 0,
      color: dto.color,
      size: dto.size,
      isActive: dto.isActive ?? true,
    });

    return this.toResponseDto(await this.productsRepository.save(product));
  }

  async findAll(query: QueryProductsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const queryBuilder = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.deletedAt IS NULL');

    if (query.search) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(product.name) LIKE LOWER(:search)', {
            search: `%${query.search}%`,
          }).orWhere('product.barcode LIKE :search', {
            search: `%${query.search}%`,
          });
        }),
      );
    }

    if (query.categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    if (query.isActive !== undefined) {
      queryBuilder.andWhere('product.isActive = :isActive', {
        isActive: query.isActive,
      });
    }

    if (query.lowStock) {
      queryBuilder.andWhere('product.stockQuantity <= product.minimumStock');
    }

    queryBuilder.orderBy('product.createdAt', 'DESC');
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [products, total] = await queryBuilder.getManyAndCount();
    return buildPaginatedResponse(
      products.map((product) => this.toResponseDto(product)),
      total,
      page,
      limit,
    );
  }

  async findLowStock() {
    const products = await this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.deleted_at IS NULL')
      .andWhere('product.stock_quantity <= product.minimum_stock')
      .orderBy('product.stock_quantity', 'ASC')
      .getMany();

    return products.map((product) => this.toResponseDto(product));
  }

  async findOne(id: string): Promise<ProductResponseDto> {
    return this.toResponseDto(await this.getById(id));
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductResponseDto> {
    const product = await this.getById(id);
    const nextRegularPrice = dto.regularPrice ?? Number(product.regularPrice);
    const nextSalePrice =
      dto.salePrice ??
      (dto.regularPrice !== undefined
        ? dto.regularPrice
        : Number(product.salePrice ?? product.regularPrice));

    this.validatePrices(nextRegularPrice, nextSalePrice);

    if (dto.barcode && dto.barcode !== product.barcode) {
      await this.ensureUnique(dto.barcode, id);
    }

    if (dto.categoryId && dto.categoryId !== product.categoryId) {
      await this.ensureCategoryExists(dto.categoryId);
      product.categoryId = dto.categoryId;
    }

    product.barcode = dto.barcode ?? product.barcode;
    product.name = dto.name ?? product.name;
    product.description = dto.description ?? product.description;
    product.imageUrl = dto.imageUrl ?? product.imageUrl;
    product.regularPrice = nextRegularPrice.toFixed(2);
    product.salePrice = nextSalePrice.toFixed(2);
    product.stockQuantity = dto.stockQuantity ?? product.stockQuantity;
    product.minimumStock = dto.minimumStock ?? product.minimumStock;
    product.color = dto.color ?? product.color;
    product.size = dto.size ?? product.size;
    product.isActive = dto.isActive ?? product.isActive;

    return this.toResponseDto(await this.productsRepository.save(product));
  }

  async softDelete(id: string): Promise<void> {
    const product = await this.getById(id);
    await this.productsRepository.softRemove(product);
  }

  async findEntityById(id: string): Promise<Product> {
    return this.getById(id);
  }

  async save(product: Product): Promise<Product> {
    return this.productsRepository.save(product);
  }

  toResponseDto(product: Product): ProductResponseDto {
    return {
      id: product.id,
      barcode: product.barcode,
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      categoryId: product.categoryId,
      category: product.category
        ? this.categoriesService.toResponseDto(product.category)
        : undefined,
      regularPrice: product.regularPrice,
      salePrice: product.salePrice,
      stockQuantity: product.stockQuantity,
      minimumStock: product.minimumStock,
      color: product.color,
      size: product.size,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      deletedAt: product.deletedAt,
    };
  }

  private async getById(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: { category: true },
    });

    if (!product || product.deletedAt) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  private validatePrices(regularPrice: number, salePrice?: number): void {
    if (regularPrice < 0) {
      throw new BadRequestException('Regular price must be non-negative');
    }

    if (salePrice !== undefined && salePrice < 0) {
      throw new BadRequestException('Sale price must be non-negative');
    }

    if (salePrice !== undefined && salePrice > regularPrice) {
      throw new BadRequestException(
        'Sale price cannot be greater than regular price',
      );
    }
  }

  private async ensureUnique(
    barcode?: string,
    ignoreId?: string,
  ): Promise<void> {
    if (barcode) {
      const existing = await this.productsRepository.findOne({
        where: { barcode },
        withDeleted: true,
      });
      if (existing && existing.id !== ignoreId) {
        throw new ConflictException('Barcode already exists');
      }
    }
  }

  private async ensureCategoryExists(categoryId: string): Promise<void> {
    const categoryExists = await this.categoriesService.exists(categoryId);
    if (!categoryExists) {
      throw new NotFoundException('Product category not found');
    }
  }
}
