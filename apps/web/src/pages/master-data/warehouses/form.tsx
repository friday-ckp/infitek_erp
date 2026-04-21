import { Button, Card, Cascader, Form, Result, Skeleton, Space } from 'antd';
import { ProForm, ProFormSelect, ProFormSwitch, ProFormText, ProFormTextArea } from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import type { WarehouseStatus } from '@infitek/shared';
import chinaRegions from '../../../assets/china-regions';
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

const warehouseTypeOptions = [
  { label: '自营仓', value: '自营仓' },
  { label: '港口仓', value: '港口仓' },
  { label: '工厂仓', value: '工厂仓' },
];

const ownershipOptions = [
  { label: '内部仓', value: '内部仓' },
  { label: '外部仓', value: '外部仓' },
];

export default function WarehouseFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const warehouseId = id ? Number(id) : undefined;
  const isEdit = Boolean(id);

  const [form] = Form.useForm();

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

  const data = detailQuery.data;

  return (
    <Card title={isEdit ? '编辑仓库' : '新建仓库'}>
      <ProForm<{
        name: string;
        address?: string;
        status?: WarehouseStatus;
        warehouseCode?: string;
        warehouseType?: string;
        supplierName?: string;
        defaultShipArea?: string[];
        ownership?: string;
        isVirtual?: boolean;
      }>
        form={form}
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
          data
            ? {
                name: data.name,
                address: data.address ?? undefined,
                status: data.status,
                warehouseCode: data.warehouseCode ?? undefined,
                warehouseType: data.warehouseType ?? undefined,
                supplierName: data.supplierName ?? undefined,
                defaultShipArea: ([data.defaultShipProvince, data.defaultShipCity].filter(Boolean) as string[]).length > 0
                  ? ([data.defaultShipProvince, data.defaultShipCity].filter(Boolean) as string[])
                  : undefined,
                ownership: data.ownership ?? '内部仓',
                isVirtual: Boolean(data.isVirtual),
              }
            : { ownership: '内部仓', isVirtual: false }
        }
        onFinish={async (values) => {
          const payload = {
            name: values.name,
            address: values.address,
            warehouseCode: values.warehouseCode || undefined,
            warehouseType: values.warehouseType as CreateWarehousePayload['warehouseType'] || undefined,
            supplierId: undefined,
            supplierName: values.supplierName || undefined,
            defaultShipProvince: values.defaultShipArea?.[0] || undefined,
            defaultShipCity: values.defaultShipArea?.[1] || undefined,
            ownership: values.ownership as CreateWarehousePayload['ownership'],
            isVirtual: values.isVirtual ? 1 : 0,
          };
          if (isEdit) {
            await updateMutation.mutateAsync({
              ...payload,
              status: values.status,
            });
          } else {
            await createMutation.mutateAsync(payload);
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
        <ProFormText
          name="warehouseCode"
          label="仓库编号"
          placeholder="如不填写，后续可手动维护"
          rules={[{ max: 50, message: '仓库编号最多 50 个字符' }]}
        />
        <ProFormSelect
          name="warehouseType"
          label="仓库类型"
          options={warehouseTypeOptions}
          placeholder="请选择仓库类型（可选）"
        />
        <ProFormText
          name="supplierName"
          label="关联供应商"
          placeholder="供应商档案完善后可关联（暂不可用）"
          disabled
          tooltip="供应商管理模块（Epic 4）完成后启用"
        />
        <Form.Item name="defaultShipArea" label="默认发运省市">
          <Cascader
            options={chinaRegions}
            placeholder="请选择省/市（可选）"
          />
        </Form.Item>
        <ProFormSelect
          name="ownership"
          label="仓库归属"
          options={ownershipOptions}
          rules={[{ required: true, message: '请选择仓库归属' }]}
        />
        <ProFormSwitch
          name="isVirtual"
          label="是否虚拟仓"
          tooltip="虚拟仓不实际存储货物，仅用于系统记账"
          fieldProps={{
            checkedChildren: '是',
            unCheckedChildren: '否',
          }}
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
