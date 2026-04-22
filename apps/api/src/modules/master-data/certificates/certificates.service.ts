import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CertificatesRepository } from './certificates.repository';
import { SpusService } from '../spus/spus.service';
import { FilesService } from '../../../files/files.service';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { QueryCertificateDto } from './dto/query-certificate.dto';
import { CertificateStatus } from '@infitek/shared';

@Injectable()
export class CertificatesService {
  constructor(
    private readonly repo: CertificatesRepository,
    private readonly spusService: SpusService,
    private readonly filesService: FilesService,
  ) {}

  private computeStatus(validUntil: string): CertificateStatus {
    const today = new Date().toISOString().split('T')[0];
    return validUntil >= today ? CertificateStatus.VALID : CertificateStatus.EXPIRED;
  }

  private async withFileUrl<T extends { fileKey: string | null }>(
    item: T,
  ): Promise<T & { fileUrl: string | null; status: CertificateStatus }> {
    const fileUrl = item.fileKey ? await this.filesService.getSignedUrl(item.fileKey) : null;
    const status = this.computeStatus((item as unknown as { validUntil: string }).validUntil);
    return { ...item, fileUrl, status };
  }

  async findAll(query: QueryCertificateDto) {
    const result = await this.repo.findAll(query);
    const list = await Promise.all(result.list.map((c) => this.withFileUrl(c)));
    return { ...result, list };
  }

  async findById(id: number) {
    const cert = await this.repo.findById(id);
    if (!cert) throw new NotFoundException('证书不存在');
    return this.withFileUrl(cert);
  }

  async create(dto: CreateCertificateDto, operator?: string) {
    if (dto.validFrom > dto.validUntil) {
      throw new BadRequestException('有效期开始日期不能晚于截止日期');
    }

    const spus = dto.spuIds?.length
      ? await Promise.all(dto.spuIds.map((id) => this.spusService.findById(id)))
      : [];

    let certificateNo: string;
    if (dto.certificateNo) {
      const existing = await this.repo.findByNo(dto.certificateNo);
      if (existing) throw new BadRequestException(`证书编号 ${dto.certificateNo} 已存在`);
      certificateNo = dto.certificateNo;
    } else {
      certificateNo = await this.repo.generateCode();
    }

    const entity = this.repo.create({
      certificateNo,
      certificateName: dto.certificateName,
      certificateType: dto.certificateType,
      directive: dto.directive ?? null,
      issueDate: dto.issueDate ?? null,
      validFrom: dto.validFrom,
      validUntil: dto.validUntil,
      issuingAuthority: dto.issuingAuthority,
      remarks: dto.remarks ?? null,
      attributionType: dto.attributionType ?? null,
      categoryId: dto.categoryId ?? null,
      fileKey: dto.fileKey ?? null,
      fileName: dto.fileName ?? null,
      spus,
      createdBy: operator,
      updatedBy: operator,
    });

    const saved = await this.repo.save(entity);
    return this.withFileUrl(saved);
  }

  async update(id: number, dto: UpdateCertificateDto, operator?: string) {
    const cert = await this.repo.findById(id);
    if (!cert) throw new NotFoundException('证书不存在');

    if (dto.validFrom !== undefined || dto.validUntil !== undefined) {
      const validFrom = dto.validFrom ?? cert.validFrom;
      const validUntil = dto.validUntil ?? cert.validUntil;
      if (validFrom > validUntil) {
        throw new BadRequestException('有效期开始日期不能晚于截止日期');
      }
    }

    if (dto.certificateName !== undefined) cert.certificateName = dto.certificateName;
    if (dto.certificateType !== undefined) cert.certificateType = dto.certificateType;
    if ('directive' in dto) cert.directive = dto.directive ?? null;
    if ('issueDate' in dto) cert.issueDate = dto.issueDate ?? null;
    if (dto.validFrom !== undefined) cert.validFrom = dto.validFrom;
    if (dto.validUntil !== undefined) cert.validUntil = dto.validUntil;
    if (dto.issuingAuthority !== undefined) cert.issuingAuthority = dto.issuingAuthority;
    if ('remarks' in dto) cert.remarks = dto.remarks ?? null;
    if ('attributionType' in dto) cert.attributionType = dto.attributionType ?? null;
    if ('categoryId' in dto) cert.categoryId = dto.categoryId ?? null;
    if ('fileKey' in dto) cert.fileKey = dto.fileKey ?? null;
    if ('fileName' in dto) cert.fileName = dto.fileName ?? null;
    if (operator !== undefined) cert.updatedBy = operator;

    if (dto.spuIds !== undefined) {
      cert.spus = dto.spuIds.length
        ? await Promise.all(dto.spuIds.map((spuId) => this.spusService.findById(spuId)))
        : [];
    }

    const saved = await this.repo.save(cert);
    return this.withFileUrl(saved);
  }

  async delete(id: number): Promise<void> {
    const cert = await this.repo.findById(id);
    if (!cert) throw new NotFoundException('证书不存在');
    await this.repo.delete(id);
  }
}
