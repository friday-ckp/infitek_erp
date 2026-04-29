export const ShippingDemandAllocationStatus = {
  ACTIVE: 'active',
  RELEASED: 'released',
  SHIPPED: 'shipped',
} as const;

export type ShippingDemandAllocationStatus =
  (typeof ShippingDemandAllocationStatus)[keyof typeof ShippingDemandAllocationStatus];
