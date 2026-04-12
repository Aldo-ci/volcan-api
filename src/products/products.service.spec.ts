import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductCategoriesService } from '../product-categories/product-categories.service';
import { Product } from './product.entity';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  const productsRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
    softRemove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: productsRepository,
        },
        {
          provide: ProductCategoriesService,
          useValue: {
            exists: jest.fn().mockResolvedValue(true),
            toResponseDto: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(ProductsService);
  });

  it('rejects sale prices greater than the regular price', async () => {
    await expect(
      service.create({
        name: 'T-Shirt',
        categoryId: 'd1494e1c-80d7-4dad-83c3-11a4f717fdbb',
        regularPrice: 10,
        salePrice: 12,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('defaults sale price to regular price when not provided', async () => {
    productsRepository.create.mockImplementation((value: unknown) => value);
    productsRepository.save.mockImplementation((value: unknown) =>
      Promise.resolve(value),
    );

    const result = await service.create({
      name: 'Cap',
      categoryId: 'd1494e1c-80d7-4dad-83c3-11a4f717fdbb',
      regularPrice: 25,
    });

    expect(result.salePrice).toBe('25.00');
  });
});
