import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FilesService } from '../files.service';

const mockPut = jest.fn();
const mockSignatureUrl = jest.fn();
const mockDelete = jest.fn();

jest.mock('ali-oss', () =>
  jest.fn().mockImplementation(() => ({
    put: mockPut,
    signatureUrl: mockSignatureUrl,
    delete: mockDelete,
  })),
);

describe('FilesService', () => {
  let service: FilesService;
  const getConfig = jest.fn();

  beforeEach(async () => {
    getConfig.mockImplementation((key: string) => {
      const map: Record<string, string> = {
        OSS_REGION: 'oss-cn-shenzhen',
        OSS_ACCESS_KEY_ID: 'mock-ak',
        OSS_ACCESS_KEY_SECRET: 'mock-sk',
        OSS_BUCKET: 'infitek-erp-files',
        NODE_ENV: 'production',
      };
      return map[key];
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: ConfigService,
          useValue: {
            get: getConfig,
          },
        },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
    jest.clearAllMocks();
  });

  describe('upload', () => {
    it('应上传文件并返回 key/filename/size', async () => {
      mockPut.mockResolvedValue({ name: 'prod/certificates/2026-04/mock-id.pdf' });
      const file = {
        originalname: 'cert.pdf',
        mimetype: 'application/pdf',
        size: 12345,
        buffer: Buffer.from('mock'),
      } as Express.Multer.File;

      const result = await service.upload(file, 'certificates');

      expect(result.filename).toBe('cert.pdf');
      expect(result.size).toBe(12345);
      expect(result.key).toMatch(/^prod\/certificates\/\d{4}-\d{2}\/[0-9a-f-]+\.pdf$/);
      expect(mockPut).toHaveBeenCalledWith(expect.stringMatching(/^prod\/certificates\//), file.buffer);
    });

    it('应拒绝 buffer 为空的文件', async () => {
      const file = {
        originalname: 'empty.pdf',
        mimetype: 'application/pdf',
        size: 0,
        buffer: Buffer.alloc(0),
      } as Express.Multer.File;

      await expect(service.upload(file, 'documents')).rejects.toThrow(
        expect.objectContaining({
          response: { code: 'FILE_EMPTY', message: '文件内容为空' },
        }),
      );
    });

    it('应拒绝不支持的 MIME 类型', async () => {
      const file = {
        originalname: 'evil.exe',
        mimetype: 'application/x-msdownload',
        size: 100,
        buffer: Buffer.from('bad'),
      } as Express.Multer.File;

      await expect(service.upload(file, 'documents')).rejects.toThrow(
        expect.objectContaining({
          response: { code: 'INVALID_FILE_TYPE', message: '不支持的文件类型' },
        }),
      );
    });

    it('应拒绝超过 50MB 的文件', async () => {
      const file = {
        originalname: 'big.pdf',
        mimetype: 'application/pdf',
        size: 50 * 1024 * 1024 + 1,
        buffer: Buffer.from('too-big'),
      } as Express.Multer.File;

      await expect(service.upload(file, 'documents')).rejects.toThrow(
        expect.objectContaining({
          response: { code: 'FILE_TOO_LARGE', message: '文件大小不能超过 50MB' },
        }),
      );
    });

    it('应拒绝非法 folder', async () => {
      const file = {
        originalname: 'ok.pdf',
        mimetype: 'application/pdf',
        size: 100,
        buffer: Buffer.from('ok'),
      } as Express.Multer.File;

      await expect(service.upload(file, '../etc')).rejects.toThrow(
        expect.objectContaining({
          response: { code: 'INVALID_FOLDER', message: '不支持的文件夹类型' },
        }),
      );
    });

    it('应允许 product-documents 目录上传', async () => {
      mockPut.mockResolvedValue({ name: 'prod/product-documents/2026-04/mock-id.pdf' });
      const file = {
        originalname: 'manual.pdf',
        mimetype: 'application/pdf',
        size: 123,
        buffer: Buffer.from('ok'),
      } as Express.Multer.File;

      const result = await service.upload(file, 'product-documents');

      expect(result.key).toMatch(/^prod\/product-documents\/\d{4}-\d{2}\/[0-9a-f-]+\.pdf$/);
      expect(mockPut).toHaveBeenCalledWith(expect.stringMatching(/^prod\/product-documents\//), file.buffer);
    });

    it('应允许 mp4 视频上传', async () => {
      mockPut.mockResolvedValue({ name: 'prod/product-documents/2026-04/mock-id.mp4' });
      const file = {
        originalname: 'demo.mp4',
        mimetype: 'video/mp4',
        size: 1024,
        buffer: Buffer.from('video'),
      } as Express.Multer.File;

      const result = await service.upload(file, 'product-documents');

      expect(result.filename).toBe('demo.mp4');
      expect(result.key).toMatch(/^prod\/product-documents\/\d{4}-\d{2}\/[0-9a-f-]+\.mp4$/);
    });

    it('应允许合同模板目录上传 docx 文件', async () => {
      mockPut.mockResolvedValue({ name: 'prod/contract-templates/2026-04/mock-id.docx' });
      const file = {
        originalname: 'contract-template.docx',
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 1024,
        buffer: Buffer.from('docx'),
      } as Express.Multer.File;

      const result = await service.upload(file, 'contract-templates');

      expect(result.filename).toBe('contract-template.docx');
      expect(result.key).toMatch(/^prod\/contract-templates\/\d{4}-\d{2}\/[0-9a-f-]+\.docx$/);
      expect(mockPut).toHaveBeenCalledWith(expect.stringMatching(/^prod\/contract-templates\//), file.buffer);
    });

    it('OSS 上传失败时应抛出 500', async () => {
      mockPut.mockRejectedValue(new Error('oss failed'));
      const file = {
        originalname: 'cert.pdf',
        mimetype: 'application/pdf',
        size: 100,
        buffer: Buffer.from('x'),
      } as Express.Multer.File;

      await expect(service.upload(file, 'certificates')).rejects.toThrow(
        expect.objectContaining({
          response: { code: 'OSS_UPLOAD_FAILED', message: '文件上传失败' },
        }),
      );
    });
  });

  describe('getSignedUrl', () => {
    it('应返回签名 URL', async () => {
      mockSignatureUrl.mockReturnValue('https://signed-url.example.com');
      const result = await service.getSignedUrl('prod/documents/2026-04/a.pdf');
      expect(result).toBe('https://signed-url.example.com');
      expect(mockSignatureUrl).toHaveBeenCalledWith('prod/documents/2026-04/a.pdf', { expires: 3600 });
    });

    it('key 为空时应抛出 400', async () => {
      await expect(service.getSignedUrl('')).rejects.toThrow(BadRequestException);
    });

    it('OSS 失败时应抛出 500', async () => {
      mockSignatureUrl.mockImplementation(() => {
        throw new Error('sign failed');
      });

      await expect(service.getSignedUrl('prod/documents/2026-04/a.pdf')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('delete', () => {
    it('应删除 OSS 文件', async () => {
      mockDelete.mockResolvedValue({});
      await expect(service.delete('prod/documents/2026-04/a.pdf')).resolves.toBeUndefined();
      expect(mockDelete).toHaveBeenCalledWith('prod/documents/2026-04/a.pdf');
    });

    it('应允许删除 product-documents 下的 mp4 文件', async () => {
      mockDelete.mockResolvedValue({});
      await expect(service.delete('prod/product-documents/2026-04/a.mp4')).resolves.toBeUndefined();
      expect(mockDelete).toHaveBeenCalledWith('prod/product-documents/2026-04/a.mp4');
    });

    it('应允许删除 contract-templates 下的 docx 文件', async () => {
      mockDelete.mockResolvedValue({});
      await expect(service.delete('prod/contract-templates/2026-04/a.docx')).resolves.toBeUndefined();
      expect(mockDelete).toHaveBeenCalledWith('prod/contract-templates/2026-04/a.docx');
    });

    it('key 为空时应抛出 400', async () => {
      await expect(service.delete('')).rejects.toThrow(BadRequestException);
    });

    it('OSS 删除失败时应抛出 500', async () => {
      mockDelete.mockRejectedValue(new Error('delete failed'));
      await expect(service.delete('prod/documents/2026-04/a.pdf')).rejects.toThrow(
        expect.objectContaining({
          response: { code: 'OSS_DELETE_FAILED', message: '文件删除失败' },
        }),
      );
    });
  });
});
