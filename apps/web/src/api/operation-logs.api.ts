import request from './request';

export type OperationLogAction = 'CREATE' | 'UPDATE' | 'DELETE';

export interface OperationLogChangeItem {
  field: string;
  fieldLabel?: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface OperationLogRecord {
  id: number;
  operator: string;
  operatorId?: number | null;
  action: OperationLogAction;
  resourceType: string;
  resourceId?: string | null;
  resourcePath: string;
  requestSummary?: Record<string, unknown> | null;
  changeSummary?: OperationLogChangeItem[] | null;
  createdAt: string;
}

export interface OperationLogsListParams {
  operator?: string;
  action?: OperationLogAction;
  dateFrom?: string;
  dateTo?: string;
  resourceType?: string;
  resourceId?: string | number;
  page?: number;
  pageSize?: number;
}

export interface OperationLogsListData {
  list: OperationLogRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function normalizeApiError(error: unknown): never {
  if (typeof error === 'object' && error !== null) {
    throw error;
  }
  throw { message: '请求失败，请稍后重试' };
}

export const getOperationLogs = (
  params: OperationLogsListParams,
): Promise<OperationLogsListData> =>
  request
    .get<any, OperationLogsListData>('/v1/operation-logs', { params })
    .catch(normalizeApiError);
