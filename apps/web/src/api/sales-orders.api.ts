import {
  BlType,
  CustomsDeclarationMethod,
  DomesticTradeType,
  InvoiceType,
  OrderNature,
  PaymentTerm,
  PrimaryIndustry,
  ReceiptStatus,
  SalesOrderSource,
  SalesOrderStatus,
  SalesOrderType,
  ShippingDemandStatus,
  SecondaryIndustry,
  TradeTerm,
  TransportationMethod,
  YesNo,
  PlugType,
  ProductLineType,
} from '@infitek/shared';
import request from './request';

export interface SalesOrderItem {
  id: number;
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
  quantity: number;
  purchaserId?: number | null;
  purchaserName?: string | null;
  needsPurchase?: YesNo | null;
  purchaseQuantity: number;
  useStockQuantity: number;
  preparedQuantity: number;
  shippedQuantity: number;
  amount: string;
  unitId?: number | null;
  unitName?: string | null;
  material?: string | null;
  imageUrl?: string | null;
  totalVolumeCbm: string;
  totalWeightKg: string;
  unitWeightKg: string;
  unitVolumeCbm: string;
  skuSpecification?: string | null;
}

export interface SalesOrderExpense {
  id: number;
  expenseName: string;
  amount: string;
}

export interface SalesOrderRelatedShippingDemand {
  id: number;
  demandCode: string;
  salesOrderId: number;
  sourceDocumentCode: string;
  status: ShippingDemandStatus;
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesOrder {
  id: number;
  erpSalesOrderCode: string;
  domesticTradeType: DomesticTradeType;
  externalOrderCode: string;
  orderSource: SalesOrderSource;
  orderType: SalesOrderType;
  customerId: number;
  customerName: string;
  customerCode: string;
  customerContactPerson?: string | null;
  afterSalesSourceOrderId?: number | null;
  afterSalesSourceOrderCode?: string | null;
  afterSalesProductSummary?: string | null;
  destinationCountryId?: number | null;
  destinationCountryName?: string | null;
  paymentTerm?: PaymentTerm | null;
  shipmentOriginCountryId?: number | null;
  shipmentOriginCountryName?: string | null;
  signingCompanyId?: number | null;
  signingCompanyName?: string | null;
  salespersonId?: number | null;
  salespersonName?: string | null;
  otherIndustryNote?: string | null;
  currencyId?: number | null;
  currencyCode?: string | null;
  currencyName?: string | null;
  currencySymbol?: string | null;
  tradeTerm?: TradeTerm | null;
  destinationPortId?: number | null;
  destinationPortName?: string | null;
  bankAccount?: string | null;
  extraViewerId?: number | null;
  extraViewerName?: string | null;
  primaryIndustry?: PrimaryIndustry | null;
  exchangeRate?: string | null;
  transportationMethod?: TransportationMethod | null;
  crmSignedAt?: string | null;
  contractAmount: string;
  orderNature?: OrderNature | null;
  secondaryIndustry?: SecondaryIndustry | null;
  receiptStatus?: ReceiptStatus | null;
  status: SalesOrderStatus;
  contractFileKeys?: string[] | null;
  contractFileNames?: string[] | null;
  contractFileUrls?: string[] | null;
  receivedAmount: string;
  merchandiserId?: number | null;
  merchandiserName?: string | null;
  merchandiserAbbr?: string | null;
  outstandingAmount: string;
  requiredDeliveryAt?: string | null;
  isSharedOrder?: YesNo | null;
  isSinosure?: YesNo | null;
  isPalletized?: YesNo | null;
  requiresCustomsCertificate?: YesNo | null;
  isSplitInAdvance?: YesNo | null;
  usesMarketingFund?: YesNo | null;
  requiresExportCustoms?: YesNo | null;
  requiresWarrantyCard?: YesNo | null;
  requiresMaternityHandover?: YesNo | null;
  customsDeclarationMethod?: CustomsDeclarationMethod | null;
  plugPhotoKeys?: string[] | null;
  plugPhotoUrls?: string[] | null;
  isInsured?: YesNo | null;
  isAliTradeAssurance?: YesNo | null;
  aliTradeAssuranceOrderCode?: string | null;
  forwarderQuoteNote?: string | null;
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
  productTotalAmount: string;
  expenseTotalAmount: string;
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  items: SalesOrderItem[];
  expenses: SalesOrderExpense[];
  shippingDemands?: SalesOrderRelatedShippingDemand[];
}

export interface CreateSalesOrderItemPayload {
  id?: number;
  skuId: number;
  productNameCn?: string;
  productNameEn?: string;
  lineType?: ProductLineType;
  spuId?: number;
  spuName?: string;
  electricalParams?: string;
  hasPlug?: YesNo;
  plugType?: PlugType;
  unitPrice: number;
  currencyId?: number;
  quantity: number;
  purchaserId?: number;
  needsPurchase?: YesNo;
  purchaseQuantity?: number;
  useStockQuantity?: number;
  preparedQuantity?: number;
  shippedQuantity?: number;
  amount?: number;
  unitId?: number;
  unitName?: string;
  material?: string;
  imageUrl?: string;
  totalVolumeCbm?: number;
  totalWeightKg?: number;
  unitWeightKg?: number;
  unitVolumeCbm?: number;
  skuSpecification?: string;
}

export interface CreateSalesOrderExpensePayload {
  expenseName: string;
  amount: number;
}

export interface CreateSalesOrderPayload {
  domesticTradeType: DomesticTradeType;
  externalOrderCode: string;
  orderSource?: SalesOrderSource;
  orderType: SalesOrderType;
  customerId: number;
  afterSalesSourceOrderId?: number;
  afterSalesProductSummary?: string;
  destinationCountryId?: number;
  paymentTerm?: PaymentTerm;
  shipmentOriginCountryId?: number;
  signingCompanyId?: number;
  salespersonId?: number;
  otherIndustryNote?: string;
  currencyId?: number;
  tradeTerm?: TradeTerm;
  destinationPortId?: number;
  bankAccount?: string;
  extraViewerId?: number;
  primaryIndustry?: PrimaryIndustry;
  exchangeRate?: number;
  transportationMethod?: TransportationMethod;
  crmSignedAt?: string;
  contractAmount: number;
  orderNature?: OrderNature;
  secondaryIndustry?: SecondaryIndustry;
  receiptStatus?: ReceiptStatus;
  status?: SalesOrderStatus;
  contractFileKeys?: string[];
  contractFileNames?: string[];
  receivedAmount: number;
  merchandiserId?: number;
  merchandiserAbbr?: string;
  requiredDeliveryAt?: string;
  isSharedOrder?: YesNo;
  isSinosure?: YesNo;
  isPalletized?: YesNo;
  requiresCustomsCertificate?: YesNo;
  isSplitInAdvance?: YesNo;
  usesMarketingFund?: YesNo;
  requiresExportCustoms?: YesNo;
  requiresWarrantyCard?: YesNo;
  requiresMaternityHandover?: YesNo;
  customsDeclarationMethod?: CustomsDeclarationMethod;
  plugPhotoKeys?: string[];
  isInsured?: YesNo;
  isAliTradeAssurance?: YesNo;
  aliTradeAssuranceOrderCode?: string;
  forwarderQuoteNote?: string;
  consigneeCompany?: string;
  consigneeOtherInfo?: string;
  notifyCompany?: string;
  notifyOtherInfo?: string;
  shipperCompany?: string;
  shipperOtherInfoCompanyId?: number;
  domesticCustomerCompany?: string;
  domesticCustomerDeliveryInfo?: string;
  usesDefaultShippingMark?: YesNo;
  shippingMarkNote?: string;
  shippingMarkTemplateKey?: string;
  needsInvoice?: YesNo;
  invoiceType?: InvoiceType;
  shippingDocumentsNote?: string;
  blType?: BlType;
  originalMailAddress?: string;
  businessRectificationNote?: string;
  customsDocumentNote?: string;
  otherRequirementNote?: string;
  items: CreateSalesOrderItemPayload[];
  expenses?: CreateSalesOrderExpensePayload[];
}

export interface SalesOrderListParams {
  keyword?: string;
  customerId?: number;
  status?: SalesOrderStatus;
  orderType?: SalesOrderType;
  page?: number;
  pageSize?: number;
}

export interface SalesOrderListData {
  list: SalesOrder[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SalesOrderOptionsData {
  initialStatus: SalesOrderStatus;
  statusFlow: SalesOrderStatus[];
  allowedTransitions: Record<string, SalesOrderStatus[]>;
  statusActions: Array<{ value: 'submit' | 'approve' | 'reject' | 'void'; label: string }>;
  defaults: {
    receiptStatus: ReceiptStatus;
    needsPurchase: YesNo;
  };
}

function normalizeApiError(error: unknown): never {
  if (typeof error === 'object' && error !== null) throw error;
  throw { message: '请求失败，请稍后重试' };
}

export const getSalesOrders = (params: SalesOrderListParams): Promise<SalesOrderListData> =>
  request.get<unknown, SalesOrderListData>('/sales-orders', { params }).catch(normalizeApiError);

export const getSalesOrderById = (id: number): Promise<SalesOrder> =>
  request.get<unknown, SalesOrder>(`/sales-orders/${id}`).catch(normalizeApiError);

export const getSalesOrderOptions = (): Promise<SalesOrderOptionsData> =>
  request.get<unknown, SalesOrderOptionsData>('/sales-orders/options').catch(normalizeApiError);

export const createSalesOrder = (payload: CreateSalesOrderPayload): Promise<SalesOrder> =>
  request.post<unknown, SalesOrder>('/sales-orders', payload).catch(normalizeApiError);

export const updateSalesOrder = (id: number, payload: CreateSalesOrderPayload): Promise<SalesOrder> =>
  request.patch<unknown, SalesOrder>(`/sales-orders/${id}`, payload).catch(normalizeApiError);

export const submitSalesOrder = (id: number): Promise<SalesOrder> =>
  request.post<unknown, SalesOrder>(`/sales-orders/${id}/submit`, {}).catch(normalizeApiError);

export const approveSalesOrder = (id: number): Promise<SalesOrder> =>
  request.post<unknown, SalesOrder>(`/sales-orders/${id}/approve`, {}).catch(normalizeApiError);

export const rejectSalesOrder = (id: number): Promise<SalesOrder> =>
  request.post<unknown, SalesOrder>(`/sales-orders/${id}/reject`, {}).catch(normalizeApiError);

export const voidSalesOrder = (id: number): Promise<SalesOrder> =>
  request.post<unknown, SalesOrder>(`/sales-orders/${id}/void`, {}).catch(normalizeApiError);

export const uploadSalesOrderFile = (
  file: File,
  folder: 'documents' | 'general' = 'documents',
): Promise<{ key: string; filename: string; size: number }> => {
  const formData = new FormData();
  formData.append('file', file);
  return request
    .post<unknown, { key: string; filename: string; size: number }>(
      `/files/upload?folder=${folder}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    .catch(normalizeApiError);
};
