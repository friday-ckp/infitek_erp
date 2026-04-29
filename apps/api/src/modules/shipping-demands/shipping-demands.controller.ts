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
import { ConfirmShippingDemandAllocationDto } from './dto/confirm-shipping-demand-allocation.dto';
import { QueryShippingDemandDto } from './dto/query-shipping-demand.dto';
import { ShippingDemandsService } from './shipping-demands.service';

@Controller('shipping-demands')
export class ShippingDemandsController {
  constructor(
    private readonly shippingDemandsService: ShippingDemandsService,
  ) {}

  @Get()
  findAll(@Query() query: QueryShippingDemandDto) {
    return this.shippingDemandsService.findAll(query);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.shippingDemandsService.findById(id);
  }

  @Post(':id/confirm-allocation')
  confirmAllocation(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConfirmShippingDemandAllocationDto,
    @CurrentUser() user: { username?: string },
  ) {
    return this.shippingDemandsService.confirmAllocation(
      id,
      dto,
      user?.username,
    );
  }

  @Post(':id/void')
  voidDemand(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { username?: string },
  ) {
    return this.shippingDemandsService.voidDemand(id, user?.username);
  }

  @Post('generate-from-sales-order/:salesOrderId')
  generateFromSalesOrder(
    @Param('salesOrderId', ParseIntPipe) salesOrderId: number,
    @CurrentUser() user: { username?: string },
  ) {
    return this.shippingDemandsService.generateFromSalesOrder(
      salesOrderId,
      user?.username,
    );
  }
}
