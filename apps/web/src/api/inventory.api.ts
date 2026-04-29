import request from './request';
import type { InventoryChangeType } from '@infitek/shared';

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

export interface InventoryTransactionItem {
  id: number | string;
  skuId: number | string;
  warehouseId: number | string;
  inventoryBatchId: number | string | null;
  changeType: InventoryChangeType;
  quantityChange: number;
  actualQuantityDelta: number;
  lockedQuantityDelta: number;
  availableQuantityDelta: number;
  beforeActualQuantity: number;
  afterActualQuantity: number;
  beforeLockedQuantity: number;
  afterLockedQuantity: number;
  beforeAvailableQuantity: number;
  afterAvailableQuantity: number;
  sourceDocumentType: string;
  sourceDocumentId: number | string;
  sourceDocumentItemId: number | string | null;
  sourceActionKey: string;
  operatedBy: string | null;
  operatedAt: string;
}

export interface InventoryTransactionsPage {
  data: InventoryTransactionItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface QueryAvailableInventoryParams {
  skuIds?: number[];
  warehouseId?: number;
}

export interface QueryInventoryTransactionParams {
  skuId?: number;
  warehouseId?: number;
  changeType?: InventoryChangeType;
  startTime?: string;
  endTime?: string;
  page?: number;
  pageSize?: number;
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

export const getInventoryTransactions = (
  params: QueryInventoryTransactionParams,
): Promise<InventoryTransactionsPage> =>
  request
    .get<unknown, InventoryTransactionsPage>('/inventory/transactions', {
      params,
    })
    .catch(normalizeApiError);

export const createOpeningInventory = (
  payload: CreateOpeningInventoryPayload,
): Promise<OpeningInventoryResult> =>
  request
    .post<unknown, OpeningInventoryResult>('/inventory/opening-balances', payload)
    .catch(normalizeApiError);
