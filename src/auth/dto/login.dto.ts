import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
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
}
