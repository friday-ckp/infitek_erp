import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateOutboundOrderDto } from './dto/create-outbound-order.dto';
import { QueryOutboundCreatePrefillDto } from './dto/query-outbound-create-prefill.dto';
import { OutboundOrdersService } from './outbound-orders.service';

@Controller('outbound-orders')
export class OutboundOrdersController {
  constructor(
    private readonly outboundOrdersService: OutboundOrdersService,
  ) {}

  @Get('create-prefill')
  getCreatePrefill(@Query() query: QueryOutboundCreatePrefillDto) {
    return this.outboundOrdersService.getCreatePrefill(query.logisticsOrderId);
  }

  @Post()
  create(
    @Body() dto: CreateOutboundOrderDto,
    @CurrentUser() user: { username?: string },
  ) {
    return this.outboundOrdersService.create(dto, user?.username);
  }
}
