import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export enum SaleItemPricingMode {
  REGULAR = 'regular',
  SALE = 'sale',
}

export class CreateSaleItemDto {
  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({
    enum: SaleItemPricingMode,
    default: SaleItemPricingMode.SALE,
  })
  @IsEnum(SaleItemPricingMode)
  @IsOptional()
  pricingMode?: SaleItemPricingMode;
}

export class CreateSaleDto {
  @ApiProperty()
  @IsDateString()
  occurredAt!: string;

  @ApiPropertyOptional({ default: 0 })
  @Min(0)
  @IsOptional()
  discountTotal?: number;

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(255)
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: [CreateSaleItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items!: CreateSaleItemDto[];
}

export class SaleItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  quantity!: number;

  @ApiPropertyOptional()
  productNameSnapshot?: string | null;

  @ApiPropertyOptional()
  productBarcodeSnapshot?: string | null;

  @ApiPropertyOptional()
  unitPrice?: string | null;

  @ApiProperty()
  discountAmount!: string;

  @ApiPropertyOptional()
  lineTotal?: string | null;
}

export class SaleResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  occurredAt!: Date;

  @ApiPropertyOptional()
  createdByUserId?: string | null;

  @ApiPropertyOptional()
  subtotal?: string | null;

  @ApiProperty()
  discountTotal!: string;

  @ApiProperty()
  total!: string;

  @ApiProperty()
  hasDiscount!: boolean;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiProperty()
  status!: string;

  @ApiPropertyOptional()
  cancelledAt?: Date | null;

  @ApiPropertyOptional()
  cancelledByUserId?: string | null;

  @ApiPropertyOptional()
  cancellationReason?: string | null;

  @ApiProperty({ type: [SaleItemResponseDto] })
  items!: SaleItemResponseDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
