import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateOpeningInventoryDto } from './dto/create-opening-inventory.dto';
import { QueryAvailableInventoryDto } from './dto/query-available-inventory.dto';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('available')
  findAvailable(@Query() query: QueryAvailableInventoryDto) {
    return this.inventoryService.findAvailable(query);
  }

  @Get('batches')
  findBatches(@Query() query: QueryAvailableInventoryDto) {
    return this.inventoryService.findBatches(query);
  }

  @Post('opening-balances')
  recordOpeningBalance(
    @Body() dto: CreateOpeningInventoryDto,
    @CurrentUser() user: { username?: string },
  ) {
    return this.inventoryService.recordOpeningBalance(dto, user?.username);
  }
}
