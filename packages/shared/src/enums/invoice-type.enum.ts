export const InvoiceType = {
  VAT_SPECIAL: 'vat_special',
  VAT_NORMAL: 'vat_normal',
} as const;

export type InvoiceType = (typeof InvoiceType)[keyof typeof InvoiceType];
