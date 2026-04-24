export const SupplierStatus = {
  COOPERATING: '合作',
  ELIMINATED: '淘汰',
  TEMPORARY: '临拓',
} as const;

export type SupplierStatus = (typeof SupplierStatus)[keyof typeof SupplierStatus];
