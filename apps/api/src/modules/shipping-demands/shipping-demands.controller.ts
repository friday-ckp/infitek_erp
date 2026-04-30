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
import { ConfirmShippingDemandAllocationDto } from './dto/confirm-shipping-demand-allocation.dto';
import { QueryShippingDemandDto } from './dto/query-shipping-demand.dto';
import { UpdateShippingDemandItemSupplierDto } from './dto/update-shipping-demand-item-supplier.dto';
import { UpdateShippingDemandDto } from './dto/update-shipping-demand.dto';
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

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateShippingDemandDto,
    @CurrentUser() user: { username?: string },
  ) {
    return this.shippingDemandsService.update(id, dto, user?.username);
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

  @Patch(':id/items/:itemId/purchase-supplier')
  updateItemPurchaseSupplier(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateShippingDemandItemSupplierDto,
    @CurrentUser() user: { username?: string },
  ) {
    return this.shippingDemandsService.updateItemPurchaseSupplier(
      id,
      itemId,
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
