import { useMemo, useState } from 'react';
import { Alert, Button, Empty, Result, Select, Skeleton } from 'antd';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  getAvailableInventory,
  type AvailableInventoryItem,
} from '../../api/inventory.api';
import { getSkus } from '../../api/skus.api';
import { getWarehouses } from '../../api/warehouses.api';
import { InventoryAvailabilityTag } from './components/InventoryAvailabilityTag';
import { InventoryMetric } from './components/InventoryMetric';
import {
  buildInventoryContextSearch,
  buildSkuMap,
  buildSkuOptions,
  buildWarehouseMap,
  buildWarehouseOptions,
  parseNumberSearchParam,
  parseSkuIdsSearchParam,
  skuDisplayName,
  toNumberId,
} from './components/inventory-page-utils';
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

export default function InventoryAvailablePage() {
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

  const skuMap = useMemo(() => buildSkuMap(skusQuery.data?.list), [skusQuery.data]);
  const warehouseMap = useMemo(() => buildWarehouseMap(warehousesQuery.data?.list), [warehousesQuery.data]);
  const skuOptions = useMemo(() => buildSkuOptions(skusQuery.data?.list), [skusQuery.data]);
  const warehouseOptions = useMemo(() => buildWarehouseOptions(warehousesQuery.data?.list), [warehousesQuery.data]);

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
          skuName: skuDisplayName(sku),
          warehouseName: warehouse?.name ?? (warehouseId ? `仓库 #${warehouseId}` : '未指定仓库'),
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

  const updateUrlFilters = (skuIds: number[], warehouseId: number | undefined) => {
    const next = new URLSearchParams();
    if (skuIds.length > 0) next.set('skuIds', skuIds.join(','));
    if (warehouseId) next.set('warehouseId', String(warehouseId));
    setSearchParams(next, { replace: true });
  };

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
      render: (_, record) => <InventoryAvailabilityTag value={record.availableQuantity} />,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 145,
      render: (_, record) => (record.updatedAt ? dayjs(record.updatedAt).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 150,
      fixed: 'right',
      render: (_, record) => {
        const batchesSearch = buildInventoryContextSearch({
          skuIds: [record.skuId],
          warehouseId: record.warehouseId,
        });
        const transactionsSearch = buildInventoryContextSearch({
          skuId: record.skuId,
          warehouseId: record.warehouseId,
        });
        return [
          <Link key="batches" to={`/inventory/batches?${batchesSearch}`}>查看批次</Link>,
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
            <div className="master-page-title">可用库存查询</div>
            <div className="master-page-description">按 SKU 和仓库查看实际库存、锁定量和可用库存，作为库存决策和后续追溯入口。</div>
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
                  placeholder="不选则查询全部库存"
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

            {availableQuery.isError ? (
              <Alert
                type="error"
                showIcon
                message="可用库存查询失败"
                description="请检查筛选条件或稍后重试。"
                style={{ marginBottom: 16 }}
              />
            ) : null}

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
                scroll={{ x: 980 }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
