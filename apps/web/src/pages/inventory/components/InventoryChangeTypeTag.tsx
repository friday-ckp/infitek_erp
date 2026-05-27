import { Tag } from 'antd';
import { changeTypeLabel, inventoryChangeTypeColor } from './inventory-page-utils';

export function InventoryChangeTypeTag({ value }: { value: string }) {
  return (
    <Tag color={inventoryChangeTypeColor[value]}>
      {changeTypeLabel(value)}
    </Tag>
  );
}
