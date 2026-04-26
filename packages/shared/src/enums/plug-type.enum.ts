export const PlugType = {
  EU: 'eu',
  UK: 'uk',
  US: 'us',
  CN: 'cn',
  OTHER: 'other',
  NONE: 'none',
} as const;

export type PlugType = (typeof PlugType)[keyof typeof PlugType];
