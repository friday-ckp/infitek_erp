import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateLogisticsOrderDto } from './dto/create-logistics-order.dto';
import { QueryLogisticsOrderDto } from './dto/query-logistics-order.dto';
import { UpdateLogisticsTrackingDto } from './dto/update-logistics-tracking.dto';
import { LogisticsOrdersService } from './logistics-orders.service';

@Controller('logistics-orders')
export class LogisticsOrdersController {
  constructor(
    private readonly logisticsOrdersService: LogisticsOrdersService,
  ) {}

  @Get()
  findAll(@Query() query: QueryLogisticsOrderDto) {
    return this.logisticsOrdersService.findAll(query);
  }

  @Get('create-prefill')
  getCreatePrefill(
    @Query('shippingDemandId', ParseIntPipe) shippingDemandId: number,
  ) {
    return this.logisticsOrdersService.getCreatePrefill(shippingDemandId);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.logisticsOrdersService.findById(id);
  }

  @Patch(':id/tracking')
  updateTracking(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLogisticsTrackingDto,
    @CurrentUser() user: { username?: string },
  ) {
    return this.logisticsOrdersService.updateTracking(id, dto, user?.username);
  }

  @Post()
  create(
    @Body() dto: CreateLogisticsOrderDto,
    @CurrentUser() user: { username?: string },
  ) {
    return this.logisticsOrdersService.create(dto, user?.username);
  }
}
