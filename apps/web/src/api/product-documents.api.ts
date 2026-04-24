import request from './request';

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  brochure: '彩页',
  spec_sheet: '规格说明书',
  certificate: '证书',
  image: '图片',
  video: '视频',
  customs_docs: '报关资料',
  quotation: '报价单',
  other: '其它',
};

export const ATTRIBUTION_TYPE_LABELS: Record<string, string> = {
  general: '通用归属',
  category_l1: '产品一级分类归属',
  category_l2: '产品二级分类归属',
  category_l3: '产品三级分类归属',
  product: '产品归属',
};

export const DOCUMENT_TYPE_OPTIONS = Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const ATTRIBUTION_TYPE_OPTIONS = Object.entries(ATTRIBUTION_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export interface ProductDocument {
  id: number;
  documentName: string;
  documentType: string;
  content: string | null;
  attributionType: string;
  countryId: number | null;
  categoryLevel1Id: number | null;
  categoryLevel2Id: number | null;
  categoryLevel3Id: number | null;
  spuId: number | null;
  fileKey: string | null;
  fileName: string | null;
  fileUrl: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface ProductDocumentsListParams {
  keyword?: string;
  documentType?: string;
  attributionType?: string;
  spuId?: number;
  countryId?: number;
  page?: number;
  pageSize?: number;
}

export interface ProductDocumentsListData {
  list: ProductDocument[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateProductDocumentPayload {
  documentName: string;
  documentType: string;
  content?: string;
  attributionType: string;
  countryId?: number;
  categoryLevel1Id?: number;
  categoryLevel2Id?: number;
  categoryLevel3Id?: number;
  spuId?: number;
  fileKey?: string;
  fileName?: string;
}

export type UpdateProductDocumentPayload = Partial<CreateProductDocumentPayload>;

function normalizeApiError(error: unknown): never {
  if (typeof error === 'object' && error !== null) throw error;
  throw { message: '请求失败，请稍后重试' };
}

export const getProductDocuments = (params: ProductDocumentsListParams): Promise<ProductDocumentsListData> =>
  request.get<unknown, ProductDocumentsListData>('/product-documents', { params }).catch(normalizeApiError);

export const getProductDocumentById = (id: number): Promise<ProductDocument> =>
  request.get<unknown, ProductDocument>(`/product-documents/${id}`).catch(normalizeApiError);

export const createProductDocument = (payload: CreateProductDocumentPayload): Promise<ProductDocument> =>
  request.post<unknown, ProductDocument>('/product-documents', payload).catch(normalizeApiError);

export const updateProductDocument = (id: number, payload: UpdateProductDocumentPayload): Promise<ProductDocument> =>
  request.patch<unknown, ProductDocument>(`/product-documents/${id}`, payload).catch(normalizeApiError);

export const deleteProductDocument = (id: number): Promise<void> =>
  request.delete<unknown, void>(`/product-documents/${id}`).catch(normalizeApiError);

export const uploadProductDocumentFile = (file: File): Promise<{ key: string; filename: string; size: number }> => {
  const formData = new FormData();
  formData.append('file', file);
  return request
    .post<unknown, { key: string; filename: string; size: number }>(
      '/files/upload?folder=product-documents',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    .catch(normalizeApiError);
};
