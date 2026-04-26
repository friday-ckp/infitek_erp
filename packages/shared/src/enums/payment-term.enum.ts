export const PaymentTerm = {
  TT_IN_ADVANCE_100: '100_tt_in_advance',
  DEPOSIT_30_BALANCE_70_BEFORE_DELIVERY: '30_deposit_70_balance_before_delivery',
  DEPOSIT_40_BALANCE_60_BEFORE_DELIVERY: '40_deposit_60_balance_before_delivery',
  DEPOSIT_50_BALANCE_50_BEFORE_DELIVERY: '50_deposit_50_balance_before_delivery',
  DEPOSIT_60_BALANCE_40_BEFORE_DELIVERY: '60_deposit_40_balance_before_delivery',
  DEPOSIT_70_BALANCE_30_BEFORE_DELIVERY: '70_deposit_30_balance_before_delivery',
  PAYMENT_100_BEFORE_DELIVERY: '100_payment_before_delivery',
  DEPOSIT_40_BALANCE_60_AGAINST_BL_COPY: '40_deposit_60_balance_against_bl_copy',
  DEPOSIT_50_BALANCE_50_AGAINST_BL_COPY: '50_deposit_50_balance_against_bl_copy',
  DEPOSIT_70_BALANCE_30_AGAINST_BL_COPY: '70_deposit_30_balance_against_bl_copy',
  LC_AT_SIGHT: 'lc_at_sight',
  CAD: 'cad',
  DP_AT_SIGHT: 'dp_at_sight',
  DA_30_DAYS: 'da_30_days',
  OA_30_DAYS: 'oa_30_days',
} as const;

export type PaymentTerm = (typeof PaymentTerm)[keyof typeof PaymentTerm];
