import { Button, Card, Result, Skeleton, Space } from 'antd';
import { ProForm, ProFormSelect, ProFormText, ProFormTextArea } from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import type { WarehouseStatus } from '@infitek/shared';
import {
  createWarehouse,
  getWarehouseById,
  updateWarehouse,
  type CreateWarehousePayload,
  type UpdateWarehousePayload,
} from '../../../api/warehouses.api';

const statusOptions: Array<{ label: string; value: WarehouseStatus }> = [
  { label: '启用', value: 'active' as WarehouseStatus },
  { label: '禁用', value: 'inactive' as WarehouseStatus },
];

export default function WarehouseFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const warehouseId = id ? Number(id) : undefined;
  const isEdit = Boolean(id);

  const detailQuery = useQuery({
    queryKey: ['warehouse-detail', warehouseId],
    queryFn: () => getWarehouseById(warehouseId as number),
    enabled: Boolean(isEdit && warehouseId && Number.isInteger(warehouseId) && warehouseId > 0),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateWarehousePayload) => createWarehouse(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      navigate('/master-data/warehouses');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateWarehousePayload) => updateWarehouse(warehouseId as number, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-detail', warehouseId] });
      navigate('/master-data/warehouses');
    },
  });

  if (isEdit && (!warehouseId || !Number.isInteger(warehouseId) || warehouseId <= 0)) {
    return (
      <Result
        status="404"
        title="仓库不存在"
        extra={
          <Button type="primary" onClick={() => navigate('/master-data/warehouses')}>
            返回列表
          </Button>
        }
      />
    );
  }

  if (isEdit && detailQuery.isLoading) {
    return <Skeleton active />;
  }

  if (isEdit && detailQuery.isError && !detailQuery.data) {
    return (
      <Result
        status="error"
        title="仓库详情加载失败"
        subTitle="请检查网络或稍后重试"
        extra={[
          <Button key="retry" type="primary" onClick={() => detailQuery.refetch()}>
            重试
          </Button>,
          <Button key="back" onClick={() => navigate('/master-data/warehouses')}>
            返回列表
          </Button>,
        ]}
      />
    );
  }

  return (
    <Card title={isEdit ? '编辑仓库' : '新建仓库'}>
      <ProForm<{
        name: string;
        address?: string;
        status?: WarehouseStatus;
      }>
        grid
        rowProps={{ gutter: [16, 0] }}
        colProps={{ span: 12 }}
        loading={detailQuery.isLoading}
        submitter={{
          render: (_, dom) => (
            <Space>
              <Button onClick={() => navigate('/master-data/warehouses')}>取消</Button>
              {dom[1]}
            </Space>
          ),
          searchConfig: {
            submitText: isEdit ? '保存' : '创建',
          },
        }}
        initialValues={
          detailQuery.data
            ? {
                name: detailQuery.data.name,
                address: detailQuery.data.address ?? undefined,
                status: detailQuery.data.status,
              }
            : {}
        }
        onFinish={async (values) => {
          if (isEdit) {
            await updateMutation.mutateAsync({
              name: values.name,
              address: values.address,
              status: values.status,
            });
          } else {
            await createMutation.mutateAsync({
              name: values.name,
              address: values.address,
            });
          }
          return true;
        }}
      >
        <ProFormText
          name="name"
          label="仓库名称"
          placeholder="请输入仓库名称"
          rules={[
            { required: true, message: '请输入仓库名称' },
            { max: 100, message: '仓库名称最多 100 个字符' },
          ]}
        />
        <ProFormTextArea
          name="address"
          label="仓库地址"
          placeholder="请输入仓库地址（可选）"
          fieldProps={{ rows: 2 }}
          rules={[{ max: 255, message: '仓库地址最多 255 个字符' }]}
        />
        {isEdit ? (
          <ProFormSelect
            name="status"
            label="状态"
            options={statusOptions}
            rules={[{ required: true, message: '请选择状态' }]}
          />
        ) : null}
      </ProForm>
    </Card>
  );
}
