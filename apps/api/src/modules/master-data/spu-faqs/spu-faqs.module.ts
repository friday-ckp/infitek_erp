import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpuFaq } from './entities/spu-faq.entity';
import { SpuFaqsController } from './spu-faqs.controller';
import { SpuFaqsRepository } from './spu-faqs.repository';
import { SpuFaqsService } from './spu-faqs.service';
import { SpusModule } from '../spus/spus.module';

@Module({
  imports: [TypeOrmModule.forFeature([SpuFaq]), SpusModule],
  controllers: [SpuFaqsController],
  providers: [SpuFaqsRepository, SpuFaqsService],
  exports: [SpuFaqsService],
})
export class SpuFaqsModule {}
