import { useEffect, useRef } from 'react';
import { Breadcrumb, Button, Result, Skeleton } from 'antd';
import {
  ProForm,
  ProFormSelect,
  ProFormText,
  type ProFormInstance,
} from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  createProductCategory,
  getProductCategoryById,
  getProductCategoryTree,
  updateProductCategory,
  type ProductCategoryNode,
} from '../../../api/product-categories.api';
import { getUsers } from '../../../api/users.api';
import '../master-page.css';

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

export default function ProductCategoryFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const formRef = useRef<ProFormInstance>(undefined);

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

  const createMutation = useMutation({
    mutationFn: createProductCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-categories', 'tree'] });
      navigate('/master-data/product-categories');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { name?: string; nameEn?: string; purchaseOwner?: string; productOwner?: string }) =>
      updateProductCategory(Number(id), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-categories', 'tree'] });
      navigate('/master-data/product-categories');
    },
  });

  const usersQuery = useQuery({
    queryKey: ['users', 'all'],
    queryFn: () => getUsers(1, 200),
    staleTime: 5 * 60 * 1000,
  });

  const userOptions = (usersQuery.data?.list ?? []).map((user) => ({ label: user.name, value: user.name }));
  const treeSelectData = buildTreeSelectData(treeQuery.data ?? []);
  const parentNode =
    !isEdit && parentIdFromQuery && treeQuery.data ? findNodeById(treeQuery.data, Number(parentIdFromQuery)) : null;

  useEffect(() => {
    if (isEdit && detailQuery.data) {
      formRef.current?.setFieldsValue({
        name: detailQuery.data.name,
        nameEn: detailQuery.data.nameEn ?? undefined,
        purchaseOwner: detailQuery.data.purchaseOwner ?? undefined,
        productOwner: detailQuery.data.productOwner ?? undefined,
      });
    } else if (!isEdit && parentIdFromQuery) {
      formRef.current?.setFieldsValue({ parentId: Number(parentIdFromQuery) });
    }
  }, [isEdit, detailQuery.data, parentIdFromQuery]);

  if (isEdit && detailQuery.isError && !detailQuery.data) {
    return (
      <Result
        status="error"
        title="分类详情加载失败"
        subTitle="请检查网络或稍后重试"
        extra={[
          <Button key="retry" type="primary" onClick={() => detailQuery.refetch()}>重试</Button>,
          <Button key="back" onClick={() => navigate('/master-data/product-categories')}>返回列表</Button>,
        ]}
      />
    );
  }

  return (
    <div className="master-page master-form-page">
      <Breadcrumb
        items={[
          {
            title: (
              <Button type="link" className="master-breadcrumb-link" onClick={() => navigate('/master-data/product-categories')}>
                主数据
              </Button>
            ),
          },
          {
            title: (
              <Button type="link" className="master-breadcrumb-link" onClick={() => navigate('/master-data/product-categories')}>
                产品分类
              </Button>
            ),
          },
          { title: isEdit ? `编辑 ${detailQuery.data?.name || ''}` : parentNode ? `新建 ${parentNode.name} 子分类` : '新建分类' },
        ]}
      />

      <ProForm
        formRef={formRef}
        submitter={false}
        loading={isEdit && detailQuery.isLoading}
        onFinish={async (values) => {
          if (isEdit) {
            await updateMutation.mutateAsync({
              name: values.name,
              nameEn: values.nameEn,
              purchaseOwner: values.purchaseOwner,
              productOwner: values.productOwner,
            });
          } else {
            await createMutation.mutateAsync({
              name: values.name,
              nameEn: values.nameEn,
              parentId: values.parentId ?? (parentIdFromQuery ? Number(parentIdFromQuery) : undefined),
              purchaseOwner: values.purchaseOwner,
              productOwner: values.productOwner,
            });
          }
          return true;
        }}
      >
        <div className="master-info-card">
          <div className="master-form-body">
            {isEdit && detailQuery.isLoading ? <Skeleton active paragraph={{ rows: 5 }} /> : null}

            {!isEdit && parentNode ? (
              <div className="master-info-tip" style={{ marginTop: 0, marginBottom: 12 }}>
                当前将创建在父级分类「{parentNode.name}」下。
              </div>
            ) : null}

            <ProForm.Group>
              <ProFormText
                name="name"
                label="分类名称"
                width="md"
                placeholder="请输入分类名称"
                rules={[
                  { required: true, message: '请输入分类名称' },
                  { max: 100, message: '不能超过100个字符' },
                ]}
              />
              <ProFormText
                name="nameEn"
                label="英文名称"
                width="md"
                placeholder="可选"
                rules={[{ max: 100, message: '不能超过100个字符' }]}
              />
              {!isEdit && !parentIdFromQuery ? (
                <ProFormSelect
                  name="parentId"
                  label="父级分类"
                  width="md"
                  placeholder="不选则创建为一级分类"
                  options={treeSelectData.map((item) => ({ label: item.title, value: item.value }))}
                  showSearch
                  allowClear
                />
              ) : null}
              <ProFormSelect
                name="purchaseOwner"
                label="采购负责人"
                width="md"
                placeholder="请选择用户"
                showSearch
                options={userOptions}
                fieldProps={{ optionFilterProp: 'label', allowClear: true, loading: usersQuery.isLoading }}
              />
              <ProFormSelect
                name="productOwner"
                label="产品负责人"
                width="md"
                placeholder="请选择用户"
                showSearch
                options={userOptions}
                fieldProps={{ optionFilterProp: 'label', allowClear: true, loading: usersQuery.isLoading }}
              />
            </ProForm.Group>
          </div>
          <div className="master-form-footer">
            <Button onClick={() => navigate('/master-data/product-categories')}>取消</Button>
            <Button
              type="primary"
              loading={createMutation.isPending || updateMutation.isPending}
              onClick={() => formRef.current?.submit?.()}
            >
              {isEdit ? '保存' : '创建'}
            </Button>
          </div>
        </div>
      </ProForm>
    </div>
  );
}
