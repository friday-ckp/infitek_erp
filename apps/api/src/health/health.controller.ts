import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';

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
