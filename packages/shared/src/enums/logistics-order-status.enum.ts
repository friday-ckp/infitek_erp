export const LogisticsOrderStatus = {
  CONFIRMED: "confirmed",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

export type LogisticsOrderStatus =
  (typeof LogisticsOrderStatus)[keyof typeof LogisticsOrderStatus];
