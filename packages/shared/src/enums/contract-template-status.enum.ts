export const ContractTemplateStatus = {
  PENDING_SUBMIT: 'pending_submit',
  IN_REVIEW: 'in_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  VOIDED: 'voided',
} as const;

export type ContractTemplateStatus =
  (typeof ContractTemplateStatus)[keyof typeof ContractTemplateStatus];
