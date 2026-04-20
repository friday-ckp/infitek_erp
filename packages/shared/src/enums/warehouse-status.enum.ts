export const WarehouseStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export type WarehouseStatus = (typeof WarehouseStatus)[keyof typeof WarehouseStatus];
