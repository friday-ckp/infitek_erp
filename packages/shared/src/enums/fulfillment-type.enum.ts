export const FulfillmentType = {
  FULL_PURCHASE: 'full_purchase',
  PARTIAL_PURCHASE: 'partial_purchase',
  USE_STOCK: 'use_stock',
} as const;

export type FulfillmentType =
  (typeof FulfillmentType)[keyof typeof FulfillmentType];
