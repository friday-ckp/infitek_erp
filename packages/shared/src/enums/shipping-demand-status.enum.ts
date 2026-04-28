export const ShippingDemandStatus = {
  PENDING_ALLOCATION: 'pending_allocation',
  PURCHASING: 'purchasing',
  PREPARED: 'prepared',
  PARTIALLY_SHIPPED: 'partially_shipped',
  SHIPPED: 'shipped',
  VOIDED: 'voided',
} as const;

export type ShippingDemandStatus =
  (typeof ShippingDemandStatus)[keyof typeof ShippingDemandStatus];
