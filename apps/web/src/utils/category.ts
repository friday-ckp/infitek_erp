import type { ProductCategoryNode } from '../api/product-categories.api';

export function findCategoryName(nodes: ProductCategoryNode[], id: number | string): string {
  const numId = Number(id);
  for (const node of nodes) {
    if (Number(node.id) === numId) return node.name;
    const found = findCategoryName(node.children, numId);
    if (found !== '') return found;
  }
  return '';
}
