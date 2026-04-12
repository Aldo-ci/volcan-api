import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../common/interfaces/jwt-payload.interface';
import { CancelSaleDto } from './dto/cancel-sale.dto';
import { CreateSaleDto, SaleResponseDto } from './dto/create-sale.dto';
import { QuerySalesDto } from './dto/query-sales.dto';
import { SalesService } from './sales.service';

@ApiTags('sales')
@ApiBearerAuth()
@Roles('admin')
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @ApiCreatedResponse({ type: SaleResponseDto })
  create(
    @Body() dto: CreateSaleDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.salesService.create(dto, currentUser);
  }

  @Get()
  @ApiOkResponse({ type: SaleResponseDto, isArray: true })
  findAll(@Query() query: QuerySalesDto) {
    return this.salesService.findAll(query);
  }

  @Get('summary')
  @ApiOkResponse({
    schema: {
      example: {
        totalSold: '120.00',
        subtotal: '130.00',
        discountTotal: '10.00',
        tickets: 4,
        totalUnits: 10,
      },
    },
  })
  summary(@Query() query: QuerySalesDto) {
    return this.salesService.getSummary(query);
  }

  @Get(':id')
  @ApiOkResponse({ type: SaleResponseDto })
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  @Post(':id/cancel')
  @ApiOkResponse({ type: SaleResponseDto })
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelSaleDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.salesService.cancel(id, dto, currentUser);
  }
}
