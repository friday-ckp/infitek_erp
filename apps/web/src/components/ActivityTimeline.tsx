import { Skeleton } from 'antd';
import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import {
  OPERATION_LOG_CREATE_SUMMARY_FIELD,
  OPERATION_LOG_CREATE_SUMMARY_LABEL,
  resolveOperationLogFieldLabel,
} from '@infitek/shared';
import { getCompanyById } from '../api/companies.api';
import { CONTRACT_TEMPLATE_STATUS_LABELS } from '../api/contract-templates.api';
import { getCountryById } from '../api/countries.api';
import { getCurrencyById } from '../api/currencies.api';
import { getCustomerById } from '../api/customers.api';
import { ATTRIBUTION_TYPE_LABELS, DOCUMENT_TYPE_LABELS } from '../api/product-documents.api';
import {
  getOperationLogs,
  type OperationLogAction,
  type OperationLogChangeItem,
} from '../api/operation-logs.api';
import { getPortById } from '../api/ports.api';
import { getProductCategoryById } from '../api/product-categories.api';
import { getSkuById } from '../api/skus.api';
import { getSpuById } from '../api/spus.api';
import { getSupplierById } from '../api/suppliers.api';
import { getUnitById } from '../api/units.api';
import { getUserById } from '../api/users.api';
import { OperationTimeline } from '../pages/master-data/components/page-scaffold';

const DISPLAY_COMPANION_FIELDS: Record<string, string> = {
  countryId: 'countryName',
  salesOrderId: 'sourceDocumentCode',
  salespersonId: 'salespersonName',
  supplierId: 'supplierName',
  defaultCompanyId: 'defaultCompanyName',
  chiefAccountantId: 'chiefAccountantName',
  companyId: 'companyName',
  customerId: 'customerName',
  destinationCountryId: 'destinationCountryName',
  shipmentOriginCountryId: 'shipmentOriginCountryName',
  signingCompanyId: 'signingCompanyName',
  currencyId: 'currencyName',
  destinationPortId: 'destinationPortName',
  extraViewerId: 'extraViewerName',
  merchandiserId: 'merchandiserName',
  shipperOtherInfoCompanyId: 'shipperOtherInfoCompanyName',
};


const BOOLEAN_FIELDS = new Set([
  'isDefault',
  'requiresLegalReview',
  'isBaseCurrency',
  'isVirtual',
  'annualRebateEnabled',
  'hasPlug',
  'isInspectionRequired',
  'customsInfoMaintained',
  'isSharedOrder',
  'isSinosure',
  'isPalletized',
  'requiresCustomsCertificate',
  'isSplitInAdvance',
  'usesMarketingFund',
  'requiresExportCustoms',
  'requiresWarrantyCard',
  'requiresMaternityHandover',
  'isInsured',
  'isAliTradeAssurance',
  'usesDefaultShippingMark',
  'needsInvoice',
]);

const ENUM_VALUE_LABELS: Record<string, Record<string, string>> = {
  status: {
    active: '启用',
    inactive: '停用',
    valid: '有效',
    expired: '已过期',
    cooperating: '合作',
    eliminated: '淘汰',
    pending_submit: '待提交',
    in_review: '审核中',
    approved: '审核通过',
    rejected: '已拒绝',
    voided: '已作废',
    pending_allocation: '待分配库存',
    purchasing: '采购中',
    enabled: '启用',
    disabled: '停用',
    ACTIVE: '启用',
    INACTIVE: '停用',
  },
  documentType: DOCUMENT_TYPE_LABELS,
  attributionType: {
    ...ATTRIBUTION_TYPE_LABELS,
    通用归属: '通用归属',
    产品SPU归属: '产品 SPU 归属',
    产品分类归属: '产品分类归属',
  },
  portType: {
    起运港: '起运港',
    目的港: '目的港',
  },
  action: {
    CREATE: '新增',
    UPDATE: '更新',
    DELETE: '删除',
  },
  questionType: {
    recommended_selection: '推荐选型',
    information_providing: '资料提供',
    general_knowledge: '通识类',
    product_advantages: '产品优势',
    functional_parameters: '功能参数',
    solution: '解决方案',
    configuration_info: '配置信息',
    product_customization: '产品定制',
    no_matching_product: '无匹配产品',
    new_development_selection: '新拓选型',
    operation_maintenance: '操作维护',
    other: '其它类型',
  },
  productType: {
    主品: '主品',
    配件: '配件',
    耗材: '耗材',
  },
  warehouseType: {
    成品仓: '成品仓',
    原料仓: '原料仓',
    中转仓: '中转仓',
    退货仓: '退货仓',
  },
  ownership: {
    INTERNAL: '自有',
    EXTERNAL: '外协',
    INTERNAL_LEASED: '自有租赁',
    EXTERNAL_LEASED: '外部租赁',
    自有: '自有',
    外协: '外协',
  },
  certificateType: {
    CE: 'CE',
    FDA: 'FDA',
    'IEC第三方检测报告': 'IEC 第三方检测报告',
    DOC: 'DOC',
    IS09001: 'ISO9001',
    ISO14001: 'ISO14001',
    ISO45001: 'ISO45001',
    ISO13485: 'ISO13485',
    其它: '其它',
  },
  orderSource: {
    manual: '手工创建',
    third_party: '第三方导入',
  },
  domesticTradeType: {
    domestic: '内销',
    foreign: '外销',
  },
  orderType: {
    sales: '销售订单',
    after_sales: '售后订单',
    sample: '样品订单',
  },
  paymentTerm: {
    '100_tt_in_advance': '100% TT预付',
    '30_deposit_70_balance_before_delivery': '30%定金 + 70%发货前付清',
    '40_deposit_60_balance_before_delivery': '40%定金 + 60%发货前付清',
    '50_deposit_50_balance_before_delivery': '50%定金 + 50%发货前付清',
    '60_deposit_40_balance_before_delivery': '60%定金 + 40%发货前付清',
    '70_deposit_30_balance_before_delivery': '70%定金 + 30%发货前付清',
    '100_payment_before_delivery': '100%发货前付清',
    '40_deposit_60_balance_against_bl_copy': '40%定金 + 60%见提单副本付清',
    '50_deposit_50_balance_against_bl_copy': '50%定金 + 50%见提单副本付清',
    '70_deposit_30_balance_against_bl_copy': '70%定金 + 30%见提单副本付清',
    lc_at_sight: '即期信用证',
    cad: '交单付款(CAD)',
    dp_at_sight: '即期付款交单(D/P)',
    da_30_days: '30天承兑交单(D/A)',
    oa_30_days: '30天赊账(OA)',
  },
  tradeTerm: {
    EXW: 'EXW 工厂交货',
    FCA: 'FCA 货交承运人',
    FOB: 'FOB 船上交货',
    CFR: 'CFR 成本加运费',
    CIF: 'CIF 成本保险加运费',
    CIP: 'CIP 运费保险费付至',
    CPT: 'CPT 运费付至',
  },
  transportationMethod: {
    sea: '海运',
    air: '空运',
    road: '陆运',
    rail: '铁路',
    express: '快递',
    other: '其它',
  },
  primaryIndustry: {
    education: '教育',
    government: '政府',
    medical: '医疗',
    enterprise: '企业',
  },
  secondaryIndustry: {
    agriculture_college: '农学院',
    food: '食品',
    animal_science: '动物科学',
    pharmacy: '药学',
    medical_college: '医学院',
    public_health: '公共卫生',
    life_science: '生命科学',
    environment: '环境',
  },
  orderNature: {
    bidding: '招投标',
    retail: '零售',
    stock_prepare: '备货',
  },
  receiptStatus: {
    unpaid: '未收款',
    partially_paid: '部分收款',
    paid: '已收款',
  },
  customsDeclarationMethod: {
    self: '自理报关',
    ali_one_touch: '一达通',
  },
  invoiceType: {
    vat_special: '增值税专票',
    vat_normal: '增值税普票',
  },
  blType: {
    telex_release: '电放',
    original: '正本',
  },
};

const RESOURCE_ENUM_VALUE_LABELS: Record<string, Record<string, Record<string, string>>> = {
  currencies: {
    status: {
      enabled: '启用',
      disabled: '停用',
    },
  },
  units: {
    status: {
      enabled: '启用',
      disabled: '停用',
    },
  },
  warehouses: {
    status: {
      active: '启用',
      inactive: '停用',
    },
  },
  certificates: {
    status: {
      valid: '有效',
      expired: '已过期',
    },
    attributionType: {
      通用归属: '通用归属',
      产品SPU归属: '产品 SPU 归属',
      产品分类归属: '产品分类归属',
    },
  },
  'product-documents': {
    attributionType: ATTRIBUTION_TYPE_LABELS,
    documentType: DOCUMENT_TYPE_LABELS,
  },
  'contract-templates': {
    status: CONTRACT_TEMPLATE_STATUS_LABELS,
  },
  'logistics-providers': {
    status: {
      合作: '合作',
      淘汰: '淘汰',
    },
  },
  'sales-orders': {
    orderSource: {
      manual: '手工创建',
      third_party: '第三方导入',
    },
    domesticTradeType: {
      domestic: '内销',
      foreign: '外销',
    },
    orderType: {
      sales: '销售订单',
      after_sales: '售后订单',
      sample: '样品订单',
    },
    sourceDocumentType: {
      sales_order: '销售订单',
    },
    paymentTerm: {
      '100_tt_in_advance': '100% TT预付',
      '30_deposit_70_balance_before_delivery': '30%定金 + 70%发货前付清',
      '40_deposit_60_balance_before_delivery': '40%定金 + 60%发货前付清',
      '50_deposit_50_balance_before_delivery': '50%定金 + 50%发货前付清',
      '60_deposit_40_balance_before_delivery': '60%定金 + 40%发货前付清',
      '70_deposit_30_balance_before_delivery': '70%定金 + 30%发货前付清',
      '100_payment_before_delivery': '100%发货前付清',
      '40_deposit_60_against_bl_copy': '40%定金 + 60%见提单副本付清',
      '50_deposit_50_against_bl_copy': '50%定金 + 50%见提单副本付清',
      '70_deposit_30_against_bl_copy': '70%定金 + 30%见提单副本付清',
      lc_at_sight: '即期信用证',
      cad: '交单付款(CAD)',
      dp_at_sight: '即期付款交单(D/P)',
      da_30_days: '30天承兑交单(D/A)',
      oa_30_days: '30天赊账(OA)',
    },
    tradeTerm: {
      EXW: 'EXW 工厂交货',
      FCA: 'FCA 货交承运人',
      FOB: 'FOB 船上交货',
      CFR: 'CFR 成本加运费',
      CIF: 'CIF 成本保险加运费',
      CIP: 'CIP 运费保险费付至',
      CPT: 'CPT 运费付至',
    },
    transportationMethod: {
      sea: '海运',
      air: '空运',
      road: '陆运',
      rail: '铁路',
      express: '快递',
      other: '其它',
    },
    primaryIndustry: {
      education: '教育',
      government: '政府',
      medical: '医疗',
      enterprise: '企业',
    },
    secondaryIndustry: {
      agriculture_college: '农学院',
      food: '食品',
      animal_science: '动物科学',
      pharmacy: '药学',
      medical_college: '医学院',
      public_health: '公共卫生',
      life_science: '生命科学',
      environment: '环境',
    },
    orderNature: {
      bidding: '招投标',
      retail: '零售',
      stock_prepare: '备货',
    },
    receiptStatus: {
      unpaid: '未收款',
      partially_paid: '部分收款',
      paid: '已收款',
    },
    status: {
      pending_submit: '待提交',
      in_review: '审核中',
      approved: '审核通过',
      rejected: '已拒绝',
      preparing: '备货中',
      prepared: '已备货',
      partially_shipped: '部分发货',
      shipped: '已发货',
      voided: '已作废',
    },
    customsDeclarationMethod: {
      self: '自理报关',
      ali_one_touch: '一达通',
    },
    invoiceType: {
      vat_special: '增值税专票',
      vat_normal: '增值税普票',
    },
    blType: {
      telex_release: '电放',
      original: '正本',
    },
    isSharedOrder: {
      yes: '是',
      no: '否',
    },
    isSinosure: {
      yes: '是',
      no: '否',
    },
    isPalletized: {
      yes: '是',
      no: '否',
    },
    requiresCustomsCertificate: {
      yes: '是',
      no: '否',
    },
    isSplitInAdvance: {
      yes: '是',
      no: '否',
    },
    usesMarketingFund: {
      yes: '是',
      no: '否',
    },
    requiresExportCustoms: {
      yes: '是',
      no: '否',
    },
    requiresWarrantyCard: {
      yes: '是',
      no: '否',
    },
    requiresMaternityHandover: {
      yes: '是',
      no: '否',
    },
    isInsured: {
      yes: '是',
      no: '否',
    },
    isAliTradeAssurance: {
      yes: '是',
      no: '否',
    },
    usesDefaultShippingMark: {
      yes: '是',
      no: '否',
    },
    needsInvoice: {
      yes: '是',
      no: '否',
    },
  },
  'shipping-demands': {
    sourceDocumentType: {
      sales_order: '销售订单',
    },
    orderType: {
      sales: '销售订单',
      after_sales: '售后订单',
      sample: '样品订单',
    },
    domesticTradeType: {
      domestic: '内销',
      foreign: '外销',
    },
    status: {
      pending_allocation: '待分配库存',
      purchasing: '采购中',
      prepared: '备货完成',
      partially_shipped: '部分发货',
      shipped: '已发货',
      voided: '已作废',
    },
    paymentTerm: {
      '100_tt_in_advance': '100% TT预付',
      '30_deposit_70_balance_before_delivery': '30%定金 + 70%发货前付清',
      '40_deposit_60_balance_before_delivery': '40%定金 + 60%发货前付清',
      '50_deposit_50_balance_before_delivery': '50%定金 + 50%发货前付清',
      '60_deposit_40_balance_before_delivery': '60%定金 + 40%发货前付清',
      '70_deposit_30_balance_before_delivery': '70%定金 + 30%发货前付清',
      '100_payment_before_delivery': '100%发货前付清',
      '40_deposit_60_balance_against_bl_copy': '40%定金 + 60%见提单副本付清',
      '50_deposit_50_balance_against_bl_copy': '50%定金 + 50%见提单副本付清',
      '70_deposit_30_balance_against_bl_copy': '70%定金 + 30%见提单副本付清',
      lc_at_sight: '即期信用证',
      cad: '交单付款(CAD)',
      dp_at_sight: '即期付款交单(D/P)',
      da_30_days: '30天承兑交单(D/A)',
      oa_30_days: '30天赊账(OA)',
    },
    tradeTerm: {
      EXW: 'EXW 工厂交货',
      FCA: 'FCA 货交承运人',
      FOB: 'FOB 船上交货',
      CFR: 'CFR 成本加运费',
      CIF: 'CIF 成本保险加运费',
      CIP: 'CIP 运费保险费付至',
      CPT: 'CPT 运费付至',
    },
    transportationMethod: {
      sea: '海运',
      air: '空运',
      road: '陆运',
      rail: '铁路',
      express: '快递',
      other: '其它',
    },
    orderNature: {
      bidding: '招投标',
      retail: '零售',
      stock_prepare: '备货',
    },
    receiptStatus: {
      unpaid: '未收款',
      partially_paid: '部分收款',
      paid: '已收款',
    },
    isSharedOrder: {
      yes: '是',
      no: '否',
    },
    isSinosure: {
      yes: '是',
      no: '否',
    },
    isPalletized: {
      yes: '是',
      no: '否',
    },
    requiresCustomsCertificate: {
      yes: '是',
      no: '否',
    },
    usesMarketingFund: {
      yes: '是',
      no: '否',
    },
    requiresExportCustoms: {
      yes: '是',
      no: '否',
    },
    requiresWarrantyCard: {
      yes: '是',
      no: '否',
    },
    isInsured: {
      yes: '是',
      no: '否',
    },
    isAliTradeAssurance: {
      yes: '是',
      no: '否',
    },
  },
};

type LookupRequest = {
  cacheKey: string;
  queryKey: Array<string | number>;
  queryFn: () => Promise<string | null>;
};

type FieldLookupResolver = {
  resolveId: (value: unknown) => string | null;
  buildRequest: (id: string) => LookupRequest;
};

function normalizeLookupId(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized ? normalized : null;
  }

  return null;
}

async function safeLoadLabel(loader: () => Promise<string | null>) {
  try {
    return await loader();
  } catch {
    return null;
  }
}

const FIELD_LOOKUP_RESOLVERS: Record<string, FieldLookupResolver> = {
  countryId: {
    resolveId: normalizeLookupId,
    buildRequest: (id) => ({
      cacheKey: `country:${id}`,
      queryKey: ['audit-lookup', 'country', id],
      queryFn: () => safeLoadLabel(async () => (await getCountryById(Number(id))).name),
    }),
  },
  destinationCountryId: {
    resolveId: normalizeLookupId,
    buildRequest: (id) => ({
      cacheKey: `country:${id}`,
      queryKey: ['audit-lookup', 'country', id],
      queryFn: () => safeLoadLabel(async () => (await getCountryById(Number(id))).name),
    }),
  },
  shipmentOriginCountryId: {
    resolveId: normalizeLookupId,
    buildRequest: (id) => ({
      cacheKey: `country:${id}`,
      queryKey: ['audit-lookup', 'country', id],
      queryFn: () => safeLoadLabel(async () => (await getCountryById(Number(id))).name),
    }),
  },
  salespersonId: {
    resolveId: normalizeLookupId,
    buildRequest: (id) => ({
      cacheKey: `user:${id}`,
      queryKey: ['audit-lookup', 'user', id],
      queryFn: () =>
        safeLoadLabel(async () => {
          const user = await getUserById(id);
          return user.name || user.username || null;
        }),
    }),
  },
  extraViewerId: {
    resolveId: normalizeLookupId,
    buildRequest: (id) => ({
      cacheKey: `user:${id}`,
      queryKey: ['audit-lookup', 'user', id],
      queryFn: () =>
        safeLoadLabel(async () => {
          const user = await getUserById(id);
          return user.name || user.username || null;
        }),
    }),
  },
  merchandiserId: {
    resolveId: normalizeLookupId,
    buildRequest: (id) => ({
      cacheKey: `user:${id}`,
      queryKey: ['audit-lookup', 'user', id],
      queryFn: () =>
        safeLoadLabel(async () => {
          const user = await getUserById(id);
          return user.name || user.username || null;
        }),
    }),
  },
  chiefAccountantId: {
    resolveId: normalizeLookupId,
    buildRequest: (id) => ({
      cacheKey: `user:${id}`,
      queryKey: ['audit-lookup', 'user', id],
      queryFn: () =>
        safeLoadLabel(async () => {
          const user = await getUserById(id);
          return user.name || user.username || null;
        }),
    }),
  },
  unitId: {
    resolveId: normalizeLookupId,
    buildRequest: (id) => ({
      cacheKey: `unit:${id}`,
      queryKey: ['audit-lookup', 'unit', id],
      queryFn: () => safeLoadLabel(async () => (await getUnitById(Number(id))).name),
    }),
  },
  spuId: {
    resolveId: normalizeLookupId,
    buildRequest: (id) => ({
      cacheKey: `spu:${id}`,
      queryKey: ['audit-lookup', 'spu', id],
      queryFn: () =>
        safeLoadLabel(async () => {
          const spu = await getSpuById(Number(id));
          return spu.name ? `${spu.spuCode} / ${spu.name}` : spu.spuCode;
        }),
    }),
  },
  accessoryParentSkuId: {
    resolveId: normalizeLookupId,
    buildRequest: (id) => ({
      cacheKey: `sku:${id}`,
      queryKey: ['audit-lookup', 'sku', id],
      queryFn: () =>
        safeLoadLabel(async () => {
          const sku = await getSkuById(Number(id));
          return sku.nameCn ? `${sku.skuCode} / ${sku.nameCn}` : sku.skuCode;
        }),
    }),
  },
  supplierId: {
    resolveId: normalizeLookupId,
    buildRequest: (id) => ({
      cacheKey: `supplier:${id}`,
      queryKey: ['audit-lookup', 'supplier', id],
      queryFn: () => safeLoadLabel(async () => (await getSupplierById(Number(id))).name),
    }),
  },
  customerId: {
    resolveId: normalizeLookupId,
    buildRequest: (id) => ({
      cacheKey: `customer:${id}`,
      queryKey: ['audit-lookup', 'customer', id],
      queryFn: () => safeLoadLabel(async () => (await getCustomerById(Number(id))).customerName),
    }),
  },
  companyId: {
    resolveId: normalizeLookupId,
    buildRequest: (id) => ({
      cacheKey: `company:${id}`,
      queryKey: ['audit-lookup', 'company', id],
      queryFn: () => safeLoadLabel(async () => (await getCompanyById(Number(id))).nameCn),
    }),
  },
  signingCompanyId: {
    resolveId: normalizeLookupId,
    buildRequest: (id) => ({
      cacheKey: `company:${id}`,
      queryKey: ['audit-lookup', 'company', id],
      queryFn: () => safeLoadLabel(async () => (await getCompanyById(Number(id))).nameCn),
    }),
  },
  shipperOtherInfoCompanyId: {
    resolveId: normalizeLookupId,
    buildRequest: (id) => ({
      cacheKey: `company:${id}`,
      queryKey: ['audit-lookup', 'company', id],
      queryFn: () => safeLoadLabel(async () => (await getCompanyById(Number(id))).nameCn),
    }),
  },
  defaultCompanyId: {
    resolveId: normalizeLookupId,
    buildRequest: (id) => ({
      cacheKey: `company:${id}`,
      queryKey: ['audit-lookup', 'company', id],
      queryFn: () => safeLoadLabel(async () => (await getCompanyById(Number(id))).nameCn),
    }),
  },
  currencyId: {
    resolveId: normalizeLookupId,
    buildRequest: (id) => ({
      cacheKey: `currency:${id}`,
      queryKey: ['audit-lookup', 'currency', id],
      queryFn: () => safeLoadLabel(async () => (await getCurrencyById(Number(id))).name),
    }),
  },
  destinationPortId: {
    resolveId: normalizeLookupId,
    buildRequest: (id) => ({
      cacheKey: `port:${id}`,
      queryKey: ['audit-lookup', 'port', id],
      queryFn: () => safeLoadLabel(async () => (await getPortById(Number(id))).nameCn),
    }),
  },
  categoryId: {
    resolveId: normalizeLookupId,
    buildRequest: (id) => ({
      cacheKey: `category:${id}`,
      queryKey: ['audit-lookup', 'category', id],
      queryFn: () => safeLoadLabel(async () => (await getProductCategoryById(Number(id))).name),
    }),
  },
  categoryLevel1Id: {
    resolveId: normalizeLookupId,
    buildRequest: (id) => ({
      cacheKey: `category:${id}`,
      queryKey: ['audit-lookup', 'category', id],
      queryFn: () => safeLoadLabel(async () => (await getProductCategoryById(Number(id))).name),
    }),
  },
  categoryLevel2Id: {
    resolveId: normalizeLookupId,
    buildRequest: (id) => ({
      cacheKey: `category:${id}`,
      queryKey: ['audit-lookup', 'category', id],
      queryFn: () => safeLoadLabel(async () => (await getProductCategoryById(Number(id))).name),
    }),
  },
  categoryLevel3Id: {
    resolveId: normalizeLookupId,
    buildRequest: (id) => ({
      cacheKey: `category:${id}`,
      queryKey: ['audit-lookup', 'category', id],
      queryFn: () => safeLoadLabel(async () => (await getProductCategoryById(Number(id))).name),
    }),
  },
};

function resolveFieldLabel(resourceType: string, change: OperationLogChangeItem) {
  return resolveOperationLogFieldLabel(resourceType, change.field, change.fieldLabel ?? change.field);
}

function formatActionText(
  action: OperationLogAction,
  resourceType: string,
  changes: OperationLogChangeItem[],
) {
  const fieldText = changes.length
    ? action === 'CREATE' && changes[0]?.field === OPERATION_LOG_CREATE_SUMMARY_FIELD
      ? resolveFieldLabel(resourceType, changes[0])
      : `涉及 ${changes.slice(0, 3).map((item) => resolveFieldLabel(resourceType, item)).join('、')}${changes.length > 3 ? ' 等字段' : ''}`
    : '无字段差异';

  if (action === 'CREATE') {
    const createSummary = changes.find((item) => item.field === OPERATION_LOG_CREATE_SUMMARY_FIELD);
    if (createSummary) {
      return `${OPERATION_LOG_CREATE_SUMMARY_LABEL}：${formatFieldValue(createSummary.field, createSummary.newValue)}`;
    }
    return `创建记录，${fieldText}`;
  }

  if (action === 'DELETE') {
    return `删除记录，删除前${fieldText}`;
  }

  return `更新记录，${fieldText}`;
}

function formatChangeValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  if (typeof value === 'boolean') {
    return value ? '是' : '否';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (Array.isArray(value)) {
    if (!value.length) {
      return '—';
    }
    return value.map((item) => formatChangeValue(item)).join('，');
  }

  return JSON.stringify(value);
}

function formatFieldValue(field: string, value: unknown): string {
  if (BOOLEAN_FIELDS.has(field) && (value === 0 || value === 1 || typeof value === 'boolean')) {
    return value === 1 || value === true ? '是' : '否';
  }

  return formatChangeValue(value);
}

function formatEnumValue(
  resourceType: string,
  field: string,
  value: unknown,
): string | null {
  const normalizedValue = normalizeLookupId(value);
  if (!normalizedValue) {
    return null;
  }

  const resourceLabels = RESOURCE_ENUM_VALUE_LABELS[resourceType]?.[field];
  if (resourceLabels?.[normalizedValue]) {
    return resourceLabels[normalizedValue];
  }

  const commonLabels = ENUM_VALUE_LABELS[field];
  if (commonLabels?.[normalizedValue]) {
    return commonLabels[normalizedValue];
  }

  return null;
}

function resolveLookupValue(
  field: string,
  value: unknown,
  lookupValueMap: Map<string, string | null>,
) {
  const resolver = FIELD_LOOKUP_RESOLVERS[field];
  if (!resolver) {
    return null;
  }

  const id = resolver.resolveId(value);
  if (!id) {
    return null;
  }

  return lookupValueMap.get(resolver.buildRequest(id).cacheKey) ?? null;
}

function normalizeChanges(
  resourceType: string,
  changes: OperationLogChangeItem[],
  lookupValueMap: Map<string, string | null>,
) {
  const changeMap = new Map(changes.map((change) => [change.field, change]));
  const consumedFields = new Set<string>();

  return changes.flatMap((change, index) => {
    if (change.field === OPERATION_LOG_CREATE_SUMMARY_FIELD) {
      return [];
    }

    if (consumedFields.has(change.field)) {
      return [];
    }

    const companionField = DISPLAY_COMPANION_FIELDS[change.field];
    const companionChange = companionField ? changeMap.get(companionField) : undefined;

    if (companionChange) {
      consumedFields.add(change.field);
      consumedFields.add(companionField);

      return [
        {
          key: `${change.field}-${index}`,
          fieldLabel: resolveFieldLabel(resourceType, change),
          oldValue:
            formatFieldValue(companionField, companionChange.oldValue),
          newValue:
            formatFieldValue(companionField, companionChange.newValue),
        },
      ];
    }

    consumedFields.add(change.field);

    return [
      {
        key: `${change.field}-${index}`,
        fieldLabel: resolveFieldLabel(resourceType, change),
        oldValue:
          formatEnumValue(resourceType, change.field, change.oldValue) ??
          resolveLookupValue(change.field, change.oldValue, lookupValueMap) ??
          formatFieldValue(change.field, change.oldValue),
        newValue:
          formatEnumValue(resourceType, change.field, change.newValue) ??
          resolveLookupValue(change.field, change.newValue, lookupValueMap) ??
          formatFieldValue(change.field, change.newValue),
      },
    ];
  });
}

export function ActivityTimeline({
  resourceType,
  resourceId,
}: {
  resourceType: string;
  resourceId: string | number;
}) {
  const query = useQuery({
    queryKey: ['operation-logs', resourceType, resourceId],
    queryFn: () =>
      getOperationLogs({
        resourceType,
        resourceId,
        page: 1,
        pageSize: 50,
      }),
    enabled: Boolean(resourceType) && Boolean(resourceId),
  });

  const lookupRequests = useMemo(() => {
    const requests = new Map<string, LookupRequest>();

    for (const record of query.data?.list ?? []) {
      for (const change of record.changeSummary ?? []) {
        const resolver = FIELD_LOOKUP_RESOLVERS[change.field];
        if (!resolver) {
          continue;
        }

        for (const candidate of [change.oldValue, change.newValue]) {
          const id = resolver.resolveId(candidate);
          if (!id) {
            continue;
          }

          const request = resolver.buildRequest(id);
          requests.set(request.cacheKey, request);
        }
      }
    }

    return Array.from(requests.values());
  }, [query.data]);

  const lookupResults = useQueries({
    queries: lookupRequests.map((request) => ({
      queryKey: request.queryKey,
      queryFn: request.queryFn,
      staleTime: 5 * 60 * 1000,
      enabled: Boolean(query.data?.list?.length),
    })),
  });

  const lookupValueMap = useMemo(() => {
    const map = new Map<string, string | null>();

    lookupRequests.forEach((request, index) => {
      map.set(request.cacheKey, lookupResults[index]?.data ?? null);
    });

    return map;
  }, [lookupRequests, lookupResults]);

  const records = (query.data?.list ?? []).map((record) => ({
    key: String(record.id),
    operator: record.operator || 'system',
    actionType: record.action,
    action: formatActionText(record.action, resourceType, record.changeSummary ?? []),
    time: record.createdAt,
    changes: normalizeChanges(resourceType, record.changeSummary ?? [], lookupValueMap).map((change) => ({
      key: `${record.id}-${change.key}`,
      fieldLabel: change.fieldLabel,
      oldValue: change.oldValue,
      newValue: change.newValue,
    })),
  }));

  if (query.isLoading && !query.data) {
    return <Skeleton active paragraph={{ rows: 3 }} />;
  }

  return <OperationTimeline records={records} />;
}
