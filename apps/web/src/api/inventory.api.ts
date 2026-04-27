import request from './request';

export interface AvailableInventoryItem {
  skuId: number;
  warehouseId: number | null;
  actualQuantity: number;
  lockedQuantity: number;
  availableQuantity: number;
  updatedAt?: string;
}

export interface QueryAvailableInventoryParams {
  skuIds: number[];
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
        skuIds: params.skuIds.join(','),
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
