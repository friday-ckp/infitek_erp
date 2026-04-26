export const PrimaryIndustry = {
  EDUCATION: 'education',
  GOVERNMENT: 'government',
  MEDICAL: 'medical',
  ENTERPRISE: 'enterprise',
} as const;

export type PrimaryIndustry =
  (typeof PrimaryIndustry)[keyof typeof PrimaryIndustry];
