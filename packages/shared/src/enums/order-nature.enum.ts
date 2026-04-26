export const OrderNature = {
  BIDDING: 'bidding',
  RETAIL: 'retail',
  STOCK_PREPARE: 'stock_prepare',
} as const;

export type OrderNature =
  (typeof OrderNature)[keyof typeof OrderNature];
