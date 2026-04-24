/**
 * Jest mock for @infitek/shared workspace package.
 *
 * The shared package's dist/ is not pre-built during test runs, and
 * pointing moduleNameMapper at the raw TypeScript source forces ts-jest
 * to cross-compile with a different tsconfig (nodenext vs commonjs),
 * which triggers runtime errors on certain Node versions.
 *
 * This mock re-exports the exact same values so tests resolve instantly.
 *
 * Keep in sync with packages/shared/src/ when adding new exports that
 * API code depends on.
 */

// enums
export enum SkuStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum UnitStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum LogisticsOrderStatus {
  CREATED = 'created',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum PurchaseOrderStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  RECEIVED = 'received',
  CANCELLED = 'cancelled',
}

export enum SalesOrderStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

export enum ShippingDemandStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export const CurrencyStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;
export type CurrencyStatus =
  (typeof CurrencyStatus)[keyof typeof CurrencyStatus];

export const WarehouseStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;
export type WarehouseStatus =
  (typeof WarehouseStatus)[keyof typeof WarehouseStatus];

export const WarehouseType = {
  SELF_OWNED: '自营仓',
  PORT: '港口仓',
  FACTORY: '工厂仓',
} as const;
export type WarehouseType =
  (typeof WarehouseType)[keyof typeof WarehouseType];

export const WarehouseOwnership = {
  INTERNAL: '内部仓',
  EXTERNAL: '外部仓',
} as const;
export type WarehouseOwnership =
  (typeof WarehouseOwnership)[keyof typeof WarehouseOwnership];

export const CertificateStatus = {
  VALID: 'valid',
  EXPIRED: 'expired',
} as const;
export type CertificateStatus =
  (typeof CertificateStatus)[keyof typeof CertificateStatus];

export const SpuFaqQuestionType = {
  RECOMMENDED_SELECTION: 'recommended_selection',
  INFORMATION_PROVIDING: 'information_providing',
  GENERAL_KNOWLEDGE: 'general_knowledge',
  PRODUCT_ADVANTAGES: 'product_advantages',
  FUNCTIONAL_PARAMETERS: 'functional_parameters',
  SOLUTION: 'solution',
  CONFIGURATION_INFO: 'configuration_info',
  PRODUCT_CUSTOMIZATION: 'product_customization',
  NO_MATCHING_PRODUCT: 'no_matching_product',
  NEW_DEVELOPMENT_SELECTION: 'new_development_selection',
  OPERATION_MAINTENANCE: 'operation_maintenance',
  OTHER: 'other',
} as const;
export type SpuFaqQuestionType =
  (typeof SpuFaqQuestionType)[keyof typeof SpuFaqQuestionType];

export const ProductDocumentType = {
  BROCHURE: 'brochure',
  SPEC_SHEET: 'spec_sheet',
  CERTIFICATE: 'certificate',
  IMAGE: 'image',
  VIDEO: 'video',
  CUSTOMS_DOCS: 'customs_docs',
  QUOTATION: 'quotation',
  OTHER: 'other',
} as const;
export type ProductDocumentType =
  (typeof ProductDocumentType)[keyof typeof ProductDocumentType];

export const ProductDocumentAttributionType = {
  GENERAL: 'general',
  CATEGORY_L1: 'category_l1',
  CATEGORY_L2: 'category_l2',
  CATEGORY_L3: 'category_l3',
  PRODUCT: 'product',
} as const;
export type ProductDocumentAttributionType =
  (typeof ProductDocumentAttributionType)[keyof typeof ProductDocumentAttributionType];

export const PortType = {
  DEPARTURE: '起运港',
  DESTINATION: '目的港',
} as const;
export type PortType = (typeof PortType)[keyof typeof PortType];

export const LogisticsProviderStatus = {
  COOPERATING: '合作',
  ELIMINATED: '淘汰',
} as const;
export type LogisticsProviderStatus =
  (typeof LogisticsProviderStatus)[keyof typeof LogisticsProviderStatus];

// types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message: string;
  code: string;
}

export interface PaginationResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
