export const WarehouseType = {
  SELF_OWNED: '自营仓',
  PORT: '港口仓',
  FACTORY: '工厂仓',
} as const;

export type WarehouseType = (typeof WarehouseType)[keyof typeof WarehouseType];
