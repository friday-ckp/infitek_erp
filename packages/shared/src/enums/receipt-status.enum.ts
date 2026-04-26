export const ReceiptStatus = {
  UNPAID: 'unpaid',
  PARTIALLY_PAID: 'partially_paid',
  PAID: 'paid',
} as const;

export type ReceiptStatus =
  (typeof ReceiptStatus)[keyof typeof ReceiptStatus];
