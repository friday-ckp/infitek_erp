import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ProductCategoriesService } from './product-categories.service';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { QueryProductCategoryDto } from './dto/query-product-category.dto';

@Controller('product-categories')
export class ProductCategoriesController {
  constructor(private readonly productCategoriesService: ProductCategoriesService) {}

  @Get('tree')
  getTree() {
    return this.productCategoriesService.findTree();
  }

  @Get()
  findAll(@Query() query: QueryProductCategoryDto) {
    return this.productCategoriesService.findAll(query);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.productCategoriesService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateProductCategoryDto, @CurrentUser() user: { username?: string }) {
    return this.productCategoriesService.create(dto, user?.username);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductCategoryDto,
    @CurrentUser() user: { username?: string },
  ) {
    return this.productCategoriesService.update(id, dto, user?.username);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.productCategoriesService.delete(id);
  }
}
