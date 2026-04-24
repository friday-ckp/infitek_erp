import type {
  SupplierInvoiceType,
  SupplierSettlementDateType,
  SupplierSettlementType,
  SupplierStatus,
} from '@infitek/shared';
import request from './request';

export interface SupplierPaymentTerm {
  id?: number;
  supplierId?: number;
  companyId?: number | null;
  companyName?: string | null;
  paymentTermName?: string | null;
  settlementType?: SupplierSettlementType | null;
  settlementDays?: number | null;
  monthlySettlementDate?: number | null;
  settlementDateType?: SupplierSettlementDateType | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Supplier {
  id: number;
  name: string;
  shortName?: string | null;
  supplierCode: string;
  contactPerson?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  address?: string | null;
  countryId?: number | null;
  countryName?: string | null;
  status: SupplierStatus;
  supplierLevel?: string | null;
  invoiceType?: SupplierInvoiceType | null;
  origin?: string | null;
  annualRebateEnabled?: number;
  contractFrameworkFile?: string | null;
  contractTemplateName?: string | null;
  annualRebateNote?: string | null;
  contractTerms?: string | null;
  paymentTerms: SupplierPaymentTerm[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface SuppliersListParams {
  keyword?: string;
  categoryId?: number;
  status?: SupplierStatus;
  page?: number;
  pageSize?: number;
}

export interface SuppliersListData {
  list: Supplier[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SupplierPaymentTermPayload {
  companyId?: number;
  companyName?: string;
  paymentTermName?: string;
  settlementType?: SupplierSettlementType;
  settlementDays?: number;
  monthlySettlementDate?: number;
  settlementDateType?: SupplierSettlementDateType;
}

export interface CreateSupplierPayload {
  name: string;
  shortName?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  countryId?: number;
  countryName?: string;
  status?: SupplierStatus;
  supplierLevel?: string;
  invoiceType?: SupplierInvoiceType;
  origin?: string;
  annualRebateEnabled?: number;
  contractFrameworkFile?: string;
  contractTemplateName?: string;
  annualRebateNote?: string;
  contractTerms?: string;
  paymentTerms?: SupplierPaymentTermPayload[];
}

export type UpdateSupplierPayload = Partial<CreateSupplierPayload>;

function normalizeApiError(error: unknown): never {
  if (typeof error === 'object' && error !== null) throw error;
  throw { message: '请求失败，请稍后重试' };
}

export const getSuppliers = (params: SuppliersListParams): Promise<SuppliersListData> =>
  request.get<unknown, SuppliersListData>('/suppliers', { params }).catch(normalizeApiError);

export const getSupplierById = (id: number): Promise<Supplier> =>
  request.get<unknown, Supplier>(`/suppliers/${id}`).catch(normalizeApiError);

export const createSupplier = (payload: CreateSupplierPayload): Promise<Supplier> =>
  request.post<unknown, Supplier>('/suppliers', payload).catch(normalizeApiError);

export const updateSupplier = (id: number, payload: UpdateSupplierPayload): Promise<Supplier> =>
  request.patch<unknown, Supplier>(`/suppliers/${id}`, payload).catch(normalizeApiError);
