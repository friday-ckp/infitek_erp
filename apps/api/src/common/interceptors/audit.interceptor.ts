import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DataSource, type EntityMetadata, type ObjectLiteral, Repository } from 'typeorm';
import {
  OPERATION_LOG_CREATE_SUMMARY_FIELD,
  OPERATION_LOG_CREATE_SUMMARY_LABEL,
  OPERATION_LOG_CREATE_SUMMARY_VALUE,
  resolveOperationLogFieldLabel,
} from '@infitek/shared';
import { OperationLogsService } from '../../modules/operation-logs/operation-logs.service';
import {
  OperationLogAction,
} from '../../modules/operation-logs/entities/operation-log.entity';

type RequestLike = {
  method?: string;
  originalUrl?: string;
  url?: string;
  body?: Record<string, unknown>;
  params?: Record<string, unknown>;
  user?: { id?: number; username?: string };
};

type ResponseLike = {
  statusCode?: number;
};

type EntitySnapshot = Record<string, unknown> | null;

const AUDITED_METHODS = new Set(['POST', 'PATCH', 'DELETE']);
const SENSITIVE_FIELDS = new Set([
  'password',
  'token',
  'secret',
  'accessToken',
  'refreshToken',
  'authorization',
]);
const OMITTED_CHANGE_FIELDS = new Set([
  'id',
  'createdAt',
  'updatedAt',
  'createdBy',
  'updatedBy',
  'deletedAt',
]);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly operationLogsService: OperationLogsService,
    private readonly dataSource: DataSource,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuditInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<RequestLike>();
    const response = httpContext.getResponse<ResponseLike>();
    const method = request.method?.toUpperCase();

    if (!method || !AUDITED_METHODS.has(method)) {
      return next.handle();
    }

    const auditContextPromise = this.buildAuditContext(request, method);

    return next.handle().pipe(
      tap({
        next: async (result) => {
          try {
            if ((response.statusCode ?? 200) >= 400) {
              return;
            }

            const auditContext = await auditContextPromise;
            const payload = this.buildAuditPayload({
              request,
              result,
              auditContext,
            });

            if (!payload) {
              return;
            }

            void this.operationLogsService.create(payload).catch((error: unknown) => {
              this.logger.warn(
                {
                  err: error,
                  resourcePath: payload.resourcePath,
                  action: payload.action,
                },
                'audit log write failed',
              );
            });
          } catch (error) {
            this.logger.warn({ err: error }, 'audit log preparation failed');
          }
        },
      }),
    );
  }

  private async buildAuditContext(request: RequestLike, method: string) {
    const resourcePath = this.normalizePath(request.originalUrl ?? request.url ?? '');
    const { resourceType, resourceId } = this.parseResource(resourcePath, request.params);
    const action = this.resolveAction(method, resourcePath, resourceId);
    const requestSummary = this.sanitizeValue(request.body ?? {});
    const beforeSnapshot =
      action === OperationLogAction.UPDATE || action === OperationLogAction.DELETE
        ? await this.loadEntitySnapshot(resourceType, resourceId)
        : null;

    return {
      action,
      method,
      resourcePath,
      resourceType,
      resourceId,
      requestSummary,
      beforeSnapshot,
    };
  }

  private buildAuditPayload({
    request,
    result,
    auditContext,
  }: {
    request: RequestLike;
    result: unknown;
    auditContext: Awaited<ReturnType<AuditInterceptor['buildAuditContext']>>;
  }) {
    const operator = request.user?.username ?? 'system';
    const operatorId = request.user?.id ?? null;
    const afterSnapshot =
      auditContext.action === OperationLogAction.DELETE
        ? null
        : this.extractSnapshot(result);
    const normalizedAfterSnapshot =
      auditContext.action === OperationLogAction.CREATE && !afterSnapshot
        ? this.sanitizeValue(request.body ?? {})
        : afterSnapshot;
    const changeSummary = this.buildChangeSummary(
      auditContext.action,
      auditContext.resourceType,
      auditContext.beforeSnapshot,
      normalizedAfterSnapshot,
      auditContext.requestSummary,
      auditContext.method,
    );

    if (!changeSummary.length && auditContext.action === OperationLogAction.UPDATE) {
      return null;
    }

    return {
      operator,
      operatorId,
      action: auditContext.action,
      resourceType: auditContext.resourceType,
      resourceId:
        this.resolvePayloadResourceId(auditContext.action, normalizedAfterSnapshot, auditContext.resourceId) ??
        null,
      resourcePath: auditContext.resourcePath,
      requestSummary:
        auditContext.requestSummary &&
        typeof auditContext.requestSummary === 'object' &&
        !Array.isArray(auditContext.requestSummary)
          ? (auditContext.requestSummary as Record<string, unknown>)
          : null,
      changeSummary,
    };
  }

  private resolveAction(
    method: string,
    resourcePath: string,
    resourceId: string | null,
  ) {
    switch (method) {
      case 'POST':
        return this.isCustomResourceAction(resourcePath, resourceId)
          ? OperationLogAction.UPDATE
          : OperationLogAction.CREATE;
      case 'PATCH':
        return OperationLogAction.UPDATE;
      case 'DELETE':
        return OperationLogAction.DELETE;
      default:
        return OperationLogAction.UPDATE;
    }
  }

  private isCustomResourceAction(resourcePath: string, resourceId: string | null) {
    if (!resourceId) {
      return false;
    }

    const segments = resourcePath.split('/').filter(Boolean);
    const resourceIndex = segments.findIndex((segment) => segment === resourceId);
    return resourceIndex >= 0 && resourceIndex < segments.length - 1;
  }

  private normalizePath(url: string) {
    return url.split('?')[0] ?? url;
  }

  private parseResource(resourcePath: string, params?: Record<string, unknown>) {
    const segments = resourcePath.split('/').filter(Boolean);
    const apiIndex = segments.findIndex((segment) => segment === 'api');
    const resourceStartIndex =
      apiIndex >= 0 && segments[apiIndex + 1] === 'v1' ? apiIndex + 2 : apiIndex >= 0 ? apiIndex + 1 : 0;
    const resourceType = segments[resourceStartIndex] ?? 'unknown';
    const idFromPath = segments.find((segment) => /^\d+$/.test(segment));
    const idFromParams = params?.id;
    return {
      resourceType,
      resourceId:
        typeof idFromParams === 'string' || typeof idFromParams === 'number'
          ? String(idFromParams)
          : idFromPath ?? null,
    };
  }

  private async loadEntitySnapshot(
    resourceType: string,
    resourceId: string | null,
  ): Promise<EntitySnapshot> {
    if (!resourceType || !resourceId) {
      return null;
    }

    try {
      const metadata = this.resolveEntityMetadata(resourceType);
      if (!metadata) {
        return null;
      }

      const repo = this.dataSource.getRepository(
        metadata.target as Parameters<DataSource['getRepository']>[0],
      ) as Repository<ObjectLiteral>;
      const entity = await repo.findOne({
        where: {
          [metadata.primaryColumns[0]?.propertyName ?? 'id']: Number.isNaN(Number(resourceId))
            ? resourceId
            : Number(resourceId),
        } as Record<string, unknown>,
      });

      return this.extractSnapshot(entity);
    } catch (error) {
      this.logger.warn({ err: error, resourceType, resourceId }, 'failed to load audit entity snapshot');
      return null;
    }
  }

  private resolveEntityMetadata(resourceType: string): EntityMetadata | null {
    const candidates = new Set([
      resourceType,
      resourceType.replace(/-/g, '_'),
      resourceType.replace(/_/g, '-'),
    ]);

    return (
      this.dataSource.entityMetadatas.find((item) =>
        candidates.has(item.tableName) ||
        candidates.has(item.givenTableName ?? '') ||
        candidates.has(item.name),
      ) ?? null
    );
  }

  private extractSnapshot(value: unknown): EntitySnapshot {
    if (!value || typeof value !== 'object') {
      return null;
    }

    if ('data' in (value as Record<string, unknown>)) {
      return this.extractSnapshot((value as Record<string, unknown>).data);
    }

    return this.sanitizeValue(value) as Record<string, unknown>;
  }

  private sanitizeValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeValue(item));
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (value && typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !SENSITIVE_FIELDS.has(key))
        .map(([key, entryValue]) => [key, this.sanitizeValue(entryValue)]);
      return Object.fromEntries(entries);
    }

    return value ?? null;
  }

  private buildChangeSummary(
    action: OperationLogAction,
    resourceType: string,
    beforeSnapshot: EntitySnapshot,
    afterSnapshot: unknown,
    requestSummary: unknown,
    method?: string,
  ) {
    const source =
      afterSnapshot && typeof afterSnapshot === 'object'
        ? (afterSnapshot as Record<string, unknown>)
        : requestSummary && typeof requestSummary === 'object'
          ? (requestSummary as Record<string, unknown>)
          : {};

    if (action === OperationLogAction.CREATE) {
      return [
        {
          field: OPERATION_LOG_CREATE_SUMMARY_FIELD,
          fieldLabel: OPERATION_LOG_CREATE_SUMMARY_LABEL,
          oldValue: null,
          newValue:
            source && Object.keys(source).length ? OPERATION_LOG_CREATE_SUMMARY_VALUE : '已新增',
        },
      ];
    }

    if (action === OperationLogAction.DELETE) {
      const snapshot = beforeSnapshot ?? {};
      return Object.entries(snapshot)
        .filter(([field]) => !OMITTED_CHANGE_FIELDS.has(field))
        .map(([field, oldValue]) => ({
          field,
          fieldLabel: this.humanizeField(resourceType, field),
          oldValue,
          newValue: null,
        }));
    }

    const before = beforeSnapshot ?? {};
    const after =
      afterSnapshot && typeof afterSnapshot === 'object'
        ? (afterSnapshot as Record<string, unknown>)
        : {};
    const requestFields =
      requestSummary && typeof requestSummary === 'object' && !Array.isArray(requestSummary)
        ? Object.keys(requestSummary as Record<string, unknown>)
        : [];
    const fields =
      method === 'PATCH' && requestFields.length > 0
        ? new Set(requestFields)
        : new Set([...Object.keys(before), ...Object.keys(after)]);

    return Array.from(fields)
      .filter((field) => !OMITTED_CHANGE_FIELDS.has(field))
      .filter((field) => !this.areValuesEqual(before[field], after[field]))
      .map((field) => ({
        field,
        fieldLabel: this.humanizeField(resourceType, field),
        oldValue: before[field] ?? null,
        newValue: after[field] ?? null,
      }));
  }

  private humanizeField(resourceType: string, field: string) {
    return resolveOperationLogFieldLabel(resourceType, field);
  }

  private extractResourceId(snapshot: unknown) {
    if (!snapshot || typeof snapshot !== 'object') {
      return null;
    }

    const id = (snapshot as Record<string, unknown>).id;
    if (typeof id === 'string' || typeof id === 'number') {
      return String(id);
    }
    return null;
  }

  private resolvePayloadResourceId(
    action: OperationLogAction,
    snapshot: unknown,
    pathResourceId: string | null,
  ) {
    const resultResourceId = this.extractResourceId(snapshot);
    if (action === OperationLogAction.CREATE && resultResourceId) {
      return resultResourceId;
    }
    return pathResourceId ?? resultResourceId ?? null;
  }

  private areValuesEqual(left: unknown, right: unknown) {
    return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
  }
}
