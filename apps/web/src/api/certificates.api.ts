import request from './request';

export interface CertificateSpu {
  id: number;
  spuCode: string;
  name: string;
}

export interface Certificate {
  id: number;
  certificateNo: string;
  certificateName: string;
  certificateType: string;
  directive: string | null;
  issueDate: string | null;
  validFrom: string;
  validUntil: string;
  issuingAuthority: string;
  remarks: string | null;
  attributionType: string | null;
  categoryId: number | null;
  fileKey: string | null;
  fileName: string | null;
  fileUrl: string | null;
  status: 'valid' | 'expired';
  spus: CertificateSpu[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CertificatesListParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
  certificateType?: string;
  status?: 'valid' | 'expired';
  categoryId?: number;
}

export interface CertificatesListData {
  list: Certificate[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateCertificatePayload {
  certificateName: string;
  certificateType: string;
  directive?: string;
  issueDate?: string;
  validFrom: string;
  validUntil: string;
  issuingAuthority: string;
  remarks?: string;
  attributionType?: string;
  categoryId?: number;
  fileKey?: string;
  fileName?: string;
  spuIds?: number[];
}

export type UpdateCertificatePayload = Partial<CreateCertificatePayload>;

function normalizeApiError(error: unknown): never {
  if (typeof error === 'object' && error !== null) {
    throw error;
  }
  throw { message: '请求失败，请稍后重试' };
}

export const getCertificates = (params: CertificatesListParams): Promise<CertificatesListData> => {
  return request.get<any, CertificatesListData>('/certificates', { params }).catch(normalizeApiError);
};

export const getCertificateById = (id: number): Promise<Certificate> => {
  return request.get<any, Certificate>(`/certificates/${id}`).catch(normalizeApiError);
};

export const createCertificate = (payload: CreateCertificatePayload): Promise<Certificate> => {
  return request.post<any, Certificate>('/certificates', payload).catch(normalizeApiError);
};

export const updateCertificate = (id: number, payload: UpdateCertificatePayload): Promise<Certificate> => {
  return request.patch<any, Certificate>(`/certificates/${id}`, payload).catch(normalizeApiError);
};

export const deleteCertificate = (id: number): Promise<void> => {
  return request.delete<any, void>(`/certificates/${id}`).catch(normalizeApiError);
};

export const uploadCertificateFile = (file: File): Promise<{ key: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  return request
    .post<any, { key: string }>('/files/upload?folder=certificates', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .catch(normalizeApiError);
};
