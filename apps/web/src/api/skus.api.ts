import request from './request';

export interface Sku {
  id: number;
  skuCode: string;
  spuId: number;
  unitId: number | null;
  nameCn: string | null;
  nameEn: string | null;
  specification: string;
  status: string;
  productType: string | null;
  principle: string | null;
  productUsage: string | null;
  coreParams: string | null;
  electricalParams: string | null;
  material: string | null;
  hasPlug: boolean | null;
  specialAttributes: string | null;
  specialAttributesNote: string | null;
  customerWarrantyMonths: number | null;
  forbiddenCountries: string | null;
  weightKg: number;
  grossWeightKg: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  volumeCbm: number;
  packagingType: string | null;
  packagingQty: number | null;
  packagingInfo: string | null;
  hsCode: string;
  customsNameCn: string;
  customsNameEn: string;
  declaredValueRef: number | null;
  declarationElements: string | null;
  isInspectionRequired: boolean | null;
  regulatoryConditions: string | null;
  taxRefundRate: number | null;
  customsInfoMaintained: boolean | null;
  productImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface SkusListParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
  spuId?: number;
  categoryId?: number;
}

export interface SkusListData {
  list: Sku[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateSkuPayload {
  spuId: number;
  unitId?: number;
  nameCn?: string;
  nameEn?: string;
  specification: string;
  status?: string;
  productType?: string;
  principle?: string;
  productUsage?: string;
  coreParams?: string;
  electricalParams?: string;
  material?: string;
  hasPlug?: boolean;
  specialAttributes?: string;
  specialAttributesNote?: string;
  customerWarrantyMonths?: number;
  forbiddenCountries?: string;
  weightKg: number;
  grossWeightKg?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  volumeCbm: number;
  packagingType?: string;
  packagingQty?: number;
  packagingInfo?: string;
  hsCode: string;
  customsNameCn: string;
  customsNameEn: string;
  declaredValueRef?: number;
  declarationElements?: string;
  isInspectionRequired?: boolean;
  regulatoryConditions?: string;
  taxRefundRate?: number;
  customsInfoMaintained?: boolean;
  productImageUrl?: string;
}

export type UpdateSkuPayload = Partial<CreateSkuPayload>;

function normalizeApiError(error: unknown): never {
  if (typeof error === 'object' && error !== null) {
    throw error;
  }
  throw { message: '请求失败，请稍后重试' };
}

export const getSkus = (params: SkusListParams): Promise<SkusListData> => {
  return request.get<any, SkusListData>('/skus', { params }).catch(normalizeApiError);
};

export const getSkuById = (id: number): Promise<Sku> => {
  return request.get<any, Sku>(`/skus/${id}`).catch(normalizeApiError);
};

export const createSku = (payload: CreateSkuPayload): Promise<Sku> => {
  return request.post<any, Sku>('/skus', payload).catch(normalizeApiError);
};

export const updateSku = (id: number, payload: UpdateSkuPayload): Promise<Sku> => {
  return request.patch<any, Sku>(`/skus/${id}`, payload).catch(normalizeApiError);
};

export const deleteSku = (id: number): Promise<void> => {
  return request.delete<any, void>(`/skus/${id}`).catch(normalizeApiError);
};
