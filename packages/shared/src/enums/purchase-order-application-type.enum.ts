export const PurchaseOrderApplicationType = {
  STOCK_PURCHASE: "stock_purchase",
  SALES_REQUISITION: "sales_requisition",
} as const;

export type PurchaseOrderApplicationType =
  (typeof PurchaseOrderApplicationType)[keyof typeof PurchaseOrderApplicationType];
