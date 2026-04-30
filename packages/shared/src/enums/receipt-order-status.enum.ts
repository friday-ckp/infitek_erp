export const ReceiptOrderStatus = {
  CONFIRMED: 'confirmed',
} as const;

export type ReceiptOrderStatus =
  (typeof ReceiptOrderStatus)[keyof typeof ReceiptOrderStatus];
