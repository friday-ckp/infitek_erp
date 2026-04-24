import type { PortType } from '@infitek/shared';
import request from './request';

export interface Port {
  id: number;
  portType: PortType | null;
  portCode: string;
  nameCn: string;
  nameEn: string | null;
  countryId: number;
  countryName: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface PortsListParams {
  keyword?: string;
  countryId?: number;
  page?: number;
  pageSize?: number;
}

export interface PortsListData {
  list: Port[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreatePortPayload {
  portType?: PortType;
  portCode: string;
  nameCn: string;
  nameEn?: string;
  countryId: number;
  countryName?: string;
}

export type UpdatePortPayload = Partial<CreatePortPayload>;

export const PORT_TYPE_OPTIONS = [
  { label: '起运港', value: '起运港' },
  { label: '目的港', value: '目的港' },
];

function normalizeApiError(error: unknown): never {
  if (typeof error === 'object' && error !== null) throw error;
  throw { message: '请求失败，请稍后重试' };
}

export const getPorts = (params: PortsListParams): Promise<PortsListData> =>
  request.get<unknown, PortsListData>('/ports', { params }).catch(normalizeApiError);

export const getPortById = (id: number): Promise<Port> =>
  request.get<unknown, Port>(`/ports/${id}`).catch(normalizeApiError);

export const createPort = (payload: CreatePortPayload): Promise<Port> =>
  request.post<unknown, Port>('/ports', payload).catch(normalizeApiError);

export const updatePort = (id: number, payload: UpdatePortPayload): Promise<Port> =>
  request.patch<unknown, Port>(`/ports/${id}`, payload).catch(normalizeApiError);
