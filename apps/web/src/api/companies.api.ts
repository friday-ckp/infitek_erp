import request from './request';

export interface Company {
  id: number;
  nameCn: string;
  signingLocation: string | null;
  bankName: string | null;
  bankAccount: string | null;
  swiftCode: string | null;
  defaultCurrencyCode: string | null;
  taxId: string | null;
  customsCode: string | null;
  quarantineCode: string | null;
  nameEn?: string | null;
  abbreviation?: string | null;
  countryId?: number | null;
  countryName?: string | null;
  addressCn?: string | null;
  addressEn?: string | null;
  contactPerson?: string | null;
  contactPhone?: string | null;
  defaultCurrencyName?: string | null;
  chiefAccountantId?: number | null;
  chiefAccountantName?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CompaniesListParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface CompaniesListData {
  list: Company[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateCompanyPayload {
  nameCn: string;
  signingLocation?: string;
  bankName?: string;
  bankAccount?: string;
  swiftCode?: string;
  defaultCurrencyCode?: string;
  taxId?: string;
  customsCode?: string;
  quarantineCode?: string;
  nameEn?: string;
  abbreviation?: string;
  countryId?: number;
  countryName?: string;
  addressCn?: string;
  addressEn?: string;
  contactPerson?: string;
  contactPhone?: string;
  defaultCurrencyName?: string;
  chiefAccountantId?: number;
  chiefAccountantName?: string;
}

export type UpdateCompanyPayload = Partial<CreateCompanyPayload>;

function normalizeApiError(error: unknown): never {
  if (typeof error === 'object' && error !== null) {
    throw error;
  }
  throw { message: '请求失败，请稍后重试' };
}

export const getCompanies = (params: CompaniesListParams): Promise<CompaniesListData> => {
  return request.get<any, CompaniesListData>('/companies', { params }).catch(normalizeApiError);
};

export const getCompanyById = (id: number): Promise<Company> => {
  return request.get<any, Company>(`/companies/${id}`).catch(normalizeApiError);
};

export const createCompany = (payload: CreateCompanyPayload): Promise<Company> => {
  return request.post<any, Company>('/companies', payload).catch(normalizeApiError);
};

export const updateCompany = (id: number, payload: UpdateCompanyPayload): Promise<Company> => {
  return request.patch<any, Company>(`/companies/${id}`, payload).catch(normalizeApiError);
};
