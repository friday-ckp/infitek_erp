export const PurchaseOrderDemandType = {
  SALES_ORDER: "sales_order",
  AFTER_SALES_ORDER: "after_sales_order",
  EXHIBITION_SAMPLE_ORDER: "exhibition_sample_order",
} as const;

export type PurchaseOrderDemandType =
  (typeof PurchaseOrderDemandType)[keyof typeof PurchaseOrderDemandType];
