import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductDocumentsRepository } from '../product-documents.repository';
import { ProductDocumentsService } from '../product-documents.service';
import { SpusService } from '../../spus/spus.service';
import { FilesService } from '../../../../files/files.service';
import { CountriesService } from '../../countries/countries.service';
import { ProductCategoriesService } from '../../product-categories/product-categories.service';
import { ProductDocumentType, ProductDocumentAttributionType } from '@infitek/shared';

describe('ProductDocumentsService', () => {
  let service: ProductDocumentsService;

  const repoMock = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const spusServiceMock = {
    findById: jest.fn(),
  };

  const filesServiceMock = {
    getSignedUrl: jest.fn(),
    delete: jest.fn(),
  };

  const countriesServiceMock = {
    findById: jest.fn(),
  };

  const productCategoriesServiceMock = {
    findById: jest.fn(),
  };

  const baseDoc = {
    id: 1,
    documentName: '测试说明书',
    documentType: ProductDocumentType.SPEC_SHEET,
    content: null,
    attributionType: ProductDocumentAttributionType.GENERAL,
    countryId: null,
    categoryLevel1Id: null,
    categoryLevel2Id: null,
    categoryLevel3Id: null,
    spuId: null,
    fileKey: null,
    fileName: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin',
    updatedBy: 'admin',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductDocumentsService,
        { provide: ProductDocumentsRepository, useValue: repoMock },
        { provide: SpusService, useValue: spusServiceMock },
        { provide: FilesService, useValue: filesServiceMock },
        { provide: CountriesService, useValue: countriesServiceMock },
        { provide: ProductCategoriesService, useValue: productCategoriesServiceMock },
      ],
    }).compile();

    service = module.get<ProductDocumentsService>(ProductDocumentsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('创建资料成功（通用归属）', async () => {
      repoMock.create.mockReturnValue({ ...baseDoc });
      repoMock.save.mockResolvedValue({ ...baseDoc });
      filesServiceMock.getSignedUrl.mockResolvedValue(null);

      const result = await service.create(
        {
          documentName: '测试说明书',
          documentType: ProductDocumentType.SPEC_SHEET,
          attributionType: ProductDocumentAttributionType.GENERAL,
          fileKey: 'product-documents/test.pdf',
          fileName: 'test.pdf',
        },
        'admin',
      );

      expect(result.documentName).toBe('测试说明书');
      expect(repoMock.save).toHaveBeenCalled();
    });

    it('spuId 不存在时 → NotFoundException', async () => {
      spusServiceMock.findById.mockResolvedValue(null);

      await expect(
        service.create(
        {
          documentName: '测试资料',
          documentType: ProductDocumentType.SPEC_SHEET,
          attributionType: ProductDocumentAttributionType.PRODUCT,
          spuId: 999,
          fileKey: 'product-documents/test.pdf',
          fileName: 'test.pdf',
        },
        'admin',
      ),
      ).rejects.toThrow(NotFoundException);
    });

    it('有 fileKey 时创建后返回 fileUrl', async () => {
      const signedUrl = 'https://oss.example.com/signed';
      const docWithFile = { ...baseDoc, fileKey: 'product-documents/2024/test.pdf' };
      repoMock.create.mockReturnValue(docWithFile);
      repoMock.save.mockResolvedValue(docWithFile);
      filesServiceMock.getSignedUrl.mockResolvedValue(signedUrl);

      const result = await service.create(
        {
          documentName: '测试资料',
          documentType: ProductDocumentType.SPEC_SHEET,
          attributionType: ProductDocumentAttributionType.GENERAL,
          fileKey: 'product-documents/2024/test.pdf',
          fileName: 'test.pdf',
        },
        'admin',
      );

      expect(result.fileUrl).toBe(signedUrl);
    });

    it('未上传文件时也可创建资料', async () => {
      repoMock.create.mockReturnValue({ ...baseDoc });
      repoMock.save.mockResolvedValue({ ...baseDoc });
      filesServiceMock.getSignedUrl.mockResolvedValue(null);

      const result = await service.create(
        {
          documentName: '测试资料',
          documentType: ProductDocumentType.SPEC_SHEET,
          attributionType: ProductDocumentAttributionType.GENERAL,
        },
        'admin',
      );

      expect(result.fileKey).toBeNull();
      expect(result.fileName).toBeNull();
      expect(result.fileUrl).toBeNull();
    });

    it('一级分类归属必须选择一级分类', async () => {
      await expect(
        service.create(
          {
            documentName: '测试资料',
            documentType: ProductDocumentType.SPEC_SHEET,
            attributionType: ProductDocumentAttributionType.CATEGORY_L1,
            fileKey: 'product-documents/test.pdf',
            fileName: 'test.pdf',
          },
          'admin',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('三级分类归属会校验分类层级', async () => {
      productCategoriesServiceMock.findById.mockResolvedValue({ id: 101, level: 2 });

      await expect(
        service.create(
          {
            documentName: '测试资料',
            documentType: ProductDocumentType.SPEC_SHEET,
            attributionType: ProductDocumentAttributionType.CATEGORY_L3,
            categoryLevel3Id: 101,
            fileKey: 'product-documents/test.pdf',
            fileName: 'test.pdf',
          },
          'admin',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findById', () => {
    it('找不到资料 → NotFoundException', async () => {
      repoMock.findById.mockResolvedValue(null);
      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });

    it('无 fileKey 时 fileUrl 为 null', async () => {
      repoMock.findById.mockResolvedValue({ ...baseDoc, fileKey: null });
      filesServiceMock.getSignedUrl.mockResolvedValue(null);

      const result = await service.findById(1);
      expect(result.fileUrl).toBeNull();
    });

    it('有 fileKey 时返回签名 URL', async () => {
      const signedUrl = 'https://oss.example.com/signed';
      repoMock.findById.mockResolvedValue({ ...baseDoc, fileKey: 'product-documents/test.pdf' });
      filesServiceMock.getSignedUrl.mockResolvedValue(signedUrl);

      const result = await service.findById(1);
      expect(result.fileUrl).toBe(signedUrl);
    });
  });

  describe('update', () => {
    it('更新资料名称成功', async () => {
      repoMock.findById.mockResolvedValue({
        ...baseDoc,
        fileKey: 'product-documents/test.pdf',
        fileName: 'test.pdf',
      });
      repoMock.save.mockResolvedValue({
        ...baseDoc,
        documentName: '新名称',
        fileKey: 'product-documents/test.pdf',
        fileName: 'test.pdf',
      });
      filesServiceMock.getSignedUrl.mockResolvedValue(null);

      const result = await service.update(1, { documentName: '新名称' }, 'admin');
      expect(result.documentName).toBe('新名称');
    });

    it('资料不存在 → NotFoundException', async () => {
      repoMock.findById.mockResolvedValue(null);
      await expect(service.update(999, { documentName: '新名称' }, 'admin')).rejects.toThrow(NotFoundException);
    });

    it('无文件资料也可更新其它字段', async () => {
      repoMock.findById.mockResolvedValue({ ...baseDoc, fileKey: null, fileName: null });
      repoMock.save.mockResolvedValue({ ...baseDoc, documentName: '新名称', fileKey: null, fileName: null });
      filesServiceMock.getSignedUrl.mockResolvedValue(null);

      const result = await service.update(1, { documentName: '新名称' }, 'admin');
      expect(result.documentName).toBe('新名称');
      expect(result.fileUrl).toBeNull();
    });

    it('替换文件时会删除旧 OSS 文件', async () => {
      repoMock.findById.mockResolvedValue({
        ...baseDoc,
        fileKey: 'product-documents/old.pdf',
        fileName: 'old.pdf',
      });
      repoMock.save.mockResolvedValue({
        ...baseDoc,
        fileKey: 'product-documents/new.pdf',
        fileName: 'new.pdf',
      });
      filesServiceMock.getSignedUrl.mockResolvedValue('https://oss.example.com/new-signed');
      filesServiceMock.delete.mockResolvedValue(undefined);

      await service.update(
        1,
        {
          fileKey: 'product-documents/new.pdf',
          fileName: 'new.pdf',
        },
        'admin',
      );

      expect(filesServiceMock.delete).toHaveBeenCalledWith('product-documents/old.pdf');
    });
  });

  describe('delete', () => {
    it('删除资料成功（无文件）', async () => {
      repoMock.findById.mockResolvedValue({ ...baseDoc, fileKey: null });
      repoMock.delete.mockResolvedValue(undefined);

      await expect(service.delete(1)).resolves.toBeUndefined();
      expect(filesServiceMock.delete).not.toHaveBeenCalled();
      expect(repoMock.delete).toHaveBeenCalledWith(1);
    });

    it('删除资料时同步删除 OSS 文件', async () => {
      const docWithFile = { ...baseDoc, fileKey: 'product-documents/test.pdf' };
      repoMock.findById.mockResolvedValue(docWithFile);
      filesServiceMock.delete.mockResolvedValue(undefined);
      repoMock.delete.mockResolvedValue(undefined);

      await service.delete(1);
      expect(filesServiceMock.delete).toHaveBeenCalledWith('product-documents/test.pdf');
      expect(repoMock.delete).toHaveBeenCalledWith(1);
    });

    it('资料不存在 → NotFoundException', async () => {
      repoMock.findById.mockResolvedValue(null);
      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
    });
  });
});
