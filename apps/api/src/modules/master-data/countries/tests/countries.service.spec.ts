import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateCountryDto } from '../dto/create-country.dto';
import { UpdateCountryDto } from '../dto/update-country.dto';
import { Country } from '../entities/country.entity';
import { CountriesRepository } from '../countries.repository';
import { CountriesService } from '../countries.service';

const mockCountry: Country = {
  id: 1,
  name: '中国',
  code: 'CN',
  nameEn: null,
  abbreviation: null,
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
};

describe('CountriesService', () => {
  let service: CountriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CountriesService,
        { provide: CountriesRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<CountriesService>(CountriesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('应返回分页列表', async () => {
      const result = { list: [mockCountry], total: 1, page: 1, pageSize: 20, totalPages: 1 };
      mockRepo.findAll.mockResolvedValue(result);

      const res = await service.findAll({ page: 1, pageSize: 20 });
      expect(res).toEqual(result);
    });
  });

  describe('findById', () => {
    it('应返回国家', async () => {
      mockRepo.findById.mockResolvedValue(mockCountry);
      const res = await service.findById(1);
      expect(res).toEqual(mockCountry);
    });

    it('国家不存在时应抛出 NotFoundException', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('应创建国家', async () => {
      const dto: CreateCountryDto = { name: '美国', code: 'US' };
      mockRepo.findByCode.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue({ ...mockCountry, ...dto });

      await service.create(dto, 'admin');
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: '美国', code: 'US', createdBy: 'admin' }),
      );
    });

    it('应创建国家（含英文名称和简称）', async () => {
      const dto: CreateCountryDto = { name: '美国', code: 'US', nameEn: 'United States', abbreviation: '美' };
      mockRepo.findByCode.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue({ ...mockCountry, ...dto });

      await service.create(dto, 'admin');
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nameEn: 'United States',
          abbreviation: '美',
        }),
      );
    });

    it('code 重复时应抛出 BadRequestException', async () => {
      const dto: CreateCountryDto = { name: '中华人民共和国', code: 'CN' };
      mockRepo.findByCode.mockResolvedValue(mockCountry);

      await expect(service.create(dto, 'admin')).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('应更新国家名称', async () => {
      const dto: UpdateCountryDto = { name: '中国（更新）' };
      mockRepo.findById.mockResolvedValue(mockCountry);
      mockRepo.update.mockResolvedValue({ ...mockCountry, name: '中国（更新）' });

      const res = await service.update(1, dto, 'admin');
      expect(res.name).toBe('中国（更新）');
    });

    it('修改 code 时应检查重复', async () => {
      const dto: UpdateCountryDto = { code: 'US' };
      mockRepo.findById.mockResolvedValue(mockCountry);
      mockRepo.findByCode.mockResolvedValue({ ...mockCountry, id: 2, code: 'US' });

      await expect(service.update(1, dto, 'admin')).rejects.toThrow(BadRequestException);
    });

    it('国家不存在时应抛出 NotFoundException', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.update(999, {}, 'admin')).rejects.toThrow(NotFoundException);
    });
  });
});
