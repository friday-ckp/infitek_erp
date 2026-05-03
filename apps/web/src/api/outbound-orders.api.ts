import { OutboundOrderStatus, OutboundOrderType } from "@infitek/shared";
import request from "./request";

function normalizeApiError(error: unknown): never {
  if (typeof error === "object" && error !== null) throw error;
  throw { message: "请求失败，请稍后重试" };
}

export interface OutboundOrderPrefillItem {
  logisticsOrderItemId: number;
  shippingDemandItemId: number;
  salesOrderItemId: number;
  skuId: number;
  skuCode: string;
  productNameCn?: string | null;
  productNameEn?: string | null;
  unitName?: string | null;
  purchaseSubject?: string | null;
  salesUnitPrice?: string | null;
  costUnitPrice?: string | null;
  plannedQuantity: number;
  outboundQuantity: number;
  remainingQuantity: number;
}

export interface OutboundOrderPrefill {
  logisticsOrder: {
    id: number;
    orderCode: string;
    shippingDemandId: number;
    shippingDemandCode: string;
    salesOrderId: number;
    salesOrderCode: string;
    status: string;
    logisticsProviderName?: string | null;
    transportationMethod?: string | null;
  };
  items: OutboundOrderPrefillItem[];
}

export interface CreateOutboundOrderPayload {
  logisticsOrderId: number;
  outboundUserId: number;
  outboundDate: string;
  outboundType: OutboundOrderType;
  salesCompanyId: number;
  warehouseId: number;
  requestKey: string;
  remark?: string;
  items: Array<{
    logisticsOrderItemId: number;
    outboundQuantity: number;
  }>;
}

export interface OutboundOrderItem {
  id: number;
  logisticsOrderItemId: number;
  shippingDemandItemId: number;
  salesOrderItemId: number;
  skuId: number;
  skuCode: string;
  productNameCn?: string | null;
  productNameEn?: string | null;
  unitName?: string | null;
  plannedQuantity: number;
  previousOutboundQuantity: number;
  outboundQuantity: number;
  warehouseId: number;
  warehouseName: string;
}

export interface OutboundOrder {
  id: number;
  outboundCode: string;
  logisticsOrderId: number;
  logisticsOrderCode: string;
  shippingDemandId: number;
  shippingDemandCode: string;
  salesOrderId: number;
  salesOrderCode: string;
  outboundUserId: number;
  outboundUserName: string;
  outboundDate: string;
  outboundType: OutboundOrderType;
  salesCompanyId: number;
  salesCompanyName: string;
  warehouseId: number;
  warehouseName: string;
  status: OutboundOrderStatus;
  salesTotalAmount: string;
  costTotalAmount: string;
  remark?: string | null;
  items?: OutboundOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export const OUTBOUND_ORDER_STATUS_LABELS: Record<OutboundOrderStatus, string> = {
  [OutboundOrderStatus.CONFIRMED]: "已确认",
};

export const OUTBOUND_ORDER_TYPE_LABELS: Record<OutboundOrderType, string> = {
  [OutboundOrderType.SALES]: "销售出库",
  [OutboundOrderType.LOSS]: "报损出库",
  [OutboundOrderType.INVENTORY_LOSS]: "盘亏出库",
  [OutboundOrderType.OTHER]: "其他",
};

export const getOutboundOrderCreatePrefill = (
  logisticsOrderId: number,
): Promise<OutboundOrderPrefill> =>
  request
    .get<unknown, OutboundOrderPrefill>("/outbound-orders/create-prefill", {
      params: { logisticsOrderId },
    })
    .catch(normalizeApiError);

export const createOutboundOrder = (
  payload: CreateOutboundOrderPayload,
): Promise<OutboundOrder> =>
  request
    .post<unknown, OutboundOrder>("/outbound-orders", payload)
    .catch(normalizeApiError);
