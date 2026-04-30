export const PurchaseOrderSettlementType = {
  MONTHLY: "monthly",
  HALF_MONTHLY: "half_monthly",
  INVOICE_BASED: "invoice_based",
} as const;

export type PurchaseOrderSettlementType =
  (typeof PurchaseOrderSettlementType)[keyof typeof PurchaseOrderSettlementType];
