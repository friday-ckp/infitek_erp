import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Certificate } from './entities/certificate.entity';
import { CertificatesController } from './certificates.controller';
import { CertificatesRepository } from './certificates.repository';
import { CertificatesService } from './certificates.service';
import { SpusModule } from '../spus/spus.module';

@Module({
  imports: [TypeOrmModule.forFeature([Certificate]), SpusModule],
  controllers: [CertificatesController],
  providers: [CertificatesRepository, CertificatesService],
  exports: [CertificatesService],
})
export class CertificatesModule {}
