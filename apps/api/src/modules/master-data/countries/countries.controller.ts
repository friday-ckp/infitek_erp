import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CreateCountryDto } from './dto/create-country.dto';
import { QueryCountryDto } from './dto/query-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { CountriesService } from './countries.service';

@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Get()
  findAll(@Query() query: QueryCountryDto) {
    return this.countriesService.findAll(query);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.countriesService.findById(id);
  }

  @Post()
  create(
    @Body() dto: CreateCountryDto,
    @CurrentUser() user: { username?: string },
  ) {
    return this.countriesService.create(dto, user?.username);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCountryDto,
    @CurrentUser() user: { username?: string },
  ) {
    return this.countriesService.update(id, dto, user?.username);
  }
}
