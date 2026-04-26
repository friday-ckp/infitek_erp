export const SalesOrderType = {
  SALES: 'sales',
  AFTER_SALES: 'after_sales',
  SAMPLE: 'sample',
} as const;

export type SalesOrderType =
  (typeof SalesOrderType)[keyof typeof SalesOrderType];
