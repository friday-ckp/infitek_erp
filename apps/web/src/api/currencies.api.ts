import type { CurrencyStatus } from '@infitek/shared';
import request from './request';

export interface Currency {
  id: number;
  code: string;
  name: string;
  status: CurrencyStatus;
  symbol?: string | null;
  isBaseCurrency?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CurrenciesListParams {
  keyword?: string;
  status?: CurrencyStatus;
  page?: number;
  pageSize?: number;
}

export interface CurrenciesListData {
  list: Currency[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateCurrencyPayload {
  code: string;
  name: string;
  symbol?: string;
  isBaseCurrency?: number;
}

export interface UpdateCurrencyPayload {
  code?: string;
  name?: string;
  status?: CurrencyStatus;
  symbol?: string;
  isBaseCurrency?: number;
}

function normalizeApiError(error: unknown): never {
  if (typeof error === 'object' && error !== null) throw error;
  throw { message: '请求失败，请稍后重试' };
}

export const getCurrencies = (params: CurrenciesListParams): Promise<CurrenciesListData> =>
  request.get<unknown, CurrenciesListData>('/currencies', { params }).catch(normalizeApiError);

export const getCurrencyById = (id: number): Promise<Currency> =>
  request.get<unknown, Currency>(`/currencies/${id}`).catch(normalizeApiError);

export const createCurrency = (payload: CreateCurrencyPayload): Promise<Currency> =>
  request.post<unknown, Currency>('/currencies', payload).catch(normalizeApiError);

export const updateCurrency = (id: number, payload: UpdateCurrencyPayload): Promise<Currency> =>
  request.patch<unknown, Currency>(`/currencies/${id}`, payload).catch(normalizeApiError);
