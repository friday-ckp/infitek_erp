export const CurrencyStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export type CurrencyStatus = (typeof CurrencyStatus)[keyof typeof CurrencyStatus];
