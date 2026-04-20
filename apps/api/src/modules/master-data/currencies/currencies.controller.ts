import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { QueryCurrencyDto } from './dto/query-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';
import { CurrenciesService } from './currencies.service';

@Controller('currencies')
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Get()
  findAll(@Query() query: QueryCurrencyDto) {
    return this.currenciesService.findAll(query);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.currenciesService.findById(id);
  }

  @Post()
  create(
    @Body() dto: CreateCurrencyDto,
    @CurrentUser() user: { username?: string },
  ) {
    return this.currenciesService.create(dto, user?.username);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCurrencyDto,
    @CurrentUser() user: { username?: string },
  ) {
    return this.currenciesService.update(id, dto, user?.username);
  }
}
