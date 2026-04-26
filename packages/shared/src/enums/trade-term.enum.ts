export const TradeTerm = {
  EXW: 'EXW',
  FCA: 'FCA',
  FOB: 'FOB',
  CFR: 'CFR',
  CIF: 'CIF',
  CIP: 'CIP',
  CPT: 'CPT',
} as const;

export type TradeTerm = (typeof TradeTerm)[keyof typeof TradeTerm];
