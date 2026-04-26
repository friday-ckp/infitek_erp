export const ProductLineType = {
  MAIN: 'main',
  OPTIONAL: 'optional',
  STANDARD: 'standard',
  GIFT: 'gift',
} as const;

export type ProductLineType =
  (typeof ProductLineType)[keyof typeof ProductLineType];
