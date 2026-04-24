import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CountriesService } from '../countries/countries.service';
import { CreatePortDto } from './dto/create-port.dto';
import { QueryPortDto } from './dto/query-port.dto';
import { UpdatePortDto } from './dto/update-port.dto';
import { Port } from './entities/port.entity';
import { PortsRepository } from './ports.repository';

@Injectable()
export class PortsService {
  constructor(
    private readonly portsRepository: PortsRepository,
    private readonly countriesService: CountriesService,
  ) {}

  findAll(query: QueryPortDto) {
    return this.portsRepository.findAll(query);
  }

  async findById(id: number): Promise<Port> {
    const port = await this.portsRepository.findById(id);
    if (!port) {
      throw new NotFoundException('港口不存在');
    }
    return port;
  }

  private async resolveCountryPayload(countryId: number, countryName?: string | null) {
    const country = await this.countriesService.findById(countryId);
    return {
      countryId,
      countryName: countryName?.trim() || country.name,
    };
  }

  async create(dto: CreatePortDto, operator?: string) {
    const duplicate = await this.portsRepository.findByCode(dto.portCode);
    if (duplicate) {
      throw new BadRequestException('港口代码已存在');
    }

    const countryInfo = await this.resolveCountryPayload(dto.countryId, dto.countryName);

    return this.portsRepository.create({
      portType: dto.portType,
      portCode: dto.portCode,
      nameCn: dto.nameCn,
      nameEn: dto.nameEn,
      ...countryInfo,
      createdBy: operator,
      updatedBy: operator,
    });
  }

  async update(id: number, dto: UpdatePortDto, operator?: string) {
    const port = await this.portsRepository.findById(id);
    if (!port) {
      throw new NotFoundException('港口不存在');
    }

    if (dto.portCode && dto.portCode !== port.portCode) {
      const duplicate = await this.portsRepository.findByCode(dto.portCode);
      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException('港口代码已存在');
      }
    }

    let countryData: Partial<Port> = {};
    if (dto.countryId !== undefined) {
      countryData = await this.resolveCountryPayload(
        dto.countryId,
        dto.countryName ?? port.countryName,
      );
    } else if (dto.countryName !== undefined) {
      countryData = { countryName: dto.countryName };
    }

    return this.portsRepository.update(id, {
      portType: dto.portType ?? port.portType,
      portCode: dto.portCode ?? port.portCode,
      nameCn: dto.nameCn ?? port.nameCn,
      nameEn: dto.nameEn ?? port.nameEn,
      ...countryData,
      updatedBy: operator,
    });
  }
}
