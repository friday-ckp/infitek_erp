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

// 拦截器已提取 response.data.data，以下类型为 data 字段内容
export interface UsersListData {
  items: User[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 获取用户列表
 */
export const getUsers = (
  page: number = 1,
  pageSize: number = 20,
  search?: string,
  status?: 'ACTIVE' | 'INACTIVE',
): Promise<UsersListData> => {
  const params: Record<string, unknown> = { page, pageSize };
  if (search) params.search = search;
  if (status) params.status = status;
  return request.get('/users', { params });
};

/**
 * 获取用户详情
 */
export const getUserById = (id: string): Promise<User> => {
  return request.get(`/users/${id}`);
};

/**
 * 创建用户
 */
export const createUser = (data: CreateUserRequest): Promise<User> => {
  return request.post('/users', data);
};

/**
 * 编辑用户
 */
export const updateUser = (id: string, data: UpdateUserRequest): Promise<User> => {
  return request.patch(`/users/${id}`, data);
};

/**
 * 停用用户
 */
export const deactivateUser = (id: string): Promise<User> => {
  return request.post(`/users/${id}/deactivate`);
};
