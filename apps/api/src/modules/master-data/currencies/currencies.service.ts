import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CurrencyStatus } from '@infitek/shared';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { QueryCurrencyDto } from './dto/query-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';
import { Currency } from './entities/currency.entity';
import { CurrenciesRepository } from './currencies.repository';

@Injectable()
export class CurrenciesService {
  constructor(private readonly currenciesRepository: CurrenciesRepository) {}

  findAll(query: QueryCurrencyDto) {
    return this.currenciesRepository.findAll(query);
  }

  async findById(id: number): Promise<Currency> {
    const currency = await this.currenciesRepository.findById(id);
    if (!currency) {
      throw new NotFoundException('币种不存在');
    }
    return currency;
  }

  async create(dto: CreateCurrencyDto, operator?: string) {
    const duplicate = await this.currenciesRepository.findByCode(dto.code);
    if (duplicate) {
      throw new BadRequestException('币种代码已存在');
    }
    return this.currenciesRepository.create({
      code: dto.code,
      name: dto.name,
      status: CurrencyStatus.ACTIVE,
      createdBy: operator,
      updatedBy: operator,
    });
  }

  async update(id: number, dto: UpdateCurrencyDto, operator?: string) {
    const currency = await this.currenciesRepository.findById(id);
    if (!currency) {
      throw new NotFoundException('币种不存在');
    }

    if (dto.code && dto.code !== currency.code) {
      const duplicate = await this.currenciesRepository.findByCode(dto.code);
      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException('币种代码已存在');
      }
    }

    return this.currenciesRepository.update(id, {
      ...dto,
      updatedBy: operator,
    });
  }
}
