import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Public } from '../common/decorators/public.decorator';

@Public()
@Controller('health')
export class HealthController {
  constructor(private dataSource: DataSource) {}

  @Get()
  async getHealth() {
    const dbStatus = this.dataSource.isInitialized ? 'connected' : 'disconnected';
    return {
      db: dbStatus,
    };
  }
}
