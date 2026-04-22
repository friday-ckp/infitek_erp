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
import { SpuFaqsService } from './spu-faqs.service';
import { CreateSpuFaqDto } from './dto/create-spu-faq.dto';
import { UpdateSpuFaqDto } from './dto/update-spu-faq.dto';
import { QuerySpuFaqDto } from './dto/query-spu-faq.dto';

@Controller('spu-faqs')
export class SpuFaqsController {
  constructor(private readonly spuFaqsService: SpuFaqsService) {}

  @Get()
  findBySpu(@Query() query: QuerySpuFaqDto) {
    return this.spuFaqsService.findBySpu(query.spuId);
  }

  @Post()
  create(@Body() dto: CreateSpuFaqDto, @CurrentUser() user: { username?: string }) {
    return this.spuFaqsService.create(dto, user?.username);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSpuFaqDto,
    @CurrentUser() user: { username?: string },
  ) {
    return this.spuFaqsService.update(id, dto, user?.username);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.spuFaqsService.delete(id);
  }
}
