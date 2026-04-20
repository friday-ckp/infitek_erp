import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

/**
 * 将分页参数应用到 QueryBuilder。
 * 封装 skip/take 计算，供所有列表查询统一调用。
 */
export function applyPagination<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  page: number,
  pageSize: number,
): SelectQueryBuilder<T> {
  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.max(1, Math.floor(pageSize));
  return qb.skip((safePage - 1) * safePageSize).take(safePageSize);
}

/**
 * 将关键字模糊搜索条件应用到 QueryBuilder。
 * 当 keyword 为空时不添加任何条件，直接返回原 QueryBuilder。
 *
 * @param qb      目标 QueryBuilder
 * @param alias   实体别名（与 createQueryBuilder(alias) 一致）
 * @param fields  需要搜索的字段名列表（使用实体属性名，非列名）
 * @param keyword 关键字（undefined/空字符串时跳过）
 */
export function applyKeywordFilter<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  alias: string,
  fields: string[],
  keyword: string | undefined,
): SelectQueryBuilder<T> {
  const kw = keyword?.trim();
  if (!kw || fields.length === 0) return qb;

  const conditions = fields.map((f, i) => `${alias}.${f} LIKE :kw${i}`);
  const params = Object.fromEntries(
    fields.map((_, i) => [`kw${i}`, `%${kw}%`]),
  );

  return qb.andWhere(`(${conditions.join(' OR ')})`, params);
}
