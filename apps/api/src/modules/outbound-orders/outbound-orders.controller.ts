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
import { CreateOutboundOrderDto } from './dto/create-outbound-order.dto';
import { QueryOutboundOrderDto } from './dto/query-outbound-order.dto';
import { QueryOutboundCreatePrefillDto } from './dto/query-outbound-create-prefill.dto';
import { OutboundOrdersService } from './outbound-orders.service';

@Controller('outbound-orders')
export class OutboundOrdersController {
  constructor(
    private readonly outboundOrdersService: OutboundOrdersService,
  ) {}

  @Get()
  findAll(@Query() query: QueryOutboundOrderDto) {
    return this.outboundOrdersService.findAll(query);
  }

  @Get('create-prefill')
  getCreatePrefill(@Query() query: QueryOutboundCreatePrefillDto) {
    return this.outboundOrdersService.getCreatePrefill(query.logisticsOrderId);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.outboundOrdersService.findById(id);
  }

  @Post()
  create(
    @Body() dto: CreateOutboundOrderDto,
    @CurrentUser() user: { username?: string },
  ) {
    return this.outboundOrdersService.create(dto, user?.username);
  }
}
