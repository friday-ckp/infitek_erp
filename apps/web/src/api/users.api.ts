import request from './request';

export interface User {
  id: string;
  username: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface CreateUserRequest {
  username: string;
  name: string;
  password: string;
}

export interface UpdateUserRequest {
  name?: string;
  password?: string;
}

export interface UsersListResponse {
  success: boolean;
  data: {
    items: User[];
    total: number;
    page: number;
    pageSize: number;
  };
  message: string;
  code: string;
}

export interface UserDetailResponse {
  success: boolean;
  data: User;
  message: string;
  code: string;
}

export interface UserActionResponse {
  success: boolean;
  data: User;
  message: string;
  code: string;
}

/**
 * 获取用户列表
 */
export const getUsers = (
  page: number = 1,
  pageSize: number = 20,
  search?: string,
  status?: 'ACTIVE' | 'INACTIVE'
): Promise<UsersListResponse> => {
  const params: Record<string, any> = { page, pageSize };
  if (search) params.search = search;
  if (status) params.status = status;
  return request.get('/v1/users', { params });
};

/**
 * 获取用户详情
 */
export const getUserById = (id: string): Promise<UserDetailResponse> => {
  return request.get(`/v1/users/${id}`);
};

/**
 * 创建用户
 */
export const createUser = (data: CreateUserRequest): Promise<UserActionResponse> => {
  return request.post('/v1/users', data);
};

/**
 * 编辑用户
 */
export const updateUser = (id: string, data: UpdateUserRequest): Promise<UserActionResponse> => {
  return request.patch(`/v1/users/${id}`, data);
};

/**
 * 停用用户
 */
export const deactivateUser = (id: string): Promise<UserActionResponse> => {
  return request.post(`/v1/users/${id}/deactivate`);
};
