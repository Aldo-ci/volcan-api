import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CreateProductCategoryDto,
  ProductCategoryResponseDto,
} from './dto/create-product-category.dto';
import { QueryProductCategoriesDto } from './dto/query-product-categories.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { ProductCategoriesService } from './product-categories.service';

@ApiTags('product-categories')
@ApiBearerAuth()
@Roles('admin')
@Controller('product-categories')
export class ProductCategoriesController {
  constructor(private readonly categoriesService: ProductCategoriesService) {}

  @Post()
  @ApiCreatedResponse({ type: ProductCategoryResponseDto })
  create(@Body() dto: CreateProductCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Get()
  @ApiOkResponse({ type: ProductCategoryResponseDto, isArray: true })
  findAll(@Query() query: QueryProductCategoriesDto) {
    return this.categoriesService.findAll(query);
  }

  @Get(':id')
  @ApiOkResponse({ type: ProductCategoryResponseDto })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: ProductCategoryResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateProductCategoryDto) {
    return this.categoriesService.update(id, dto);
  }
}
