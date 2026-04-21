import type { ProductCategoryNode } from '../api/product-categories.api';

export function findCategoryName(nodes: ProductCategoryNode[], id: number): string {
  for (const node of nodes) {
    if (node.id === id) return node.name;
    const found = findCategoryName(node.children, id);
    if (found) return found;
  }
  return '-';
}
