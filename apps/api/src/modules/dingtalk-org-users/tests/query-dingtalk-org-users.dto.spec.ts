import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DingtalkOrgUserStatus } from '@infitek/shared';
import { QueryDingtalkOrgUsersDto } from '../dto/query-dingtalk-org-users.dto';

describe('QueryDingtalkOrgUsersDto', () => {
  async function validateQuery(input: Record<string, unknown>) {
    const dto = plainToInstance(QueryDingtalkOrgUsersDto, input);
    const errors = await validate(dto);
    return { dto, errors };
  }

  it('normalizes pagination and status values', async () => {
    const { dto, errors } = await validateQuery({
      page: '2',
      pageSize: '50',
      status: DingtalkOrgUserStatus.CONFLICT,
      keyword: ' 张三 ',
    });

    expect(errors).toHaveLength(0);
    expect(dto).toEqual(
      expect.objectContaining({
        page: 2,
        pageSize: 50,
        status: DingtalkOrgUserStatus.CONFLICT,
        keyword: '张三',
      }),
    );
  });

  it('rejects invalid status values', async () => {
    const { errors } = await validateQuery({
      status: 'PENDING',
    });

    expect(errors.map((error) => error.property)).toContain('status');
  });
});
