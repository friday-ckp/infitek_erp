export const PurchaseOrderSettlementDateType = {
  ORDER_DATE: "order_date",
  RECEIPT_DATE: "receipt_date",
  INVOICE_DATE: "invoice_date",
} as const;

export type PurchaseOrderSettlementDateType =
  (typeof PurchaseOrderSettlementDateType)[keyof typeof PurchaseOrderSettlementDateType];
