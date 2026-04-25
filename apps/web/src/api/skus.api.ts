import request from './request';

export interface PackagingRow {
  packagingType?: string;
  packagingQty?: number;
  weightKg?: number;
  grossWeightKg?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  volumeCbm?: number;
}

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
  productModel: string | null;
  accessoryParentSkuId: number | null;
  categoryLevel1Id: number | null;
  categoryLevel2Id: number | null;
  categoryLevel3Id: number | null;
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
  packagingList: string | null;
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
  productImageUrls: string | null;
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
  skuCode: string;
  spuId: number;
  unitId?: number;
  nameCn?: string;
  nameEn?: string;
  specification: string;
  status?: string;
  productType?: string;
  productModel?: string;
  accessoryParentSkuId?: number;
  categoryLevel1Id?: number;
  categoryLevel2Id?: number;
  categoryLevel3Id?: number;
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
  packagingList?: string;
  hsCode: string;
  customsNameCn: string;
  customsNameEn: string;
  declaredValueRef?: number;
  declarationElements?: string;
  isInspectionRequired?: boolean;
  regulatoryConditions?: string;
  taxRefundRate?: number;
  customsInfoMaintained?: boolean;
  productImageUrls?: string;
}

export type UpdateSkuPayload = Partial<Omit<CreateSkuPayload, 'skuCode'>>;

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

export const uploadSkuImage = (file: File): Promise<{ key: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  return request
    .post<any, { key: string }>('/files/upload?folder=skus', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .catch(normalizeApiError);
};

export const getSignedUrl = (key: string): Promise<string> => {
  return request.get<any, string>('/files/signed-url', { params: { key } }).catch(normalizeApiError);
};
