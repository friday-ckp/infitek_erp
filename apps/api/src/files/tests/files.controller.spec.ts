import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { FilesController } from '../files.controller';
import { FilesService } from '../files.service';

describe('FilesController', () => {
  let controller: FilesController;
  const mockFilesService = {
    upload: jest.fn(),
    getSignedUrl: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        {
          provide: FilesService,
          useValue: mockFilesService,
        },
      ],
    }).compile();

    controller = module.get<FilesController>(FilesController);
    jest.clearAllMocks();
  });

  describe('upload', () => {
    it('应调用 service.upload 并返回结果', async () => {
      const file = {
        originalname: 'cert.pdf',
        mimetype: 'application/pdf',
        size: 123,
        buffer: Buffer.from('x'),
      } as Express.Multer.File;
      mockFilesService.upload.mockResolvedValue({
        key: 'prod/certificates/2026-04/id.pdf',
        filename: 'cert.pdf',
        size: 123,
      });

      const result = await controller.upload(file, 'certificates');

      expect(result).toEqual({
        key: 'prod/certificates/2026-04/id.pdf',
        filename: 'cert.pdf',
        size: 123,
      });
      expect(mockFilesService.upload).toHaveBeenCalledWith(file, 'certificates');
    });

    it('file 缺失时应抛出 400', async () => {
      await expect(controller.upload(undefined as unknown as Express.Multer.File, 'documents')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getSignedUrl', () => {
    it('应调用 service.getSignedUrl', async () => {
      mockFilesService.getSignedUrl.mockResolvedValue('https://signed-url');

      const result = await controller.getSignedUrl('prod/documents/2026-04/a.pdf');

      expect(result).toBe('https://signed-url');
      expect(mockFilesService.getSignedUrl).toHaveBeenCalledWith('prod/documents/2026-04/a.pdf');
    });
  });

  describe('delete', () => {
    it('应调用 service.delete 并返回 key', async () => {
      mockFilesService.delete.mockResolvedValue(undefined);

      const result = await controller.delete({ key: 'prod/documents/2026-04/a.pdf' });

      expect(mockFilesService.delete).toHaveBeenCalledWith('prod/documents/2026-04/a.pdf');
      expect(result).toEqual({ key: 'prod/documents/2026-04/a.pdf' });
    });
  });
});
