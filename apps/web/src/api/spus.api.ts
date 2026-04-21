import request from './request';

export interface Spu {
  id: number;
  spuCode: string;
  name: string;
  categoryId: number;
  categoryLevel1Id: number | null;
  categoryLevel2Id: number | null;
  unit: string | null;
  manufacturerModel: string | null;
  customerWarrantyMonths: number | null;
  purchaseWarrantyMonths: number | null;
  supplierWarrantyNote: string | null;
  forbiddenCountries: string | null;
  invoiceName: string | null;
  invoiceUnit: string | null;
  invoiceModel: string | null;
  supplierName: string | null;
  companyId: number | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface SpusListParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
  categoryId?: number;
}

export interface SpusListData {
  list: Spu[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateSpuPayload {
  name: string;
  categoryId: number;
  unit?: string;
  manufacturerModel?: string;
  customerWarrantyMonths?: number;
  purchaseWarrantyMonths?: number;
  supplierWarrantyNote?: string;
  forbiddenCountries?: string;
  invoiceName?: string;
  invoiceUnit?: string;
  invoiceModel?: string;
  supplierName?: string;
  companyId?: number;
}

export type UpdateSpuPayload = Partial<CreateSpuPayload>;

function normalizeApiError(error: unknown): never {
  if (typeof error === 'object' && error !== null) {
    throw error;
  }
  throw { message: '请求失败，请稍后重试' };
}

export const getSpus = (params: SpusListParams): Promise<SpusListData> => {
  return request.get<any, SpusListData>('/spus', { params }).catch(normalizeApiError);
};

export const getSpuById = (id: number): Promise<Spu> => {
  return request.get<any, Spu>(`/spus/${id}`).catch(normalizeApiError);
};

export const createSpu = (payload: CreateSpuPayload): Promise<Spu> => {
  return request.post<any, Spu>('/spus', payload).catch(normalizeApiError);
};

export const updateSpu = (id: number, payload: UpdateSpuPayload): Promise<Spu> => {
  return request.patch<any, Spu>(`/spus/${id}`, payload).catch(normalizeApiError);
};

export const deleteSpu = (id: number): Promise<void> => {
  return request.delete<any, void>(`/spus/${id}`).catch(normalizeApiError);
};
