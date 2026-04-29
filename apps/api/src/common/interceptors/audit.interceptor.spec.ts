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

  it('creates a single summary item for create actions', () => {
    const { interceptor } = createInterceptor();

    const result = (interceptor as any).buildChangeSummary(
      'CREATE',
      'users',
      null,
      { username: 'alice', name: 'Alice' },
      { username: 'alice', name: 'Alice' },
    );

    expect(result).toEqual([
      {
        field: '__create__',
        fieldLabel: '新增数据',
        oldValue: null,
        newValue: '已新增',
      },
    ]);
  });

  it('uses shared chinese labels for update fields', () => {
    const { interceptor } = createInterceptor();

    const result = (interceptor as any).buildChangeSummary(
      'UPDATE',
      'users',
      { username: 'old_name' },
      { username: 'new_name' },
      {},
    );

    expect(result).toEqual([
      {
        field: 'username',
        fieldLabel: '用户名',
        oldValue: 'old_name',
        newValue: 'new_name',
      },
    ]);
  });

  it('limits patch update summaries to submitted fields', () => {
    const { interceptor } = createInterceptor();

    const result = (interceptor as any).buildChangeSummary(
      'UPDATE',
      'shipping-demands',
      { afterSalesProductSummary: null },
      {
        afterSalesProductSummary: '售后产品A：1000',
        items: [{ id: 1, requiredQuantity: 2 }],
      },
      { afterSalesProductSummary: '售后产品A：1000' },
      'PATCH',
    );

    expect(result).toEqual([
      {
        field: 'afterSalesProductSummary',
        fieldLabel: '所有售后产品品名及对应总价',
        oldValue: null,
        newValue: '售后产品A：1000',
      },
    ]);
  });

  it('uses created entity id for create action resource id before path id', () => {
    const { interceptor } = createInterceptor();

    expect((interceptor as any).resolvePayloadResourceId('CREATE', { id: 500 }, '10')).toBe('500');
    expect((interceptor as any).resolvePayloadResourceId('UPDATE', { id: 500 }, '10')).toBe('10');
  });
});
