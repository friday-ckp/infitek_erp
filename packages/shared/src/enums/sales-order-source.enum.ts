export const SalesOrderSource = {
  MANUAL: 'manual',
  THIRD_PARTY: 'third_party',
} as const;

export type SalesOrderSource =
  (typeof SalesOrderSource)[keyof typeof SalesOrderSource];
