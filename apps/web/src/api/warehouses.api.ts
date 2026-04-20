import type { WarehouseOwnership, WarehouseStatus, WarehouseType } from '@infitek/shared';
import request from './request';

export interface Warehouse {
  id: number;
  name: string;
  address: string | null;
  status: WarehouseStatus;
  warehouseCode?: string | null;
  warehouseType?: WarehouseType | null;
  supplierId?: number | null;
  supplierName?: string | null;
  defaultShipProvince?: string | null;
  defaultShipCity?: string | null;
  ownership?: WarehouseOwnership;
  isVirtual?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface WarehousesListParams {
  keyword?: string;
  status?: WarehouseStatus;
  page?: number;
  pageSize?: number;
}

export interface WarehousesListData {
  list: Warehouse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateWarehousePayload {
  name: string;
  address?: string;
  warehouseCode?: string;
  warehouseType?: WarehouseType;
  supplierId?: number;
  supplierName?: string;
  defaultShipProvince?: string;
  defaultShipCity?: string;
  ownership?: WarehouseOwnership;
  isVirtual?: number;
}

export interface UpdateWarehousePayload {
  name?: string;
  address?: string;
  status?: WarehouseStatus;
  warehouseCode?: string;
  warehouseType?: WarehouseType;
  supplierId?: number;
  supplierName?: string;
  defaultShipProvince?: string;
  defaultShipCity?: string;
  ownership?: WarehouseOwnership;
  isVirtual?: number;
}

function normalizeApiError(error: unknown): never {
  if (typeof error === 'object' && error !== null) throw error;
  throw { message: '请求失败，请稍后重试' };
}

export const getWarehouses = (params: WarehousesListParams): Promise<WarehousesListData> =>
  request.get<unknown, WarehousesListData>('/warehouses', { params }).catch(normalizeApiError);

export const getWarehouseById = (id: number): Promise<Warehouse> =>
  request.get<unknown, Warehouse>(`/warehouses/${id}`).catch(normalizeApiError);

export const createWarehouse = (payload: CreateWarehousePayload): Promise<Warehouse> =>
  request.post<unknown, Warehouse>('/warehouses', payload).catch(normalizeApiError);

export const updateWarehouse = (id: number, payload: UpdateWarehousePayload): Promise<Warehouse> =>
  request.patch<unknown, Warehouse>(`/warehouses/${id}`, payload).catch(normalizeApiError);
