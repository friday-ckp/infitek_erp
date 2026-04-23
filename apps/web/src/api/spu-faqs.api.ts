import request from './request';

export const SpuFaqQuestionType = {
  RECOMMENDED_SELECTION: 'recommended_selection',
  INFORMATION_PROVIDING: 'information_providing',
  GENERAL_KNOWLEDGE: 'general_knowledge',
  PRODUCT_ADVANTAGES: 'product_advantages',
  FUNCTIONAL_PARAMETERS: 'functional_parameters',
  SOLUTION: 'solution',
  CONFIGURATION_INFO: 'configuration_info',
  PRODUCT_CUSTOMIZATION: 'product_customization',
  NO_MATCHING_PRODUCT: 'no_matching_product',
  NEW_DEVELOPMENT_SELECTION: 'new_development_selection',
  OPERATION_MAINTENANCE: 'operation_maintenance',
  OTHER: 'other',
} as const;

export type SpuFaqQuestionType = typeof SpuFaqQuestionType[keyof typeof SpuFaqQuestionType];

export const QUESTION_TYPE_LABELS: Record<SpuFaqQuestionType, string> = {
  recommended_selection: '推荐选型',
  information_providing: '资料提供',
  general_knowledge: '通识类',
  product_advantages: '产品优势',
  functional_parameters: '功能参数',
  solution: '解决方案',
  configuration_info: '配置信息',
  product_customization: '产品定制',
  no_matching_product: '无匹配产品',
  new_development_selection: '新拓选型',
  operation_maintenance: '操作维护',
  other: '其它类型',
};

export const QUESTION_TYPE_OPTIONS = Object.entries(QUESTION_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export interface SpuFaq {
  id: number;
  spuId: number | null;
  spuCode: string | null;
  question: string;
  answer: string;
  questionType: SpuFaqQuestionType;
  attachmentUrl: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface SpuFaqsListData {
  list: SpuFaq[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SpuFaqsListParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
  spuId?: number;
  spuCode?: string;
  questionType?: SpuFaqQuestionType;
}

export interface CreateSpuFaqPayload {
  spuId?: number;
  spuCode?: string;
  question: string;
  answer: string;
  questionType: SpuFaqQuestionType;
  attachmentUrl?: string;
  sortOrder?: number;
}

export interface UpdateSpuFaqPayload {
  question?: string;
  answer?: string;
  questionType?: SpuFaqQuestionType;
  attachmentUrl?: string;
  sortOrder?: number;
}

function normalizeApiError(error: unknown): never {
  if (typeof error === 'object' && error !== null) {
    throw error;
  }
  throw { message: '请求失败，请稍后重试' };
}

export const getSpuFaqs = (params: SpuFaqsListParams): Promise<SpuFaqsListData> => {
  return request.get<any, SpuFaqsListData>('/spu-faqs', { params }).catch(normalizeApiError);
};

export const getSpuFaqById = (id: number): Promise<SpuFaq> => {
  return request.get<any, SpuFaq>(`/spu-faqs/${id}`).catch(normalizeApiError);
};

export const createSpuFaq = (payload: CreateSpuFaqPayload): Promise<SpuFaq> => {
  return request.post<any, SpuFaq>('/spu-faqs', payload).catch(normalizeApiError);
};

export const updateSpuFaq = (id: number, payload: UpdateSpuFaqPayload): Promise<SpuFaq> => {
  return request.patch<any, SpuFaq>(`/spu-faqs/${id}`, payload).catch(normalizeApiError);
};

export const deleteSpuFaq = (id: number): Promise<void> => {
  return request.delete<any, void>(`/spu-faqs/${id}`).catch(normalizeApiError);
};

export const uploadFaqAttachment = (file: File): Promise<{ key: string; filename: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  return request
    .post<any, { key: string; filename: string }>('/files/upload?folder=faqs', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .catch(normalizeApiError);
};

export const getFaqAttachmentUrl = (key: string): Promise<string> => {
  return request.get<any, string>('/files/signed-url', { params: { key } }).catch(normalizeApiError);
};
