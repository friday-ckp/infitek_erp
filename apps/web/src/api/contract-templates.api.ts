import type { ContractTemplateStatus } from '@infitek/shared';
import request from './request';

export interface ContractTemplate {
  id: number;
  name: string;
  templateFileKey: string | null;
  templateFileName: string | null;
  templateFileUrl: string | null;
  description: string | null;
  content: string;
  isDefault: number;
  requiresLegalReview: number;
  status: ContractTemplateStatus;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface ContractTemplatesListParams {
  keyword?: string;
  status?: ContractTemplateStatus;
  page?: number;
  pageSize?: number;
}

export interface ContractTemplatesListData {
  list: ContractTemplate[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateContractTemplatePayload {
  name: string;
  templateFileKey?: string | null;
  templateFileName?: string | null;
  description?: string | null;
  content: string;
  isDefault?: number;
  requiresLegalReview?: number;
}

export type UpdateContractTemplatePayload = Partial<CreateContractTemplatePayload>;

function normalizeApiError(error: unknown): never {
  if (typeof error === 'object' && error !== null) throw error;
  throw { message: '请求失败，请稍后重试' };
}

export const CONTRACT_TEMPLATE_STATUS_LABELS: Record<ContractTemplateStatus, string> = {
  pending_submit: '待提交',
  in_review: '审核中',
  approved: '审核通过',
  rejected: '已拒绝',
  voided: '已作废',
};

export const CONTRACT_TEMPLATE_STATUS_OPTIONS = Object.entries(
  CONTRACT_TEMPLATE_STATUS_LABELS,
).map(([value, label]) => ({
  value: value as ContractTemplateStatus,
  label,
}));

export const getContractTemplates = (
  params: ContractTemplatesListParams,
): Promise<ContractTemplatesListData> =>
  request.get<unknown, ContractTemplatesListData>('/contract-templates', { params }).catch(normalizeApiError);

export const getContractTemplateById = (id: number): Promise<ContractTemplate> =>
  request.get<unknown, ContractTemplate>(`/contract-templates/${id}`).catch(normalizeApiError);

export const createContractTemplate = (
  payload: CreateContractTemplatePayload,
): Promise<ContractTemplate> =>
  request.post<unknown, ContractTemplate>('/contract-templates', payload).catch(normalizeApiError);

export const updateContractTemplate = (
  id: number,
  payload: UpdateContractTemplatePayload,
): Promise<ContractTemplate> =>
  request.patch<unknown, ContractTemplate>(`/contract-templates/${id}`, payload).catch(normalizeApiError);

export const submitContractTemplate = (id: number): Promise<ContractTemplate> =>
  request.post<unknown, ContractTemplate>(`/contract-templates/${id}/submit`, {}).catch(normalizeApiError);

export const approveContractTemplate = (id: number): Promise<ContractTemplate> =>
  request.post<unknown, ContractTemplate>(`/contract-templates/${id}/approve`, {}).catch(normalizeApiError);

export const rejectContractTemplate = (id: number): Promise<ContractTemplate> =>
  request.post<unknown, ContractTemplate>(`/contract-templates/${id}/reject`, {}).catch(normalizeApiError);

export const voidContractTemplate = (id: number): Promise<ContractTemplate> =>
  request.post<unknown, ContractTemplate>(`/contract-templates/${id}/void`, {}).catch(normalizeApiError);

export const uploadContractTemplateFile = (
  file: File,
): Promise<{ key: string; filename: string; size: number }> => {
  const formData = new FormData();
  formData.append('file', file);
  return request
    .post<unknown, { key: string; filename: string; size: number }>(
      '/files/upload?folder=contract-templates',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    .catch(normalizeApiError);
};
