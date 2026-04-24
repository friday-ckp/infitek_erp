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
import { ProductDocumentsService } from './product-documents.service';
import { CreateProductDocumentDto } from './dto/create-product-document.dto';
import { UpdateProductDocumentDto } from './dto/update-product-document.dto';
import { QueryProductDocumentDto } from './dto/query-product-document.dto';

@Controller('product-documents')
export class ProductDocumentsController {
  constructor(private readonly productDocumentsService: ProductDocumentsService) {}

  @Get()
  findAll(@Query() query: QueryProductDocumentDto) {
    return this.productDocumentsService.findAll(query);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.productDocumentsService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateProductDocumentDto, @CurrentUser() user: { username?: string }) {
    return this.productDocumentsService.create(dto, user?.username);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDocumentDto,
    @CurrentUser() user: { username?: string },
  ) {
    return this.productDocumentsService.update(id, dto, user?.username);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.productDocumentsService.delete(id);
  }
}
