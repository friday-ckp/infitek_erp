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

export const LOGISTICS_ORDER_STATUS_LABELS: Record<LogisticsOrderStatus, string> = {
  [LogisticsOrderStatus.CONFIRMED]: "已确认",
  [LogisticsOrderStatus.SHIPPED]: "已发运",
  [LogisticsOrderStatus.DELIVERED]: "已送达",
  [LogisticsOrderStatus.CANCELLED]: "已取消",
};

export const TRANSPORTATION_METHOD_LABELS: Record<TransportationMethod, string> = {
  [TransportationMethod.SEA]: "海运",
  [TransportationMethod.AIR]: "空运",
  [TransportationMethod.ROAD]: "陆运",
  [TransportationMethod.RAIL]: "铁路",
  [TransportationMethod.EXPRESS]: "快递",
  [TransportationMethod.OTHER]: "其它",
};

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
  logisticsOrderItemId?: number | null;
  shippingDemandItemId?: number | null;
  skuId?: number | null;
  skuCode?: string | null;
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
  shippingMark?: string | null;
  etd?: string | null;
  eta?: string | null;
  bookingNumber?: string | null;
  carrier?: string | null;
  vesselVoyage?: string | null;
  blSoNumber?: string | null;
  actualDepartureDate?: string | null;
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
  itemCount?: number;
}

export interface LogisticsOrdersListParams {
  keyword?: string;
  status?: LogisticsOrderStatus;
  logisticsProviderId?: number;
  shippingDemandId?: number;
  page?: number;
  pageSize?: number;
}

export interface LogisticsOrdersListData {
  list: LogisticsOrder[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
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
  shippingDemandItemId: number;
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
  shippingMark?: string;
  remarks?: string;
  items: CreateLogisticsOrderItemPayload[];
  packages: CreateLogisticsOrderPackagePayload[];
}

export interface UpdateLogisticsTrackingPayload {
  etd?: string | null;
  eta?: string | null;
  bookingNumber?: string | null;
  carrier?: string | null;
  vesselVoyage?: string | null;
  blSoNumber?: string | null;
  actualDepartureDate?: string | null;
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

export const getLogisticsOrders = (
  params: LogisticsOrdersListParams,
): Promise<LogisticsOrdersListData> =>
  request
    .get<unknown, LogisticsOrdersListData>("/logistics-orders", { params })
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

export const updateLogisticsTracking = (
  id: number,
  payload: UpdateLogisticsTrackingPayload,
): Promise<LogisticsOrder> =>
  request
    .patch<unknown, LogisticsOrder>(`/logistics-orders/${id}/tracking`, payload)
    .catch(normalizeApiError);
