export const SupplierSettlementDateType = {
  ORDER_DATE: '采购下单日期',
  RECEIPT_DATE: '采购入库日期',
  INVOICE_DATE: '采购开票日期',
} as const;

export type SupplierSettlementDateType =
  (typeof SupplierSettlementDateType)[keyof typeof SupplierSettlementDateType];
