import { api } from './client'

export interface User {
  id: number
  username: string
  name: string
  status: 'active' | 'inactive'
  createdBy: string
  updatedBy: string | null
  createdAt: string
  updatedAt: string
}

export interface UserListParams {
  page?: number
  pageSize?: number
  search?: string
  status?: string
}

export interface UserListResult {
  data: User[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface CreateUserDto {
  username: string
  name: string
  password: string
}

export interface UpdateUserDto {
  name?: string
  password?: string
}

export const usersApi = {
  list: async (params: UserListParams = {}): Promise<UserListResult> => {
    const p = new URLSearchParams()
    p.append('page', String(params.page ?? 1))
    p.append('pageSize', String(params.pageSize ?? 20))
    if (params.search) p.append('search', params.search)
    if (params.status) p.append('status', params.status)
    const res = await api.get(`/users?${p}`)
    return res.data.data
  },

  getById: async (id: number): Promise<User> => {
    const res = await api.get(`/users/${id}`)
    return res.data.data
  },

  create: async (dto: CreateUserDto): Promise<User> => {
    const res = await api.post('/users', dto)
    return res.data.data
  },

  update: async (id: number, dto: UpdateUserDto): Promise<User> => {
    const res = await api.patch(`/users/${id}`, dto)
    return res.data.data
  },

  deactivate: async (id: number): Promise<User> => {
    const res = await api.post(`/users/${id}/deactivate`)
    return res.data.data
  },
}
