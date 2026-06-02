import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { DingtalkOrgUserStatus, UserStatus } from '@infitek/shared';
import { DingtalkOrgUsersService } from '../dingtalk-org-users.service';
import { DingtalkOrgUsersRepository } from '../dingtalk-org-users.repository';
import { DingtalkOrgUsersClient } from '../dingtalk-org-users.client';
import { UsersService } from '../../users/users.service';

describe('DingtalkOrgUsersService', () => {
  let service: DingtalkOrgUsersService;

  const repository = {
    findByUnionId: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const client = {
    fetchOrganizationUsers: jest.fn(),
  };

  const usersService = {
    findByDingtalkUnionId: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByIds: jest.fn(),
    findActiveMatchCandidates: jest.fn(),
    createAutoProvisionedDingtalkUser: jest.fn(),
    bindDingtalkIdentity: jest.fn(),
    unbindDingtalkIdentity: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DingtalkOrgUsersService,
        { provide: DingtalkOrgUsersRepository, useValue: repository },
        { provide: DingtalkOrgUsersClient, useValue: client },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = module.get(DingtalkOrgUsersService);
    jest.clearAllMocks();
  });

  it('admin 同步成功时应写入用户池摘要', async () => {
    client.fetchOrganizationUsers.mockResolvedValue([
      {
        unionId: 'union-1',
        userId: 'dt-user-1',
        openId: 'open-1',
        nick: '张三',
        mobile: '13800000000',
        email: 'zhangsan@example.com',
        jobNumber: 'A001',
        departmentNames: ['销售部'],
      },
    ]);
    repository.findByUnionId.mockResolvedValue(null);
    usersService.findByDingtalkUnionId.mockResolvedValue(null);
    usersService.findActiveMatchCandidates.mockResolvedValue([
      {
        id: 9,
        username: 'zhangsan@example.com',
        name: '张三',
        status: UserStatus.ACTIVE,
        email: 'zhangsan@example.com',
      },
    ]);

    const result = await service.sync('admin');

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        unionId: 'union-1',
        status: DingtalkOrgUserStatus.CANDIDATE,
        suggestedUserId: 9,
      }),
    );
    expect(result).toEqual({
      total: 1,
      created: 1,
      updated: 0,
      skipped: 0,
      failed: 0,
      bound: 0,
    });
  });

  it('重复同步时应幂等更新而不是重复插入', async () => {
    client.fetchOrganizationUsers.mockResolvedValue([
      {
        unionId: 'union-1',
        userId: 'dt-user-1',
        openId: 'open-1',
        nick: '张三',
        mobile: '13800000000',
        email: 'zhangsan@example.com',
        jobNumber: 'A001',
        departmentNames: ['销售部'],
      },
    ]);
    repository.findByUnionId.mockResolvedValue({ id: 10, unionId: 'union-1' });
    usersService.findByDingtalkUnionId.mockResolvedValue({ id: 5 });
    usersService.findActiveMatchCandidates.mockResolvedValue([]);

    const result = await service.sync('admin');

    expect(repository.update).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        unionId: 'union-1',
        status: DingtalkOrgUserStatus.BOUND,
      }),
    );
    expect(repository.create).not.toHaveBeenCalled();
    expect(result.bound).toBe(1);
  });

  it('非 admin 调用同步时应返回 403', async () => {
    await expect(service.sync('normal-user')).rejects.toThrow(ForbiddenException);
    expect(client.fetchOrganizationUsers).not.toHaveBeenCalled();
  });

  it('外部接口失败时应透传统一业务错误', async () => {
    client.fetchOrganizationUsers.mockRejectedValue(
      new UnauthorizedException({ code: 'DINGTALK_SYNC_FAILED', message: '钉钉组织用户同步失败' }),
    );

    await expect(service.sync('admin')).rejects.toThrow(UnauthorizedException);
  });

  it('唯一命中时应生成 CANDIDATE 建议', async () => {
    client.fetchOrganizationUsers.mockResolvedValue([
      {
        unionId: 'union-2',
        userId: 'dt-user-2',
        openId: 'open-2',
        nick: '李四',
        mobile: '13900000000',
        email: null,
        jobNumber: null,
        departmentNames: ['财务部'],
      },
    ]);
    repository.findByUnionId.mockResolvedValue(null);
    usersService.findByDingtalkUnionId.mockResolvedValue(null);
    usersService.findActiveMatchCandidates.mockResolvedValue([
      {
        id: 12,
        username: 'lisi',
        name: '李四',
        status: UserStatus.ACTIVE,
        mobile: '13900000000',
      },
    ]);

    await service.sync('admin');

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: DingtalkOrgUserStatus.CANDIDATE,
        suggestedUserId: 12,
        matchReason: 'candidate:mobile',
      }),
    );
  });

  it('多命中时应标记为 CONFLICT', async () => {
    client.fetchOrganizationUsers.mockResolvedValue([
      {
        unionId: 'union-3',
        userId: 'dt-user-3',
        openId: 'open-3',
        nick: '王五',
        mobile: '13700000000',
        email: null,
        jobNumber: null,
        departmentNames: ['采购部'],
      },
    ]);
    repository.findByUnionId.mockResolvedValue(null);
    usersService.findByDingtalkUnionId.mockResolvedValue(null);
    usersService.findActiveMatchCandidates.mockResolvedValue([
      { id: 21, username: 'u1', name: '王五A', status: UserStatus.ACTIVE, mobile: '13700000000' },
      { id: 22, username: 'u2', name: '王五B', status: UserStatus.ACTIVE, mobile: '13700000000' },
    ]);

    await service.sync('admin');

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: DingtalkOrgUserStatus.CONFLICT,
        suggestedUserId: null,
        matchReason: 'conflict:mobile:multiple-matches',
      }),
    );
  });

  it('确认候选绑定后应更新为 BOUND 并回写 users', async () => {
    repository.findById.mockResolvedValue({
      id: 31,
      unionId: 'union-31',
      userId: 'dt-user-31',
      openId: 'open-31',
      nick: '赵六',
      status: DingtalkOrgUserStatus.CANDIDATE,
      suggestedUserId: 8,
    });
    usersService.findById.mockResolvedValue({ id: 8, username: 'zhaoliu', name: '赵六' });
    usersService.bindDingtalkIdentity.mockResolvedValue({ id: 8, dingtalkUnionId: 'union-31' });
    repository.update.mockResolvedValue({ id: 31, status: DingtalkOrgUserStatus.BOUND });

    const result = await service.confirmBinding(31, 'admin');

    expect(usersService.bindDingtalkIdentity).toHaveBeenCalledWith(
      8,
      expect.objectContaining({
        dingtalkUnionId: 'union-31',
        dingtalkUserId: 'dt-user-31',
        dingtalkOpenId: 'open-31',
        dingtalkNick: '赵六',
      }),
      'admin',
    );
    expect(repository.update).toHaveBeenCalledWith(
      31,
      expect.objectContaining({
        status: DingtalkOrgUserStatus.BOUND,
        suggestedUserId: 8,
      }),
    );
    expect(result.status).toBe(DingtalkOrgUserStatus.BOUND);
  });

  it('解绑后应回流为待处理状态', async () => {
    repository.findById.mockResolvedValue({
      id: 41,
      unionId: 'union-41',
      mobile: '13600000000',
      email: 'back@example.com',
      jobNumber: 'EMP-41',
      nick: '解绑用户',
      status: DingtalkOrgUserStatus.BOUND,
    });
    usersService.findByDingtalkUnionId.mockResolvedValue({ id: 9, username: 'bound-user' });
    usersService.unbindDingtalkIdentity.mockResolvedValue({ id: 9, dingtalkUnionId: null });
    usersService.findActiveMatchCandidates.mockResolvedValue([]);
    repository.update.mockResolvedValue({ id: 41, status: DingtalkOrgUserStatus.UNBOUND });

    const result = await service.unbind(41, 'admin');

    expect(usersService.unbindDingtalkIdentity).toHaveBeenCalledWith(9, 'admin');
    expect(repository.update).toHaveBeenCalledWith(
      41,
      expect.objectContaining({
        status: DingtalkOrgUserStatus.UNBOUND,
        matchReason: 'no-erp-match',
      }),
    );
    expect(result.status).toBe(DingtalkOrgUserStatus.UNBOUND);
  });

  it('登录时用户池唯一命中 ERP 用户应自动绑定并回写 BOUND', async () => {
    repository.findByUnionId.mockResolvedValue({
      id: 51,
      unionId: 'union-51',
      userId: 'dt-user-51',
      openId: 'open-51',
      nick: '自动绑定用户',
      mobile: '13500000000',
      email: 'autobind@example.com',
      jobNumber: 'EMP-51',
    });
    usersService.findByDingtalkUnionId.mockResolvedValue(null);
    usersService.findActiveMatchCandidates.mockResolvedValue([
      {
        id: 15,
        username: 'autobind',
        name: '自动绑定用户',
        status: UserStatus.ACTIVE,
        mobile: '13500000000',
        email: 'autobind@example.com',
        jobNumber: 'EMP-51',
      },
    ]);
    usersService.findById.mockResolvedValue({
      id: 15,
      username: 'autobind',
      name: '自动绑定用户',
      status: UserStatus.ACTIVE,
    });
    usersService.bindDingtalkIdentity.mockResolvedValue({ id: 15, dingtalkUnionId: 'union-51' });
    repository.update.mockResolvedValue({ id: 51, status: DingtalkOrgUserStatus.BOUND });

    const result = await service.autoBindForLogin({
      unionId: 'union-51',
      userId: 'dt-user-51',
      openId: 'open-51',
      nick: '自动绑定用户',
      avatar: 'https://example.com/avatar.png',
    });

    expect(usersService.bindDingtalkIdentity).toHaveBeenCalledWith(
      15,
      expect.objectContaining({
        dingtalkUnionId: 'union-51',
        dingtalkUserId: 'dt-user-51',
        dingtalkOpenId: 'open-51',
        dingtalkNick: '自动绑定用户',
        dingtalkAvatar: 'https://example.com/avatar.png',
      }),
      'admin',
    );
    expect(repository.update).toHaveBeenCalledWith(
      51,
      expect.objectContaining({
        status: DingtalkOrgUserStatus.BOUND,
        suggestedUserId: 15,
        matchReason: 'auto-bound-on-login',
      }),
    );
    expect(result).toEqual({ id: 15, dingtalkUnionId: 'union-51' });
  });

  it('登录时如果用户池不存在当前用户应直接返回 null', async () => {
    repository.findByUnionId.mockResolvedValue(null);

    const result = await service.autoBindForLogin({
      unionId: 'missing-union',
      userId: null,
      openId: null,
      nick: null,
      avatar: null,
    });

    expect(result).toBeNull();
    expect(usersService.bindDingtalkIdentity).not.toHaveBeenCalled();
  });

  it('登录时用户池存在但无 ERP 匹配应自动创建用户并绑定', async () => {
    repository.findByUnionId.mockResolvedValue({
      id: 61,
      unionId: 'union-61',
      userId: 'dt-user-61',
      openId: null,
      nick: '陈康平',
      mobile: null,
      email: null,
      jobNumber: '100526',
    });
    usersService.findByDingtalkUnionId.mockResolvedValue(null);
    usersService.findActiveMatchCandidates.mockResolvedValue([]);
    usersService.createAutoProvisionedDingtalkUser.mockResolvedValue({
      id: 26,
      username: '100526',
      name: '陈康平',
      status: UserStatus.ACTIVE,
    });
    usersService.findById.mockResolvedValue({
      id: 26,
      username: '100526',
      name: '陈康平',
      status: UserStatus.ACTIVE,
    });
    usersService.bindDingtalkIdentity.mockResolvedValue({ id: 26, dingtalkUnionId: 'union-61' });
    repository.update.mockResolvedValue({ id: 61, status: DingtalkOrgUserStatus.BOUND });

    const result = await service.autoBindForLogin({
      unionId: 'union-61',
      userId: 'dt-user-61',
      openId: 'open-61',
      nick: '陈康平',
      avatar: null,
    });

    expect(usersService.createAutoProvisionedDingtalkUser).toHaveBeenCalledWith(
      {
        nick: '陈康平',
        mobile: null,
        email: null,
        jobNumber: '100526',
        dingtalkUserId: 'dt-user-61',
        unionId: 'union-61',
      },
      'admin',
    );
    expect(usersService.bindDingtalkIdentity).toHaveBeenCalledWith(
      26,
      expect.objectContaining({
        dingtalkUnionId: 'union-61',
        dingtalkUserId: 'dt-user-61',
        dingtalkOpenId: 'open-61',
        dingtalkNick: '陈康平',
      }),
      'admin',
    );
    expect(repository.update).toHaveBeenCalledWith(
      61,
      expect.objectContaining({
        status: DingtalkOrgUserStatus.BOUND,
        suggestedUserId: 26,
        matchReason: 'auto-provisioned-on-login',
      }),
    );
    expect(result).toEqual({ id: 26, dingtalkUnionId: 'union-61' });
  });
});
