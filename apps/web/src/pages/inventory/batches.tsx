import { useMemo, useState } from 'react';
import { Alert, Button, Empty, Result, Select, Skeleton, Tag } from 'antd';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  getInventoryBatches,
  type InventoryBatchItem,
} from '../../api/inventory.api';
import { getSkus } from '../../api/skus.api';
import { getWarehouses } from '../../api/warehouses.api';
import { InventoryAvailabilityTag } from './components/InventoryAvailabilityTag';
import {
  buildInventoryContextSearch,
  buildSkuMap,
  buildSkuOptions,
  buildWarehouseMap,
  buildWarehouseOptions,
  parseNumberSearchParam,
  parseSkuIdsSearchParam,
  skuDisplayName,
  sourceTypeLabel,
  toNumberId,
} from './components/inventory-page-utils';
import '../master-data/master-page.css';
import './inventory.css';

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

export default function InventoryBatchesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedSkuIds, setSelectedSkuIds] = useState<number[]>(() => parseSkuIdsSearchParam(searchParams.get('skuIds')));
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | undefined>(() => parseNumberSearchParam(searchParams.get('warehouseId')));

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
  const batchesQuery = useQuery({
    queryKey: ['inventory-batches', querySkuIds, selectedWarehouseId],
    queryFn: () =>
      getInventoryBatches({
        skuIds: querySkuIds,
        warehouseId: selectedWarehouseId,
      }),
    enabled: canQuery,
  });

  const skuMap = useMemo(() => buildSkuMap(skusQuery.data?.list), [skusQuery.data]);
  const warehouseMap = useMemo(() => buildWarehouseMap(warehousesQuery.data?.list), [warehousesQuery.data]);
  const skuOptions = useMemo(() => buildSkuOptions(skusQuery.data?.list), [skusQuery.data]);
  const warehouseOptions = useMemo(() => buildWarehouseOptions(warehousesQuery.data?.list), [warehousesQuery.data]);

  const rows: InventoryBatchRow[] = useMemo(
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
          skuName: skuDisplayName(sku),
          warehouseName: warehouse?.name ?? `仓库 #${warehouseId}`,
        };
      }),
    [batchesQuery.data, skuMap, warehouseMap],
  );

  const updateUrlFilters = (skuIds: number[], warehouseId: number | undefined) => {
    const next = new URLSearchParams();
    if (skuIds.length > 0) next.set('skuIds', skuIds.join(','));
    if (warehouseId) next.set('warehouseId', String(warehouseId));
    setSearchParams(next, { replace: true });
  };

  const columns: ProColumns<InventoryBatchRow>[] = [
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
      title: '来源类型',
      dataIndex: 'sourceType',
      width: 105,
      render: (_, record) => <Tag color={record.sourceType === 'initial' ? 'blue' : 'green'}>{sourceTypeLabel(record.sourceType)}</Tag>,
    },
    {
      title: '来源单据',
      dataIndex: 'sourceDocumentId',
      width: 120,
      render: (_, record) => (record.sourceDocumentId ? `#${record.sourceDocumentId}` : '-'),
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
      render: (_, record) => <InventoryAvailabilityTag value={record.batchAvailableQuantity} />,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 95,
      fixed: 'right',
      render: (_, record) => {
        const transactionsSearch = buildInventoryContextSearch({
          skuId: record.skuId,
          warehouseId: record.warehouseId,
        });
        return [
          <Link key="transactions" to={`/inventory/transactions?${transactionsSearch}`}>查看流水</Link>,
        ];
      },
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
    <div className="master-page inventory-page">
      <div className="master-page-shell">
        <div className="master-page-header inventory-page-header">
          <div className="master-page-heading">
            <div className="master-page-title">批次库存明细</div>
            <div className="master-page-description">按入库日期和批次号追溯 FIFO 库存来源，查看批次数量、锁定量和批次可用量。</div>
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
          <>
            <div className="inventory-query-toolbar">
              <label className="inventory-query-field inventory-query-field-sku">
                <span className="inventory-query-label">SKU 范围</span>
                <Select<number[]>
                  mode="multiple"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  placeholder="不选则查询全部批次"
                  options={skuOptions}
                  value={selectedSkuIds}
                  onChange={(value) => {
                    setSelectedSkuIds(value);
                    updateUrlFilters(value, selectedWarehouseId);
                  }}
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
                  onChange={(value) => {
                    setSelectedWarehouseId(value);
                    updateUrlFilters(selectedSkuIds, value);
                  }}
                  style={{ width: '100%' }}
                />
              </label>
              <Button
                type="primary"
                className="inventory-query-button"
                disabled={!canQuery}
                loading={batchesQuery.isFetching}
                onClick={() => batchesQuery.refetch()}
              >
                查询
              </Button>
              <span className="inventory-section-badge">{rows.length} 个批次</span>
            </div>

            {batchesQuery.isError ? (
              <Alert
                type="error"
                showIcon
                message="批次库存明细查询失败"
                description="请检查筛选条件或稍后重试。"
                style={{ marginBottom: 16 }}
              />
            ) : null}

            <div className="master-table-shell">
              <ProTable<InventoryBatchRow>
                rowKey="key"
                columns={columns}
                dataSource={rows}
                loading={batchesQuery.isFetching}
                search={false}
                options={false}
                pagination={false}
                locale={{
                  emptyText: canQuery ? <Empty description="暂无批次库存" /> : <Empty description="SKU 加载中" />,
                }}
                scroll={{ x: 1335 }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
