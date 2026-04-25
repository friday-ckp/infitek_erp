import { Controller, Get, Query } from '@nestjs/common';
import { QueryOperationLogDto } from './dto/query-operation-log.dto';
import { OperationLogsService } from './operation-logs.service';

@Controller('v1/operation-logs')
export class OperationLogsController {
  constructor(private readonly operationLogsService: OperationLogsService) {}

  @Get()
  findAll(@Query() query: QueryOperationLogDto) {
    return this.operationLogsService.findAll(query);
  }
}
