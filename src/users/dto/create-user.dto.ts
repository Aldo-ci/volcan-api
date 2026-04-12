import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { RoleResponseDto } from '../../roles/dto/create-role.dto';

export class CreateUserDto {
  @ApiPropertyOptional()
  @IsString()
  @MaxLength(191)
  @IsOptional()
  legacyUserId?: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  username!: string;

  @ApiProperty()
  @IsString()
  @MinLength(4)
  @MaxLength(100)
  password!: string;

  @ApiProperty()
  @IsUUID()
  roleId!: string;

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(100)
  @IsOptional()
  legacyRoleName?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional()
  legacyUserId?: string | null;

  @ApiProperty()
  username!: string;

  @ApiPropertyOptional()
  roleId?: string | null;

  @ApiPropertyOptional({ type: RoleResponseDto })
  role?: RoleResponseDto | null;

  @ApiPropertyOptional()
  legacyRoleName?: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiPropertyOptional()
  deletedAt?: Date | null;
}
