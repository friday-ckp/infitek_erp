export const BlType = {
  TELEX_RELEASE: 'telex_release',
  ORIGINAL: 'original',
} as const;

export type BlType = (typeof BlType)[keyof typeof BlType];
