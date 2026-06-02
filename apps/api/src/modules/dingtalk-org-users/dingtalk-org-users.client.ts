import { Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { DingtalkConfig } from '../../config/dingtalk.config';

const DINGTALK_APP_ACCESS_TOKEN_URL = 'https://api.dingtalk.com/v1.0/oauth2/accessToken';
const DINGTALK_DEPARTMENT_LIST_URL =
  'https://oapi.dingtalk.com/topapi/v2/department/listsub?access_token=';
const DINGTALK_DEPARTMENT_USER_LIST_URL =
  'https://oapi.dingtalk.com/topapi/v2/user/list?access_token=';

interface DingtalkAccessTokenResponse {
  accessToken?: string;
  access_token?: string;
}

interface DingtalkDepartmentResponse {
  errcode?: number;
  errmsg?: string;
  result?: Array<{ dept_id?: number; deptId?: number; name?: string }>;
}

interface DingtalkDepartment {
  id: number;
  name: string;
}

interface DingtalkUserListResponse {
  errcode?: number;
  errmsg?: string;
  result?: {
    has_more?: boolean;
    next_cursor?: number;
    list?: Array<{
      unionid?: string;
      userid?: string;
      openUserid?: string;
      name?: string;
      mobile?: string;
      email?: string;
      job_number?: string;
    }>;
  };
}

export interface DingtalkOrgUserProfile {
  unionId: string;
  userId: string | null;
  openId: string | null;
  nick: string | null;
  mobile: string | null;
  email: string | null;
  jobNumber: string | null;
  departmentNames: string[];
}

@Injectable()
export class DingtalkOrgUsersClient {
  private readonly logger = new Logger(DingtalkOrgUsersClient.name);

  constructor(private readonly configService: ConfigService) {}

  async fetchOrganizationUsers(): Promise<DingtalkOrgUserProfile[]> {
    const accessToken = await this.fetchAppAccessToken();
    const departments = await this.fetchAllDepartments(accessToken);
    const users = new Map<string, DingtalkOrgUserProfile>();

    for (const department of departments) {
      const departmentUsers = await this.fetchDepartmentUsers(accessToken, department);
      for (const user of departmentUsers) {
        const existing = users.get(user.unionId);
        if (existing) {
          existing.departmentNames = Array.from(
            new Set([...existing.departmentNames, ...user.departmentNames]),
          );
          existing.nick = existing.nick ?? user.nick;
          existing.mobile = existing.mobile ?? user.mobile;
          existing.email = existing.email ?? user.email;
          existing.jobNumber = existing.jobNumber ?? user.jobNumber;
          existing.userId = existing.userId ?? user.userId;
          existing.openId = existing.openId ?? user.openId;
          continue;
        }

        users.set(user.unionId, user);
      }
    }

    return Array.from(users.values());
  }

  private async fetchAppAccessToken(): Promise<string> {
    const config = this.getConfigOrThrow();
    const response = await this.fetchJson<DingtalkAccessTokenResponse>(
      DINGTALK_APP_ACCESS_TOKEN_URL,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          appKey: config.clientId,
          appSecret: config.clientSecret,
        }),
      },
    );

    const token = response.accessToken ?? response.access_token;
    if (!token) {
      throw new UnauthorizedException({
        code: 'DINGTALK_SYNC_FAILED',
        message: '钉钉组织用户同步失败',
      });
    }

    return token;
  }

  private async fetchAllDepartments(accessToken: string): Promise<DingtalkDepartment[]> {
    const visited = new Set<number>();
    const queue: number[] = [1];
    const departments = new Map<number, DingtalkDepartment>([[1, { id: 1, name: '根部门' }]]);

    while (queue.length > 0) {
      const currentDepartmentId = queue.shift()!;
      if (visited.has(currentDepartmentId)) {
        continue;
      }

      visited.add(currentDepartmentId);
      const children = await this.fetchDepartmentChildren(accessToken, currentDepartmentId);

      for (const child of children) {
        if (!departments.has(child.id)) {
          departments.set(child.id, child);
        }
        if (!visited.has(child.id)) {
          queue.push(child.id);
        }
      }
    }

    return Array.from(departments.values());
  }

  private async fetchDepartmentChildren(accessToken: string, departmentId: number): Promise<DingtalkDepartment[]> {
    const response = await this.fetchJson<DingtalkDepartmentResponse>(
      `${DINGTALK_DEPARTMENT_LIST_URL}${accessToken}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ dept_id: departmentId }),
      },
    );

    if (response.errcode && response.errcode !== 0) {
      this.logger.error(`DingTalk department list failed: ${response.errcode} ${response.errmsg ?? ''}`);
      throw new UnauthorizedException({
        code: 'DINGTALK_SYNC_FAILED',
        message: '钉钉组织用户同步失败',
      });
    }

    return (response.result ?? [])
      .map((item) => ({
        id: item.dept_id ?? item.deptId ?? 0,
        name: item.name ?? '',
      }))
      .filter((item) => item.id > 0);
  }

  private async fetchDepartmentUsers(accessToken: string, department: DingtalkDepartment) {
    let cursor = 0;
    let hasMore = true;
    const users: DingtalkOrgUserProfile[] = [];

    while (hasMore) {
      const response = await this.fetchJson<DingtalkUserListResponse>(
        `${DINGTALK_DEPARTMENT_USER_LIST_URL}${accessToken}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            dept_id: department.id,
            cursor,
            size: 100,
            contain_access_limit: false,
            language: 'zh_CN',
          }),
        },
      );

      if (response.errcode && response.errcode !== 0) {
        this.logger.error(
          `DingTalk department user list failed: dept=${department.id} code=${response.errcode} msg=${response.errmsg ?? ''}`,
        );
        throw new UnauthorizedException({
          code: 'DINGTALK_SYNC_FAILED',
          message: '钉钉组织用户同步失败',
        });
      }

      const list = response.result?.list ?? [];
      users.push(
        ...list
          .filter((item) => item.unionid)
          .map((item) => ({
            unionId: item.unionid!,
            userId: item.userid ?? null,
            openId: item.openUserid ?? null,
            nick: item.name ?? null,
            mobile: item.mobile ?? null,
            email: item.email ?? null,
            jobNumber: item.job_number ?? null,
            departmentNames: department.name ? [department.name] : [],
          })),
      );

      hasMore = response.result?.has_more ?? false;
      cursor = response.result?.next_cursor ?? 0;
    }

    return users;
  }

  private getConfigOrThrow(): DingtalkConfig {
    const config = this.configService.get<DingtalkConfig>('dingtalk');

    if (!config?.clientId || !config.clientSecret) {
      throw new InternalServerErrorException({
        code: 'DINGTALK_CONFIG_MISSING',
        message: '钉钉登录配置缺失',
      });
    }

    return config;
  }

  private async fetchJson<T>(url: string, init: RequestInit): Promise<T> {
    let response: Response;

    try {
      response = await fetch(url, init);
    } catch (error) {
      this.logger.error(
        `DingTalk sync request failed before response: ${url}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new UnauthorizedException({ code: 'DINGTALK_SYNC_FAILED', message: '钉钉组织用户同步失败' });
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      this.logger.error(
        `DingTalk sync request returned non-OK status: ${url} -> ${response.status} ${response.statusText}; body=${errorText}`,
      );
      throw new UnauthorizedException({ code: 'DINGTALK_SYNC_FAILED', message: '钉钉组织用户同步失败' });
    }

    try {
      return (await response.json()) as T;
    } catch (error) {
      this.logger.error(
        `DingTalk sync response JSON parse failed: ${url}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new UnauthorizedException({ code: 'DINGTALK_SYNC_FAILED', message: '钉钉组织用户同步失败' });
    }
  }
}
