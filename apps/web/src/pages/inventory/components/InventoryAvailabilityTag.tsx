import { inventoryTag } from './inventory-page-utils';

export function InventoryAvailabilityTag({ value }: { value: number }) {
  return (
    <span className={`inventory-availability-tag ${inventoryTag(value)}`}>
      {value > 0 ? `可用 ${value}` : '无可用库存'}
    </span>
  );
}
