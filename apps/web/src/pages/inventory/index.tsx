import { useMemo, useRef, useState } from 'react';
import { Button, Empty, Result, Select, Skeleton, Statistic, Tag, Typography, message } from 'antd';
import { ProForm, ProFormDatePicker, ProFormDigit, ProFormSelect, ProTable, type ProFormInstance } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { createOpeningInventory, getAvailableInventory, type AvailableInventoryItem, type CreateOpeningInventoryPayload } from '../../api/inventory.api';
import { getSkus, type Sku } from '../../api/skus.api';
import { getWarehouses, type Warehouse } from '../../api/warehouses.api';
import { SectionCard } from '../master-data/components/page-scaffold';
import '../master-data/master-page.css';

interface InventoryRow extends AvailableInventoryItem {
  key: string;
  skuCode?: string;
  skuName?: string | null;
  warehouseName?: string | null;
}

interface OpeningInventoryFormValues {
  skuId: number;
  warehouseId: number;
  quantity: number;
  receiptDate?: string | Dayjs;
}

function inventoryTag(value: number) {
  if (value > 0) return <Tag color="success">可用 {value}</Tag>;
  return <Tag color="error">无可用库存</Tag>;
}

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const formRef = useRef<ProFormInstance<OpeningInventoryFormValues>>(undefined);
  const [selectedSkuIds, setSelectedSkuIds] = useState<number[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | undefined>();

  const skusQuery = useQuery({
    queryKey: ['inventory-skus'],
    queryFn: () => getSkus({ page: 1, pageSize: 200 }),
  });
  const warehousesQuery = useQuery({
    queryKey: ['inventory-warehouses'],
    queryFn: () => getWarehouses({ page: 1, pageSize: 200 }),
  });

  const canQuery = selectedSkuIds.length > 0;
  const availableQuery = useQuery({
    queryKey: ['inventory-available', selectedSkuIds, selectedWarehouseId],
    queryFn: () =>
      getAvailableInventory({
        skuIds: selectedSkuIds,
        warehouseId: selectedWarehouseId,
      }),
    enabled: canQuery,
  });

  const skuMap = useMemo(() => {
    const map = new Map<number, Sku>();
    skusQuery.data?.list.forEach((sku) => map.set(sku.id, sku));
    return map;
  }, [skusQuery.data]);

  const warehouseMap = useMemo(() => {
    const map = new Map<number, Warehouse>();
    warehousesQuery.data?.list.forEach((warehouse) => map.set(warehouse.id, warehouse));
    return map;
  }, [warehousesQuery.data]);

  const skuOptions = useMemo(
    () =>
      (skusQuery.data?.list ?? []).map((sku) => ({
        label: `${sku.skuCode} ${sku.nameCn ?? sku.specification ?? ''}`,
        value: sku.id,
      })),
    [skusQuery.data],
  );

  const warehouseOptions = useMemo(
    () =>
      (warehousesQuery.data?.list ?? []).map((warehouse) => ({
        label: warehouse.name,
        value: warehouse.id,
      })),
    [warehousesQuery.data],
  );

  const rows: InventoryRow[] = useMemo(
    () =>
      (availableQuery.data ?? []).map((item) => {
        const sku = skuMap.get(item.skuId);
        const warehouse = item.warehouseId ? warehouseMap.get(item.warehouseId) : undefined;
        return {
          ...item,
          key: `${item.skuId}-${item.warehouseId ?? 'all'}`,
          skuCode: sku?.skuCode,
          skuName: sku?.nameCn ?? sku?.nameEn ?? sku?.specification,
          warehouseName: warehouse?.name ?? (item.warehouseId ? `仓库 #${item.warehouseId}` : '未指定仓库'),
        };
      }),
    [availableQuery.data, skuMap, warehouseMap],
  );

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({
          actualQuantity: acc.actualQuantity + row.actualQuantity,
          lockedQuantity: acc.lockedQuantity + row.lockedQuantity,
          availableQuantity: acc.availableQuantity + row.availableQuantity,
        }),
        { actualQuantity: 0, lockedQuantity: 0, availableQuantity: 0 },
      ),
    [rows],
  );

  const createMutation = useMutation({
    mutationFn: (payload: CreateOpeningInventoryPayload) => createOpeningInventory(payload),
    onSuccess: (_, payload) => {
      message.success('期初库存已保存');
      setSelectedSkuIds([payload.skuId]);
      setSelectedWarehouseId(payload.warehouseId);
      queryClient.invalidateQueries({ queryKey: ['inventory-available'] });
      formRef.current?.resetFields();
    },
  });

  const columns: ProColumns<InventoryRow>[] = [
    {
      title: 'SKU',
      dataIndex: 'skuCode',
      width: 220,
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.skuCode ?? `SKU #${record.skuId}`}</Typography.Text>
          <div style={{ color: '#64748b', fontSize: 12 }}>{record.skuName ?? '-'}</div>
        </div>
      ),
    },
    {
      title: '仓库',
      dataIndex: 'warehouseName',
      width: 180,
      render: (_, record) => record.warehouseName,
    },
    {
      title: '实际库存',
      dataIndex: 'actualQuantity',
      width: 120,
      align: 'right',
    },
    {
      title: '锁定量',
      dataIndex: 'lockedQuantity',
      width: 120,
      align: 'right',
    },
    {
      title: '可用库存',
      dataIndex: 'availableQuantity',
      width: 140,
      align: 'right',
      render: (_, record) => inventoryTag(record.availableQuantity),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 160,
      render: (_, record) => (record.updatedAt ? dayjs(record.updatedAt).format('YYYY-MM-DD HH:mm') : '-'),
    },
  ];

  if ((skusQuery.isError && !skusQuery.data) || (warehousesQuery.isError && !warehousesQuery.data)) {
    return (
      <Result
        status="error"
        title="库存基础数据加载失败"
        extra={<Button type="primary" onClick={() => { skusQuery.refetch(); warehousesQuery.refetch(); }}>重试</Button>}
      />
    );
  }

  const loadingBase = skusQuery.isLoading || warehousesQuery.isLoading;

  return (
    <div className="master-page master-form-page">
      <div className="master-page-header">
        <div className="master-page-heading">
          <div className="master-page-title">库存查询</div>
          <div className="master-page-description">维护 SKU + 仓库的期初库存，并查看实际库存、锁定量和可用库存。</div>
        </div>
      </div>

      {loadingBase ? (
        <Skeleton active />
      ) : (
        <div className="master-form-main">
          <SectionCard id="opening" title="期初库存录入" description="同一 SKU + 仓库再次提交会覆盖期初批次数量，并重算汇总库存。">
            <ProForm<OpeningInventoryFormValues>
              formRef={formRef}
              layout="vertical"
              submitter={false}
              onFinish={async (values) => {
                await createMutation.mutateAsync({
                  skuId: values.skuId,
                  warehouseId: values.warehouseId,
                  quantity: values.quantity,
                  receiptDate: values.receiptDate
                    ? dayjs(values.receiptDate).format('YYYY-MM-DD')
                    : undefined,
                });
                return true;
              }}
            >
              <div className="master-form-grid">
                <ProFormSelect
                  name="skuId"
                  label="SKU"
                  options={skuOptions}
                  showSearch
                  rules={[{ required: true, message: '请选择 SKU' }]}
                  fieldProps={{ optionFilterProp: 'label' }}
                />
                <ProFormSelect
                  name="warehouseId"
                  label="仓库"
                  options={warehouseOptions}
                  showSearch
                  rules={[{ required: true, message: '请选择仓库' }]}
                  fieldProps={{ optionFilterProp: 'label' }}
                />
                <ProFormDigit
                  name="quantity"
                  label="期初数量"
                  min={0}
                  fieldProps={{ precision: 0 }}
                  rules={[{ required: true, message: '请输入期初数量' }]}
                />
                <ProFormDatePicker name="receiptDate" label="入库日期" />
              </div>
              <div className="master-form-footer" style={{ position: 'static', marginTop: 0 }}>
                <div className="master-form-footer-tip">保存后库存汇总会立即按批次聚合结果刷新。</div>
                <div className="master-form-footer-actions">
                  <Button onClick={() => formRef.current?.resetFields()}>重置</Button>
                  <Button
                    type="primary"
                    loading={createMutation.isPending}
                    onClick={() => formRef.current?.submit?.()}
                  >
                    保存期初库存
                  </Button>
                </div>
              </div>
            </ProForm>
          </SectionCard>

          <SectionCard id="query" title="可用库存查询" description="供后续发货需求生成和库存决策复用的正式查询口径。">
            <div className="master-form-grid">
              <div className="full">
                <Select<number[]>
                  mode="multiple"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  placeholder="选择一个或多个 SKU"
                  options={skuOptions}
                  value={selectedSkuIds}
                  onChange={setSelectedSkuIds}
                  style={{ width: '100%' }}
                />
              </div>
              <Select<number>
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="限定仓库（可选）"
                options={warehouseOptions}
                value={selectedWarehouseId}
                onChange={setSelectedWarehouseId}
                style={{ width: '100%' }}
              />
              <Button
                type="primary"
                disabled={!canQuery}
                loading={availableQuery.isFetching}
                onClick={() => availableQuery.refetch()}
              >
                查询
              </Button>
            </div>

            <div className="master-summary-meta" style={{ marginBottom: 16 }}>
              <Statistic title="实际库存" value={totals.actualQuantity} />
              <Statistic title="锁定量" value={totals.lockedQuantity} />
              <Statistic title="可用库存" value={totals.availableQuantity} />
            </div>

            <div className="master-table-shell">
              <ProTable<InventoryRow>
                rowKey="key"
                columns={columns}
                dataSource={rows}
                loading={availableQuery.isFetching}
                search={false}
                options={false}
                pagination={false}
                locale={{
                  emptyText: canQuery ? <Empty description="暂无库存记录" /> : <Empty description="请选择 SKU 后查询" />,
                }}
                scroll={{ x: 940 }}
              />
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}
