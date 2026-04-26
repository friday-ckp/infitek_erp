export const TransportationMethod = {
  SEA: 'sea',
  AIR: 'air',
  ROAD: 'road',
  RAIL: 'rail',
  EXPRESS: 'express',
  OTHER: 'other',
} as const;

export type TransportationMethod =
  (typeof TransportationMethod)[keyof typeof TransportationMethod];
