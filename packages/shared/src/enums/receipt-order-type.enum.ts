export const ReceiptOrderType = {
  PURCHASE_RECEIPT: 'purchase_receipt',
  SALES_RETURN_RECEIPT: 'sales_return_receipt',
  SALES_EXCHANGE_RECEIPT: 'sales_exchange_receipt',
  OPENING_RECEIPT: 'opening_receipt',
  SUPPLIER_GIFT_RECEIPT: 'supplier_gift_receipt',
  TRANSFER_RECEIPT: 'transfer_receipt',
  INVENTORY_GAIN_RECEIPT: 'inventory_gain_receipt',
  OTHER: 'other',
} as const;

export type ReceiptOrderType =
  (typeof ReceiptOrderType)[keyof typeof ReceiptOrderType];
