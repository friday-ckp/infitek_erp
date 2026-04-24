import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CountriesService } from '../../countries/countries.service';
import { UsersService } from '../../../users/users.service';
import { CustomersRepository } from '../customers.repository';
import { CustomersService } from '../customers.service';

describe('CustomersService', () => {
  let service: CustomersService;

  const repoMock = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCustomerCode: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const countriesServiceMock = {
    findById: jest.fn(),
  };

  const usersServiceMock = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: CustomersRepository,
          useValue: repoMock,
        },
        {
          provide: CountriesService,
          useValue: countriesServiceMock,
        },
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    jest.clearAllMocks();
  });

  it('应分页查询客户列表', async () => {
    const payload = {
      list: [
        {
          id: 1,
          customerCode: 'CUST-001',
          customerName: 'ABC Trade',
          countryId: 1,
          countryName: '中国',
          salespersonId: 2,
          salespersonName: '张三',
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    };
    repoMock.findAll.mockResolvedValue(payload);

    const result = await service.findAll({ page: 1, pageSize: 20, keyword: 'ABC' });

    expect(result).toEqual(payload);
    expect(repoMock.findAll).toHaveBeenCalledWith({ page: 1, pageSize: 20, keyword: 'ABC' });
  });

  it('应创建客户', async () => {
    repoMock.findByCustomerCode.mockResolvedValue(null);
    countriesServiceMock.findById.mockResolvedValue({ id: 1, name: '中国' });
    usersServiceMock.findById.mockResolvedValue({ id: 2, name: '张三' });
    repoMock.create.mockResolvedValue({
      id: 1,
      customerCode: 'CUST-001',
      customerName: 'ABC Trade',
      countryName: '中国',
      salespersonName: '张三',
      createdBy: 'admin',
    });

    const result = await service.create(
      {
        customerCode: 'CUST-001',
        customerName: 'ABC Trade',
        countryId: 1,
        salespersonId: 2,
        contactPerson: '李四',
      },
      'admin',
    );

    expect(result.customerCode).toBe('CUST-001');
    expect(repoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customerCode: 'CUST-001',
        customerName: 'ABC Trade',
        countryId: 1,
        countryName: '中国',
        salespersonId: 2,
        salespersonName: '张三',
        contactPerson: '李四',
        createdBy: 'admin',
        updatedBy: 'admin',
      }),
    );
  });

  it('创建重复客户代码应抛错', async () => {
    repoMock.findByCustomerCode.mockResolvedValue({ id: 1, customerCode: 'CUST-001' });

    await expect(
      service.create(
        {
          customerCode: 'CUST-001',
          customerName: 'ABC Trade',
          countryId: 1,
          salespersonId: 2,
        },
        'admin',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('创建时销售员不存在应抛错', async () => {
    repoMock.findByCustomerCode.mockResolvedValue(null);
    countriesServiceMock.findById.mockResolvedValue({ id: 1, name: '中国' });
    usersServiceMock.findById.mockResolvedValue(null);

    await expect(
      service.create(
        {
          customerCode: 'CUST-001',
          customerName: 'ABC Trade',
          countryId: 1,
          salespersonId: 2,
        },
        'admin',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('应更新客户', async () => {
    repoMock.findById.mockResolvedValue({
      id: 1,
      customerCode: 'CUST-001',
      customerName: 'ABC Trade',
      countryId: 1,
      countryName: '中国',
      salespersonId: 2,
      salespersonName: '张三',
      contactPerson: '李四',
      contactPhone: null,
      contactEmail: null,
      billingRequirements: null,
      address: null,
    });
    usersServiceMock.findById.mockResolvedValue({ id: 3, name: '王五' });
    repoMock.update.mockResolvedValue({
      id: 1,
      customerCode: 'CUST-001',
      customerName: 'ABC Trade',
      salespersonId: 3,
      salespersonName: '王五',
      contactPerson: '赵六',
    });

    const result = await service.update(
      1,
      { salespersonId: 3, contactPerson: '赵六' },
      'admin',
    );

    expect(result.salespersonName).toBe('王五');
    expect(repoMock.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        salespersonId: 3,
        salespersonName: '王五',
        contactPerson: '赵六',
        updatedBy: 'admin',
      }),
    );
  });

  it('更新不存在客户应抛错', async () => {
    repoMock.findById.mockResolvedValue(null);

    await expect(service.update(999, { customerName: 'X' }, 'admin')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('查询不存在客户详情应抛错', async () => {
    repoMock.findById.mockResolvedValue(null);

    await expect(service.findById(999)).rejects.toThrow(NotFoundException);
  });
});
