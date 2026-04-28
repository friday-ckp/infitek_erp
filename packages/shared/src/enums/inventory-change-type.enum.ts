export const InventoryChangeType = {
  INITIAL: 'initial',
  PURCHASE_RECEIPT: 'purchase_receipt',
  OUTBOUND: 'outbound',
  LOCK: 'lock',
  UNLOCK: 'unlock',
} as const;

export type InventoryChangeType =
  (typeof InventoryChangeType)[keyof typeof InventoryChangeType];
