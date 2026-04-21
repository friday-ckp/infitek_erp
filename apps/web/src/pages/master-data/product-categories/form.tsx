import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Form, Input, message, Select, Skeleton, TreeSelect } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createProductCategory,
  getProductCategoryById,
  getProductCategoryTree,
  updateProductCategory,
  type ProductCategoryNode,
} from '../../../api/product-categories.api';
import { getUsers } from '../../../api/users.api';

interface TreeSelectNode {
  title: string;
  value: number;
  selectable: boolean;
  children?: TreeSelectNode[];
}

function buildTreeSelectData(nodes: ProductCategoryNode[]): TreeSelectNode[] {
  return nodes.map((node) => ({
    title: node.name,
    value: node.id,
    selectable: node.level < 3,
    children: node.children.length > 0 ? buildTreeSelectData(node.children) : undefined,
  }));
}

function findNodeById(nodes: ProductCategoryNode[], id: number): ProductCategoryNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNodeById(node.children, id);
    if (found) return found;
  }
  return null;
}

const LEVEL_STYLES: Record<number, { bg: string; color: string }> = {
  1: { bg: '#EDE9FE', color: '#7C3AED' },
  2: { bg: '#DBEAFE', color: '#2563EB' },
  3: { bg: '#D1FAE5', color: '#059669' },
};

export default function ProductCategoryFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [submitHovered, setSubmitHovered] = useState(false);

  const isEdit = Boolean(id);
  const parentIdFromQuery = searchParams.get('parentId');

  const treeQuery = useQuery({
    queryKey: ['product-categories', 'tree'],
    queryFn: getProductCategoryTree,
  });

  const detailQuery = useQuery({
    queryKey: ['product-categories', Number(id)],
    queryFn: () => getProductCategoryById(Number(id)),
    enabled: isEdit,
  });

  useEffect(() => {
    if (isEdit && detailQuery.data) {
      form.setFieldsValue({
        name: detailQuery.data.name,
        nameEn: detailQuery.data.nameEn ?? undefined,
        purchaseOwner: detailQuery.data.purchaseOwner ?? undefined,
        productOwner: detailQuery.data.productOwner ?? undefined,
      });
    } else if (!isEdit && parentIdFromQuery) {
      form.setFieldsValue({ parentId: Number(parentIdFromQuery) });
    }
  }, [isEdit, detailQuery.data, parentIdFromQuery, form]);

  const createMutation = useMutation({
    mutationFn: createProductCategory,
    onSuccess: () => {
      message.success('创建成功');
      queryClient.invalidateQueries({ queryKey: ['product-categories', 'tree'] });
      navigate('/master-data/product-categories');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ payload }: { payload: { name?: string; nameEn?: string; purchaseOwner?: string; productOwner?: string } }) =>
      updateProductCategory(Number(id), payload),
    onSuccess: () => {
      message.success('保存成功');
      queryClient.invalidateQueries({ queryKey: ['product-categories', 'tree'] });
      navigate('/master-data/product-categories');
    },
  });

  const usersQuery = useQuery({
    queryKey: ['users', 'all'],
    queryFn: () => getUsers(1, 200),
    staleTime: 5 * 60 * 1000,
  });
  const userOptions = (usersQuery.data?.list ?? []).map((u) => ({ label: u.name, value: u.name }));

  const loading = isEdit && detailQuery.isLoading;
  const submitting = createMutation.isPending || updateMutation.isPending;
  const treeSelectData = buildTreeSelectData(treeQuery.data ?? []);

  // 父级分类信息（新建子分类时展示）
  const parentNode = !isEdit && parentIdFromQuery && treeQuery.data
    ? findNodeById(treeQuery.data, Number(parentIdFromQuery))
    : null;

  const handleSubmit = (values: { name: string; nameEn?: string; parentId?: number; purchaseOwner?: string; productOwner?: string }) => {
    if (isEdit) {
      updateMutation.mutate({
        payload: { name: values.name, nameEn: values.nameEn, purchaseOwner: values.purchaseOwner, productOwner: values.productOwner },
      });
    } else {
      createMutation.mutate({
        name: values.name,
        nameEn: values.nameEn,
        parentId: values.parentId ?? (parentIdFromQuery ? Number(parentIdFromQuery) : undefined),
        purchaseOwner: values.purchaseOwner,
        productOwner: values.productOwner,
      });
    }
  };

  return (
    <div>
      {/* 页头 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => navigate('/master-data/product-categories')}
          style={{
            width: 32, height: 32, borderRadius: 8,
            border: '1px solid #E5E7EB', background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#6B7280', flexShrink: 0,
            transition: 'border-color .15s, color .15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#A5B4FC'; (e.currentTarget as HTMLButtonElement).style.color = '#4F46E5'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLButtonElement).style.color = '#6B7280'; }}
          title="返回"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L6 8l4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>
            {isEdit ? '编辑产品分类' : parentIdFromQuery ? `新建子分类` : '新建一级分类'}
          </div>
          {/* 父级上下文提示 */}
          {parentNode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>父级：</span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                background: LEVEL_STYLES[parentNode.level]?.bg ?? '#EDE9FE',
                color: LEVEL_STYLES[parentNode.level]?.color ?? '#7C3AED',
              }}>
                L{parentNode.level}
              </span>
              <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{parentNode.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* 表单卡片 */}
      <div style={{ maxWidth: 560, background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <Skeleton active loading={loading} style={{ padding: 24 }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            style={{ padding: '20px 24px 24px' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Form.Item
                label={<span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>分类名称</span>}
                name="name"
                rules={[
                  { required: true, message: '请输入分类名称' },
                  { max: 100, message: '不能超过100个字符' },
                ]}
                style={{ marginBottom: 16 }}
              >
                <Input placeholder="请输入中文名称" size="middle" />
              </Form.Item>

              <Form.Item
                label={<span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>英文名称</span>}
                name="nameEn"
                rules={[{ max: 100, message: '不能超过100个字符' }]}
                style={{ marginBottom: 16 }}
              >
                <Input placeholder="可选" size="middle" />
              </Form.Item>
            </div>

            {/* 新建子分类时展示只读父级；新建一级分类时可选父级 */}
            {!isEdit && parentIdFromQuery && (
              <Form.Item
                label={<span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>父级分类</span>}
                style={{ marginBottom: 16 }}
              >
                <Input
                  value={parentNode ? parentNode.name : `分类 #${parentIdFromQuery}`}
                  disabled
                  size="middle"
                />
              </Form.Item>
            )}
            {!isEdit && !parentIdFromQuery && (
              <Form.Item
                label={<span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>父级分类</span>}
                name="parentId"
                style={{ marginBottom: 16 }}
              >
                <TreeSelect
                  placeholder="不选则创建为一级分类"
                  allowClear
                  treeData={treeSelectData}
                  loading={treeQuery.isLoading}
                  treeDefaultExpandAll
                  size="middle"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Form.Item
                label={<span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>采购负责人</span>}
                name="purchaseOwner"
                style={{ marginBottom: 24 }}
              >
                <Select
                  placeholder="请选择用户"
                  allowClear
                  showSearch
                  options={userOptions}
                  loading={usersQuery.isLoading}
                  size="middle"
                  style={{ width: '100%' }}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Form.Item>

              <Form.Item
                label={<span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>产品负责人</span>}
                name="productOwner"
                style={{ marginBottom: 24 }}
              >
                <Select
                  placeholder="请选择用户"
                  allowClear
                  showSearch
                  options={userOptions}
                  loading={usersQuery.isLoading}
                  size="middle"
                  style={{ width: '100%' }}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </div>

            {/* 底部操作栏 */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              paddingTop: 16, borderTop: '1px solid #F3F4F6',
            }}>
              <button
                type="submit"
                disabled={submitting}
                onMouseEnter={() => setSubmitHovered(true)}
                onMouseLeave={() => setSubmitHovered(false)}
                style={{
                  padding: '7px 20px', borderRadius: 7, fontSize: 13, fontWeight: 500,
                  background: submitting ? '#818CF8' : submitHovered ? '#4338CA' : '#4F46E5',
                  color: '#fff', border: 'none',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  transition: 'background .15s',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {submitting && (
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                    <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,.4)" strokeWidth="2"/>
                    <path d="M8 2a6 6 0 016 6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  </svg>
                )}
                {isEdit ? '保存' : '创建'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/master-data/product-categories')}
                style={{
                  padding: '7px 16px', borderRadius: 7, fontSize: 13, fontWeight: 500,
                  background: '#fff', color: '#374151',
                  border: '1px solid #D1D5DB', cursor: 'pointer',
                  transition: 'border-color .15s, color .15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#A5B4FC'; (e.currentTarget as HTMLButtonElement).style.color = '#4F46E5'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#D1D5DB'; (e.currentTarget as HTMLButtonElement).style.color = '#374151'; }}
              >
                取消
              </button>
            </div>
          </Form>
        </Skeleton>
      </div>
    </div>
  );
}
