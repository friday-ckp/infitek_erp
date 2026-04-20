import type { UnitStatus } from '@infitek/shared';
import request from './request';

export interface Unit {
  id: number;
  code: string;
  name: string;
  status: UnitStatus;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface UnitsListParams {
  keyword?: string;
  status?: UnitStatus;
  page?: number;
  pageSize?: number;
}

export interface UnitsListData {
  list: Unit[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateUnitPayload {
  code: string;
  name: string;
}

export interface UpdateUnitPayload {
  code?: string;
  name?: string;
  status?: UnitStatus;
}

function normalizeApiError(error: unknown): never {
  if (typeof error === 'object' && error !== null) {
    throw error;
  }
  throw { message: '请求失败，请稍后重试' };
}

export const getUnits = (params: UnitsListParams): Promise<UnitsListData> => {
  return request.get<any, UnitsListData>('/units', { params }).catch(normalizeApiError);
};

export const getUnitById = (id: number): Promise<Unit> => {
  return request.get<any, Unit>(`/units/${id}`).catch(normalizeApiError);
};

export const createUnit = (payload: CreateUnitPayload): Promise<Unit> => {
  return request.post<any, Unit>('/units', payload).catch(normalizeApiError);
};

export const updateUnit = (id: number, payload: UpdateUnitPayload): Promise<Unit> => {
  return request.patch<any, Unit>(`/units/${id}`, payload).catch(normalizeApiError);
};
