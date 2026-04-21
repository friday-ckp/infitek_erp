import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CurrencyStatus } from '@infitek/shared';
import { CreateCurrencyDto } from '../dto/create-currency.dto';
import { UpdateCurrencyDto } from '../dto/update-currency.dto';
import { Currency } from '../entities/currency.entity';
import { CurrenciesRepository } from '../currencies.repository';
import { CurrenciesService } from '../currencies.service';

const mockCurrency: Currency = {
  id: 1,
  code: 'USD',
  name: '美元',
  status: CurrencyStatus.ACTIVE,
  symbol: '$',
  isBaseCurrency: 0,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'admin',
  updatedBy: 'admin',
};

const mockRepo = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByCode: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  clearBaseCurrency: jest.fn(),
};

describe('CurrenciesService', () => {
  let service: CurrenciesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrenciesService,
        { provide: CurrenciesRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<CurrenciesService>(CurrenciesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('应返回分页列表', async () => {
      const result = { list: [mockCurrency], total: 1, page: 1, pageSize: 20, totalPages: 1 };
      mockRepo.findAll.mockResolvedValue(result);

      const res = await service.findAll({ page: 1, pageSize: 20 });
      expect(res).toEqual(result);
    });
  });

  describe('findById', () => {
    it('应返回币种', async () => {
      mockRepo.findById.mockResolvedValue(mockCurrency);
      const res = await service.findById(1);
      expect(res).toEqual(mockCurrency);
    });

    it('币种不存在时应抛出 NotFoundException', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('应创建币种，默认状态为 ACTIVE', async () => {
      const dto: CreateCurrencyDto = { code: 'EUR', name: '欧元' };
      mockRepo.findByCode.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue({ ...mockCurrency, code: 'EUR', name: '欧元' });

      await service.create(dto, 'admin');
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'EUR',
          name: '欧元',
          status: CurrencyStatus.ACTIVE,
        }),
      );
    });

    it('code 重复时应抛出 BadRequestException', async () => {
      const dto: CreateCurrencyDto = { code: 'USD', name: '美元2' };
      mockRepo.findByCode.mockResolvedValue(mockCurrency);

      await expect(service.create(dto, 'admin')).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('应更新币种名称', async () => {
      const dto: UpdateCurrencyDto = { name: '美元（更新）' };
      mockRepo.findById.mockResolvedValue(mockCurrency);
      mockRepo.update.mockResolvedValue({ ...mockCurrency, name: '美元（更新）' });

      const res = await service.update(1, dto, 'admin');
      expect(res.name).toBe('美元（更新）');
    });

    it('修改 code 时应检查重复', async () => {
      const dto: UpdateCurrencyDto = { code: 'CNY' };
      mockRepo.findById.mockResolvedValue(mockCurrency);
      mockRepo.findByCode.mockResolvedValue({ ...mockCurrency, id: 2, code: 'CNY' });

      await expect(service.update(1, dto, 'admin')).rejects.toThrow(BadRequestException);
    });

    it('应支持禁用币种', async () => {
      const dto: UpdateCurrencyDto = { status: CurrencyStatus.INACTIVE };
      mockRepo.findById.mockResolvedValue(mockCurrency);
      mockRepo.update.mockResolvedValue({ ...mockCurrency, status: CurrencyStatus.INACTIVE });

      const res = await service.update(1, dto, 'admin');
      expect(res.status).toBe(CurrencyStatus.INACTIVE);
    });

    it('币种不存在时应抛出 NotFoundException', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.update(999, {}, 'admin')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create - 本位币互斥', () => {
    it('isBaseCurrency=1 时应先调用 clearBaseCurrency 再创建', async () => {
      const dto: CreateCurrencyDto = { code: 'CNY', name: '人民币', isBaseCurrency: 1 };
      mockRepo.findByCode.mockResolvedValue(null);
      mockRepo.clearBaseCurrency.mockResolvedValue(undefined);
      mockRepo.create.mockResolvedValue({ ...mockCurrency, code: 'CNY', isBaseCurrency: 1 });

      await service.create(dto, 'admin');
      expect(mockRepo.clearBaseCurrency).toHaveBeenCalledTimes(1);
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ isBaseCurrency: 1 }),
      );
    });

    it('isBaseCurrency=0 时不应调用 clearBaseCurrency', async () => {
      const dto: CreateCurrencyDto = { code: 'EUR', name: '欧元', isBaseCurrency: 0 };
      mockRepo.findByCode.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue({ ...mockCurrency, code: 'EUR', isBaseCurrency: 0 });

      await service.create(dto, 'admin');
      expect(mockRepo.clearBaseCurrency).not.toHaveBeenCalled();
    });

    it('create 时 isBaseCurrency 未传入应默认为 0', async () => {
      const dto: CreateCurrencyDto = { code: 'JPY', name: '日元' };
      mockRepo.findByCode.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue({ ...mockCurrency, code: 'JPY', isBaseCurrency: 0 });

      await service.create(dto, 'admin');
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ isBaseCurrency: 0 }),
      );
      expect(mockRepo.clearBaseCurrency).not.toHaveBeenCalled();
    });
  });

  describe('update - 本位币互斥', () => {
    it('update isBaseCurrency=1 时应先调用 clearBaseCurrency', async () => {
      const dto: UpdateCurrencyDto = { isBaseCurrency: 1 };
      mockRepo.findById.mockResolvedValue(mockCurrency);
      mockRepo.clearBaseCurrency.mockResolvedValue(undefined);
      mockRepo.update.mockResolvedValue({ ...mockCurrency, isBaseCurrency: 1 });

      await service.update(1, dto, 'admin');
      expect(mockRepo.clearBaseCurrency).toHaveBeenCalledTimes(1);
    });
  });
});
