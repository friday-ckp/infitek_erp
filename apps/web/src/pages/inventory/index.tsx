import { useMemo, useRef, useState } from 'react';
import { Button, Empty, Result, Select, Skeleton, Tag, message } from 'antd';
import { ProForm, ProFormDatePicker, ProFormDigit, ProFormSelect, ProTable, type ProFormInstance } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { createOpeningInventory, getAvailableInventory, getInventoryBatches, type AvailableInventoryItem, type CreateOpeningInventoryPayload, type InventoryBatchItem } from '../../api/inventory.api';
import { getSkus, type Sku } from '../../api/skus.api';
import { getWarehouses, type Warehouse } from '../../api/warehouses.api';
import { SectionCard } from '../master-data/components/page-scaffold';
import '../master-data/master-page.css';
import './inventory.css';

interface InventoryRow extends AvailableInventoryItem {
  key: string;
  skuId: number;
  warehouseId: number | null;
  skuCode?: string;
  skuName?: string | null;
  warehouseName?: string | null;
}

interface InventoryBatchRow extends InventoryBatchItem {
  key: string;
  id: number;
  skuId: number;
  warehouseId: number;
  sourceDocumentId: number | null;
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
  if (value > 0) return <span className="inventory-availability-tag positive">可用 {value}</span>;
  return <span className="inventory-availability-tag empty">无可用库存</span>;
}

function sourceTypeLabel(value: string) {
  if (value === 'initial') return '期初录入';
  if (value === 'purchase_receipt') return '采购入库';
  return value;
}

function toNumberId(value: number | string | null | undefined) {
  if (value === null || value === undefined) return null;
  const id = Number(value);
  return Number.isFinite(id) ? id : null;
}

function InventoryMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'actual' | 'locked' | 'available';
}) {
  return (
    <div className={`inventory-metric inventory-metric-${tone}`}>
      <div className="inventory-metric-label">{label}</div>
      <div className="inventory-metric-value">{value}</div>
    </div>
  );
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

  const querySkuIds = selectedSkuIds.length > 0 ? selectedSkuIds : undefined;
  const canQuery = skusQuery.isSuccess || Boolean(skusQuery.data);
  const hasSkuFilter = selectedSkuIds.length > 0;
  const availableQuery = useQuery({
    queryKey: ['inventory-available', querySkuIds, selectedWarehouseId],
    queryFn: () =>
      getAvailableInventory({
        skuIds: querySkuIds,
        warehouseId: selectedWarehouseId,
      }),
    enabled: canQuery,
  });
  const batchesQuery = useQuery({
    queryKey: ['inventory-batches', querySkuIds, selectedWarehouseId],
    queryFn: () =>
      getInventoryBatches({
        skuIds: querySkuIds,
        warehouseId: selectedWarehouseId,
      }),
    enabled: canQuery,
  });

  const skuMap = useMemo(() => {
    const map = new Map<number, Sku>();
    skusQuery.data?.list.forEach((sku) => {
      const skuId = toNumberId(sku.id);
      if (skuId !== null) map.set(skuId, sku);
    });
    return map;
  }, [skusQuery.data]);

  const warehouseMap = useMemo(() => {
    const map = new Map<number, Warehouse>();
    warehousesQuery.data?.list.forEach((warehouse) => {
      const warehouseId = toNumberId(warehouse.id);
      if (warehouseId !== null) map.set(warehouseId, warehouse);
    });
    return map;
  }, [warehousesQuery.data]);

  const skuOptions = useMemo(
    () =>
      (skusQuery.data?.list ?? []).flatMap((sku) => {
        const skuId = toNumberId(sku.id);
        if (skuId === null) return [];
        return [{
          label: `${sku.skuCode} ${sku.nameCn ?? sku.specification ?? ''}`,
          value: skuId,
        }];
      }),
    [skusQuery.data],
  );

  const warehouseOptions = useMemo(
    () =>
      (warehousesQuery.data?.list ?? []).flatMap((warehouse) => {
        const warehouseId = toNumberId(warehouse.id);
        if (warehouseId === null) return [];
        return [{
          label: warehouse.name,
          value: warehouseId,
        }];
      }),
    [warehousesQuery.data],
  );

  const rows: InventoryRow[] = useMemo(
    () =>
      (availableQuery.data ?? []).map((item) => {
        const skuId = toNumberId(item.skuId) ?? 0;
        const warehouseId = toNumberId(item.warehouseId);
        const sku = skuMap.get(skuId);
        const warehouse = warehouseId ? warehouseMap.get(warehouseId) : undefined;
        return {
          ...item,
          key: `${skuId}-${warehouseId ?? 'all'}`,
          skuId,
          warehouseId,
          skuCode: sku?.skuCode,
          skuName: sku?.nameCn ?? sku?.nameEn ?? sku?.specification,
          warehouseName: warehouse?.name ?? (warehouseId ? `仓库 #${warehouseId}` : '未指定仓库'),
        };
      }),
    [availableQuery.data, skuMap, warehouseMap],
  );

  const batchRows: InventoryBatchRow[] = useMemo(
    () =>
      (batchesQuery.data ?? []).map((item) => {
        const id = toNumberId(item.id) ?? 0;
        const skuId = toNumberId(item.skuId) ?? 0;
        const warehouseId = toNumberId(item.warehouseId) ?? 0;
        const sourceDocumentId = toNumberId(item.sourceDocumentId);
        const sku = skuMap.get(skuId);
        const warehouse = warehouseMap.get(warehouseId);
        return {
          ...item,
          key: `${item.batchNo}-${id}`,
          id,
          skuId,
          warehouseId,
          sourceDocumentId,
          skuCode: sku?.skuCode,
          skuName: sku?.nameCn ?? sku?.nameEn ?? sku?.specification,
          warehouseName: warehouse?.name ?? `仓库 #${warehouseId}`,
        };
      }),
    [batchesQuery.data, skuMap, warehouseMap],
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
      queryClient.invalidateQueries({ queryKey: ['inventory-batches'] });
      formRef.current?.resetFields();
    },
  });

  const columns: ProColumns<InventoryRow>[] = [
    {
      title: 'SKU',
      dataIndex: 'skuCode',
      width: 200,
      render: (_, record) => (
        <div className="inventory-sku-cell">
          <div className="inventory-sku-code">{record.skuCode ?? `SKU #${record.skuId}`}</div>
          <div className="inventory-sku-name">{record.skuName ?? '-'}</div>
        </div>
      ),
    },
    {
      title: '仓库',
      dataIndex: 'warehouseName',
      width: 150,
      render: (_, record) => record.warehouseName,
    },
    {
      title: '实际库存',
      dataIndex: 'actualQuantity',
      width: 105,
      align: 'right',
    },
    {
      title: '锁定量',
      dataIndex: 'lockedQuantity',
      width: 105,
      align: 'right',
    },
    {
      title: '可用库存',
      dataIndex: 'availableQuantity',
      width: 125,
      align: 'right',
      render: (_, record) => inventoryTag(record.availableQuantity),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 145,
      render: (_, record) => (record.updatedAt ? dayjs(record.updatedAt).format('YYYY-MM-DD HH:mm') : '-'),
    },
  ];

  const batchColumns: ProColumns<InventoryBatchRow>[] = [
    {
      title: '批次号',
      dataIndex: 'batchNo',
      width: 230,
      render: (_, record) => <span className="inventory-batch-no">{record.batchNo}</span>,
    },
    {
      title: 'SKU',
      dataIndex: 'skuCode',
      width: 200,
      render: (_, record) => (
        <div className="inventory-sku-cell">
          <div className="inventory-sku-code">{record.skuCode ?? `SKU #${record.skuId}`}</div>
          <div className="inventory-sku-name">{record.skuName ?? '-'}</div>
        </div>
      ),
    },
    {
      title: '仓库',
      dataIndex: 'warehouseName',
      width: 150,
    },
    {
      title: '来源',
      dataIndex: 'sourceType',
      width: 105,
      render: (_, record) => <Tag color={record.sourceType === 'initial' ? 'blue' : 'green'}>{sourceTypeLabel(record.sourceType)}</Tag>,
    },
    {
      title: '入库日期',
      dataIndex: 'receiptDate',
      width: 120,
      render: (_, record) => (record.receiptDate ? dayjs(record.receiptDate).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '批次数量',
      dataIndex: 'batchQuantity',
      width: 105,
      align: 'right',
    },
    {
      title: '锁定量',
      dataIndex: 'batchLockedQuantity',
      width: 95,
      align: 'right',
    },
    {
      title: '批次可用',
      dataIndex: 'batchAvailableQuantity',
      width: 115,
      align: 'right',
      render: (_, record) => inventoryTag(record.batchAvailableQuantity),
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
    <div className="master-page master-form-page inventory-page">
      <div className="master-page-header inventory-page-header">
        <div className="master-page-heading">
          <div className="master-page-title">库存查询</div>
          <div className="master-page-description">维护 SKU + 仓库的期初库存，并查看实际库存、锁定量和可用库存。</div>
        </div>
        <div className="inventory-header-summary" aria-label="库存基础数据">
          <div className="inventory-header-count">
            <span>SKU</span>
            <strong>{skuOptions.length}</strong>
          </div>
          <div className="inventory-header-count">
            <span>仓库</span>
            <strong>{warehouseOptions.length}</strong>
          </div>
        </div>
      </div>

      {loadingBase ? (
        <Skeleton active />
      ) : (
        <div className="master-form-main">
          <SectionCard
            id="opening"
            title="期初库存录入"
            description="每次提交都会新增一条期初批次，并按批次汇总重算库存。"
            extra={<span className="inventory-section-badge">期初批次</span>}
          >
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
              <div className="master-form-grid inventory-opening-grid">
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
              <div className="master-form-footer inventory-form-footer">
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

          <SectionCard
            id="query"
            title="可用库存查询"
            description="供后续发货需求生成和库存决策复用的正式查询口径。"
            extra={<span className={`inventory-query-status ${canQuery ? 'ready' : 'idle'}`}>{canQuery ? (hasSkuFilter ? `已选 ${selectedSkuIds.length} 个 SKU` : '默认全部库存') : 'SKU 加载中'}</span>}
          >
            <div className="inventory-query-toolbar">
              <label className="inventory-query-field inventory-query-field-sku">
                <span className="inventory-query-label">SKU 范围</span>
                <Select<number[]>
                  mode="multiple"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  placeholder="不选则查询全部库存"
                  options={skuOptions}
                  value={selectedSkuIds}
                  onChange={setSelectedSkuIds}
                  style={{ width: '100%' }}
                />
              </label>
              <label className="inventory-query-field">
                <span className="inventory-query-label">仓库</span>
                <Select<number>
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  placeholder="全部仓库"
                  options={warehouseOptions}
                  value={selectedWarehouseId}
                  onChange={setSelectedWarehouseId}
                  style={{ width: '100%' }}
                />
              </label>
              <Button
                type="primary"
                className="inventory-query-button"
                disabled={!canQuery}
                loading={availableQuery.isFetching}
                onClick={() => availableQuery.refetch()}
              >
                {hasSkuFilter ? '查询' : '查询全部'}
              </Button>
            </div>

            <div className="inventory-metric-strip">
              <InventoryMetric label="实际库存" value={totals.actualQuantity} tone="actual" />
              <InventoryMetric label="锁定量" value={totals.lockedQuantity} tone="locked" />
              <InventoryMetric label="可用库存" value={totals.availableQuantity} tone="available" />
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
                  emptyText: canQuery ? <Empty description="暂无库存记录" /> : <Empty description="SKU 加载中" />,
                }}
                scroll={{ x: 830 }}
              />
            </div>

            <div className="inventory-batch-detail-header">
              <div>
                <div className="inventory-batch-detail-title">批次库存明细</div>
                <div className="inventory-batch-detail-description">按入库日期和批次号展示 FIFO 可用库存来源。</div>
              </div>
              <span className="inventory-section-badge">{batchRows.length} 个批次</span>
            </div>

            <div className="master-table-shell">
              <ProTable<InventoryBatchRow>
                rowKey="key"
                columns={batchColumns}
                dataSource={batchRows}
                loading={batchesQuery.isFetching}
                search={false}
                options={false}
                pagination={false}
                locale={{
                  emptyText: canQuery ? <Empty description="暂无批次库存" /> : <Empty description="SKU 加载中" />,
                }}
                scroll={{ x: 1110 }}
              />
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}
