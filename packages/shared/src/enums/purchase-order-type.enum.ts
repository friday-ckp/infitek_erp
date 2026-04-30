export const PurchaseOrderType = {
  REQUISITION: 'requisition',
  STOCK: 'stock',
} as const;

export type PurchaseOrderType =
  (typeof PurchaseOrderType)[keyof typeof PurchaseOrderType];
