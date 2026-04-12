import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CancelSaleDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  reason!: string;
}
