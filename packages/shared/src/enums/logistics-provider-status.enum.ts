export const LogisticsProviderStatus = {
  COOPERATING: '合作',
  ELIMINATED: '淘汰',
} as const;

export type LogisticsProviderStatus =
  (typeof LogisticsProviderStatus)[keyof typeof LogisticsProviderStatus];
