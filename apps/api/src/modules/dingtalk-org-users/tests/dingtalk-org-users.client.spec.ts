import { ConfigService } from '@nestjs/config';
import { DingtalkOrgUsersClient } from '../dingtalk-org-users.client';

describe('DingtalkOrgUsersClient', () => {
  let client: DingtalkOrgUsersClient;

  beforeEach(() => {
    client = new DingtalkOrgUsersClient({
      get: jest.fn().mockReturnValue({
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
      }),
    } as unknown as ConfigService);
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('应递归遍历全部子部门并合并同一用户的部门信息', async () => {
    const fetchJson = jest
      .spyOn(client as any, 'fetchJson')
      .mockImplementation(async (url: string, init: RequestInit) => {
        if (url.includes('/oauth2/accessToken')) {
          return { accessToken: 'token-1' };
        }

        const payload = JSON.parse(String(init.body ?? '{}')) as { dept_id: number; cursor?: number };

        if (url.includes('/department/listsub')) {
          if (payload.dept_id === 1) {
            return {
              errcode: 0,
              result: [{ dept_id: 2, name: '销售中心' }],
            };
          }

          if (payload.dept_id === 2) {
            return {
              errcode: 0,
              result: [{ dept_id: 3, name: '华东一部' }],
            };
          }

          return { errcode: 0, result: [] };
        }

        if (url.includes('/user/list')) {
          if (payload.dept_id === 1) {
            return {
              errcode: 0,
              result: {
                has_more: false,
                next_cursor: 0,
                list: [],
              },
            };
          }

          if (payload.dept_id === 2) {
            return {
              errcode: 0,
              result: {
                has_more: false,
                next_cursor: 0,
                list: [
                  {
                    unionid: 'union-1',
                    userid: 'user-1',
                    openUserid: 'open-1',
                    name: '张三',
                    mobile: '13800000000',
                    email: 'zhangsan@example.com',
                    job_number: 'A001',
                  },
                ],
              },
            };
          }

          if (payload.dept_id === 3) {
            return {
              errcode: 0,
              result: {
                has_more: false,
                next_cursor: 0,
                list: [
                  {
                    unionid: 'union-1',
                    userid: 'user-1',
                    openUserid: 'open-1',
                    name: '张三',
                    mobile: '13800000000',
                    email: 'zhangsan@example.com',
                    job_number: 'A001',
                  },
                  {
                    unionid: 'union-2',
                    userid: 'user-2',
                    openUserid: 'open-2',
                    name: '李四',
                    mobile: '13900000000',
                    email: 'lisi@example.com',
                    job_number: 'A002',
                  },
                ],
              },
            };
          }
        }

        throw new Error(`Unexpected request: ${url} ${JSON.stringify(payload)}`);
      });

    const result = await client.fetchOrganizationUsers();

    expect(fetchJson).toHaveBeenCalled();
    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          unionId: 'union-1',
          departmentNames: ['销售中心', '华东一部'],
        }),
        expect.objectContaining({
          unionId: 'union-2',
          departmentNames: ['华东一部'],
        }),
      ]),
    );
  });
});
