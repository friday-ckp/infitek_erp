import {
  PurchaseOrderStatus,
  PurchaseOrderType,
  type FulfillmentType,
} from "@infitek/shared";
import request from "./request";
import type { ShippingDemand } from "./shipping-demands.api";

export interface PurchaseOrderItem {
  id: number;
  purchaseOrderId: number;
  shippingDemandId?: number | null;
  shippingDemandItemId?: number | null;
  salesOrderItemId?: number | null;
  skuId: number;
  skuCode: string;
  productNameCn?: string | null;
  productNameEn?: string | null;
  skuSpecification?: string | null;
  unitId?: number | null;
  unitName?: string | null;
  quantity: number;
  receivedQuantity: number;
  unitPrice: string;
  amount: string;
}

export interface PurchaseOrder {
  id: number;
  poCode: string;
  supplierId: number;
  supplierName: string;
  supplierContactPerson?: string | null;
  supplierContactPhone?: string | null;
  supplierContactEmail?: string | null;
  supplierPaymentTermName?: string | null;
  shippingDemandId?: number | null;
  shippingDemandCode?: string | null;
  salesOrderId?: number | null;
  salesOrderCode?: string | null;
  contractTermId?: number | null;
  contractTermName?: string | null;
  orderType: PurchaseOrderType;
  status: PurchaseOrderStatus;
  totalAmount: string;
  remark?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderPrefillItem {
  shippingDemandItemId: number;
  skuId: number;
  skuCode: string;
  productNameCn?: string | null;
  productNameEn?: string | null;
  skuSpecification?: string | null;
  unitId?: number | null;
  unitName?: string | null;
  fulfillmentType?: FulfillmentType | null;
  purchaseRequiredQuantity: number;
  purchaseOrderedQuantity: number;
  availableToOrder: number;
  quantity: number;
}

export interface PurchaseOrderCreatePrefill {
  shippingDemand: ShippingDemand;
  items: PurchaseOrderPrefillItem[];
}

export interface CreatePurchaseOrderItemPayload {
  skuId: number;
  quantity: number;
  unitPrice: number;
}

export interface CreatePurchaseOrderPayload {
  supplierId: number;
  contractTermId?: number;
  remark?: string;
  requestKey?: string;
  items: CreatePurchaseOrderItemPayload[];
}

export interface CreatePurchaseOrderFromDemandGroupPayload {
  supplierId: number;
  contractTermId?: number;
  remark?: string;
  items: Array<{
    shippingDemandItemId: number;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface CreatePurchaseOrdersFromShippingDemandPayload {
  shippingDemandId: number;
  requestKey: string;
  groups: CreatePurchaseOrderFromDemandGroupPayload[];
}

function normalizeApiError(error: unknown): never {
  if (typeof error === "object" && error !== null) throw error;
  throw { message: "请求失败，请稍后重试" };
}

export const PURCHASE_ORDER_STATUS_LABELS: Record<PurchaseOrderStatus, string> =
  {
    [PurchaseOrderStatus.PENDING_CONFIRM]: "待确认",
    [PurchaseOrderStatus.SUPPLIER_CONFIRMING]: "待供应商确认",
    [PurchaseOrderStatus.PENDING_RECEIPT]: "待收货",
    [PurchaseOrderStatus.PARTIALLY_RECEIVED]: "部分收货",
    [PurchaseOrderStatus.RECEIVED]: "全部收货",
    [PurchaseOrderStatus.CANCELLED]: "已取消",
  };

export const PURCHASE_ORDER_TYPE_LABELS: Record<PurchaseOrderType, string> = {
  [PurchaseOrderType.REQUISITION]: "请购型",
  [PurchaseOrderType.STOCK]: "备货型",
};

export const getPurchaseOrderCreatePrefill = (
  shippingDemandId: number,
): Promise<PurchaseOrderCreatePrefill> =>
  request
    .get<unknown, PurchaseOrderCreatePrefill>(
      "/purchase-orders/create-prefill",
      { params: { shippingDemandId } },
    )
    .catch(normalizeApiError);

export const createPurchaseOrdersFromShippingDemand = (
  payload: CreatePurchaseOrdersFromShippingDemandPayload,
): Promise<PurchaseOrder[]> =>
  request
    .post<unknown, PurchaseOrder[]>(
      "/purchase-orders/from-shipping-demand",
      payload,
    )
    .catch(normalizeApiError);

export const createPurchaseOrder = (
  payload: CreatePurchaseOrderPayload,
): Promise<PurchaseOrder> =>
  request
    .post<unknown, PurchaseOrder>("/purchase-orders", payload)
    .catch(normalizeApiError);

export const getPurchaseOrderById = (id: number): Promise<PurchaseOrder> =>
  request
    .get<unknown, PurchaseOrder>(`/purchase-orders/${id}`)
    .catch(normalizeApiError);
