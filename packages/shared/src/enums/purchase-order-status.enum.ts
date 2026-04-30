export const PurchaseOrderStatus = {
  PENDING_CONFIRM: 'pending_confirm',
  SUPPLIER_CONFIRMING: 'supplier_confirming',
  PENDING_RECEIPT: 'pending_receipt',
  PARTIALLY_RECEIVED: 'partially_received',
  RECEIVED: 'received',
  CANCELLED: 'cancelled',
} as const;

export type PurchaseOrderStatus =
  (typeof PurchaseOrderStatus)[keyof typeof PurchaseOrderStatus];
