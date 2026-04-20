import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCountryDto } from './dto/create-country.dto';
import { QueryCountryDto } from './dto/query-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { Country } from './entities/country.entity';
import { CountriesRepository } from './countries.repository';

@Injectable()
export class CountriesService {
  constructor(private readonly countriesRepository: CountriesRepository) {}

  findAll(query: QueryCountryDto) {
    return this.countriesRepository.findAll(query);
  }

  async findById(id: number): Promise<Country> {
    const country = await this.countriesRepository.findById(id);
    if (!country) {
      throw new NotFoundException('国家/地区不存在');
    }
    return country;
  }

  async create(dto: CreateCountryDto, operator?: string) {
    const duplicate = await this.countriesRepository.findByCode(dto.code);
    if (duplicate) {
      throw new BadRequestException('国家代码已存在');
    }
    return this.countriesRepository.create({
      name: dto.name,
      code: dto.code,
      createdBy: operator,
      updatedBy: operator,
    });
  }

  async update(id: number, dto: UpdateCountryDto, operator?: string) {
    const country = await this.countriesRepository.findById(id);
    if (!country) {
      throw new NotFoundException('国家/地区不存在');
    }

    if (dto.code && dto.code !== country.code) {
      const duplicate = await this.countriesRepository.findByCode(dto.code);
      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException('国家代码已存在');
      }
    }

    return this.countriesRepository.update(id, {
      ...dto,
      updatedBy: operator,
    });
  }
}
