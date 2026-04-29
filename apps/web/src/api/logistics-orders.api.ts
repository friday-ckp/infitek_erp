import {
  BlType,
  DomesticTradeType,
  InvoiceType,
  LogisticsOrderStatus,
  TransportationMethod,
  YesNo,
} from "@infitek/shared";
import request from "./request";
import type { ShippingDemand } from "./shipping-demands.api";

export interface LogisticsOrderItem {
  id: number;
  logisticsOrderId: number;
  shippingDemandItemId: number;
  salesOrderItemId: number;
  skuId: number;
  skuCode: string;
  productNameCn?: string | null;
  productNameEn?: string | null;
  skuSpecification?: string | null;
  unitId?: number | null;
  unitName?: string | null;
  lockedRemainingQuantity: number;
  plannedQuantity: number;
  outboundQuantity: number;
}

export interface LogisticsOrderPackage {
  id: number;
  logisticsOrderId: number;
  packageNo: string;
  quantityPerBox: number;
  boxCount: number;
  totalQuantity: number;
  lengthCm?: string | null;
  widthCm?: string | null;
  heightCm?: string | null;
  grossWeightKg?: string | null;
  remarks?: string | null;
}

export interface LogisticsOrder {
  id: number;
  orderCode: string;
  shippingDemandId: number;
  shippingDemandCode: string;
  salesOrderId: number;
  salesOrderCode: string;
  status: LogisticsOrderStatus;
  customerId: number;
  customerName: string;
  customerCode: string;
  domesticTradeType: DomesticTradeType;
  logisticsProviderId: number;
  logisticsProviderName: string;
  transportationMethod: TransportationMethod;
  companyId: number;
  companyName: string;
  originPortId?: number | null;
  originPortName: string;
  destinationPortId?: number | null;
  destinationPortName: string;
  destinationCountryId?: number | null;
  destinationCountryName: string;
  requiredDeliveryAt?: string | null;
  requiresExportCustoms?: YesNo | null;
  consigneeCompany?: string | null;
  consigneeOtherInfo?: string | null;
  notifyCompany?: string | null;
  notifyOtherInfo?: string | null;
  shipperCompany?: string | null;
  shipperOtherInfoCompanyName?: string | null;
  usesDefaultShippingMark?: YesNo | null;
  shippingMarkNote?: string | null;
  needsInvoice?: YesNo | null;
  invoiceType?: InvoiceType | null;
  shippingDocumentsNote?: string | null;
  blType?: BlType | null;
  originalMailAddress?: string | null;
  customsDocumentNote?: string | null;
  otherRequirementNote?: string | null;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: LogisticsOrderItem[];
  packages?: LogisticsOrderPackage[];
}

export interface LogisticsOrderPrefillItem {
  shippingDemandItemId: number;
  skuId: number;
  skuCode: string;
  productNameCn?: string | null;
  productNameEn?: string | null;
  skuSpecification?: string | null;
  unitId?: number | null;
  unitName?: string | null;
  lockedRemainingQuantity: number;
  activePlannedQuantity: number;
  availableToPlan: number;
  plannedQuantity: number;
}

export interface LogisticsOrderPrefill {
  shippingDemand: ShippingDemand;
  planItems: LogisticsOrderPrefillItem[];
}

export interface CreateLogisticsOrderItemPayload {
  shippingDemandItemId: number;
  plannedQuantity: number;
}

export interface CreateLogisticsOrderPackagePayload {
  packageNo: string;
  quantityPerBox: number;
  boxCount: number;
  totalQuantity: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  grossWeightKg?: number;
  remarks?: string;
}

export interface CreateLogisticsOrderPayload {
  shippingDemandId: number;
  logisticsProviderId: number;
  logisticsProviderName?: string;
  transportationMethod: TransportationMethod;
  companyId: number;
  companyName?: string;
  originPortId?: number;
  originPortName: string;
  destinationPortId?: number;
  destinationPortName: string;
  destinationCountryId?: number;
  destinationCountryName: string;
  requiresExportCustoms?: YesNo;
  remarks?: string;
  items: CreateLogisticsOrderItemPayload[];
  packages: CreateLogisticsOrderPackagePayload[];
}

function normalizeApiError(error: unknown): never {
  if (typeof error === "object" && error !== null) throw error;
  throw { message: "请求失败，请稍后重试" };
}

export const getLogisticsOrderCreatePrefill = (
  shippingDemandId: number,
): Promise<LogisticsOrderPrefill> =>
  request
    .get<unknown, LogisticsOrderPrefill>("/logistics-orders/create-prefill", {
      params: { shippingDemandId },
    })
    .catch(normalizeApiError);

export const createLogisticsOrder = (
  payload: CreateLogisticsOrderPayload,
): Promise<LogisticsOrder> =>
  request
    .post<unknown, LogisticsOrder>("/logistics-orders", payload)
    .catch(normalizeApiError);

export const getLogisticsOrderById = (id: number): Promise<LogisticsOrder> =>
  request
    .get<unknown, LogisticsOrder>(`/logistics-orders/${id}`)
    .catch(normalizeApiError);
