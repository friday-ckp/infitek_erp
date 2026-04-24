import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CountriesService } from '../countries/countries.service';
import { UsersService } from '../../users/users.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomersRepository } from './customers.repository';
import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomersService {
  constructor(
    private readonly customersRepository: CustomersRepository,
    private readonly countriesService: CountriesService,
    private readonly usersService: UsersService,
  ) {}

  findAll(query: QueryCustomerDto) {
    return this.customersRepository.findAll(query);
  }

  async findById(id: number): Promise<Customer> {
    const customer = await this.customersRepository.findById(id);
    if (!customer) {
      throw new NotFoundException('客户不存在');
    }
    return customer;
  }

  async create(dto: CreateCustomerDto, operator?: string): Promise<Customer> {
    const duplicate = await this.customersRepository.findByCustomerCode(dto.customerCode);
    if (duplicate) {
      throw new BadRequestException('客户代码已存在');
    }

    const country = await this.countriesService.findById(dto.countryId);
    const salesperson = await this.usersService.findById(dto.salespersonId);

    if (!salesperson) {
      throw new NotFoundException('销售员不存在');
    }

    return this.customersRepository.create({
      customerCode: dto.customerCode,
      customerName: dto.customerName,
      countryId: country.id,
      countryName: country.name,
      salespersonId: salesperson.id,
      salespersonName: salesperson.name,
      contactPerson: dto.contactPerson ?? null,
      contactPhone: dto.contactPhone ?? null,
      contactEmail: dto.contactEmail ?? null,
      billingRequirements: dto.billingRequirements ?? null,
      address: dto.address ?? null,
      createdBy: operator,
      updatedBy: operator,
    });
  }

  async update(id: number, dto: UpdateCustomerDto, operator?: string): Promise<Customer> {
    const customer = await this.customersRepository.findById(id);
    if (!customer) {
      throw new NotFoundException('客户不存在');
    }

    if (dto.customerCode && dto.customerCode !== customer.customerCode) {
      const duplicate = await this.customersRepository.findByCustomerCode(dto.customerCode);
      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException('客户代码已存在');
      }
    }

    let countryId = customer.countryId;
    let countryName = customer.countryName;
    if (dto.countryId != null && dto.countryId !== customer.countryId) {
      const country = await this.countriesService.findById(dto.countryId);
      countryId = country.id;
      countryName = country.name;
    }

    let salespersonId = customer.salespersonId;
    let salespersonName = customer.salespersonName;
    if (dto.salespersonId != null && dto.salespersonId !== customer.salespersonId) {
      const salesperson = await this.usersService.findById(dto.salespersonId);
      if (!salesperson) {
        throw new NotFoundException('销售员不存在');
      }
      salespersonId = salesperson.id;
      salespersonName = salesperson.name;
    }

    return this.customersRepository.update(id, {
      customerCode: dto.customerCode ?? customer.customerCode,
      customerName: dto.customerName ?? customer.customerName,
      countryId,
      countryName,
      salespersonId,
      salespersonName,
      contactPerson:
        dto.contactPerson !== undefined ? dto.contactPerson ?? null : customer.contactPerson,
      contactPhone:
        dto.contactPhone !== undefined ? dto.contactPhone ?? null : customer.contactPhone,
      contactEmail:
        dto.contactEmail !== undefined ? dto.contactEmail ?? null : customer.contactEmail,
      billingRequirements:
        dto.billingRequirements !== undefined
          ? dto.billingRequirements ?? null
          : customer.billingRequirements,
      address: dto.address !== undefined ? dto.address ?? null : customer.address,
      updatedBy: operator,
    });
  }
}
