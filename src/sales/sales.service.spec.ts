import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ProductsService } from '../products/products.service';
import { Product } from '../products/product.entity';
import { SaleItem } from './sale-item.entity';
import { Sale } from './sale.entity';
import { SalesService } from './sales.service';
import { SaleItemPricingMode } from './dto/create-sale.dto';

describe('SalesService', () => {
  const salesRepository = {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
  };
  const saleItemsRepository = {
    createQueryBuilder: jest.fn(),
  };
  const productsService = {
    findEntityById: jest.fn(),
  };
  const dataSource = {
    transaction: jest.fn(),
  };

  let service: SalesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        SalesService,
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: getRepositoryToken(Sale),
          useValue: salesRepository,
        },
        {
          provide: getRepositoryToken(SaleItem),
          useValue: saleItemsRepository,
        },
        {
          provide: ProductsService,
          useValue: productsService,
        },
      ],
    }).compile();

    service = moduleRef.get(SalesService);
  });

  it('rejects sales when stock is insufficient', async () => {
    productsService.findEntityById.mockResolvedValueOnce({
      id: 'product-1',
      name: 'Product 1',
      isActive: true,
      stockQuantity: 1,
      regularPrice: '10.00',
      salePrice: null,
    } as Product);

    await expect(
      service.create(
        {
          occurredAt: new Date().toISOString(),
          items: [{ productId: 'product-1', quantity: 2 }],
        },
        {
          sub: 'user-1',
          username: 'admin',
          roleId: 'role-1',
          roleCode: 'admin',
        },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects cancellation when the sale does not exist', async () => {
    dataSource.transaction.mockImplementation(
      (
        callback: (manager: {
          getRepository: () => { findOne: jest.Mock };
        }) => Promise<unknown>,
      ) =>
        Promise.resolve(
          callback({
            getRepository: () => ({
              findOne: jest.fn().mockResolvedValue(null),
            }),
          }),
        ),
    );

    await expect(
      service.cancel(
        'missing-sale',
        { reason: 'Mistake' },
        {
          sub: 'user-1',
          username: 'admin',
          roleId: 'role-1',
          roleCode: 'admin',
        },
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('uses regular price when the sale item requests it', async () => {
    const product = {
      id: 'product-1',
      name: 'Product 1',
      isActive: true,
      stockQuantity: 5,
      regularPrice: '20.00',
      salePrice: '15.00',
      barcode: null,
    } as Product;

    productsService.findEntityById.mockResolvedValue(product);
    const productRepository = {
      create: jest.fn(),
      save: jest.fn((value: Product) => Promise.resolve(value)),
      findOneOrFail: jest.fn(),
    };
    const saleRepository = {
      create: jest.fn((value: unknown) => value),
      save: jest.fn((value: unknown) => Promise.resolve(value)),
      findOneOrFail: jest.fn(() =>
        Promise.resolve({
          id: 'sale-1',
          occurredAt: new Date(),
          createdByUserId: 'user-1',
          subtotal: '40.00',
          discountTotal: '0.00',
          total: '40.00',
          hasDiscount: false,
          status: 'completed',
          items: [
            {
              id: 'item-1',
              productId: 'product-1',
              quantity: 2,
              unitPrice: '20.00',
              discountAmount: '0.00',
              lineTotal: '40.00',
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
    };
    const saleItemRepository = {
      create: jest.fn((value: unknown) => value),
      save: jest.fn((value: unknown) => Promise.resolve(value)),
      findOneOrFail: jest.fn(),
    };

    dataSource.transaction.mockImplementation(
      async (
        callback: (manager: {
          getRepository: (entity: unknown) => {
            create: jest.Mock;
            save: jest.Mock;
            findOneOrFail: jest.Mock;
          };
        }) => Promise<Sale>,
      ) =>
        callback({
          getRepository: (entity: unknown) =>
            entity === Product
              ? productRepository
              : entity === Sale
                ? saleRepository
                : saleItemRepository,
        }),
    );

    const sale = await service.create(
      {
        occurredAt: new Date().toISOString(),
        items: [
          {
            productId: 'product-1',
            quantity: 2,
            pricingMode: SaleItemPricingMode.REGULAR,
          },
        ],
      },
      {
        sub: 'user-1',
        username: 'admin',
        roleId: 'role-1',
        roleCode: 'admin',
      },
    );

    expect(Number(sale.total)).toBe(40);
    expect(Number(sale.items[0]?.unitPrice)).toBe(20);
  });
});
