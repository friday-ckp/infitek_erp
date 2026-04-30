export const PurchaseOrderReceiptStatus = {
  NOT_RECEIVED: "not_received",
  PARTIALLY_RECEIVED: "partially_received",
  RECEIVED: "received",
} as const;

export type PurchaseOrderReceiptStatus =
  (typeof PurchaseOrderReceiptStatus)[keyof typeof PurchaseOrderReceiptStatus];
