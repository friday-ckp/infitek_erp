import { InventoryChangeType } from '@infitek/shared';
import type { Sku } from '../../../api/skus.api';
import type { Warehouse } from '../../../api/warehouses.api';

export const inventoryChangeTypeOptions = [
  { label: '期初录入', value: InventoryChangeType.INITIAL },
  { label: '采购入库', value: InventoryChangeType.PURCHASE_RECEIPT },
  { label: '发货出库', value: InventoryChangeType.OUTBOUND },
  { label: '锁定', value: InventoryChangeType.LOCK },
  { label: '解锁', value: InventoryChangeType.UNLOCK },
];

export const inventoryChangeTypeColor: Record<string, string> = {
  [InventoryChangeType.INITIAL]: 'blue',
  [InventoryChangeType.PURCHASE_RECEIPT]: 'green',
  [InventoryChangeType.OUTBOUND]: 'red',
  [InventoryChangeType.LOCK]: 'gold',
  [InventoryChangeType.UNLOCK]: 'purple',
};

export function toNumberId(value: number | string | null | undefined) {
  if (value === null || value === undefined) return null;
  const id = Number(value);
  return Number.isFinite(id) ? id : null;
}

export function sourceTypeLabel(value: string) {
  if (value === 'initial') return '期初录入';
  if (value === 'purchase_receipt') return '采购入库';
  return value;
}

export function changeTypeLabel(value: string) {
  return inventoryChangeTypeOptions.find((item) => item.value === value)?.label ?? value;
}

export function signedNumber(value: number) {
  if (value > 0) return `+${value}`;
  return String(value);
}

export function inventoryTag(value: number) {
  return value > 0 ? 'positive' : 'empty';
}

export function buildSkuMap(skus: Sku[] | undefined) {
  const map = new Map<number, Sku>();
  skus?.forEach((sku) => {
    const skuId = toNumberId(sku.id);
    if (skuId !== null) map.set(skuId, sku);
  });
  return map;
}

export function buildWarehouseMap(warehouses: Warehouse[] | undefined) {
  const map = new Map<number, Warehouse>();
  warehouses?.forEach((warehouse) => {
    const warehouseId = toNumberId(warehouse.id);
    if (warehouseId !== null) map.set(warehouseId, warehouse);
  });
  return map;
}

export function buildSkuOptions(skus: Sku[] | undefined) {
  return (skus ?? []).flatMap((sku) => {
    const skuId = toNumberId(sku.id);
    if (skuId === null) return [];
    return [{
      label: `${sku.skuCode} ${sku.nameCn ?? sku.specification ?? ''}`,
      value: skuId,
    }];
  });
}

export function buildWarehouseOptions(warehouses: Warehouse[] | undefined) {
  return (warehouses ?? []).flatMap((warehouse) => {
    const warehouseId = toNumberId(warehouse.id);
    if (warehouseId === null) return [];
    return [{
      label: warehouse.name,
      value: warehouseId,
    }];
  });
}

export function skuDisplayName(sku: Sku | undefined) {
  return sku?.nameCn ?? sku?.nameEn ?? sku?.specification;
}

export function parseNumberSearchParam(value: string | null) {
  const id = toNumberId(value);
  return id ?? undefined;
}

export function parseSkuIdsSearchParam(value: string | null) {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => toNumberId(item.trim()))
    .filter((item): item is number => item !== null);
}

export function buildInventoryContextSearch(params: {
  skuId?: number | null;
  skuIds?: number[] | null;
  warehouseId?: number | null;
}) {
  const search = new URLSearchParams();
  if (params.skuIds?.length) search.set('skuIds', params.skuIds.join(','));
  if (params.skuId) search.set('skuId', String(params.skuId));
  if (params.warehouseId) search.set('warehouseId', String(params.warehouseId));
  return search.toString();
}
