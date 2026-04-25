import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ContractTemplateStatus } from '@infitek/shared';
import { FilesService } from '../../../files/files.service';
import { CreateContractTemplateDto } from './dto/create-contract-template.dto';
import { QueryContractTemplateDto } from './dto/query-contract-template.dto';
import { UpdateContractTemplateDto } from './dto/update-contract-template.dto';
import { ContractTemplatesRepository } from './contract-templates.repository';
import { ContractTemplate } from './entities/contract-template.entity';

@Injectable()
export class ContractTemplatesService {
  constructor(
    private readonly repo: ContractTemplatesRepository,
    private readonly filesService: FilesService,
  ) {}

  private async withFileUrl<T extends { templateFileKey: string | null }>(
    item: T,
  ): Promise<T & { templateFileUrl: string | null }> {
    let templateFileUrl: string | null = null;
    if (item.templateFileKey) {
      try {
        templateFileUrl = await this.filesService.getSignedUrl(item.templateFileKey);
      } catch {
        templateFileUrl = item.templateFileKey;
      }
    }
    return { ...item, templateFileUrl };
  }

  private ensureMutableStatus(status: ContractTemplateStatus): void {
    if (status !== ContractTemplateStatus.PENDING_SUBMIT) {
      throw new BadRequestException('只有待提交状态的模板才允许编辑');
    }
  }

  private ensureTransition(
    current: ContractTemplateStatus,
    allowedFrom: ContractTemplateStatus[],
    actionLabel: string,
  ): void {
    if (!allowedFrom.includes(current)) {
      throw new BadRequestException(`当前状态不允许执行${actionLabel}`);
    }
  }

  private async ensureUniqueName(name: string, currentId?: number): Promise<void> {
    const existing = await this.repo.findByName(name);
    if (existing && Number(existing.id) !== Number(currentId)) {
      throw new BadRequestException('合同模板名称已存在');
    }
  }

  private async applyDefaultFlag(isDefault: number, excludeId?: number): Promise<void> {
    if (isDefault === 1) {
      await this.repo.clearDefaultFlag(excludeId);
    }
  }

  async findAll(query: QueryContractTemplateDto) {
    const result = await this.repo.findAll(query);
    const list = await Promise.all(result.list.map((item) => this.withFileUrl(item)));
    return { ...result, list };
  }

  async findById(id: number) {
    const template = await this.repo.findById(id);
    if (!template) {
      throw new NotFoundException('合同模板不存在');
    }
    const usageCount = await this.countApprovedUsages(id);
    return {
      ...(await this.withFileUrl(template)),
      usageCount,
    };
  }

  async findDefaultApproved() {
    const template = await this.repo.findDefaultApproved();
    if (!template) {
      return null;
    }
    return this.withFileUrl(template);
  }

  async countApprovedUsages(_id: number): Promise<number> {
    return 0;
  }

  async create(dto: CreateContractTemplateDto, operator?: string) {
    await this.ensureUniqueName(dto.name);
    await this.applyDefaultFlag(dto.isDefault ?? 0);

    const entity = this.repo.create({
      name: dto.name,
      templateFileKey: dto.templateFileKey ?? null,
      templateFileName: dto.templateFileName ?? null,
      description: dto.description ?? null,
      content: dto.content,
      isDefault: dto.isDefault ?? 0,
      requiresLegalReview: dto.requiresLegalReview ?? 0,
      status: ContractTemplateStatus.PENDING_SUBMIT,
      createdBy: operator,
      updatedBy: operator,
    });

    const saved = await this.repo.save(entity);
    return {
      ...(await this.withFileUrl(saved)),
      usageCount: 0,
    };
  }

  async update(id: number, dto: UpdateContractTemplateDto, operator?: string) {
    const entity = await this.repo.findById(id);
    if (!entity) {
      throw new NotFoundException('合同模板不存在');
    }

    this.ensureMutableStatus(entity.status);

    const nextName = dto.name ?? entity.name;
    await this.ensureUniqueName(nextName, id);

    const previousFileKey = entity.templateFileKey;
    const nextFileKey = 'templateFileKey' in dto ? dto.templateFileKey ?? null : entity.templateFileKey;
    const nextFileName = 'templateFileName' in dto ? dto.templateFileName ?? null : entity.templateFileName;

    const nextIsDefault = dto.isDefault ?? entity.isDefault;
    await this.applyDefaultFlag(nextIsDefault, id);

    entity.name = nextName;
    entity.templateFileKey = nextFileKey;
    entity.templateFileName = nextFileName;
    entity.description = 'description' in dto ? dto.description ?? null : entity.description;
    entity.content = dto.content ?? entity.content;
    entity.isDefault = nextIsDefault;
    entity.requiresLegalReview = dto.requiresLegalReview ?? entity.requiresLegalReview;
    if (operator !== undefined) {
      entity.updatedBy = operator;
    }

    const saved = await this.repo.save(entity);
    if (previousFileKey && previousFileKey !== saved.templateFileKey) {
      await this.filesService.delete(previousFileKey);
    }

    return {
      ...(await this.withFileUrl(saved)),
      usageCount: await this.countApprovedUsages(id),
    };
  }

  async submit(id: number, operator?: string) {
    const entity = await this.requireEntity(id);
    this.ensureTransition(
      entity.status,
      [ContractTemplateStatus.PENDING_SUBMIT, ContractTemplateStatus.REJECTED],
      '提交审核',
    );
    entity.status = ContractTemplateStatus.IN_REVIEW;
    if (operator !== undefined) {
      entity.updatedBy = operator;
    }
    return {
      ...(await this.withFileUrl(await this.repo.save(entity))),
      usageCount: await this.countApprovedUsages(id),
    };
  }

  async approve(id: number, operator?: string) {
    const entity = await this.requireEntity(id);
    this.ensureTransition(entity.status, [ContractTemplateStatus.IN_REVIEW], '审核通过');
    if (entity.isDefault === 1) {
      await this.applyDefaultFlag(1, id);
    }
    entity.status = ContractTemplateStatus.APPROVED;
    if (operator !== undefined) {
      entity.updatedBy = operator;
    }
    return {
      ...(await this.withFileUrl(await this.repo.save(entity))),
      usageCount: await this.countApprovedUsages(id),
    };
  }

  async reject(id: number, operator?: string) {
    const entity = await this.requireEntity(id);
    this.ensureTransition(entity.status, [ContractTemplateStatus.IN_REVIEW], '驳回');
    entity.status = ContractTemplateStatus.REJECTED;
    if (operator !== undefined) {
      entity.updatedBy = operator;
    }
    return {
      ...(await this.withFileUrl(await this.repo.save(entity))),
      usageCount: await this.countApprovedUsages(id),
    };
  }

  async void(id: number, operator?: string) {
    const entity = await this.requireEntity(id);
    this.ensureTransition(
      entity.status,
      [
        ContractTemplateStatus.PENDING_SUBMIT,
        ContractTemplateStatus.IN_REVIEW,
        ContractTemplateStatus.REJECTED,
        ContractTemplateStatus.APPROVED,
      ],
      '作废',
    );
    entity.status = ContractTemplateStatus.VOIDED;
    if (operator !== undefined) {
      entity.updatedBy = operator;
    }
    return {
      ...(await this.withFileUrl(await this.repo.save(entity))),
      usageCount: await this.countApprovedUsages(id),
    };
  }

  private async requireEntity(id: number): Promise<ContractTemplate> {
    const entity = await this.repo.findById(id);
    if (!entity) {
      throw new NotFoundException('合同模板不存在');
    }
    return entity;
  }
}
