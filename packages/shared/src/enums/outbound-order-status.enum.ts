export const OutboundOrderStatus = {
  CONFIRMED: 'confirmed',
} as const;

export type OutboundOrderStatus =
  (typeof OutboundOrderStatus)[keyof typeof OutboundOrderStatus];
