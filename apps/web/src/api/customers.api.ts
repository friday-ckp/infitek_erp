import request from './request';

export interface Customer {
  id: number;
  customerCode: string;
  customerName: string;
  countryId: number;
  countryName: string;
  salespersonId: number;
  salespersonName: string;
  contactPerson?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  billingRequirements?: string | null;
  address?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export const CUSTOMER_RESOURCE_TYPE = 'customers';

export interface CustomersListParams {
  keyword?: string;
  countryId?: number;
  page?: number;
  pageSize?: number;
}

export interface CustomersListData {
  list: Customer[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateCustomerPayload {
  customerCode: string;
  customerName: string;
  countryId: number;
  countryName?: string;
  salespersonId: number;
  salespersonName?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  billingRequirements?: string;
  address?: string;
}

export type UpdateCustomerPayload = Partial<CreateCustomerPayload>;

function normalizeApiError(error: unknown): never {
  if (typeof error === 'object' && error !== null) {
    throw error;
  }
  throw { message: '请求失败，请稍后重试' };
}

export const getCustomers = (params: CustomersListParams): Promise<CustomersListData> =>
  request.get<any, CustomersListData>('/customers', { params }).catch(normalizeApiError);

export const getCustomerById = (id: number): Promise<Customer> =>
  request.get<any, Customer>(`/customers/${id}`).catch(normalizeApiError);

export const createCustomer = (payload: CreateCustomerPayload): Promise<Customer> =>
  request.post<any, Customer>('/customers', payload).catch(normalizeApiError);

export const updateCustomer = (id: number, payload: UpdateCustomerPayload): Promise<Customer> =>
  request.patch<any, Customer>(`/customers/${id}`, payload).catch(normalizeApiError);
