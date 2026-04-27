export const InventoryBatchSourceType = {
  INITIAL: 'initial',
  PURCHASE_RECEIPT: 'purchase_receipt',
} as const;

export type InventoryBatchSourceType =
  (typeof InventoryBatchSourceType)[keyof typeof InventoryBatchSourceType];
