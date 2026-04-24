export const SupplierInvoiceType = {
  NORMAL: '普票',
  VAT_13: '13%专票',
  VAT_7: '7%专票',
  VAT_1: '1%专票',
} as const;

export type SupplierInvoiceType =
  (typeof SupplierInvoiceType)[keyof typeof SupplierInvoiceType];
