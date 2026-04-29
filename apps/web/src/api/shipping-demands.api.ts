import {
  BlType,
  CustomsDeclarationMethod,
  DomesticTradeType,
  FulfillmentType,
  InvoiceType,
  OrderNature,
  PaymentTerm,
  PlugType,
  PrimaryIndustry,
  ProductLineType,
  ReceiptStatus,
  SalesOrderSource,
  SalesOrderType,
  SecondaryIndustry,
  ShippingDemandStatus,
  TradeTerm,
  TransportationMethod,
  YesNo,
} from '@infitek/shared';
import request from './request';

export interface ShippingDemandItem {
  id: number;
  shippingDemandId: number;
  salesOrderItemId: number;
  skuId: number;
  skuCode: string;
  productNameCn?: string | null;
  productNameEn?: string | null;
  lineType?: ProductLineType | null;
  spuId?: number | null;
  spuName?: string | null;
  electricalParams?: string | null;
  hasPlug?: YesNo | null;
  plugType?: PlugType | null;
  unitPrice: string;
  currencyId?: number | null;
  currencyCode?: string | null;
  unitId?: number | null;
  unitName?: string | null;
  purchaserId?: number | null;
  purchaserName?: string | null;
  needsPurchase?: YesNo | null;
  requiredQuantity: number;
  availableStockSnapshot?: Array<{
    skuId: number;
    warehouseId: number | null;
    actualQuantity: number;
    lockedQuantity: number;
    availableQuantity: number;
  }> | null;
  fulfillmentType?: FulfillmentType | null;
  stockRequiredQuantity: number;
  purchaseRequiredQuantity: number;
  lockedRemainingQuantity: number;
  shippedQuantity: number;
  purchaseOrderedQuantity: number;
  receivedQuantity: number;
  amount: string;
  material?: string | null;
  imageUrl?: string | null;
  totalVolumeCbm: string;
  totalWeightKg: string;
  unitWeightKg: string;
  unitVolumeCbm: string;
  skuSpecification?: string | null;
}

export interface ShippingDemand {
  id: number;
  demandCode: string;
  salesOrderId: number;
  sourceDocumentCode: string;
  sourceDocumentType?: string | null;
  status: ShippingDemandStatus;
  orderType: SalesOrderType;
  orderSource?: SalesOrderSource | null;
  domesticTradeType: DomesticTradeType;
  externalOrderCode?: string | null;
  customerId: number;
  customerName: string;
  customerCode: string;
  customerContactPerson?: string | null;
  afterSalesSourceOrderId?: number | null;
  afterSalesSourceOrderCode?: string | null;
  afterSalesProductSummary?: string | null;
  skuCount?: number;
  currencyId?: number | null;
  currencyCode?: string | null;
  currencyName?: string | null;
  currencySymbol?: string | null;
  tradeTerm?: TradeTerm | null;
  paymentTerm?: PaymentTerm | null;
  bankAccount?: string | null;
  extraViewerId?: number | null;
  extraViewerName?: string | null;
  primaryIndustry?: PrimaryIndustry | null;
  secondaryIndustry?: SecondaryIndustry | null;
  exchangeRate?: string | null;
  crmSignedAt?: string | null;
  shipmentOriginCountryId?: number | null;
  shipmentOriginCountryName?: string | null;
  destinationCountryId?: number | null;
  destinationCountryName?: string | null;
  destinationPortId?: number | null;
  destinationPortName?: string | null;
  signingCompanyId?: number | null;
  signingCompanyName?: string | null;
  salespersonId?: number | null;
  salespersonName?: string | null;
  merchandiserId?: number | null;
  merchandiserName?: string | null;
  merchandiserAbbr?: string | null;
  orderNature?: OrderNature | null;
  receiptStatus?: ReceiptStatus | null;
  transportationMethod?: TransportationMethod | null;
  requiredDeliveryAt?: string | null;
  isSharedOrder?: YesNo | null;
  isSinosure?: YesNo | null;
  isAliTradeAssurance?: YesNo | null;
  isInsured?: YesNo | null;
  isPalletized?: YesNo | null;
  isSplitInAdvance?: YesNo | null;
  requiresExportCustoms?: YesNo | null;
  requiresWarrantyCard?: YesNo | null;
  requiresCustomsCertificate?: YesNo | null;
  requiresMaternityHandover?: YesNo | null;
  customsDeclarationMethod?: CustomsDeclarationMethod | null;
  usesMarketingFund?: YesNo | null;
  aliTradeAssuranceOrderCode?: string | null;
  forwarderQuoteNote?: string | null;
  contractFileKeys?: string[] | null;
  contractFileNames?: string[] | null;
  contractFileUrls?: string[] | null;
  plugPhotoKeys?: string[] | null;
  plugPhotoUrls?: string[] | null;
  consigneeCompany?: string | null;
  consigneeOtherInfo?: string | null;
  notifyCompany?: string | null;
  notifyOtherInfo?: string | null;
  shipperCompany?: string | null;
  shipperOtherInfoCompanyId?: number | null;
  shipperOtherInfoCompanyName?: string | null;
  domesticCustomerCompany?: string | null;
  domesticCustomerDeliveryInfo?: string | null;
  usesDefaultShippingMark?: YesNo | null;
  shippingMarkNote?: string | null;
  shippingMarkTemplateKey?: string | null;
  shippingMarkTemplateUrl?: string | null;
  needsInvoice?: YesNo | null;
  invoiceType?: InvoiceType | null;
  shippingDocumentsNote?: string | null;
  blType?: BlType | null;
  originalMailAddress?: string | null;
  businessRectificationNote?: string | null;
  customsDocumentNote?: string | null;
  otherRequirementNote?: string | null;
  contractAmount: string;
  receivedAmount: string;
  outstandingAmount: string;
  productTotalAmount: string;
  expenseTotalAmount: string;
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
  items?: ShippingDemandItem[];
}

export interface ShippingDemandListParams {
  keyword?: string;
  status?: ShippingDemandStatus;
  customerId?: number;
  salesOrderId?: number;
  sourceDocumentCode?: string;
  page?: number;
  pageSize?: number;
}

export interface ShippingDemandListData {
  list: ShippingDemand[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ConfirmShippingDemandAllocationItemPayload {
  itemId: number;
  fulfillmentType: FulfillmentType;
  stockQuantity: number;
  warehouseId?: number;
}

export interface ConfirmShippingDemandAllocationPayload {
  items: ConfirmShippingDemandAllocationItemPayload[];
}

function normalizeApiError(error: unknown): never {
  if (typeof error === 'object' && error !== null) throw error;
  throw { message: '请求失败，请稍后重试' };
}

export const getShippingDemands = (
  params: ShippingDemandListParams,
): Promise<ShippingDemandListData> =>
  request
    .get<unknown, ShippingDemandListData>('/shipping-demands', { params })
    .catch(normalizeApiError);

export const generateShippingDemandFromSalesOrder = (
  salesOrderId: number,
): Promise<ShippingDemand> =>
  request
    .post<unknown, ShippingDemand>(
      `/shipping-demands/generate-from-sales-order/${salesOrderId}`,
      {},
    )
    .catch(normalizeApiError);

export const getShippingDemandById = (id: number): Promise<ShippingDemand> =>
  request
    .get<unknown, ShippingDemand>(`/shipping-demands/${id}`)
    .catch(normalizeApiError);

export const confirmShippingDemandAllocation = (
  id: number,
  payload: ConfirmShippingDemandAllocationPayload,
): Promise<ShippingDemand> =>
  request
    .post<unknown, ShippingDemand>(
      `/shipping-demands/${id}/confirm-allocation`,
      payload,
    )
    .catch(normalizeApiError);
