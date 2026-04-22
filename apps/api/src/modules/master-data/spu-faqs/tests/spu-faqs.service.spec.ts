import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SpuFaqsRepository } from '../spu-faqs.repository';
import { SpuFaqsService } from '../spu-faqs.service';
import { SpusService } from '../../spus/spus.service';

describe('SpuFaqsService', () => {
  let service: SpuFaqsService;

  const repoMock = {
    findBySpu: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const spusServiceMock = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpuFaqsService,
        { provide: SpuFaqsRepository, useValue: repoMock },
        { provide: SpusService, useValue: spusServiceMock },
      ],
    }).compile();

    service = module.get<SpuFaqsService>(SpuFaqsService);
    jest.clearAllMocks();
  });

  it('创建 FAQ 成功，关联 SPU', async () => {
    spusServiceMock.findById.mockResolvedValue({ id: 1, name: '测试 SPU' });
    repoMock.create.mockResolvedValue({
      id: 1,
      spuId: 1,
      question: '这是问题',
      answer: '这是回答',
      sortOrder: 0,
    });

    const result = await service.create(
      { spuId: 1, question: '这是问题', answer: '这是回答' },
      'admin',
    );

    expect(spusServiceMock.findById).toHaveBeenCalledWith(1);
    expect(repoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        spuId: 1,
        question: '这是问题',
        answer: '这是回答',
        sortOrder: 0,
        createdBy: 'admin',
        updatedBy: 'admin',
      }),
    );
    expect(result.spuId).toBe(1);
  });

  it('创建 FAQ 时 SPU 不存在 → NotFoundException', async () => {
    spusServiceMock.findById.mockRejectedValue(new NotFoundException('SPU 不存在'));

    await expect(
      service.create({ spuId: 999, question: '问题', answer: '回答' }, 'admin'),
    ).rejects.toThrow(NotFoundException);
  });

  it('更新 FAQ 成功', async () => {
    repoMock.findById.mockResolvedValue({ id: 1, question: '旧问题', answer: '旧回答', spuId: 1 });
    repoMock.update.mockResolvedValue({ id: 1, question: '旧问题', answer: '新回答', spuId: 1 });

    const result = await service.update(1, { answer: '新回答' }, 'admin');

    expect(repoMock.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ answer: '新回答', updatedBy: 'admin' }),
    );
    expect(result.answer).toBe('新回答');
  });

  it('更新不存在的 FAQ → NotFoundException', async () => {
    repoMock.findById.mockResolvedValue(null);

    await expect(service.update(404, { answer: '新回答' }, 'admin')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('删除 FAQ 成功', async () => {
    repoMock.findById.mockResolvedValue({ id: 1, spuId: 1, question: '问题', answer: '回答' });
    repoMock.delete.mockResolvedValue(undefined);

    await expect(service.delete(1)).resolves.toBeUndefined();
    expect(repoMock.delete).toHaveBeenCalledWith(1);
  });

  it('删除不存在的 FAQ → NotFoundException', async () => {
    repoMock.findById.mockResolvedValue(null);

    await expect(service.delete(404)).rejects.toThrow(NotFoundException);
  });

  it('按 spuId 查询返回排序列表（sortOrder ASC, createdAt ASC）', async () => {
    const mockFaqs = [
      { id: 1, spuId: 1, question: 'Q1', answer: 'A1', sortOrder: 0 },
      { id: 2, spuId: 1, question: 'Q2', answer: 'A2', sortOrder: 1 },
    ];
    repoMock.findBySpu.mockResolvedValue(mockFaqs);

    const result = await service.findBySpu(1);

    expect(repoMock.findBySpu).toHaveBeenCalledWith(1);
    expect(result).toHaveLength(2);
    expect(result[0].sortOrder).toBe(0);
    expect(result[1].sortOrder).toBe(1);
  });
});
