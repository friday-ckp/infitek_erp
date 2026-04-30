import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreatePurchaseOrdersFromShippingDemandDto } from './dto/create-from-shipping-demand.dto';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { QueryPurchaseOrderDto } from './dto/query-purchase-order.dto';
import { PurchaseOrdersService } from './purchase-orders.service';

@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Get()
  findAll(@Query() query: QueryPurchaseOrderDto) {
    return this.purchaseOrdersService.findAll(query);
  }

  @Get('create-prefill')
  getCreatePrefill(
    @Query('shippingDemandId', ParseIntPipe) shippingDemandId: number,
  ) {
    return this.purchaseOrdersService.getCreatePrefill(shippingDemandId);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.purchaseOrdersService.findById(id);
  }

  @Post()
  create(
    @Body() dto: CreatePurchaseOrderDto,
    @CurrentUser() user: { username?: string },
  ) {
    return this.purchaseOrdersService.create(dto, user?.username);
  }

  @Post('from-shipping-demand')
  createFromShippingDemand(
    @Body() dto: CreatePurchaseOrdersFromShippingDemandDto,
    @CurrentUser() user: { username?: string },
  ) {
    return this.purchaseOrdersService.createFromShippingDemand(
      dto,
      user?.username,
    );
  }

  @Post(':id/confirm-internal')
  confirmInternal(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { username?: string },
  ) {
    return this.purchaseOrdersService.confirmInternal(id, user?.username);
  }

  @Post(':id/confirm-supplier')
  confirmSupplier(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { username?: string },
  ) {
    return this.purchaseOrdersService.confirmSupplier(id, user?.username);
  }
}
