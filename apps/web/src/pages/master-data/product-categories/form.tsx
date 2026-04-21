import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button, Card, Form, Input, message, Skeleton, TreeSelect, Typography } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createProductCategory,
  getProductCategoryById,
  getProductCategoryTree,
  updateProductCategory,
  type ProductCategoryNode,
} from '../../../api/product-categories.api';

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

export default function ProductCategoryFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

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
      message.success('创建成功', 3);
      queryClient.invalidateQueries({ queryKey: ['product-categories', 'tree'] });
      navigate('/master-data/product-categories');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ payload }: { payload: { name?: string; nameEn?: string; purchaseOwner?: string; productOwner?: string } }) =>
      updateProductCategory(Number(id), payload),
    onSuccess: () => {
      message.success('保存成功', 3);
      queryClient.invalidateQueries({ queryKey: ['product-categories', 'tree'] });
      navigate('/master-data/product-categories');
    },
  });

  const loading = isEdit && detailQuery.isLoading;
  const submitting = createMutation.isPending || updateMutation.isPending;

  const treeSelectData = buildTreeSelectData(treeQuery.data ?? []);

  const handleSubmit = (values: { name: string; nameEn?: string; parentId?: number; purchaseOwner?: string; productOwner?: string }) => {
    if (isEdit) {
      updateMutation.mutate({
        payload: {
          name: values.name,
          nameEn: values.nameEn,
          purchaseOwner: values.purchaseOwner,
          productOwner: values.productOwner,
        },
      });
    } else {
      createMutation.mutate({
        name: values.name,
        nameEn: values.nameEn,
        parentId: values.parentId,
        purchaseOwner: values.purchaseOwner,
        productOwner: values.productOwner,
      });
    }
  };

  return (
    <div>
      <Typography.Title level={3} style={{ marginBottom: 24 }}>
        {isEdit ? '编辑产品分类' : '新建产品分类'}
      </Typography.Title>

      <Card style={{ maxWidth: 600 }}>
        <Skeleton active loading={loading}>
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label="分类名称"
              name="name"
              rules={[
                { required: true, message: '请输入分类名称' },
                { max: 100, message: '分类名称不能超过100个字符' },
              ]}
            >
              <Input placeholder="请输入分类名称" />
            </Form.Item>

            <Form.Item
              label="英文名"
              name="nameEn"
              rules={[{ max: 100, message: '英文名不能超过100个字符' }]}
            >
              <Input placeholder="请输入英文名（可选）" />
            </Form.Item>

            {!isEdit && (
              <Form.Item label="父级分类" name="parentId">
                <TreeSelect
                  placeholder="不选则为一级分类"
                  allowClear
                  treeData={treeSelectData}
                  loading={treeQuery.isLoading}
                  treeDefaultExpandAll
                />
              </Form.Item>
            )}

            <Form.Item
              label="采购负责人"
              name="purchaseOwner"
              rules={[{ max: 100, message: '采购负责人不能超过100个字符' }]}
            >
              <Input placeholder="请输入采购负责人（可选）" />
            </Form.Item>

            <Form.Item
              label="产品负责人"
              name="productOwner"
              rules={[{ max: 100, message: '产品负责人不能超过100个字符' }]}
            >
              <Input placeholder="请输入产品负责人（可选）" />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                style={{ marginRight: 8 }}
              >
                {isEdit ? '保存' : '创建'}
              </Button>
              <Button onClick={() => navigate('/master-data/product-categories')}>取消</Button>
            </Form.Item>
          </Form>
        </Skeleton>
      </Card>
    </div>
  );
}
