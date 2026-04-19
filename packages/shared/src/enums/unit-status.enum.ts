export const UnitStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export type UnitStatus = (typeof UnitStatus)[keyof typeof UnitStatus];
