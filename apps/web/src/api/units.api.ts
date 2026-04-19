import type { UnitStatus } from '@infitek/shared';
import request from './request';

export interface Unit {
  id: string;
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

export const getUnits = (params: UnitsListParams): Promise<UnitsListData> => {
  return request.get('/units', { params });
};

export const getUnitById = (id: string): Promise<Unit> => {
  return request.get(`/units/${id}`);
};

export const createUnit = (payload: CreateUnitPayload): Promise<Unit> => {
  return request.post('/units', payload);
};

export const updateUnit = (id: string, payload: UpdateUnitPayload): Promise<Unit> => {
  return request.patch(`/units/${id}`, payload);
};
