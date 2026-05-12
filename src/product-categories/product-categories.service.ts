import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { buildPaginatedResponse } from '../common/dto/paginated-response.dto';
import {
  CreateProductCategoryDto,
  ProductCategoryResponseDto,
} from './dto/create-product-category.dto';
import { QueryProductCategoriesDto } from './dto/query-product-categories.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { ProductCategory } from './product-category.entity';

@Injectable()
export class ProductCategoriesService {
  constructor(
    @InjectRepository(ProductCategory)
    private readonly categoriesRepository: Repository<ProductCategory>,
  ) {}

  async create(
    dto: CreateProductCategoryDto,
  ): Promise<ProductCategoryResponseDto> {
    await this.ensureUnique(dto.name);
    const category = this.categoriesRepository.create({
      id: randomUUID(),
      name: dto.name,
      description: dto.description,
      isActive: dto.isActive ?? true,
    });

    return this.toResponseDto(await this.categoriesRepository.save(category));
  }

  async findAll(query: QueryProductCategoriesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const queryBuilder =
      this.categoriesRepository.createQueryBuilder('category');

    if (query.search) {
      queryBuilder.where('LOWER(category.name) LIKE LOWER(:search)', {
        search: `%${query.search}%`,
      });
    }

    if (query.isActive !== undefined) {
      queryBuilder.andWhere('category.is_active = :isActive', {
        isActive: query.isActive,
      });
    }

    queryBuilder.orderBy('category.name', 'ASC');
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [categories, total] = await queryBuilder.getManyAndCount();
    return buildPaginatedResponse(
      categories.map((category) => this.toResponseDto(category)),
      total,
      page,
      limit,
    );
  }

  async findOne(id: string): Promise<ProductCategoryResponseDto> {
    return this.toResponseDto(await this.getById(id));
  }

  async update(
    id: string,
    dto: UpdateProductCategoryDto,
  ): Promise<ProductCategoryResponseDto> {
    const category = await this.getById(id);

    if (dto.name && dto.name !== category.name) {
      await this.ensureUnique(dto.name, id);
    }

    Object.assign(category, dto);
    return this.toResponseDto(await this.categoriesRepository.save(category));
  }

  async exists(id: string): Promise<boolean> {
    return this.categoriesRepository.exists({ where: { id } });
  }

  async findEntityById(id: string): Promise<ProductCategory> {
    return this.getById(id);
  }

  toResponseDto(category: ProductCategory): ProductCategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  private async getById(id: string): Promise<ProductCategory> {
    const category = await this.categoriesRepository.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException('Product category not found');
    }

    return category;
  }

  private async ensureUnique(
    name?: string,
    ignoreId?: string,
  ): Promise<void> {
    if (name) {
      const existing = await this.categoriesRepository.findOne({
        where: { name },
      });
      if (existing && existing.id !== ignoreId) {
        throw new ConflictException('Category name already exists');
      }
    }
  }
}
