import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductDocument } from './entities/product-document.entity';
import { ProductDocumentsController } from './product-documents.controller';
import { ProductDocumentsRepository } from './product-documents.repository';
import { ProductDocumentsService } from './product-documents.service';
import { SpusModule } from '../spus/spus.module';
import { CountriesModule } from '../countries/countries.module';
import { ProductCategoriesModule } from '../product-categories/product-categories.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductDocument]),
    SpusModule,
    CountriesModule,
    ProductCategoriesModule,
  ],
  controllers: [ProductDocumentsController],
  providers: [ProductDocumentsRepository, ProductDocumentsService],
  exports: [ProductDocumentsService],
})
export class ProductDocumentsModule {}
