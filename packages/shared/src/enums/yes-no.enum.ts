export const YesNo = {
  YES: 'yes',
  NO: 'no',
} as const;

export type YesNo = (typeof YesNo)[keyof typeof YesNo];
