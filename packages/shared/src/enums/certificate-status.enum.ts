export const CertificateStatus = {
  VALID: 'valid',
  EXPIRED: 'expired',
} as const;

export type CertificateStatus = typeof CertificateStatus[keyof typeof CertificateStatus];
