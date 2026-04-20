export const WarehouseOwnership = {
  INTERNAL: '内部仓',
  EXTERNAL: '外部仓',
} as const;

export type WarehouseOwnership = (typeof WarehouseOwnership)[keyof typeof WarehouseOwnership];
