export const OutboundOrderType = {
  SALES: 'sales_outbound',
  LOSS: 'loss_outbound',
  INVENTORY_LOSS: 'inventory_loss_outbound',
  OTHER: 'other',
} as const;

export type OutboundOrderType =
  (typeof OutboundOrderType)[keyof typeof OutboundOrderType];
