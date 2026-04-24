import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LogisticsProviderStatus } from '@infitek/shared';
import { CompaniesService } from '../companies/companies.service';
import { CountriesService } from '../countries/countries.service';
import { CreateLogisticsProviderDto } from './dto/create-logistics-provider.dto';
import { QueryLogisticsProviderDto } from './dto/query-logistics-provider.dto';
import { UpdateLogisticsProviderDto } from './dto/update-logistics-provider.dto';
import { LogisticsProvider } from './entities/logistics-provider.entity';
import { LogisticsProvidersRepository } from './logistics-providers.repository';

@Injectable()
export class LogisticsProvidersService {
  constructor(
    private readonly logisticsProvidersRepository: LogisticsProvidersRepository,
    private readonly countriesService: CountriesService,
    private readonly companiesService: CompaniesService,
  ) {}

  findAll(query: QueryLogisticsProviderDto) {
    return this.logisticsProvidersRepository.findAll(query);
  }

  async findById(id: number): Promise<LogisticsProvider> {
    const provider = await this.logisticsProvidersRepository.findById(id);
    if (!provider) {
      throw new NotFoundException('物流供应商不存在');
    }
    return provider;
  }

  private async generateProviderCode(): Promise<string> {
    const latestCode = await this.logisticsProvidersRepository.findLatestCode();
    const nextNumber = latestCode
      ? Number.parseInt(latestCode.replace(/^YCWL/, ''), 10) + 1
      : 1;

    return `YCWL${String(nextNumber).padStart(4, '0')}`;
  }

  private async resolveCountry(
    countryId?: number | null,
    countryName?: string | null,
  ): Promise<Pick<LogisticsProvider, 'countryId' | 'countryName'>> {
    if (!countryId) {
      return { countryId: null, countryName: countryName ?? null };
    }
    const country = await this.countriesService.findById(countryId);
    return {
      countryId,
      countryName: countryName?.trim() || country.name,
    };
  }

  private async resolveCompany(
    defaultCompanyId?: number | null,
    defaultCompanyName?: string | null,
  ): Promise<Pick<LogisticsProvider, 'defaultCompanyId' | 'defaultCompanyName'>> {
    if (!defaultCompanyId) {
      return {
        defaultCompanyId: null,
        defaultCompanyName: defaultCompanyName ?? null,
      };
    }
    const company = await this.companiesService.findById(defaultCompanyId);
    return {
      defaultCompanyId,
      defaultCompanyName: defaultCompanyName?.trim() || company.nameCn,
    };
  }

  async create(dto: CreateLogisticsProviderDto, operator?: string) {
    const duplicateName = await this.logisticsProvidersRepository.findByName(dto.name);
    if (duplicateName) {
      throw new BadRequestException('物流供应商名称已存在');
    }

    if (dto.providerCode) {
      const duplicateCode = await this.logisticsProvidersRepository.findByCode(dto.providerCode);
      if (duplicateCode) {
        throw new BadRequestException('物流供应商编码已存在');
      }
    }

    const country = await this.resolveCountry(dto.countryId, dto.countryName);
    const company = await this.resolveCompany(dto.defaultCompanyId, dto.defaultCompanyName);
    const providerCode = dto.providerCode ?? (await this.generateProviderCode());

    const entity = new LogisticsProvider();
    entity.name = dto.name;
    entity.providerCode = providerCode;
    entity.shortName = dto.shortName;
    entity.contactPerson = dto.contactPerson;
    entity.contactPhone = dto.contactPhone;
    entity.contactEmail = dto.contactEmail;
    entity.address = dto.address;
    entity.status = dto.status ?? LogisticsProviderStatus.COOPERATING;
    entity.providerLevel = dto.providerLevel ?? null;
    entity.countryId = country.countryId;
    entity.countryName = country.countryName;
    entity.defaultCompanyId = company.defaultCompanyId;
    entity.defaultCompanyName = company.defaultCompanyName;
    if (operator !== undefined) {
      entity.createdBy = operator;
      entity.updatedBy = operator;
    }

    return this.logisticsProvidersRepository.create(entity);
  }

  async update(id: number, dto: UpdateLogisticsProviderDto, operator?: string) {
    const provider = await this.logisticsProvidersRepository.findById(id);
    if (!provider) {
      throw new NotFoundException('物流供应商不存在');
    }

    if (dto.name && dto.name !== provider.name) {
      const duplicateName = await this.logisticsProvidersRepository.findByName(dto.name);
      if (duplicateName && duplicateName.id !== id) {
        throw new BadRequestException('物流供应商名称已存在');
      }
    }

    if (dto.providerCode && dto.providerCode !== provider.providerCode) {
      const duplicateCode = await this.logisticsProvidersRepository.findByCode(dto.providerCode);
      if (duplicateCode && duplicateCode.id !== id) {
        throw new BadRequestException('物流供应商编码已存在');
      }
    }

    const country =
      dto.countryId !== undefined || dto.countryName !== undefined
        ? await this.resolveCountry(
            dto.countryId ?? null,
            dto.countryName ?? provider.countryName,
          )
        : {
            countryId: provider.countryId,
            countryName: provider.countryName,
          };

    const company =
      dto.defaultCompanyId !== undefined || dto.defaultCompanyName !== undefined
        ? await this.resolveCompany(
            dto.defaultCompanyId ?? null,
            dto.defaultCompanyName ?? provider.defaultCompanyName,
          )
        : {
            defaultCompanyId: provider.defaultCompanyId,
            defaultCompanyName: provider.defaultCompanyName,
          };

    const entity = new LogisticsProvider();
    entity.name = dto.name ?? provider.name;
    entity.providerCode = dto.providerCode ?? provider.providerCode;
    entity.shortName = dto.shortName ?? provider.shortName;
    entity.contactPerson =
      dto.contactPerson ?? provider.contactPerson;
    entity.contactPhone =
      dto.contactPhone ?? provider.contactPhone;
    entity.contactEmail =
      dto.contactEmail ?? provider.contactEmail;
    entity.address = dto.address ?? provider.address;
    entity.status = dto.status ?? provider.status;
    entity.providerLevel =
      dto.providerLevel === undefined ? provider.providerLevel : dto.providerLevel ?? null;
    entity.countryId = country.countryId;
    entity.countryName = country.countryName;
    entity.defaultCompanyId = company.defaultCompanyId;
    entity.defaultCompanyName = company.defaultCompanyName;
    if (operator !== undefined) {
      entity.updatedBy = operator;
    }

    return this.logisticsProvidersRepository.update(id, entity);
  }
}
