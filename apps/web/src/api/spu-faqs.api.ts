import request from './request';

export interface SpuFaq {
  id: number;
  spuId: number;
  question: string;
  answer: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateSpuFaqPayload {
  spuId: number;
  question: string;
  answer: string;
  sortOrder?: number;
}

export interface UpdateSpuFaqPayload {
  question?: string;
  answer?: string;
  sortOrder?: number;
}

function normalizeApiError(error: unknown): never {
  if (typeof error === 'object' && error !== null) {
    throw error;
  }
  throw { message: '请求失败，请稍后重试' };
}

export const getSpuFaqs = (spuId: number): Promise<SpuFaq[]> => {
  return request.get<any, SpuFaq[]>('/spu-faqs', { params: { spuId } }).catch(normalizeApiError);
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
