export const ProductDocumentAttributionType = {
  GENERAL: 'general',
  CATEGORY_L1: 'category_l1',
  CATEGORY_L2: 'category_l2',
  CATEGORY_L3: 'category_l3',
  PRODUCT: 'product',
} as const;
export type ProductDocumentAttributionType = typeof ProductDocumentAttributionType[keyof typeof ProductDocumentAttributionType];
