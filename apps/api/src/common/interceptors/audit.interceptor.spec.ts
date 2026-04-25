import { PinoLogger } from 'nestjs-pino';
import { DataSource, type EntityMetadata, type Repository } from 'typeorm';
import { AuditInterceptor } from './audit.interceptor';
import { OperationLogsService } from '../../modules/operation-logs/operation-logs.service';

describe('AuditInterceptor', () => {
  const createInterceptor = (overrides?: {
    entityMetadatas?: EntityMetadata[];
    findOne?: jest.Mock;
  }) => {
    const findOne = overrides?.findOne ?? jest.fn();
    const repo = {
      findOne,
    } as unknown as Repository<Record<string, unknown>>;
    const dataSource = {
      entityMetadatas: overrides?.entityMetadatas ?? [],
      getRepository: jest.fn().mockReturnValue(repo),
    } as unknown as DataSource;
    const operationLogsService = {
      create: jest.fn(),
    } as unknown as OperationLogsService;
    const logger = {
      setContext: jest.fn(),
      warn: jest.fn(),
    } as unknown as PinoLogger;

    return {
      interceptor: new AuditInterceptor(operationLogsService, dataSource, logger),
      dataSource,
      findOne,
    };
  };

  it('loads snapshot for hyphenated resource types via underscored entity table names', async () => {
    const findOne = jest.fn().mockResolvedValue({ id: 12, docNo: 'PD-001' });
    const { interceptor } = createInterceptor({
      entityMetadatas: [
        {
          tableName: 'product_documents',
          givenTableName: 'product_documents',
          name: 'ProductDocument',
          target: class ProductDocument {},
          primaryColumns: [{ propertyName: 'id' }],
        } as unknown as EntityMetadata,
      ],
      findOne,
    });

    const snapshot = await (interceptor as any).loadEntitySnapshot('product-documents', '12');

    expect(findOne).toHaveBeenCalledWith({ where: { id: 12 } });
    expect(snapshot).toEqual({ id: 12, docNo: 'PD-001' });
  });

  it('returns null when no matching entity metadata exists', async () => {
    const { interceptor, dataSource } = createInterceptor();

    const snapshot = await (interceptor as any).loadEntitySnapshot('missing-resource', '1');

    expect(snapshot).toBeNull();
    expect(dataSource.getRepository).not.toHaveBeenCalled();
  });

  it('treats post sub-actions on an existing resource as updates', () => {
    const { interceptor } = createInterceptor();

    expect((interceptor as any).resolveAction('POST', '/api/v1/users/12/deactivate', '12')).toBe('UPDATE');
    expect((interceptor as any).resolveAction('POST', '/api/v1/contract-templates/8/approve', '8')).toBe('UPDATE');
    expect((interceptor as any).resolveAction('POST', '/api/v1/users', null)).toBe('CREATE');
  });
});
