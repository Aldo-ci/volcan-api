import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ProductCategoryResponseDto } from '../../product-categories/dto/create-product-category.dto';

export class CreateProductDto {
  @ApiPropertyOptional()
  @IsString()
  @MaxLength(100)
  @IsOptional()
  barcode?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(255)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ default: '' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  imageUrl?: string;

  @ApiProperty()
  @IsUUID()
  categoryId!: string;

  @ApiProperty()
  @Min(0)
  regularPrice!: number;

  @ApiPropertyOptional()
  @Min(0)
  @IsOptional()
  salePrice?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  stockQuantity?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  minimumStock?: number;

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(50)
  @IsOptional()
  color?: string;

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(50)
  @IsOptional()
  size?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class ProductResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional()
  barcode?: string | null;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty()
  imageUrl!: string;

  @ApiProperty()
  categoryId!: string;

  @ApiPropertyOptional({ type: ProductCategoryResponseDto })
  category?: ProductCategoryResponseDto;

  @ApiProperty()
  regularPrice!: string;

  @ApiPropertyOptional()
  salePrice?: string | null;

  @ApiProperty()
  stockQuantity!: number;

  @ApiProperty()
  minimumStock!: number;

  @ApiPropertyOptional()
  color?: string | null;

  @ApiPropertyOptional()
  size?: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiPropertyOptional()
  deletedAt?: Date | null;
}
