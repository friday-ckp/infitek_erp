import { applyKeywordFilter, applyPagination } from './query-builder.util';

function makeMockQb() {
  const qb: Record<string, jest.Mock> = {
    skip: jest.fn(),
    take: jest.fn(),
    andWhere: jest.fn(),
  };
  // 链式调用：每个方法返回 qb 本身
  qb.skip.mockReturnValue(qb);
  qb.take.mockReturnValue(qb);
  qb.andWhere.mockReturnValue(qb);
  return qb as unknown as Parameters<typeof applyPagination>[0];
}

describe('applyPagination', () => {
  it('page=1, pageSize=20 => skip=0, take=20', () => {
    const qb = makeMockQb();
    const result = applyPagination(qb, 1, 20);
    expect((qb as any).skip).toHaveBeenCalledWith(0);
    expect((qb as any).take).toHaveBeenCalledWith(20);
    expect(result).toBe(qb);
  });

  it('page=2, pageSize=20 => skip=20, take=20', () => {
    const qb = makeMockQb();
    applyPagination(qb, 2, 20);
    expect((qb as any).skip).toHaveBeenCalledWith(20);
    expect((qb as any).take).toHaveBeenCalledWith(20);
  });

  it('page=3, pageSize=10 => skip=20, take=10', () => {
    const qb = makeMockQb();
    applyPagination(qb, 3, 10);
    expect((qb as any).skip).toHaveBeenCalledWith(20);
    expect((qb as any).take).toHaveBeenCalledWith(10);
  });

  it('page=0 被修正为 page=1 => skip=0', () => {
    const qb = makeMockQb();
    applyPagination(qb, 0, 20);
    expect((qb as any).skip).toHaveBeenCalledWith(0);
    expect((qb as any).take).toHaveBeenCalledWith(20);
  });

  it('pageSize=0 被修正为 pageSize=1 => take=1', () => {
    const qb = makeMockQb();
    applyPagination(qb, 1, 0);
    expect((qb as any).skip).toHaveBeenCalledWith(0);
    expect((qb as any).take).toHaveBeenCalledWith(1);
  });
});

describe('applyKeywordFilter', () => {
  it('keyword 为 undefined 时不添加 andWhere', () => {
    const qb = makeMockQb();
    const result = applyKeywordFilter(qb, 'unit', ['name', 'code'], undefined);
    expect((qb as any).andWhere).not.toHaveBeenCalled();
    expect(result).toBe(qb);
  });

  it('keyword 为空字符串时不添加 andWhere', () => {
    const qb = makeMockQb();
    applyKeywordFilter(qb, 'unit', ['name', 'code'], '');
    expect((qb as any).andWhere).not.toHaveBeenCalled();
  });

  it('keyword 为纯空白字符串时 trim 后不添加 andWhere', () => {
    const qb = makeMockQb();
    applyKeywordFilter(qb, 'unit', ['name', 'code'], '   ');
    expect((qb as any).andWhere).not.toHaveBeenCalled();
  });

  it('fields 为空数组时不添加 andWhere', () => {
    const qb = makeMockQb();
    applyKeywordFilter(qb, 'unit', [], 'test');
    expect((qb as any).andWhere).not.toHaveBeenCalled();
  });

  it('单字段时生成正确的 LIKE 条件', () => {
    const qb = makeMockQb();
    applyKeywordFilter(qb, 'unit', ['name'], '件');
    expect((qb as any).andWhere).toHaveBeenCalledWith(
      '(unit.name LIKE :kw0)',
      { kw0: '%件%' },
    );
  });

  it('多字段时用 OR 连接各字段条件', () => {
    const qb = makeMockQb();
    applyKeywordFilter(qb, 'unit', ['name', 'code'], 'PCS');
    expect((qb as any).andWhere).toHaveBeenCalledWith(
      '(unit.name LIKE :kw0 OR unit.code LIKE :kw1)',
      { kw0: '%PCS%', kw1: '%PCS%' },
    );
  });

  it('返回同一 qb 实例（链式调用）', () => {
    const qb = makeMockQb();
    const result = applyKeywordFilter(qb, 'unit', ['name'], 'x');
    expect(result).toBe(qb);
  });
});
