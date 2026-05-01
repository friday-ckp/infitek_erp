import {
  ReceiptOrderStatus,
  ReceiptOrderType,
  type PurchaseOrderReceiptStatus,
  type PurchaseOrderStatus,
} from "@infitek/shared";
import request from "./request";

function normalizeApiError(error: unknown): never {
  if (typeof error === "object" && error !== null) throw error;
  throw { message: "请求失败，请稍后重试" };
}

export interface ReceiptOrderItem {
  id: number;
  receiptOrderId: number;
  purchaseOrderId: number;
  purchaseOrderItemId: number;
  shippingDemandItemId?: number | null;
  skuId: number;
  skuCode: string;
  productName?: string | null;
  productCategoryName?: string | null;
  receivedQuantity: number;
  qcImageKeys?: string[] | null;
  unitPrice: string;
  warehouseId: number;
  warehouseName: string;
  inventoryBatchId?: number | null;
}

export interface ReceiptOrder {
  id: number;
  receiptCode: string;
  purchaseOrderId: number;
  purchaseOrderCode: string;
  receiptType: ReceiptOrderType;
  status: ReceiptOrderStatus;
  warehouseId: number;
  warehouseName: string;
  receiptDate: string;
  receiverId: number;
  receiverName: string;
  shippingDemandId?: number | null;
  shippingDemandCode?: string | null;
  purchaseCompanyId?: number | null;
  purchaseCompanyName?: string | null;
  totalQuantity: number;
  totalAmount: string;
  remark?: string | null;
  inventoryNote?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: ReceiptOrderItem[];
}

export interface ReceiptPurchaseOrderOption {
  id: number;
  poCode: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  receiptStatus: PurchaseOrderReceiptStatus;
  shippingDemandId?: number | null;
  shippingDemandCode?: string | null;
  remainingTotalQuantity: number;
}

export interface ReceiptOrderPrefillItem {
  purchaseOrderItemId: number;
  shippingDemandItemId?: number | null;
  skuId: number;
  skuCode: string;
  productName: string;
  productCategoryName?: string | null;
  quantity: number;
  receivedQuantity: number;
  remainingQuantity: number;
  unitPrice: number;
  qcImageKeys: string[];
}

export interface ReceiptOrderCreatePrefill {
  purchaseOrder: {
    id: number;
    poCode: string;
    status: PurchaseOrderStatus;
    receiptStatus: PurchaseOrderReceiptStatus;
    supplierId: number;
    supplierName: string;
    shippingDemandId?: number | null;
    shippingDemandCode?: string | null;
    purchaseCompanyId?: number | null;
    purchaseCompanyName?: string | null;
    totalQuantity: number;
    receivedTotalQuantity: number;
    remainingTotalQuantity: number;
  };
  items: ReceiptOrderPrefillItem[];
}

export interface CreateReceiptOrderPayload {
  purchaseOrderId: number;
  requestKey: string;
  receiptType?: ReceiptOrderType;
  warehouseId: number;
  receiptDate: string;
  receiverId: number;
  purchaseCompanyId?: number;
  remark?: string;
  inventoryNote?: string;
  items: Array<{
    purchaseOrderItemId: number;
    receivedQuantity: number;
    warehouseId?: number;
    qcImageKeys?: string[];
  }>;
}

export const RECEIPT_ORDER_STATUS_LABELS: Record<ReceiptOrderStatus, string> = {
  [ReceiptOrderStatus.CONFIRMED]: "已确认",
};

export const RECEIPT_ORDER_TYPE_LABELS: Record<ReceiptOrderType, string> = {
  [ReceiptOrderType.PURCHASE_RECEIPT]: "采购入库",
  [ReceiptOrderType.SALES_RETURN_RECEIPT]: "销售退货入库",
  [ReceiptOrderType.SALES_EXCHANGE_RECEIPT]: "销售换货入库",
  [ReceiptOrderType.OPENING_RECEIPT]: "期初入库",
  [ReceiptOrderType.SUPPLIER_GIFT_RECEIPT]: "供应商受赠入库",
  [ReceiptOrderType.TRANSFER_RECEIPT]: "调拨入库",
  [ReceiptOrderType.INVENTORY_GAIN_RECEIPT]: "盘盈入库",
  [ReceiptOrderType.OTHER]: "其他",
};

export const getReceiptPurchaseOrderOptions = (
  keyword?: string,
): Promise<ReceiptPurchaseOrderOption[]> =>
  request
    .get<unknown, ReceiptPurchaseOrderOption[]>(
      "/receipt-orders/purchase-order-options",
      {
        params: { keyword, pageSize: 20 },
      },
    )
    .catch(normalizeApiError);

export const getReceiptOrderCreatePrefill = (
  purchaseOrderId: number,
): Promise<ReceiptOrderCreatePrefill> =>
  request
    .get<unknown, ReceiptOrderCreatePrefill>("/receipt-orders/create-prefill", {
      params: { purchaseOrderId },
    })
    .catch(normalizeApiError);

export const getReceiptOrderById = (id: number): Promise<ReceiptOrder> =>
  request
    .get<unknown, ReceiptOrder>(`/receipt-orders/${id}`)
    .catch(normalizeApiError);

export const createReceiptOrder = (
  payload: CreateReceiptOrderPayload,
): Promise<ReceiptOrder> =>
  request
    .post<unknown, ReceiptOrder>("/receipt-orders", payload)
    .catch(normalizeApiError);

export const uploadReceiptOrderQcImage = (
  file: File,
): Promise<{ key: string }> => {
  const formData = new FormData();
  formData.append("file", file);
  return request
    .post<unknown, { key: string }>(
      "/files/upload?folder=receipt-orders",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    )
    .catch(normalizeApiError);
};
