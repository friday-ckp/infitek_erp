import { Injectable } from '@nestjs/common';
import { CreateOperationLogDto } from './dto/create-operation-log.dto';
import { QueryOperationLogDto } from './dto/query-operation-log.dto';
import { OperationLogsRepository } from './operation-logs.repository';

@Injectable()
export class OperationLogsService {
  constructor(private readonly operationLogsRepository: OperationLogsRepository) {}

  create(dto: CreateOperationLogDto) {
    return this.operationLogsRepository.create({
      operator: dto.operator,
      operatorId: dto.operatorId ?? null,
      action: dto.action,
      resourceType: dto.resourceType,
      resourceId: dto.resourceId ?? null,
      resourcePath: dto.resourcePath,
      requestSummary: dto.requestSummary ?? null,
      changeSummary: dto.changeSummary
        ? dto.changeSummary.map((item) => ({
            field: item.field,
            fieldLabel: item.fieldLabel ?? item.field,
            oldValue: item.oldValue ?? null,
            newValue: item.newValue ?? null,
          }))
        : null,
    });
  }

  findAll(query: QueryOperationLogDto) {
    return this.operationLogsRepository.findAll(query);
  }
}
