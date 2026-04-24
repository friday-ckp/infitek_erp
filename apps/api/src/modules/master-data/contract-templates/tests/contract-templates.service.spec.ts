import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ContractTemplateStatus } from '@infitek/shared';
import { FilesService } from '../../../../files/files.service';
import { ContractTemplatesRepository } from '../contract-templates.repository';
import { ContractTemplatesService } from '../contract-templates.service';

describe('ContractTemplatesService', () => {
  let service: ContractTemplatesService;

  const repoMock = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByName: jest.fn(),
    findDefaultApproved: jest.fn(),
    clearDefaultFlag: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const filesServiceMock = {
    getSignedUrl: jest.fn(),
    delete: jest.fn(),
  };

  const baseTemplate = {
    id: 1,
    name: '标准采购合同',
    templateFileKey: null,
    templateFileName: null,
    description: '标准模板',
    content: '合同条款内容',
    isDefault: 0,
    requiresLegalReview: 0,
    status: ContractTemplateStatus.PENDING_SUBMIT,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin',
    updatedBy: 'admin',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractTemplatesService,
        { provide: ContractTemplatesRepository, useValue: repoMock },
        { provide: FilesService, useValue: filesServiceMock },
      ],
    }).compile();

    service = module.get<ContractTemplatesService>(ContractTemplatesService);
    jest.clearAllMocks();
  });

  it('create 应默认创建为待提交状态', async () => {
    repoMock.findByName.mockResolvedValue(null);
    repoMock.create.mockReturnValue({ ...baseTemplate });
    repoMock.save.mockResolvedValue({ ...baseTemplate });
    filesServiceMock.getSignedUrl.mockResolvedValue(null);

    const result = await service.create(
      {
        name: '标准采购合同',
        content: '合同条款内容',
      },
      'admin',
    );

    expect(result.status).toBe(ContractTemplateStatus.PENDING_SUBMIT);
    expect(repoMock.clearDefaultFlag).not.toHaveBeenCalled();
  });

  it('create 遇到重名应抛错', async () => {
    repoMock.findByName.mockResolvedValue({ ...baseTemplate });

    await expect(
      service.create({ name: '标准采购合同', content: '内容' }, 'admin'),
    ).rejects.toThrow(BadRequestException);
  });

  it('submit 支持待提交进入审核中', async () => {
    repoMock.findById.mockResolvedValue({ ...baseTemplate });
    repoMock.save.mockResolvedValue({ ...baseTemplate, status: ContractTemplateStatus.IN_REVIEW });
    filesServiceMock.getSignedUrl.mockResolvedValue(null);

    const result = await service.submit(1, 'reviewer');
    expect(result.status).toBe(ContractTemplateStatus.IN_REVIEW);
  });

  it('submit 支持已拒绝重新提交', async () => {
    repoMock.findById.mockResolvedValue({ ...baseTemplate, status: ContractTemplateStatus.REJECTED });
    repoMock.save.mockResolvedValue({ ...baseTemplate, status: ContractTemplateStatus.IN_REVIEW });
    filesServiceMock.getSignedUrl.mockResolvedValue(null);

    const result = await service.submit(1, 'reviewer');
    expect(result.status).toBe(ContractTemplateStatus.IN_REVIEW);
  });

  it('approve 仅允许审核中通过', async () => {
    repoMock.findById.mockResolvedValue({ ...baseTemplate, status: ContractTemplateStatus.PENDING_SUBMIT });

    await expect(service.approve(1, 'reviewer')).rejects.toThrow(BadRequestException);
  });

  it('reject 仅允许审核中驳回', async () => {
    repoMock.findById.mockResolvedValue({ ...baseTemplate, status: ContractTemplateStatus.IN_REVIEW });
    repoMock.save.mockResolvedValue({ ...baseTemplate, status: ContractTemplateStatus.REJECTED });
    filesServiceMock.getSignedUrl.mockResolvedValue(null);

    const result = await service.reject(1, 'reviewer');
    expect(result.status).toBe(ContractTemplateStatus.REJECTED);
  });

  it('void 允许审核通过后作废', async () => {
    repoMock.findById.mockResolvedValue({ ...baseTemplate, status: ContractTemplateStatus.APPROVED });
    repoMock.save.mockResolvedValue({ ...baseTemplate, status: ContractTemplateStatus.VOIDED });
    filesServiceMock.getSignedUrl.mockResolvedValue(null);

    const result = await service.void(1, 'admin');
    expect(result.status).toBe(ContractTemplateStatus.VOIDED);
  });

  it('update 已作废模板应拒绝编辑', async () => {
    repoMock.findById.mockResolvedValue({ ...baseTemplate, status: ContractTemplateStatus.VOIDED });

    await expect(service.update(1, { content: '新内容' }, 'admin')).rejects.toThrow(BadRequestException);
  });

  it('findById 不存在时应抛出 NotFoundException', async () => {
    repoMock.findById.mockResolvedValue(null);

    await expect(service.findById(999)).rejects.toThrow(NotFoundException);
  });

  it('update 替换文件时会删除旧文件', async () => {
    repoMock.findById.mockResolvedValue({
      ...baseTemplate,
      templateFileKey: 'dev/contract-templates/2026-04/old.pdf',
      templateFileName: 'old.pdf',
    });
    repoMock.findByName.mockResolvedValue(null);
    repoMock.save.mockResolvedValue({
      ...baseTemplate,
      templateFileKey: 'dev/contract-templates/2026-04/new.pdf',
      templateFileName: 'new.pdf',
    });
    filesServiceMock.getSignedUrl.mockResolvedValue('https://oss.example.com/new.pdf');
    filesServiceMock.delete.mockResolvedValue(undefined);

    await service.update(
      1,
      {
        templateFileKey: 'dev/contract-templates/2026-04/new.pdf',
        templateFileName: 'new.pdf',
      },
      'admin',
    );

    expect(filesServiceMock.delete).toHaveBeenCalledWith('dev/contract-templates/2026-04/old.pdf');
  });

  it('create 待提交模板即使标记默认也不应清空已审核默认模板', async () => {
    repoMock.findByName.mockResolvedValue(null);
    repoMock.create.mockReturnValue({ ...baseTemplate, isDefault: 1 });
    repoMock.save.mockResolvedValue({ ...baseTemplate, isDefault: 1 });
    filesServiceMock.getSignedUrl.mockResolvedValue(null);

    await service.create(
      {
        name: '新默认模板',
        content: '合同条款内容',
        isDefault: 1,
      },
      'admin',
    );

    expect(repoMock.clearDefaultFlag).not.toHaveBeenCalled();
  });

  it('update 非审核通过模板标记默认时不应清空已审核默认模板', async () => {
    repoMock.findById.mockResolvedValue({ ...baseTemplate, status: ContractTemplateStatus.REJECTED });
    repoMock.findByName.mockResolvedValue(null);
    repoMock.save.mockResolvedValue({ ...baseTemplate, status: ContractTemplateStatus.REJECTED, isDefault: 1 });
    filesServiceMock.getSignedUrl.mockResolvedValue(null);

    await service.update(1, { isDefault: 1 }, 'admin');

    expect(repoMock.clearDefaultFlag).not.toHaveBeenCalled();
  });

  it('approve 默认模板时应清空其他已审核默认模板', async () => {
    repoMock.findById.mockResolvedValue({ ...baseTemplate, status: ContractTemplateStatus.IN_REVIEW, isDefault: 1 });
    repoMock.save.mockResolvedValue({ ...baseTemplate, status: ContractTemplateStatus.APPROVED, isDefault: 1 });
    filesServiceMock.getSignedUrl.mockResolvedValue(null);

    const result = await service.approve(1, 'reviewer');

    expect(repoMock.clearDefaultFlag).toHaveBeenCalledWith(1);
    expect(result.status).toBe(ContractTemplateStatus.APPROVED);
  });
});
