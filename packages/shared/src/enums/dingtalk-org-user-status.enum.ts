export const DingtalkOrgUserStatus = {
  UNBOUND: 'UNBOUND',
  CANDIDATE: 'CANDIDATE',
  CONFLICT: 'CONFLICT',
  BOUND: 'BOUND',
} as const;

export type DingtalkOrgUserStatus =
  (typeof DingtalkOrgUserStatus)[keyof typeof DingtalkOrgUserStatus];
