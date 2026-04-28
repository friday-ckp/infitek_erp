import request from './request';

export interface AvailableInventoryItem {
  skuId: number | string;
  warehouseId: number | string | null;
  actualQuantity: number;
  lockedQuantity: number;
  availableQuantity: number;
  updatedAt?: string;
}

export interface InventoryBatchItem {
  id: number | string;
  batchNo: string;
  skuId: number | string;
  warehouseId: number | string;
  batchQuantity: number;
  batchLockedQuantity: number;
  batchAvailableQuantity: number;
  sourceType: string;
  sourceDocumentId: number | string | null;
  receiptDate: string;
  updatedAt?: string;
}

export interface QueryAvailableInventoryParams {
  skuIds?: number[];
  warehouseId?: number;
}

export interface CreateOpeningInventoryPayload {
  skuId: number;
  warehouseId: number;
  quantity: number;
  receiptDate?: string;
}

export interface OpeningInventoryResult {
  summary: AvailableInventoryItem;
  batch: {
    id: number;
    batchNo: string;
    skuId: number;
    warehouseId: number;
    batchQuantity: number;
    batchLockedQuantity: number;
    sourceType: string;
    receiptDate: string;
  };
}

function normalizeApiError(error: unknown): never {
  if (typeof error === 'object' && error !== null) throw error;
  throw { message: '请求失败，请稍后重试' };
}

export const getAvailableInventory = (
  params: QueryAvailableInventoryParams,
): Promise<AvailableInventoryItem[]> =>
  request
    .get<unknown, AvailableInventoryItem[]>('/inventory/available', {
      params: {
        skuIds: params.skuIds?.length ? params.skuIds.join(',') : undefined,
        warehouseId: params.warehouseId,
      },
    })
    .catch(normalizeApiError);

export const getInventoryBatches = (
  params: QueryAvailableInventoryParams,
): Promise<InventoryBatchItem[]> =>
  request
    .get<unknown, InventoryBatchItem[]>('/inventory/batches', {
      params: {
        skuIds: params.skuIds?.length ? params.skuIds.join(',') : undefined,
        warehouseId: params.warehouseId,
      },
    })
    .catch(normalizeApiError);

export const createOpeningInventory = (
  payload: CreateOpeningInventoryPayload,
): Promise<OpeningInventoryResult> =>
  request
    .post<unknown, OpeningInventoryResult>('/inventory/opening-balances', payload)
    .catch(normalizeApiError);
