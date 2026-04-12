import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryProductsDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => {
    if (value === undefined) {
      return undefined;
    }

    return value === 'true' || value === true;
  })
  @IsBoolean()
  @IsOptional()
  lowStock?: boolean;
}
