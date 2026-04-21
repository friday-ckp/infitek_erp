import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { SpusService } from './spus.service';
import { CreateSpuDto } from './dto/create-spu.dto';
import { UpdateSpuDto } from './dto/update-spu.dto';
import { QuerySpuDto } from './dto/query-spu.dto';

@Controller('spus')
export class SpusController {
  constructor(private readonly spusService: SpusService) {}

  @Get()
  findAll(@Query() query: QuerySpuDto) {
    return this.spusService.findAll(query);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.spusService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateSpuDto, @CurrentUser() user: { username?: string }) {
    return this.spusService.create(dto, user?.username);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSpuDto,
    @CurrentUser() user: { username?: string },
  ) {
    return this.spusService.update(id, dto, user?.username);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.spusService.delete(id);
  }
}
