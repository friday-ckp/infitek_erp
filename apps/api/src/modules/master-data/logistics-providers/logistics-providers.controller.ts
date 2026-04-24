import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CreateLogisticsProviderDto } from './dto/create-logistics-provider.dto';
import { QueryLogisticsProviderDto } from './dto/query-logistics-provider.dto';
import { UpdateLogisticsProviderDto } from './dto/update-logistics-provider.dto';
import { LogisticsProvidersService } from './logistics-providers.service';

@Controller('logistics-providers')
export class LogisticsProvidersController {
  constructor(
    private readonly logisticsProvidersService: LogisticsProvidersService,
  ) {}

  @Get()
  findAll(@Query() query: QueryLogisticsProviderDto) {
    return this.logisticsProvidersService.findAll(query);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.logisticsProvidersService.findById(id);
  }

  @Post()
  create(
    @Body() dto: CreateLogisticsProviderDto,
    @CurrentUser() user: { username?: string },
  ) {
    return this.logisticsProvidersService.create(dto, user?.username);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLogisticsProviderDto,
    @CurrentUser() user: { username?: string },
  ) {
    return this.logisticsProvidersService.update(id, dto, user?.username);
  }
}
