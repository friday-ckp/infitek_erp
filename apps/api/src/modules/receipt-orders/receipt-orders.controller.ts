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
import { CreateReceiptOrderDto } from './dto/create-receipt-order.dto';
import { QueryReceiptPurchaseOrderDto } from './dto/query-receipt-purchase-order.dto';
import { ReceiptOrdersService } from './receipt-orders.service';

@Controller('receipt-orders')
export class ReceiptOrdersController {
  constructor(private readonly receiptOrdersService: ReceiptOrdersService) {}

  @Get('purchase-order-options')
  getPurchaseOrderOptions(@Query() query: QueryReceiptPurchaseOrderDto) {
    return this.receiptOrdersService.getPurchaseOrderOptions(query);
  }

  @Get('create-prefill')
  getCreatePrefill(
    @Query('purchaseOrderId', ParseIntPipe) purchaseOrderId: number,
  ) {
    return this.receiptOrdersService.getCreatePrefill(purchaseOrderId);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.receiptOrdersService.findById(id);
  }

  @Post()
  create(
    @Body() dto: CreateReceiptOrderDto,
    @CurrentUser() user: { username?: string },
  ) {
    return this.receiptOrdersService.create(dto, user?.username);
  }
}
