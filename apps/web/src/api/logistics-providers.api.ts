import type { LogisticsProviderStatus } from '@infitek/shared';
import request from './request';

export interface LogisticsProvider {
  id: number;
  name: string;
  providerCode: string | null;
  shortName: string | null;
  contactPerson: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  address: string | null;
  status: LogisticsProviderStatus;
  providerLevel: number | null;
  countryId: number | null;
  countryName: string | null;
  defaultCompanyId: number | null;
  defaultCompanyName: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface LogisticsProvidersListParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface LogisticsProvidersListData {
  list: LogisticsProvider[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateLogisticsProviderPayload {
  name: string;
  providerCode?: string;
  shortName?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  status?: LogisticsProviderStatus;
  providerLevel?: number;
  countryId?: number;
  countryName?: string;
  defaultCompanyId: number;
  defaultCompanyName?: string;
}

export type UpdateLogisticsProviderPayload =
  Partial<CreateLogisticsProviderPayload>;

export const LOGISTICS_PROVIDER_STATUS_OPTIONS = [
  { label: '合作', value: '合作' },
  { label: '淘汰', value: '淘汰' },
];

function normalizeApiError(error: unknown): never {
  if (typeof error === 'object' && error !== null) throw error;
  throw { message: '请求失败，请稍后重试' };
}

export const getLogisticsProviders = (
  params: LogisticsProvidersListParams,
): Promise<LogisticsProvidersListData> =>
  request
    .get<unknown, LogisticsProvidersListData>('/logistics-providers', { params })
    .catch(normalizeApiError);

export const getLogisticsProviderById = (
  id: number,
): Promise<LogisticsProvider> =>
  request
    .get<unknown, LogisticsProvider>(`/logistics-providers/${id}`)
    .catch(normalizeApiError);

export const createLogisticsProvider = (
  payload: CreateLogisticsProviderPayload,
): Promise<LogisticsProvider> =>
  request
    .post<unknown, LogisticsProvider>('/logistics-providers', payload)
    .catch(normalizeApiError);

export const updateLogisticsProvider = (
  id: number,
  payload: UpdateLogisticsProviderPayload,
): Promise<LogisticsProvider> =>
  request
    .patch<unknown, LogisticsProvider>(`/logistics-providers/${id}`, payload)
    .catch(normalizeApiError);
