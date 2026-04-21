import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { QueryCompanyDto } from './dto/query-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company } from './entities/company.entity';
import { CompaniesRepository } from './companies.repository';

@Injectable()
export class CompaniesService {
  constructor(private readonly companiesRepository: CompaniesRepository) {}

  findAll(query: QueryCompanyDto) {
    return this.companiesRepository.findAll(query);
  }

  async findById(id: number): Promise<Company> {
    const company = await this.companiesRepository.findById(id);
    if (!company) {
      throw new NotFoundException('公司主体不存在');
    }
    return company;
  }

  async create(dto: CreateCompanyDto, operator?: string): Promise<Company> {
    const duplicate = await this.companiesRepository.findByName(dto.nameCn);
    if (duplicate) {
      throw new BadRequestException('公司名称已存在');
    }

    return this.companiesRepository.create({
      nameCn: dto.nameCn,
      signingLocation: dto.signingLocation ?? null,
      bankName: dto.bankName ?? null,
      bankAccount: dto.bankAccount ?? null,
      swiftCode: dto.swiftCode ?? null,
      defaultCurrencyCode: dto.defaultCurrencyCode ?? null,
      taxId: dto.taxId ?? null,
      customsCode: dto.customsCode ?? null,
      quarantineCode: dto.quarantineCode ?? null,
      nameEn: dto.nameEn ?? null,
      abbreviation: dto.abbreviation ?? null,
      countryId: dto.countryId ?? null,
      countryName: dto.countryName ?? null,
      addressCn: dto.addressCn ?? null,
      addressEn: dto.addressEn ?? null,
      contactPerson: dto.contactPerson ?? null,
      contactPhone: dto.contactPhone ?? null,
      defaultCurrencyName: dto.defaultCurrencyName ?? null,
      chiefAccountantId: dto.chiefAccountantId ?? null,
      chiefAccountantName: dto.chiefAccountantName ?? null,
      createdBy: operator,
      updatedBy: operator,
    });
  }

  async update(id: number, dto: UpdateCompanyDto, operator?: string): Promise<Company> {
    const company = await this.companiesRepository.findById(id);
    if (!company) {
      throw new NotFoundException('公司主体不存在');
    }

    if (dto.nameCn && dto.nameCn !== company.nameCn) {
      const duplicate = await this.companiesRepository.findByName(dto.nameCn);
      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException('公司名称已存在');
      }
    }

    return this.companiesRepository.update(id, {
      ...dto,
      updatedBy: operator,
    });
  }
}
