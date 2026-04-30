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

export const LogisticsOrderStatus = {
  CONFIRMED: 'confirmed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;
export type LogisticsOrderStatus =
  (typeof LogisticsOrderStatus)[keyof typeof LogisticsOrderStatus];

export const PurchaseOrderStatus = {
  PENDING_CONFIRM: 'pending_confirm',
  SUPPLIER_CONFIRMING: 'supplier_confirming',
  PENDING_RECEIPT: 'pending_receipt',
  PARTIALLY_RECEIVED: 'partially_received',
  RECEIVED: 'received',
  INVOICED: 'invoiced',
  CANCELLED: 'cancelled',
} as const;

export type PurchaseOrderStatus =
  (typeof PurchaseOrderStatus)[keyof typeof PurchaseOrderStatus];

export const PurchaseOrderType = {
  REQUISITION: 'requisition',
  STOCK: 'stock',
} as const;

export type PurchaseOrderType =
  (typeof PurchaseOrderType)[keyof typeof PurchaseOrderType];

export const PurchaseOrderApplicationType = {
  STOCK_PURCHASE: 'stock_purchase',
  SALES_REQUISITION: 'sales_requisition',
} as const;

export type PurchaseOrderApplicationType =
  (typeof PurchaseOrderApplicationType)[keyof typeof PurchaseOrderApplicationType];

export const PurchaseOrderDemandType = {
  SALES_ORDER: 'sales_order',
  AFTER_SALES_ORDER: 'after_sales_order',
  EXHIBITION_SAMPLE_ORDER: 'exhibition_sample_order',
} as const;

export type PurchaseOrderDemandType =
  (typeof PurchaseOrderDemandType)[keyof typeof PurchaseOrderDemandType];

export const PurchaseOrderSettlementDateType = {
  ORDER_DATE: 'order_date',
  RECEIPT_DATE: 'receipt_date',
  INVOICE_DATE: 'invoice_date',
} as const;

export type PurchaseOrderSettlementDateType =
  (typeof PurchaseOrderSettlementDateType)[keyof typeof PurchaseOrderSettlementDateType];

export const PurchaseOrderSettlementType = {
  MONTHLY: 'monthly',
  HALF_MONTHLY: 'half_monthly',
  INVOICE_BASED: 'invoice_based',
} as const;

export type PurchaseOrderSettlementType =
  (typeof PurchaseOrderSettlementType)[keyof typeof PurchaseOrderSettlementType];

export const PurchaseOrderReceiptStatus = {
  NOT_RECEIVED: 'not_received',
  PARTIALLY_RECEIVED: 'partially_received',
  RECEIVED: 'received',
} as const;

export type PurchaseOrderReceiptStatus =
  (typeof PurchaseOrderReceiptStatus)[keyof typeof PurchaseOrderReceiptStatus];

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

export const SalesOrderSource = {
  MANUAL: 'manual',
  THIRD_PARTY: 'third_party',
} as const;
export type SalesOrderSource =
  (typeof SalesOrderSource)[keyof typeof SalesOrderSource];

export const ShippingDemandStatus = {
  PENDING_ALLOCATION: 'pending_allocation',
  PENDING_PURCHASE_ORDER: 'pending_purchase_order',
  PURCHASING: 'purchasing',
  PREPARED: 'prepared',
  PARTIALLY_SHIPPED: 'partially_shipped',
  SHIPPED: 'shipped',
  VOIDED: 'voided',
} as const;
export type ShippingDemandStatus =
  (typeof ShippingDemandStatus)[keyof typeof ShippingDemandStatus];

export const ShippingDemandAllocationStatus = {
  ACTIVE: 'active',
  RELEASED: 'released',
  SHIPPED: 'shipped',
} as const;
export type ShippingDemandAllocationStatus =
  (typeof ShippingDemandAllocationStatus)[keyof typeof ShippingDemandAllocationStatus];

export const FulfillmentType = {
  FULL_PURCHASE: 'full_purchase',
  PARTIAL_PURCHASE: 'partial_purchase',
  USE_STOCK: 'use_stock',
} as const;
export type FulfillmentType =
  (typeof FulfillmentType)[keyof typeof FulfillmentType];

export const InventoryBatchSourceType = {
  INITIAL: 'initial',
  PURCHASE_RECEIPT: 'purchase_receipt',
} as const;
export type InventoryBatchSourceType =
  (typeof InventoryBatchSourceType)[keyof typeof InventoryBatchSourceType];

export const InventoryChangeType = {
  INITIAL: 'initial',
  PURCHASE_RECEIPT: 'purchase_receipt',
  OUTBOUND: 'outbound',
  LOCK: 'lock',
  UNLOCK: 'unlock',
} as const;
export type InventoryChangeType =
  (typeof InventoryChangeType)[keyof typeof InventoryChangeType];

export const ReceiptOrderStatus = {
  CONFIRMED: 'confirmed',
} as const;
export type ReceiptOrderStatus =
  (typeof ReceiptOrderStatus)[keyof typeof ReceiptOrderStatus];

export const ReceiptOrderType = {
  PURCHASE_RECEIPT: 'purchase_receipt',
  SALES_RETURN_RECEIPT: 'sales_return_receipt',
  SALES_EXCHANGE_RECEIPT: 'sales_exchange_receipt',
  OPENING_RECEIPT: 'opening_receipt',
  SUPPLIER_GIFT_RECEIPT: 'supplier_gift_receipt',
  TRANSFER_RECEIPT: 'transfer_receipt',
  INVENTORY_GAIN_RECEIPT: 'inventory_gain_receipt',
  OTHER: 'other',
} as const;
export type ReceiptOrderType =
  (typeof ReceiptOrderType)[keyof typeof ReceiptOrderType];

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
export type WarehouseType = (typeof WarehouseType)[keyof typeof WarehouseType];

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
  DEPOSIT_30_BALANCE_70_BEFORE_DELIVERY:
    '30_deposit_70_balance_before_delivery',
  DEPOSIT_40_BALANCE_60_BEFORE_DELIVERY:
    '40_deposit_60_balance_before_delivery',
  DEPOSIT_50_BALANCE_50_BEFORE_DELIVERY:
    '50_deposit_50_balance_before_delivery',
  DEPOSIT_60_BALANCE_40_BEFORE_DELIVERY:
    '60_deposit_40_balance_before_delivery',
  DEPOSIT_70_BALANCE_30_BEFORE_DELIVERY:
    '70_deposit_30_balance_before_delivery',
  PAYMENT_100_BEFORE_DELIVERY: '100_payment_before_delivery',
  DEPOSIT_40_BALANCE_60_AGAINST_BL_COPY:
    '40_deposit_60_balance_against_bl_copy',
  DEPOSIT_50_BALANCE_50_AGAINST_BL_COPY:
    '50_deposit_50_balance_against_bl_copy',
  DEPOSIT_70_BALANCE_30_AGAINST_BL_COPY:
    '70_deposit_30_balance_against_bl_copy',
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
export type OrderNature = (typeof OrderNature)[keyof typeof OrderNature];

export const ReceiptStatus = {
  UNPAID: 'unpaid',
  PARTIALLY_PAID: 'partially_paid',
  PAID: 'paid',
} as const;
export type ReceiptStatus = (typeof ReceiptStatus)[keyof typeof ReceiptStatus];

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

export const OPERATION_LOG_CREATE_SUMMARY_FIELD = '__create__';
export const OPERATION_LOG_CREATE_SUMMARY_LABEL = '新增数据';
export const OPERATION_LOG_CREATE_SUMMARY_VALUE = '已新增';

export const COMMON_OPERATION_LOG_FIELD_LABELS: Record<string, string> = {
  id: '编号',
  code: '编码',
  name: '名称',
  nameCn: '中文名称',
  nameEn: '英文名称',
  username: '用户名',
  status: '状态',
  address: '地址',
  contactPerson: '联系人',
  contactPhone: '联系电话',
  contactEmail: '联系邮箱',
  createdAt: '创建时间',
  updatedAt: '更新时间',
  createdBy: '创建人',
  updatedBy: '更新人',
  remarks: '备注',
  description: '描述',
  content: '内容',
  countryId: '国家/地区',
  countryName: '国家/地区',
  fileKey: '附件',
  fileName: '附件名称',
  fileUrl: '附件链接',
};

export const RESOURCE_OPERATION_LOG_FIELD_LABELS: Record<
  string,
  Record<string, string>
> = {
  users: {
    username: '用户名',
    name: '姓名',
    password: '登录密码',
    status: '状态',
  },
  customers: {
    customerCode: '客户编码',
    customerName: '客户名称',
    salespersonId: '销售员',
    salespersonName: '销售员',
    contactPerson: '联系人',
    contactPhone: '联系电话',
    contactEmail: '联系邮箱',
    billingRequirements: '开票要求',
    address: '地址',
  },
  companies: {
    nameCn: '公司中文名',
    nameEn: '公司英文名',
    abbreviation: '简称',
    signingLocation: '签约地',
    bankName: '开户行',
    bankAccount: '银行账号',
    swiftCode: 'SWIFT',
    defaultCurrencyCode: '默认币种编码',
    defaultCurrencyName: '默认币种',
    taxId: '税号',
    customsCode: '海关编码',
    quarantineCode: '检疫编码',
    addressCn: '中文地址',
    addressEn: '英文地址',
    contactPerson: '联系人',
    contactPhone: '联系电话',
    chiefAccountantId: '负责人',
    chiefAccountantName: '负责人',
  },
  warehouses: {
    name: '仓库名称',
    warehouseCode: '仓库编码',
    warehouseType: '仓库类型',
    supplierId: '供应商',
    supplierName: '供应商',
    address: '地址',
    defaultShipProvince: '默认发货省份',
    defaultShipCity: '默认发货城市',
    ownership: '权属',
    isVirtual: '虚拟仓',
    status: '状态',
  },
  suppliers: {
    name: '供应商名称',
    shortName: '简称',
    supplierCode: '供应商编码',
    contactPerson: '联系人',
    contactPhone: '联系电话',
    contactEmail: '联系邮箱',
    address: '地址',
    status: '状态',
    supplierLevel: '供应商等级',
    invoiceType: '发票类型',
    origin: '来源',
    annualRebateEnabled: '年返启用',
    contractFrameworkFile: '框架合同文件',
    contractTemplateName: '合同模板',
    annualRebateNote: '年返说明',
    contractTerms: '合同条款',
    paymentTerms: '结算条款',
  },
  spus: {
    spuCode: 'SPU 编码',
    name: 'SPU 名称',
    categoryId: '分类',
    categoryLevel1Id: '一级分类',
    categoryLevel2Id: '二级分类',
    categoryLevel3Code: '三级分类编码',
    unit: '单位',
    manufacturerModel: '厂家型号',
    customerWarrantyMonths: '客户质保(月)',
    purchaseWarrantyMonths: '采购质保(月)',
    supplierWarrantyNote: '供应商保修说明',
    forbiddenCountries: '禁售国家',
    invoiceName: '开票品名',
    invoiceUnit: '开票单位',
    invoiceModel: '开票型号',
    supplierName: '供应商',
    companyId: '合作主体',
  },
  skus: {
    skuCode: 'SKU 编码',
    spuId: 'SPU',
    unitId: '单位',
    nameCn: '中文名称',
    nameEn: '英文名称',
    specification: '规格',
    status: '状态',
    productType: '产品类型',
    productModel: '产品型号',
    accessoryParentSkuId: '配件母 SKU',
    categoryLevel1Id: '一级分类',
    categoryLevel2Id: '二级分类',
    categoryLevel3Id: '三级分类',
    principle: '原理',
    productUsage: '产品用途',
    coreParams: '核心参数',
    electricalParams: '电气参数',
    material: '材质',
    hasPlug: '是否带插头',
    specialAttributes: '特殊属性',
    specialAttributesNote: '特殊属性说明',
    customerWarrantyMonths: '客户质保(月)',
    forbiddenCountries: '禁售国家',
    weightKg: '净重(kg)',
    grossWeightKg: '毛重(kg)',
    lengthCm: '长(cm)',
    widthCm: '宽(cm)',
    heightCm: '高(cm)',
    volumeCbm: '体积(cbm)',
    packagingType: '包装类型',
    packagingQty: '装箱数量',
    packagingInfo: '包装信息',
    packagingList: '包装清单',
    hsCode: 'HS 编码',
    customsNameCn: '报关中文名',
    customsNameEn: '报关英文名',
    declaredValueRef: '申报价参考',
    declarationElements: '申报要素',
    isInspectionRequired: '是否商检',
    regulatoryConditions: '监管条件',
    taxRefundRate: '退税率',
    customsInfoMaintained: '报关信息已维护',
    productImageUrl: '产品图片',
    productImageUrls: '产品图片',
  },
  certificates: {
    certificateNo: '证书编号',
    certificateName: '证书名称',
    certificateType: '证书类型',
    directive: '指令法规',
    issueDate: '签发日期',
    validFrom: '生效日期',
    validUntil: '失效日期',
    issuingAuthority: '发证机构',
    remarks: '备注',
    attributionType: '归属类型',
    categoryId: '分类',
    spuIds: '关联 SPU',
  },
  'product-documents': {
    documentName: '资料名称',
    documentType: '资料类型',
    content: '内容',
    attributionType: '归属类型',
    countryId: '国家/地区',
    categoryLevel1Id: '一级分类',
    categoryLevel2Id: '二级分类',
    categoryLevel3Id: '三级分类',
    spuId: 'SPU',
  },
  units: {
    code: '单位编码',
    name: '单位名称',
    status: '状态',
  },
  'contract-templates': {
    name: '模板名称',
    templateFileKey: '模板文件',
    templateFileName: '模板文件名',
    description: '描述',
    content: '条款内容',
    isDefault: '默认模板',
    requiresLegalReview: '需要法务审核',
    status: '状态',
    usageCount: '使用次数',
  },
  countries: {
    code: '国家/地区代码',
    name: '中文名称',
    nameEn: '英文名称',
    abbreviation: '简称',
  },
  currencies: {
    code: '币种代码',
    name: '币种名称',
    symbol: '币种符号',
    isBaseCurrency: '本位币',
    status: '状态',
  },
  'logistics-providers': {
    name: '物流商名称',
    providerCode: '物流商编码',
    shortName: '简称',
    contactPerson: '联系人',
    contactPhone: '联系电话',
    contactEmail: '联系邮箱',
    address: '地址',
    status: '状态',
    providerLevel: '服务等级',
    defaultCompanyId: '默认合作主体',
    defaultCompanyName: '默认合作主体',
  },
  ports: {
    portType: '港口类型',
    portCode: '港口编码',
    nameCn: '中文名称',
    nameEn: '英文名称',
  },
  'sales-orders': {
    erpSalesOrderCode: 'ERP销售订单号',
    domesticTradeType: '内外销',
    externalOrderCode: '订单号',
    orderType: '订单类型',
    customerId: '客户',
    customerName: '客户',
    customerCode: '客户代码',
    customerContactPerson: '联系人',
    afterSalesSourceOrderId: '售后原订单号',
    afterSalesSourceOrderCode: '售后原订单号',
    afterSalesProductSummary: '所有售后产品品名及对应总价',
    destinationCountryId: '运抵国',
    destinationCountryName: '运抵国',
    paymentTerm: '付款方式',
    shipmentOriginCountryId: '起运地',
    shipmentOriginCountryName: '起运地',
    signingCompanyId: '签约公司',
    signingCompanyName: '签约公司',
    salespersonId: '销售员',
    salespersonName: '销售员',
    otherIndustryNote: '其他行业说明',
    currencyId: '外销币种',
    currencyCode: '外销币种',
    currencyName: '币种名称',
    currencySymbol: '币种符号',
    tradeTerm: '贸易术语',
    destinationPortId: '目的地',
    destinationPortName: '目的地',
    bankAccount: '银行账号',
    extraViewerId: '额外查看人',
    extraViewerName: '额外查看人',
    primaryIndustry: '一级行业',
    exchangeRate: '汇率',
    transportationMethod: '运输方式',
    crmSignedAt: 'CRM签约日期',
    contractAmount: '合同金额',
    orderNature: '订单性质',
    secondaryIndustry: '二级行业',
    receiptStatus: '收款状态',
    status: '订单状态',
    contractFileKeys: 'PI&SC合同文件',
    contractFileNames: 'PI&SC合同文件',
    receivedAmount: '已收款金额',
    merchandiserId: '商务跟单',
    merchandiserName: '商务跟单',
    merchandiserAbbr: '商务跟单英文简写',
    outstandingAmount: '待收款金额',
    requiredDeliveryAt: '要求到货日期',
    isSharedOrder: '是否分摊订单',
    isSinosure: '是否中信保',
    isPalletized: '是否打托',
    requiresCustomsCertificate: '是否需要清关证书',
    isSplitInAdvance: '是否提前分单',
    usesMarketingFund: '是否使用市场经费',
    requiresExportCustoms: '是否出口报关',
    requiresWarrantyCard: '是否需要质保卡',
    requiresMaternityHandover: '是否产假交接单',
    customsDeclarationMethod: '报关方式',
    plugPhotoKeys: '插头照片',
    isInsured: '是否投保',
    isAliTradeAssurance: '是否阿里信保订单',
    aliTradeAssuranceOrderCode: '阿里信保订单号',
    forwarderQuoteNote: '询价货代及费用',
    consigneeCompany: '收货人公司(Consignee)',
    consigneeOtherInfo: '收货人其他信息',
    notifyCompany: '通知人公司(Notify)',
    notifyOtherInfo: '通知人其他信息',
    shipperCompany: '发货人公司(Shipper)',
    shipperOtherInfoCompanyId: '发货人其他信息',
    shipperOtherInfoCompanyName: '发货人其他信息',
    domesticCustomerCompany: '客户公司',
    domesticCustomerDeliveryInfo: '客户收货信息',
    usesDefaultShippingMark: '是否公司常规唛头',
    shippingMarkNote: '唛头补充信息',
    shippingMarkTemplateKey: '唛头模板',
    needsInvoice: '客户是否需要开票',
    invoiceType: '开票类型',
    shippingDocumentsNote: '随货文件',
    blType: '签单/出提单方式',
    originalMailAddress: '正本邮寄地址',
    businessRectificationNote: '业务整改要求',
    customsDocumentNote: '清关单据要求',
    otherRequirementNote: '其他要求及注意事项',
    productTotalAmount: '产品总金额',
    expenseTotalAmount: '加项费用总金额',
    totalAmount: '总金额',
    items: '产品明细',
    expenses: '加项费用',
  },
  'shipping-demands': {
    afterSalesProductSummary: '所有售后产品品名及对应总价',
    items: '产品明细',
  },
};

export function resolveOperationLogFieldLabel(
  resourceType: string,
  field: string,
  fallback?: string | null,
) {
  return (
    RESOURCE_OPERATION_LOG_FIELD_LABELS[resourceType]?.[field] ??
    COMMON_OPERATION_LOG_FIELD_LABELS[field] ??
    fallback ??
    field
  );
}

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
