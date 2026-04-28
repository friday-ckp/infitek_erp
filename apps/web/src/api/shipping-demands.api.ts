import { ShippingDemandStatus } from '@infitek/shared';
import request from './request';

export interface ShippingDemandItem {
  id: number;
  shippingDemandId: number;
  salesOrderItemId: number;
  skuId: number;
  skuCode: string;
  productNameCn?: string | null;
  productNameEn?: string | null;
  requiredQuantity: number;
  availableStockSnapshot?: Array<{
    skuId: number;
    warehouseId: number | null;
    actualQuantity: number;
    lockedQuantity: number;
    availableQuantity: number;
  }> | null;
  fulfillmentType?: string | null;
  stockRequiredQuantity: number;
  purchaseRequiredQuantity: number;
  lockedRemainingQuantity: number;
  shippedQuantity: number;
}

export interface ShippingDemand {
  id: number;
  demandCode: string;
  salesOrderId: number;
  sourceDocumentCode: string;
  status: ShippingDemandStatus;
  customerName: string;
  customerCode: string;
  currencyCode?: string | null;
  destinationCountryName?: string | null;
  destinationPortName?: string | null;
  merchandiserName?: string | null;
  requiredDeliveryAt?: string | null;
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
  items?: ShippingDemandItem[];
}

export interface ShippingDemandListParams {
  keyword?: string;
  status?: ShippingDemandStatus;
  customerId?: number;
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
