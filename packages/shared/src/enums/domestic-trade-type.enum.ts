export const DomesticTradeType = {
  DOMESTIC: 'domestic',
  FOREIGN: 'foreign',
} as const;

export type DomesticTradeType =
  (typeof DomesticTradeType)[keyof typeof DomesticTradeType];
