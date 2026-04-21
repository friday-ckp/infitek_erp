import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, Button, Result, Skeleton } from 'antd';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteProductCategory, getProductCategoryTree, type ProductCategoryNode } from '../../../api/product-categories.api';

// ─── helpers ───────────────────────────────────────────────────────────────

function findNodeById(nodes: ProductCategoryNode[], id: number): ProductCategoryNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNodeById(node.children, id);
    if (found) return found;
  }
  return null;
}

function buildPath(nodes: ProductCategoryNode[], id: number, path: ProductCategoryNode[] = []): ProductCategoryNode[] {
  for (const node of nodes) {
    const next = [...path, node];
    if (node.id === id) return next;
    const found = buildPath(node.children, id, next);
    if (found.length) return found;
  }
  return [];
}

function countAll(nodes: ProductCategoryNode[]): { l1: number; total: number } {
  let total = 0;
  function walk(items: ProductCategoryNode[]) {
    for (const n of items) { total++; walk(n.children); }
  }
  walk(nodes);
  return { l1: nodes.length, total };
}

// ─── level badge ───────────────────────────────────────────────────────────

const LEVEL_STYLES: Record<number, { bg: string; color: string }> = {
  1: { bg: '#EDE9FE', color: '#7C3AED' },
  2: { bg: '#DBEAFE', color: '#2563EB' },
  3: { bg: '#D1FAE5', color: '#059669' },
};

function LevelBadge({ level }: { level: number }) {
  const s = LEVEL_STYLES[level] ?? LEVEL_STYLES[1];
  return (
    <span style={{
      fontSize: 9.5, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
      background: s.bg, color: s.color, flexShrink: 0,
    }}>
      L{level}
    </span>
  );
}

// ─── tree node ─────────────────────────────────────────────────────────────

function TreeNode({
  node, selectedId, expandedIds, onSelect, onToggle, depth,
}: {
  node: ProductCategoryNode;
  selectedId: number | null;
  expandedIds: Set<number>;
  onSelect: (id: number) => void;
  onToggle: (id: number) => void;
  depth: number;
}) {
  const isSelected = selectedId === node.id;
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = node.children.length > 0;
  const [hovered, setHovered] = useState(false);

  return (
    <div>
      <div
        onClick={() => onSelect(node.id)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex', alignItems: 'center',
          padding: '6px 8px',
          paddingLeft: depth > 0 ? 8 + depth * 20 : 8,
          borderRadius: 7, cursor: 'pointer',
          gap: 6, fontSize: 13,
          color: isSelected ? '#4F46E5' : '#374151',
          fontWeight: isSelected ? 600 : 400,
          background: isSelected ? '#EEF2FF' : hovered ? '#F3F4F6' : 'transparent',
          transition: 'background .12s, color .12s',
          userSelect: 'none',
        }}
      >
        {/* 展开箭头 */}
        <span
          onClick={(e) => { e.stopPropagation(); if (hasChildren) onToggle(node.id); }}
          style={{
            width: 16, height: 16, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#9CA3AF',
            opacity: hasChildren ? 1 : 0,
            pointerEvents: hasChildren ? 'auto' : 'none',
            transform: isExpanded ? 'rotate(90deg)' : 'none',
            transition: 'transform .18s',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>

        <LevelBadge level={node.level} />

        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {node.name}
        </span>

        {/* 子分类计数 */}
        <span style={{
          fontSize: 10.5, fontWeight: 500,
          padding: '1px 6px', borderRadius: 8,
          background: isSelected ? '#C7D2FE' : '#F3F4F6',
          color: isSelected ? '#4F46E5' : '#9CA3AF',
          flexShrink: 0,
        }}>
          {node.children.length}
        </span>
      </div>

      {/* 子节点 */}
      {hasChildren && (
        <div style={{
          overflow: 'hidden',
          maxHeight: isExpanded ? 9999 : 0,
          transition: 'max-height 0.22s cubic-bezier(.4,0,.2,1)',
        }}>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onToggle={onToggle}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── stat card ─────────────────────────────────────────────────────────────

// ─── main page ─────────────────────────────────────────────────────────────

export default function ProductCategoriesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { message, modal } = App.useApp();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [searchText, setSearchText] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const query = useQuery({
    queryKey: ['product-categories', 'tree'],
    queryFn: getProductCategoryTree,
  });

  // 数据加载后默认全展开
  useEffect(() => {
    if (!query.data) return;
    const ids = new Set<number>();
    function collectIds(nodes: ProductCategoryNode[]) {
      for (const n of nodes) { ids.add(n.id); collectIds(n.children); }
    }
    collectIds(query.data);
    setExpandedIds(ids);
  }, [query.data]);

  if (query.isError && !query.data) {
    return (
      <Result
        status="error"
        title="加载产品分类失败"
        subTitle="请检查网络或稍后重试"
        extra={<Button type="primary" onClick={() => query.refetch()}>重试</Button>}
      />
    );
  }

  const treeNodes = query.data ?? [];
  const { l1, total } = countAll(treeNodes);
  const selectedNode = selectedId !== null ? findNodeById(treeNodes, selectedId) : null;
  const pathNodes = selectedId !== null ? buildPath(treeNodes, selectedId) : [];

  const handleToggle = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // 搜索过滤（简单名称匹配）
  function filterNodes(nodes: ProductCategoryNode[], kw: string): ProductCategoryNode[] {
    if (!kw) return nodes;
    const result: ProductCategoryNode[] = [];
    for (const n of nodes) {
      const childMatches = filterNodes(n.children, kw);
      if (n.name.includes(kw) || childMatches.length > 0) {
        result.push({ ...n, children: childMatches });
      }
    }
    return result;
  }
  const displayNodes = filterNodes(treeNodes, searchText.trim());

  return (
    <div>
      {/* 页头 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>产品分类管理</div>
          <div style={{ fontSize: 12.5, color: '#9CA3AF', marginTop: 3 }}>
            共 {l1} 个一级分类，{total - l1} 个子分类
          </div>
        </div>
        <button
          onClick={() => navigate('/master-data/product-categories/create')}
          style={{
            padding: '7px 16px', borderRadius: 7, fontSize: 13, fontWeight: 500,
            background: '#4F46E5', color: '#fff', border: 'none', cursor: 'pointer',
            transition: 'background .15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#4338CA'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#4F46E5'; }}
        >
          + 新建分类
        </button>
      </div>

      <Skeleton active loading={query.isLoading && !query.data}>
        <div style={{ display: 'flex', gap: 16, minHeight: 600 }}>

          {/* 左侧树形面板 */}
          <div style={{
            width: 280, flexShrink: 0,
            background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB',
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
          }}>
            {/* 面板头部 */}
            <div style={{
              padding: '14px 16px', borderBottom: '1px solid #F3F4F6',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>分类树</span>
              <span style={{ fontSize: 11, color: '#9CA3AF', background: '#F3F4F6', padding: '2px 7px', borderRadius: 8 }}>
                {l1} / {total} 条
              </span>
            </div>

            {/* 搜索框 */}
            <div style={{ margin: '10px 12px', position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
                color: '#9CA3AF', pointerEvents: 'none', display: 'flex',
              }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path d="M14 14l-4-4m0 0A5 5 0 102 7a5 5 0 008 5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </span>
              <input
                type="text"
                placeholder="搜索分类名称..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                style={{
                  width: '100%', padding: '7px 10px 7px 32px',
                  border: `1px solid ${searchFocused ? '#818CF8' : '#E5E7EB'}`,
                  borderRadius: 7, fontSize: 12.5, color: '#374151',
                  outline: 'none',
                  background: searchFocused ? '#fff' : '#FAFAFA',
                  transition: 'border-color .15s, background .15s',
                }}
              />
            </div>

            {/* 树形主体 */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px 12px' }}
              className="tree-scroll"
            >
              <style>{`.tree-scroll::-webkit-scrollbar{width:3px}.tree-scroll::-webkit-scrollbar-thumb{background:#E5E7EB;border-radius:2px}`}</style>
              {displayNodes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF', fontSize: 13 }}>
                  {treeNodes.length === 0 ? (
                    <>
                      <div style={{ marginBottom: 12 }}>暂无分类</div>
                      <button
                        onClick={() => navigate('/master-data/product-categories/create')}
                        style={{ padding: '6px 14px', borderRadius: 7, fontSize: 12, background: '#4F46E5', color: '#fff', border: 'none', cursor: 'pointer' }}
                      >
                        新建分类
                      </button>
                    </>
                  ) : '无匹配结果'}
                </div>
              ) : (
                displayNodes.map((node) => (
                  <TreeNode
                    key={node.id}
                    node={node}
                    selectedId={selectedId}
                    expandedIds={expandedIds}
                    onSelect={setSelectedId}
                    onToggle={handleToggle}
                    depth={0}
                  />
                ))
              )}
            </div>
          </div>

          {/* 右侧详情面板 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {!selectedNode ? (
              <div style={{
                flex: 1, background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 12, color: '#9CA3AF',
              }}>
                <div style={{ width: 56, height: 56, background: '#F9FAFB', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
                    <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="#D1D5DB" strokeWidth="1.3"/>
                    <path d="M2 7h12" stroke="#D1D5DB" strokeWidth="1.2"/>
                  </svg>
                </div>
                <span style={{ fontSize: 13 }}>请在左侧选择分类</span>
              </div>
            ) : (
              <DetailPanel
                node={selectedNode}
                pathNodes={pathNodes}
                onEdit={() => navigate(`/master-data/product-categories/${selectedNode.id}/edit`)}
                onCreateChild={() => navigate(`/master-data/product-categories/create?parentId=${selectedNode.id}`)}
                onDelete={() => {
                  modal.confirm({
                    title: `删除「${selectedNode.name}」？`,
                    content: selectedNode.children.length > 0
                      ? '该分类下有子分类，请先删除子分类后再操作。'
                      : '删除后不可恢复。',
                    okText: '确认删除',
                    okButtonProps: { danger: true, disabled: selectedNode.children.length > 0 },
                    cancelText: '取消',
                    onOk: async () => {
                      try {
                        await deleteProductCategory(selectedNode.id);
                        message.success('删除成功');
                        queryClient.invalidateQueries({ queryKey: ['product-categories', 'tree'] });
                        setSelectedId(null);
                      } catch {
                        // 错误由 request.ts 统一处理
                      }
                    },
                  });
                }}
              />
            )}
          </div>
        </div>
      </Skeleton>
    </div>
  );
}

// ─── detail panel ──────────────────────────────────────────────────────────

function DetailPanel({
  node, pathNodes, onEdit, onCreateChild, onDelete,
}: {
  node: ProductCategoryNode;
  pathNodes: ProductCategoryNode[];
  onEdit: () => void;
  onCreateChild: () => void;
  onDelete: () => void;
}) {
  const levelStyle = LEVEL_STYLES[node.level] ?? LEVEL_STYLES[1];
  const isMaxLevel = node.level >= 3;

  return (
    <>
      {/* 详情头部卡片 */}
      <div style={{
        background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB',
        padding: '16px 20px',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 11,
            background: 'linear-gradient(135deg, #EDE9FE, #C7D2FE)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="#7C3AED" strokeWidth="1.3"/>
              <path d="M2 7h12" stroke="#7C3AED" strokeWidth="1.2"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{node.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 8,
                background: levelStyle.bg, color: levelStyle.color,
              }}>
                第 {node.level} 级
              </span>
              {node.code && (
                <span style={{ fontSize: 11.5, color: '#6B7280' }}># {node.code}</span>
              )}
            </div>
            {/* 路径面包屑 */}
            {pathNodes.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5, fontSize: 11.5 }}>
                <span style={{ color: '#9CA3AF', fontSize: 11 }}>路径：</span>
                {pathNodes.map((p, i) => (
                  <span key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {i > 0 && <span style={{ color: '#D1D5DB' }}>›</span>}
                    <span style={{
                      color: i === pathNodes.length - 1 ? '#4F46E5' : '#6B7280',
                      fontWeight: i === pathNodes.length - 1 ? 600 : 400,
                    }}>
                      {p.name}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <BtnDefault label="编辑" onClick={onEdit} />
          <BtnDashed
            label="+ 子分类"
            disabled={isMaxLevel}
            title={isMaxLevel ? '已达最大层级（3级）' : undefined}
            onClick={onCreateChild}
          />
          <BtnDanger label="删除" onClick={onDelete} />
        </div>
      </div>

      {/* 基本信息卡片 */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <div style={{
          padding: '12px 18px', borderBottom: '1px solid #F3F4F6',
          fontSize: 12.5, fontWeight: 600, color: '#6B7280',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M8 7v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            <circle cx="8" cy="5" r=".8" fill="currentColor"/>
          </svg>
          基本信息
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <InfoItem label="中文名称" value={node.name} />
          <InfoItem label="英文名称" value={node.nameEn} />
          <InfoItem label="采购负责人" value={node.purchaseOwner} />
          <InfoItem label="产品负责人" value={node.productOwner} />
          <InfoItem label="父级分类" value={node.parentId ? undefined : '—'} rawValue={node.parentId ? String(node.parentId) : '—'} />
          <InfoItem label="创建时间" value={node.createdAt ? node.createdAt.slice(0, 10) : null} />
        </div>
      </div>
    </>
  );
}

function InfoItem({ label, value, rawValue }: { label: string; value?: string | null; rawValue?: string }) {
  const display = rawValue ?? value;
  const isEmpty = !display || display === '—';
  return (
    <div style={{
      padding: '12px 18px',
      borderBottom: '1px solid #F9FAFB',
    }}>
      <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, marginBottom: 3 }}>{label}</div>
      <div style={{
        fontSize: 13.5, fontWeight: 500,
        color: isEmpty ? '#D1D5DB' : '#111827',
        fontStyle: isEmpty ? 'italic' : 'normal',
      }}>
        {isEmpty ? '—' : display}
      </div>
    </div>
  );
}

function BtnDefault({ label, onClick }: { label: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: 'pointer',
        background: '#fff', color: hovered ? '#4F46E5' : '#374151',
        border: `1px solid ${hovered ? '#A5B4FC' : '#D1D5DB'}`,
        transition: 'all .15s',
      }}
    >
      {label}
    </button>
  );
}

function BtnDashed({ label, disabled, title, onClick }: { label: string; disabled?: boolean; title?: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={title}
      style={{
        padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500,
        background: hovered && !disabled ? '#EEF2FF' : '#fff',
        color: '#6366F1',
        border: '1.5px dashed #C7D2FE',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all .15s',
      }}
    >
      {label}
    </button>
  );
}

function BtnDanger({ label, onClick }: { label: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: 'pointer',
        background: hovered ? '#FEF2F2' : '#fff',
        color: hovered ? '#DC2626' : '#9CA3AF',
        border: `1px solid ${hovered ? '#FECACA' : '#E5E7EB'}`,
        transition: 'all .15s',
      }}
    >
      {label}
    </button>
  );
}
