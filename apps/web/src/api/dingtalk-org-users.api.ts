import request from './request';

export type DingtalkOrgUserStatus = 'UNBOUND' | 'CANDIDATE' | 'CONFLICT' | 'BOUND';

export interface DingtalkOrgUser {
  id: string;
  unionId: string;
  userId?: string | null;
  openId?: string | null;
  nick?: string | null;
  mobile?: string | null;
  email?: string | null;
  jobNumber?: string | null;
  departmentNames?: string[] | null;
  status: DingtalkOrgUserStatus;
  suggestedUserId?: number | null;
  suggestedUsername?: string | null;
  suggestedUserName?: string | null;
  matchReason?: string | null;
  lastSyncedAt?: string | null;
  updatedAt: string;
}

export interface DingtalkOrgUsersListData {
  list: DingtalkOrgUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SyncDingtalkOrgUsersResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  bound: number;
}

export const getDingtalkOrgUsers = (
  page: number = 1,
  pageSize: number = 20,
  keyword?: string,
  status?: DingtalkOrgUserStatus,
): Promise<DingtalkOrgUsersListData> => {
  const params: Record<string, unknown> = { page, pageSize };
  if (keyword) params.keyword = keyword;
  if (status) params.status = status;
  return request.get('/dingtalk-org-users', { params });
};

export const syncDingtalkOrgUsers = (): Promise<SyncDingtalkOrgUsersResult> => {
  return request.post('/dingtalk-org-users/sync', {}, { timeout: 120000 });
};

export const recomputeDingtalkOrgUserMatch = (id: string): Promise<DingtalkOrgUser> => {
  return request.post(`/dingtalk-org-users/${id}/recompute-match`, {});
};

export const confirmDingtalkOrgUserBinding = (id: string): Promise<DingtalkOrgUser> => {
  return request.post(`/dingtalk-org-users/${id}/confirm-binding`, {});
};

export const manualBindDingtalkOrgUser = (
  id: string,
  userId: string,
): Promise<DingtalkOrgUser> => {
  return request.post(`/dingtalk-org-users/${id}/manual-binding`, {
    userId: Number(userId),
  });
};

export const unbindDingtalkOrgUser = (id: string): Promise<DingtalkOrgUser> => {
  return request.delete(`/dingtalk-org-users/${id}/binding`);
};
