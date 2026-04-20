import request from './request';

export interface Country {
  id: number;
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CountriesListParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface CountriesListData {
  list: Country[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateCountryPayload {
  code: string;
  name: string;
}

export interface UpdateCountryPayload {
  code?: string;
  name?: string;
}

function normalizeApiError(error: unknown): never {
  if (typeof error === 'object' && error !== null) throw error;
  throw { message: '请求失败，请稍后重试' };
}

export const getCountries = (params: CountriesListParams): Promise<CountriesListData> =>
  request.get<any, CountriesListData>('/countries', { params }).catch(normalizeApiError);

export const getCountryById = (id: number): Promise<Country> =>
  request.get<any, Country>(`/countries/${id}`).catch(normalizeApiError);

export const createCountry = (payload: CreateCountryPayload): Promise<Country> =>
  request.post<any, Country>('/countries', payload).catch(normalizeApiError);

export const updateCountry = (id: number, payload: UpdateCountryPayload): Promise<Country> =>
  request.patch<any, Country>(`/countries/${id}`, payload).catch(normalizeApiError);
