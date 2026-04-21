import request from './request';

export interface ProductCategory {
  id: number;
  name: string;
  nameEn: string | null;
  code: string | null;
  parentId: number | null;
  level: number;
  sortOrder: number;
  purchaseOwner: string | null;
  productOwner: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface ProductCategoryNode extends ProductCategory {
  children: ProductCategoryNode[];
}

export interface ProductCategoriesListParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
  parentId?: number;
}

export interface ProductCategoriesListData {
  list: ProductCategory[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateProductCategoryPayload {
  name: string;
  nameEn?: string;
  parentId?: number;
  purchaseOwner?: string;
  productOwner?: string;
}

export interface UpdateProductCategoryPayload {
  name?: string;
  nameEn?: string;
  purchaseOwner?: string;
  productOwner?: string;
}

function normalizeApiError(error: unknown): never {
  if (typeof error === 'object' && error !== null) {
    throw error;
  }
  throw { message: '请求失败，请稍后重试' };
}

export const getProductCategoryTree = (): Promise<ProductCategoryNode[]> => {
  return request.get<any, ProductCategoryNode[]>('/product-categories/tree').catch(normalizeApiError);
};

export const getProductCategories = (params: ProductCategoriesListParams): Promise<ProductCategoriesListData> => {
  return request.get<any, ProductCategoriesListData>('/product-categories', { params }).catch(normalizeApiError);
};

export const getProductCategoryById = (id: number): Promise<ProductCategory> => {
  return request.get<any, ProductCategory>(`/product-categories/${id}`).catch(normalizeApiError);
};

export const createProductCategory = (payload: CreateProductCategoryPayload): Promise<ProductCategory> => {
  return request.post<any, ProductCategory>('/product-categories', payload).catch(normalizeApiError);
};

export const updateProductCategory = (id: number, payload: UpdateProductCategoryPayload): Promise<ProductCategory> => {
  return request.patch<any, ProductCategory>(`/product-categories/${id}`, payload).catch(normalizeApiError);
};

export const deleteProductCategory = (id: number): Promise<void> => {
  return request.delete<any, void>(`/product-categories/${id}`).catch(normalizeApiError);
};
