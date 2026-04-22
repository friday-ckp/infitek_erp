import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CertificatesRepository } from '../certificates.repository';
import { CertificatesService } from '../certificates.service';
import { SpusService } from '../../spus/spus.service';
import { FilesService } from '../../../../files/files.service';

describe('CertificatesService', () => {
  let service: CertificatesService;

  const repoMock = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByNo: jest.fn(),
    generateCode: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const spusServiceMock = {
    findById: jest.fn(),
  };

  const filesServiceMock = {
    getSignedUrl: jest.fn(),
  };

  const today = new Date().toISOString().split('T')[0];
  const pastDate = '2020-01-01';
  const futureDate = '2099-12-31';

  const baseCert = {
    id: 1,
    certificateNo: 'CERT001',
    certificateName: '测试证书',
    certificateType: 'CE',
    directive: null,
    issueDate: null,
    validFrom: '2024-01-01',
    validUntil: futureDate,
    issuingAuthority: '测试机构',
    remarks: null,
    attributionType: null,
    categoryId: null,
    fileKey: null,
    fileName: null,
    spus: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin',
    updatedBy: 'admin',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificatesService,
        { provide: CertificatesRepository, useValue: repoMock },
        { provide: SpusService, useValue: spusServiceMock },
        { provide: FilesService, useValue: filesServiceMock },
      ],
    }).compile();

    service = module.get<CertificatesService>(CertificatesService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('创建证书成功，自动生成编号 CERT001', async () => {
      repoMock.generateCode.mockResolvedValue('CERT001');
      repoMock.create.mockReturnValue({ ...baseCert });
      repoMock.save.mockResolvedValue({ ...baseCert });
      filesServiceMock.getSignedUrl.mockResolvedValue(null);

      const result = await service.create(
        {
          certificateName: '测试证书',
          certificateType: 'CE',
          validFrom: '2024-01-01',
          validUntil: futureDate,
          issuingAuthority: '测试机构',
        },
        'admin',
      );

      expect(result.certificateNo).toBe('CERT001');
      expect(repoMock.save).toHaveBeenCalled();
    });

    it('validFrom > validUntil → BadRequestException', async () => {
      await expect(
        service.create(
          {
            certificateName: '测试证书',
            certificateType: 'CE',
            validFrom: '2025-01-01',
            validUntil: '2024-01-01',
            issuingAuthority: '测试机构',
          },
          'admin',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('提供自定义编号时优先使用，不调用 generateCode', async () => {
      repoMock.findByNo.mockResolvedValue(null);
      repoMock.create.mockReturnValue({ ...baseCert, certificateNo: 'CUST-001' });
      repoMock.save.mockResolvedValue({ ...baseCert, certificateNo: 'CUST-001' });
      filesServiceMock.getSignedUrl.mockResolvedValue(null);

      const result = await service.create(
        {
          certificateName: '测试证书',
          certificateNo: 'CUST-001',
          certificateType: 'CE',
          validFrom: '2024-01-01',
          validUntil: futureDate,
          issuingAuthority: '测试机构',
        },
        'admin',
      );

      expect(result.certificateNo).toBe('CUST-001');
      expect(repoMock.generateCode).not.toHaveBeenCalled();
      expect(repoMock.findByNo).toHaveBeenCalledWith('CUST-001');
    });

    it('自定义编号已存在 → BadRequestException', async () => {
      repoMock.findByNo.mockResolvedValue({ ...baseCert, certificateNo: 'CUST-001' });

      await expect(
        service.create(
          {
            certificateName: '测试证书',
            certificateNo: 'CUST-001',
            certificateType: 'CE',
            validFrom: '2024-01-01',
            validUntil: futureDate,
            issuingAuthority: '测试机构',
          },
          'admin',
        ),
      ).rejects.toThrow(BadRequestException);

      expect(repoMock.generateCode).not.toHaveBeenCalled();
    });

    it('传入 spuIds → 查询并关联 SPU', async () => {
      const spu = { id: 1, spuCode: 'SPU001', name: '产品A' };
      repoMock.generateCode.mockResolvedValue('CERT001');
      repoMock.create.mockReturnValue({ ...baseCert, spus: [spu] });
      repoMock.save.mockResolvedValue({ ...baseCert, spus: [spu] });
      spusServiceMock.findById.mockResolvedValue(spu);
      filesServiceMock.getSignedUrl.mockResolvedValue(null);

      await service.create(
        {
          certificateName: '测试证书',
          certificateType: 'CE',
          validFrom: '2024-01-01',
          validUntil: futureDate,
          issuingAuthority: '测试机构',
          spuIds: [1],
        },
        'admin',
      );

      expect(spusServiceMock.findById).toHaveBeenCalledWith(1);
      expect(repoMock.create).toHaveBeenCalledWith(expect.objectContaining({ spus: [spu] }));
    });
  });

  describe('findById', () => {
    it('找不到证书 → NotFoundException', async () => {
      repoMock.findById.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });

    it('返回有效证书时 status=valid', async () => {
      repoMock.findById.mockResolvedValue({ ...baseCert, validUntil: futureDate });
      filesServiceMock.getSignedUrl.mockResolvedValue(null);

      const result = await service.findById(1);

      expect(result.status).toBe('valid');
    });

    it('返回过期证书时 status=expired', async () => {
      repoMock.findById.mockResolvedValue({ ...baseCert, validUntil: pastDate });
      filesServiceMock.getSignedUrl.mockResolvedValue(null);

      const result = await service.findById(1);

      expect(result.status).toBe('expired');
    });

    it('有 fileKey 时返回 fileUrl', async () => {
      const signedUrl = 'https://oss.example.com/signed-url';
      repoMock.findById.mockResolvedValue({ ...baseCert, fileKey: 'prod/certificates/2024-01/abc.pdf' });
      filesServiceMock.getSignedUrl.mockResolvedValue(signedUrl);

      const result = await service.findById(1);

      expect(result.fileUrl).toBe(signedUrl);
      expect(filesServiceMock.getSignedUrl).toHaveBeenCalledWith('prod/certificates/2024-01/abc.pdf');
    });
  });

  describe('update', () => {
    it('更新证书名称成功', async () => {
      const cert = { ...baseCert };
      repoMock.findById.mockResolvedValue(cert);
      repoMock.save.mockResolvedValue({ ...cert, certificateName: '新证书名' });
      filesServiceMock.getSignedUrl.mockResolvedValue(null);

      const result = await service.update(1, { certificateName: '新证书名' }, 'admin');

      expect(result.certificateName).toBe('新证书名');
      expect(repoMock.save).toHaveBeenCalled();
    });

    it('更新时 validFrom > validUntil → BadRequestException', async () => {
      repoMock.findById.mockResolvedValue({ ...baseCert, validFrom: '2024-01-01', validUntil: futureDate });

      await expect(
        service.update(1, { validFrom: '2025-01-01', validUntil: '2024-01-01' }, 'admin'),
      ).rejects.toThrow(BadRequestException);
    });

    it('更新不存在的证书 → NotFoundException', async () => {
      repoMock.findById.mockResolvedValue(null);

      await expect(service.update(999, { certificateName: '新名称' }, 'admin')).rejects.toThrow(NotFoundException);
    });

    it('更新 spuIds → 重新关联 SPU', async () => {
      const cert = { ...baseCert, spus: [] };
      const spu = { id: 2, spuCode: 'SPU002', name: '产品B' };
      repoMock.findById.mockResolvedValue(cert);
      repoMock.save.mockResolvedValue({ ...cert, spus: [spu] });
      spusServiceMock.findById.mockResolvedValue(spu);
      filesServiceMock.getSignedUrl.mockResolvedValue(null);

      await service.update(1, { spuIds: [2] }, 'admin');

      expect(spusServiceMock.findById).toHaveBeenCalledWith(2);
    });
  });

  describe('delete', () => {
    it('删除证书成功', async () => {
      repoMock.findById.mockResolvedValue(baseCert);
      repoMock.delete.mockResolvedValue(undefined);

      await expect(service.delete(1)).resolves.toBeUndefined();
      expect(repoMock.delete).toHaveBeenCalledWith(1);
    });

    it('删除不存在的证书 → NotFoundException', async () => {
      repoMock.findById.mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
    });
  });
});
