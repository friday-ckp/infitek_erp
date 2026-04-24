export const SupplierSettlementType = {
  MONTHLY: '月结',
  BEFORE_SHIPMENT: '发货前结算',
  HALF_MONTHLY: '半月结',
  INVOICE_BASED: '票结',
} as const;

export type SupplierSettlementType =
  (typeof SupplierSettlementType)[keyof typeof SupplierSettlementType];
