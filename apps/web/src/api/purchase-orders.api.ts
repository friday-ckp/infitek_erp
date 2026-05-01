import {
  PurchaseOrderApplicationType,
  PurchaseOrderDemandType,
  PurchaseOrderReceiptStatus,
  PurchaseOrderSettlementDateType,
  PurchaseOrderSettlementType,
  PurchaseOrderStatus,
  PurchaseOrderType,
  ReceiptOrderStatus,
  type FulfillmentType,
  type YesNo,
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
  productType?: string | null;
  manufacturerModel?: string | null;
  plugType?: string | null;
  skuSpecification?: string | null;
  unitId?: number | null;
  unitName?: string | null;
  listPrice?: string | null;
  isInvoiced?: YesNo | null;
  quantity: number;
  receivedQuantity: number;
  isFullyReceived?: YesNo | null;
  unitPrice: string;
  amount: string;
  spuId?: number | null;
  spuName?: string | null;
  electricalParams?: string | null;
  coreParams?: string | null;
  hasPlugText?: string | null;
  specialAttributeNote?: string | null;
}

export interface PurchaseOrderReceiptOrderSummary {
  id: number;
  receiptCode: string;
  status: ReceiptOrderStatus;
  receiptDate: string;
  totalQuantity: number;
  totalAmount: string;
}

export interface PurchaseOrder {
  id: number;
  poCode: string;
  supplierId: number;
  supplierName: string;
  supplierCode?: string | null;
  supplierNameText?: string | null;
  supplierContactPerson?: string | null;
  supplierContactPhone?: string | null;
  supplierContactEmail?: string | null;
  supplierPaymentTermName?: string | null;
  supplierAddress?: string | null;
  poDeliveryDate?: string | null;
  arrivalDate?: string | null;
  isPrepaid?: YesNo | null;
  prepaidRatio?: number | null;
  plugPhotoKeys?: string[] | null;
  shippingDemandId?: number | null;
  shippingDemandCode?: string | null;
  salesOrderId?: number | null;
  salesOrderCode?: string | null;
  purchaseCompanyId?: number | null;
  purchaseCompanyName?: string | null;
  companyAddressCn?: string | null;
  companySigningLocation?: string | null;
  companyContactPerson?: string | null;
  companyContactPhone?: string | null;
  contractTermId?: number | null;
  contractTermName?: string | null;
  contractTemplateIdText?: string | null;
  orderType: PurchaseOrderType;
  applicationType?: PurchaseOrderApplicationType | null;
  demandType?: PurchaseOrderDemandType | null;
  status: PurchaseOrderStatus;
  currencyId?: number | null;
  currencyCode?: string | null;
  currencyName?: string | null;
  currencySymbol?: string | null;
  settlementDateType?: PurchaseOrderSettlementDateType | null;
  settlementType?: PurchaseOrderSettlementType | null;
  purchaserId?: number | null;
  purchaserName?: string | null;
  salespersonName?: string | null;
  purchaseDate?: string | null;
  totalQuantity?: number;
  totalAmount: string;
  paidAmount?: string;
  receivedTotalQuantity?: number;
  receiptStatus?: PurchaseOrderReceiptStatus;
  isFullyPaid?: YesNo | null;
  supplierStampedContractKeys?: string[] | null;
  bothStampedContractKeys?: string[] | null;
  supplierContractUploaded?: YesNo | null;
  bothContractUploaded?: YesNo | null;
  remark?: string | null;
  businessRectificationRequirement?: string | null;
  commercialRectificationRequirement?: string | null;
  formErrorMessage?: string | null;
  invoiceCompletedAt?: string | null;
  paymentCompletedAt?: string | null;
  receiptOrders?: PurchaseOrderReceiptOrderSummary[];
  createdAt: string;
  updatedAt: string;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrdersListParams {
  keyword?: string;
  status?: PurchaseOrderStatus;
  supplierId?: number;
  shippingDemandId?: number;
  orderType?: PurchaseOrderType;
  applicationType?: PurchaseOrderApplicationType;
  demandType?: PurchaseOrderDemandType;
  receiptStatus?: PurchaseOrderReceiptStatus;
  page?: number;
  pageSize?: number;
}

export interface PurchaseOrdersListData {
  list: PurchaseOrder[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
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
  purchaseSupplierId?: number | null;
  purchaseSupplierName?: string | null;
  purchaseSupplierCode?: string | null;
  purchaseSupplierContactPerson?: string | null;
  purchaseSupplierContactPhone?: string | null;
  purchaseSupplierContactEmail?: string | null;
  purchaseSupplierPaymentTermName?: string | null;
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
  purchaseCompanyId?: number;
  currencyId?: number;
  purchaserId?: number;
  purchaseDate?: string;
  poDeliveryDate?: string;
  arrivalDate?: string;
  isPrepaid?: YesNo;
  prepaidRatio?: number;
  applicationType?: PurchaseOrderApplicationType;
  demandType?: PurchaseOrderDemandType;
  settlementDateType?: PurchaseOrderSettlementDateType;
  settlementType?: PurchaseOrderSettlementType;
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
    [PurchaseOrderStatus.INVOICED]: "已开票",
    [PurchaseOrderStatus.CANCELLED]: "已取消",
  };

export const PURCHASE_ORDER_TYPE_LABELS: Record<PurchaseOrderType, string> = {
  [PurchaseOrderType.REQUISITION]: "请购型",
  [PurchaseOrderType.STOCK]: "备货型",
};

export const PURCHASE_ORDER_APPLICATION_TYPE_LABELS: Record<
  PurchaseOrderApplicationType,
  string
> = {
  [PurchaseOrderApplicationType.STOCK_PURCHASE]: "采购备货",
  [PurchaseOrderApplicationType.SALES_REQUISITION]: "销售请购",
};

export const PURCHASE_ORDER_DEMAND_TYPE_LABELS: Record<
  PurchaseOrderDemandType,
  string
> = {
  [PurchaseOrderDemandType.SALES_ORDER]: "销售订单",
  [PurchaseOrderDemandType.AFTER_SALES_ORDER]: "售后单",
  [PurchaseOrderDemandType.EXHIBITION_SAMPLE_ORDER]: "展会样品单",
};

export const PURCHASE_ORDER_SETTLEMENT_DATE_TYPE_LABELS: Record<
  PurchaseOrderSettlementDateType,
  string
> = {
  [PurchaseOrderSettlementDateType.ORDER_DATE]: "采购下单日期",
  [PurchaseOrderSettlementDateType.RECEIPT_DATE]: "采购入库日期",
  [PurchaseOrderSettlementDateType.INVOICE_DATE]: "采购开票日期",
};

export const PURCHASE_ORDER_SETTLEMENT_TYPE_LABELS: Record<
  PurchaseOrderSettlementType,
  string
> = {
  [PurchaseOrderSettlementType.MONTHLY]: "月结",
  [PurchaseOrderSettlementType.HALF_MONTHLY]: "半月结",
  [PurchaseOrderSettlementType.INVOICE_BASED]: "票结",
};

export const PURCHASE_ORDER_RECEIPT_STATUS_LABELS: Record<
  PurchaseOrderReceiptStatus,
  string
> = {
  [PurchaseOrderReceiptStatus.NOT_RECEIVED]: "未入库",
  [PurchaseOrderReceiptStatus.PARTIALLY_RECEIVED]: "部分入库",
  [PurchaseOrderReceiptStatus.RECEIVED]: "全部入库",
};

export const YES_NO_LABELS: Record<YesNo, string> = {
  yes: "是",
  no: "否",
};

export const getPurchaseOrderCreatePrefill = (
  shippingDemandId: number,
): Promise<PurchaseOrderCreatePrefill> =>
  request
    .get<
      unknown,
      PurchaseOrderCreatePrefill
    >("/purchase-orders/create-prefill", { params: { shippingDemandId } })
    .catch(normalizeApiError);

export const createPurchaseOrdersFromShippingDemand = (
  payload: CreatePurchaseOrdersFromShippingDemandPayload,
): Promise<PurchaseOrder[]> =>
  request
    .post<
      unknown,
      PurchaseOrder[]
    >("/purchase-orders/from-shipping-demand", payload)
    .catch(normalizeApiError);

export const createPurchaseOrder = (
  payload: CreatePurchaseOrderPayload,
): Promise<PurchaseOrder> =>
  request
    .post<unknown, PurchaseOrder>("/purchase-orders", payload)
    .catch(normalizeApiError);

export const getPurchaseOrders = (
  params: PurchaseOrdersListParams,
): Promise<PurchaseOrdersListData> =>
  request
    .get<unknown, PurchaseOrdersListData>("/purchase-orders", { params })
    .catch(normalizeApiError);

export const getPurchaseOrderById = (id: number): Promise<PurchaseOrder> =>
  request
    .get<unknown, PurchaseOrder>(`/purchase-orders/${id}`)
    .catch(normalizeApiError);

export const confirmInternalPurchaseOrder = (
  id: number,
): Promise<PurchaseOrder> =>
  request
    .post<unknown, PurchaseOrder>(`/purchase-orders/${id}/confirm-internal`)
    .catch(normalizeApiError);

export const confirmSupplierPurchaseOrder = (
  id: number,
): Promise<PurchaseOrder> =>
  request
    .post<unknown, PurchaseOrder>(`/purchase-orders/${id}/confirm-supplier`)
    .catch(normalizeApiError);
