import { Test, TestingModule } from '@nestjs/testing';
import { DingtalkOrgUsersController } from '../dingtalk-org-users.controller';
import { DingtalkOrgUsersService } from '../dingtalk-org-users.service';
import { DingtalkOrgUserStatus } from '@infitek/shared';

describe('DingtalkOrgUsersController', () => {
  let controller: DingtalkOrgUsersController;

  const service = {
    findAll: jest.fn(),
    sync: jest.fn(),
    recomputeMatch: jest.fn(),
    confirmBinding: jest.fn(),
    manualBind: jest.fn(),
    unbind: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DingtalkOrgUsersController],
      providers: [{ provide: DingtalkOrgUsersService, useValue: service }],
    }).compile();

    controller = module.get(DingtalkOrgUsersController);
    jest.clearAllMocks();
  });

  it('列表接口应透传查询参数', async () => {
    service.findAll.mockResolvedValue({
      list: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    });

    const query = { page: 1, pageSize: 20, status: DingtalkOrgUserStatus.UNBOUND };
    const result = await controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
    expect(result.total).toBe(0);
  });

  it('同步接口应传递当前用户', async () => {
    service.sync.mockResolvedValue({ total: 1, created: 1, updated: 0, skipped: 0, failed: 0, bound: 0 });

    const result = await controller.sync({}, { username: 'admin' });

    expect(service.sync).toHaveBeenCalledWith('admin');
    expect(result.created).toBe(1);
  });

  it('重算匹配接口应传递当前用户', async () => {
    service.recomputeMatch.mockResolvedValue({ id: 1, status: DingtalkOrgUserStatus.CANDIDATE });

    const result = await controller.recomputeMatch(1, { username: 'admin' });

    expect(service.recomputeMatch).toHaveBeenCalledWith(1, 'admin');
    expect(result.status).toBe(DingtalkOrgUserStatus.CANDIDATE);
  });

  it('确认绑定接口应传递当前用户', async () => {
    service.confirmBinding.mockResolvedValue({ id: 1, status: DingtalkOrgUserStatus.BOUND });

    const result = await controller.confirmBinding(1, { username: 'admin' });

    expect(service.confirmBinding).toHaveBeenCalledWith(1, 'admin');
    expect(result.status).toBe(DingtalkOrgUserStatus.BOUND);
  });

  it('手工绑定接口应透传 userId', async () => {
    service.manualBind.mockResolvedValue({ id: 1, status: DingtalkOrgUserStatus.BOUND });

    const result = await controller.manualBind(1, { userId: 7 }, { username: 'admin' });

    expect(service.manualBind).toHaveBeenCalledWith(1, 7, 'admin');
    expect(result.status).toBe(DingtalkOrgUserStatus.BOUND);
  });

  it('解绑接口应传递当前用户', async () => {
    service.unbind.mockResolvedValue({ id: 1, status: DingtalkOrgUserStatus.UNBOUND });

    const result = await controller.unbind(1, { username: 'admin' });

    expect(service.unbind).toHaveBeenCalledWith(1, 'admin');
    expect(result.status).toBe(DingtalkOrgUserStatus.UNBOUND);
  });
});
