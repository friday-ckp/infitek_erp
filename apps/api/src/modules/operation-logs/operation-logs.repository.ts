import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperationLog } from './entities/operation-log.entity';
import { QueryOperationLogDto } from './dto/query-operation-log.dto';

@Injectable()
export class OperationLogsRepository {
  constructor(
    @InjectRepository(OperationLog)
    private readonly repo: Repository<OperationLog>,
  ) {}

  create(data: Partial<OperationLog>): Promise<OperationLog> {
    return this.repo.save(this.repo.create(data));
  }

  async findAll(query: QueryOperationLogDto) {
    const {
      page = 1,
      pageSize = 20,
      operator,
      action,
      dateFrom,
      dateTo,
      resourceType,
      resourceId,
    } = query;

    const qb = this.repo.createQueryBuilder('operationLog');

    if (operator) {
      qb.andWhere('operationLog.operator LIKE :operator', {
        operator: `%${operator}%`,
      });
    }

    if (action) {
      qb.andWhere('operationLog.action = :action', { action });
    }

    if (dateFrom) {
      qb.andWhere('operationLog.created_at >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      qb.andWhere('operationLog.created_at <= :dateTo', { dateTo });
    }

    if (resourceType) {
      qb.andWhere('operationLog.resource_type = :resourceType', { resourceType });
    }

    if (resourceId) {
      qb.andWhere('operationLog.resource_id = :resourceId', { resourceId });
    }

    const [list, total] = await qb
      .orderBy('operationLog.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
