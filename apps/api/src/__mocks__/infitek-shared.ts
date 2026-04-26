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

export const SalesOrderStatus = {
  PENDING_SUBMIT: 'pending_submit',
  IN_REVIEW: 'in_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PREPARING: 'preparing',
  PREPARED: 'prepared',
  PARTIALLY_SHIPPED: 'partially_shipped',
  SHIPPED: 'shipped',
  VOIDED: 'voided',
} as const;
export type SalesOrderStatus =
  (typeof SalesOrderStatus)[keyof typeof SalesOrderStatus];

export const SalesOrderType = {
  SALES: 'sales',
  AFTER_SALES: 'after_sales',
  SAMPLE: 'sample',
} as const;
export type SalesOrderType =
  (typeof SalesOrderType)[keyof typeof SalesOrderType];

export const ShippingDemandStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;
export type ShippingDemandStatus =
  (typeof ShippingDemandStatus)[keyof typeof ShippingDemandStatus];

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

export const SupplierStatus = {
  COOPERATING: '合作',
  ELIMINATED: '淘汰',
  TEMPORARY: '临拓',
} as const;
export type SupplierStatus =
  (typeof SupplierStatus)[keyof typeof SupplierStatus];

export const SupplierInvoiceType = {
  NORMAL: '普票',
  VAT_13: '13%专票',
  VAT_7: '7%专票',
  VAT_1: '1%专票',
} as const;
export type SupplierInvoiceType =
  (typeof SupplierInvoiceType)[keyof typeof SupplierInvoiceType];

export const SupplierSettlementType = {
  MONTHLY: '月结',
  BEFORE_SHIPMENT: '发货前结算',
  HALF_MONTHLY: '半月结',
  INVOICE_BASED: '票结',
} as const;
export type SupplierSettlementType =
  (typeof SupplierSettlementType)[keyof typeof SupplierSettlementType];

export const SupplierSettlementDateType = {
  ORDER_DATE: '采购下单日期',
  RECEIPT_DATE: '采购入库日期',
  INVOICE_DATE: '采购开票日期',
} as const;
export type SupplierSettlementDateType =
  (typeof SupplierSettlementDateType)[keyof typeof SupplierSettlementDateType];

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

export const ContractTemplateStatus = {
  PENDING_SUBMIT: 'pending_submit',
  IN_REVIEW: 'in_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  VOIDED: 'voided',
} as const;
export type ContractTemplateStatus =
  (typeof ContractTemplateStatus)[keyof typeof ContractTemplateStatus];

export const DomesticTradeType = {
  DOMESTIC: 'domestic',
  FOREIGN: 'foreign',
} as const;
export type DomesticTradeType =
  (typeof DomesticTradeType)[keyof typeof DomesticTradeType];

export const PaymentTerm = {
  TT_IN_ADVANCE_100: '100_tt_in_advance',
  DEPOSIT_30_BALANCE_70_BEFORE_DELIVERY: '30_deposit_70_balance_before_delivery',
  DEPOSIT_40_BALANCE_60_BEFORE_DELIVERY: '40_deposit_60_balance_before_delivery',
  DEPOSIT_50_BALANCE_50_BEFORE_DELIVERY: '50_deposit_50_balance_before_delivery',
  DEPOSIT_60_BALANCE_40_BEFORE_DELIVERY: '60_deposit_40_balance_before_delivery',
  DEPOSIT_70_BALANCE_30_BEFORE_DELIVERY: '70_deposit_30_balance_before_delivery',
  PAYMENT_100_BEFORE_DELIVERY: '100_payment_before_delivery',
  DEPOSIT_40_BALANCE_60_AGAINST_BL_COPY: '40_deposit_60_balance_against_bl_copy',
  DEPOSIT_50_BALANCE_50_AGAINST_BL_COPY: '50_deposit_50_balance_against_bl_copy',
  DEPOSIT_70_BALANCE_30_AGAINST_BL_COPY: '70_deposit_30_balance_against_bl_copy',
  LC_AT_SIGHT: 'lc_at_sight',
  CAD: 'cad',
  DP_AT_SIGHT: 'dp_at_sight',
  DA_30_DAYS: 'da_30_days',
  OA_30_DAYS: 'oa_30_days',
} as const;
export type PaymentTerm = (typeof PaymentTerm)[keyof typeof PaymentTerm];

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

export const PrimaryIndustry = {
  EDUCATION: 'education',
  GOVERNMENT: 'government',
  MEDICAL: 'medical',
  ENTERPRISE: 'enterprise',
} as const;
export type PrimaryIndustry =
  (typeof PrimaryIndustry)[keyof typeof PrimaryIndustry];

export const SecondaryIndustry = {
  AGRICULTURE_COLLEGE: 'agriculture_college',
  FOOD: 'food',
  ANIMAL_SCIENCE: 'animal_science',
  PHARMACY: 'pharmacy',
  MEDICAL_COLLEGE: 'medical_college',
  PUBLIC_HEALTH: 'public_health',
  LIFE_SCIENCE: 'life_science',
  ENVIRONMENT: 'environment',
} as const;
export type SecondaryIndustry =
  (typeof SecondaryIndustry)[keyof typeof SecondaryIndustry];

export const OrderNature = {
  BIDDING: 'bidding',
  RETAIL: 'retail',
  STOCK_PREPARE: 'stock_prepare',
} as const;
export type OrderNature =
  (typeof OrderNature)[keyof typeof OrderNature];

export const ReceiptStatus = {
  UNPAID: 'unpaid',
  PARTIALLY_PAID: 'partially_paid',
  PAID: 'paid',
} as const;
export type ReceiptStatus =
  (typeof ReceiptStatus)[keyof typeof ReceiptStatus];

export const YesNo = {
  YES: 'yes',
  NO: 'no',
} as const;
export type YesNo = (typeof YesNo)[keyof typeof YesNo];

export const CustomsDeclarationMethod = {
  SELF: 'self',
  ALI_ONE_TOUCH: 'ali_one_touch',
} as const;
export type CustomsDeclarationMethod =
  (typeof CustomsDeclarationMethod)[keyof typeof CustomsDeclarationMethod];

export const ProductLineType = {
  MAIN: 'main',
  OPTIONAL: 'optional',
  STANDARD: 'standard',
  GIFT: 'gift',
} as const;
export type ProductLineType =
  (typeof ProductLineType)[keyof typeof ProductLineType];

export const PlugType = {
  EU: 'eu',
  UK: 'uk',
  US: 'us',
  CN: 'cn',
  OTHER: 'other',
  NONE: 'none',
} as const;
export type PlugType = (typeof PlugType)[keyof typeof PlugType];

export const InvoiceType = {
  VAT_SPECIAL: 'vat_special',
  VAT_NORMAL: 'vat_normal',
} as const;
export type InvoiceType = (typeof InvoiceType)[keyof typeof InvoiceType];

export const BlType = {
  TELEX_RELEASE: 'telex_release',
  ORIGINAL: 'original',
} as const;
export type BlType = (typeof BlType)[keyof typeof BlType];

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
