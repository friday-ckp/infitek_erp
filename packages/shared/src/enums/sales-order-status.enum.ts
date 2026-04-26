export const SalesOrderStatus = {
  PENDING_SUBMIT: 'pending_submit',
  IN_REVIEW: 'in_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PREPARING: 'preparing',
  PREPARED: 'prepared',
  PARTIALLY_SHIPPED: 'partially_shipped',
  SHIPPED: 'shipped',
  VOIDED: 'voided',
} as const;

export type SalesOrderStatus =
  (typeof SalesOrderStatus)[keyof typeof SalesOrderStatus];
