import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let mockDataSource: any;

  beforeEach(async () => {
    mockDataSource = {
      isInitialized: true,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should return db connected status', async () => {
    const result = await controller.getHealth();
    expect(result).toEqual({ db: 'connected' });
  });

  it('should return db disconnected status', async () => {
    mockDataSource.isInitialized = false;
    const result = await controller.getHealth();
    expect(result).toEqual({ db: 'disconnected' });
  });
});
