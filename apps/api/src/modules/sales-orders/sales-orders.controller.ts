import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { QuerySalesOrderOptionsDto } from './dto/query-sales-order-options.dto';
import { QuerySalesOrderDto } from './dto/query-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { SalesOrdersService } from './sales-orders.service';

@Controller('sales-orders')
export class SalesOrdersController {
  constructor(private readonly salesOrdersService: SalesOrdersService) {}

  @Get()
  findAll(@Query() query: QuerySalesOrderDto) {
    return this.salesOrdersService.findAll(query);
  }

  @Get('options')
  getOptions(@Query() query: QuerySalesOrderOptionsDto) {
    return this.salesOrdersService.getOptions(query);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.salesOrdersService.findById(id);
  }

  @Post()
  create(
    @Body() dto: CreateSalesOrderDto,
    @CurrentUser() user: { username?: string },
  ) {
    return this.salesOrdersService.create(dto, user?.username);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSalesOrderDto,
    @CurrentUser() user: { username?: string },
  ) {
    return this.salesOrdersService.update(id, dto, user?.username);
  }

  @Post(':id/submit')
  submit(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { username?: string },
  ) {
    return this.salesOrdersService.submit(id, user?.username);
  }

  @Post(':id/approve')
  approve(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { username?: string },
  ) {
    return this.salesOrdersService.approve(id, user?.username);
  }

  @Post(':id/reject')
  reject(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { username?: string },
  ) {
    return this.salesOrdersService.reject(id, user?.username);
  }

  @Post(':id/void')
  voidOrder(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { username?: string },
  ) {
    return this.salesOrdersService.void(id, user?.username);
  }
}
