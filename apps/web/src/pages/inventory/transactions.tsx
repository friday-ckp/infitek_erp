import { useMemo, useState } from 'react';
import { Alert, Button, DatePicker, Empty, Select } from 'antd';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import dayjs, { type Dayjs } from 'dayjs';
import { InventoryChangeType } from '@infitek/shared';
import {
  getInventoryTransactions,
  type InventoryTransactionItem,
} from '../../api/inventory.api';
import { getSkus, type Sku } from '../../api/skus.api';
import { getWarehouses, type Warehouse } from '../../api/warehouses.api';
import { InventoryChangeTypeTag } from './components/InventoryChangeTypeTag';
import { SourceDocumentLink } from './components/SourceDocumentLink';
import {
  buildSkuMap,
  buildSkuOptions,
  buildWarehouseMap,
  buildWarehouseOptions,
  inventoryChangeTypeOptions,
  parseNumberSearchParam,
  signedNumber,
  skuDisplayName,
  toNumberId,
} from './components/inventory-page-utils';
import '../master-data/master-page.css';
import './inventory.css';

interface InventoryTransactionRow extends InventoryTransactionItem {
  key: string;
  id: number;
  skuId: number;
  warehouseId: number;
  inventoryBatchId: number | null;
  sourceDocumentId: number;
  sourceDocumentItemId: number | null;
  skuCode?: string;
  skuName?: string | null;
  warehouseName?: string | null;
}

export default function InventoryTransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedSkuId, setSelectedSkuId] = useState<number | undefined>(() => parseNumberSearchParam(searchParams.get('skuId')));
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | undefined>(() => parseNumberSearchParam(searchParams.get('warehouseId')));
  const [selectedChangeType, setSelectedChangeType] = useState<InventoryChangeType | undefined>();
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const skusQuery = useQuery({
    queryKey: ['inventory-ledger-skus'],
    queryFn: () => getSkus({ page: 1, pageSize: 200 }),
  });
  const warehousesQuery = useQuery({
    queryKey: ['inventory-ledger-warehouses'],
    queryFn: () => getWarehouses({ page: 1, pageSize: 200 }),
  });

  const startTime = dateRange?.[0]?.format('YYYY-MM-DD');
  const endTime = dateRange?.[1]?.format('YYYY-MM-DD');
  const transactionsQuery = useQuery({
    queryKey: [
      'inventory-transactions-page',
      selectedSkuId,
      selectedWarehouseId,
      selectedChangeType,
      startTime,
      endTime,
      page,
      pageSize,
    ],
    queryFn: () =>
      getInventoryTransactions({
        skuId: selectedSkuId,
        warehouseId: selectedWarehouseId,
        changeType: selectedChangeType,
        startTime,
        endTime,
        page,
        pageSize,
      }),
  });

  const skuMap = useMemo(() => buildSkuMap(skusQuery.data?.list as Sku[] | undefined), [skusQuery.data]);
  const warehouseMap = useMemo(() => buildWarehouseMap(warehousesQuery.data?.list as Warehouse[] | undefined), [warehousesQuery.data]);
  const skuOptions = useMemo(() => buildSkuOptions(skusQuery.data?.list), [skusQuery.data]);
  const warehouseOptions = useMemo(() => buildWarehouseOptions(warehousesQuery.data?.list), [warehousesQuery.data]);

  const rows: InventoryTransactionRow[] = useMemo(
    () =>
      (transactionsQuery.data?.data ?? []).map((item) => {
        const id = toNumberId(item.id) ?? 0;
        const skuId = toNumberId(item.skuId) ?? 0;
        const warehouseId = toNumberId(item.warehouseId) ?? 0;
        const inventoryBatchId = toNumberId(item.inventoryBatchId);
        const sourceDocumentId = toNumberId(item.sourceDocumentId) ?? 0;
        const sourceDocumentItemId = toNumberId(item.sourceDocumentItemId);
        const sku = skuMap.get(skuId);
        const warehouse = warehouseMap.get(warehouseId);
        return {
          ...item,
          key: `${id}`,
          id,
          skuId,
          warehouseId,
          inventoryBatchId,
          sourceDocumentId,
          sourceDocumentItemId,
          skuCode: sku?.skuCode,
          skuName: skuDisplayName(sku),
          warehouseName: warehouse?.name ?? `仓库 #${warehouseId}`,
        };
      }),
    [transactionsQuery.data, skuMap, warehouseMap],
  );

  const resetFilters = () => {
    setSelectedSkuId(undefined);
    setSelectedWarehouseId(undefined);
    setSelectedChangeType(undefined);
    setDateRange(null);
    setPage(1);
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const updateContextSearch = (skuId: number | undefined, warehouseId: number | undefined) => {
    const next = new URLSearchParams(searchParams);
    if (skuId) next.set('skuId', String(skuId));
    else next.delete('skuId');
    if (warehouseId) next.set('warehouseId', String(warehouseId));
    else next.delete('warehouseId');
    setSearchParams(next, { replace: true });
  };

  const columns: ProColumns<InventoryTransactionRow>[] = [
    {
      title: '变动类型',
      dataIndex: 'changeType',
      width: 105,
      render: (_, record) => <InventoryChangeTypeTag value={record.changeType} />,
    },
    {
      title: 'SKU',
      dataIndex: 'skuCode',
      width: 190,
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
      width: 140,
    },
    {
      title: '数量变化',
      dataIndex: 'quantityChange',
      width: 100,
      align: 'right',
      render: (_, record) => (
        <span className={record.quantityChange >= 0 ? 'inventory-delta positive' : 'inventory-delta negative'}>
          {signedNumber(record.quantityChange)}
        </span>
      ),
    },
    {
      title: '实际库存',
      dataIndex: 'actualQuantityDelta',
      width: 105,
      align: 'right',
      render: (_, record) => signedNumber(record.actualQuantityDelta),
    },
    {
      title: '锁定量',
      dataIndex: 'lockedQuantityDelta',
      width: 95,
      align: 'right',
      render: (_, record) => signedNumber(record.lockedQuantityDelta),
    },
    {
      title: '可用库存',
      dataIndex: 'availableQuantityDelta',
      width: 105,
      align: 'right',
      render: (_, record) => signedNumber(record.availableQuantityDelta),
    },
    {
      title: '变动前/后',
      dataIndex: 'beforeAfter',
      width: 155,
      render: (_, record) => (
        <div className="inventory-before-after">
          <span>实 {record.beforeActualQuantity} / {record.afterActualQuantity}</span>
          <span>锁 {record.beforeLockedQuantity} / {record.afterLockedQuantity}</span>
          <span>可 {record.beforeAvailableQuantity} / {record.afterAvailableQuantity}</span>
        </div>
      ),
    },
    {
      title: '来源单据',
      dataIndex: 'sourceDocumentType',
      width: 180,
      render: (_, record) => (
        <SourceDocumentLink
          sourceDocumentType={record.sourceDocumentType}
          sourceDocumentId={record.sourceDocumentId}
          sourceDocumentCode={record.sourceDocumentCode}
          sourceDocumentLabel={record.sourceDocumentLabel}
          sourceDocumentPath={record.sourceDocumentPath}
        />
      ),
    },
    {
      title: '操作人',
      dataIndex: 'operatedBy',
      width: 105,
      render: (_, record) => record.operatedBy ?? 'system',
    },
    {
      title: '操作时间',
      dataIndex: 'operatedAt',
      width: 150,
      render: (_, record) => (record.operatedAt ? dayjs(record.operatedAt).format('YYYY-MM-DD HH:mm') : '-'),
    },
  ];

  return (
    <div className="master-page inventory-page">
      <div className="master-page-shell">
        <div className="master-page-header inventory-page-header">
          <div className="master-page-heading">
            <div className="master-page-title">库存变动流水</div>
            <div className="master-page-description">按 SKU、仓库、变动类型和操作时间追溯库存实际量、锁定量和可用量变化。</div>
          </div>
          <div className="inventory-header-summary" aria-label="库存流水筛选基础数据">
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

        <div className="inventory-ledger-page-toolbar">
          <label className="inventory-query-field">
            <span className="inventory-query-label">SKU</span>
            <Select<number>
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="全部 SKU"
              options={skuOptions}
              value={selectedSkuId}
              onChange={(value) => {
                setSelectedSkuId(value);
                updateContextSearch(value, selectedWarehouseId);
                setPage(1);
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
                updateContextSearch(selectedSkuId, value);
                setPage(1);
              }}
              style={{ width: '100%' }}
            />
          </label>
          <label className="inventory-query-field">
            <span className="inventory-query-label">变动类型</span>
            <Select<InventoryChangeType>
              allowClear
              placeholder="全部类型"
              options={inventoryChangeTypeOptions}
              value={selectedChangeType}
              onChange={(value) => {
                setSelectedChangeType(value);
                setPage(1);
              }}
              style={{ width: '100%' }}
            />
          </label>
          <label className="inventory-query-field">
            <span className="inventory-query-label">操作时间</span>
            <DatePicker.RangePicker
              value={dateRange}
              onChange={(values) => {
                setDateRange(values ? [values[0], values[1]] : null);
                setPage(1);
              }}
              style={{ width: '100%' }}
            />
          </label>
          <Button className="inventory-query-button" onClick={resetFilters}>
            清除筛选
          </Button>
        </div>

        {transactionsQuery.isError ? (
          <Alert
            type="error"
            showIcon
            message="库存变动流水查询失败"
            description="请检查筛选条件或稍后重试。"
            style={{ marginBottom: 16 }}
          />
        ) : null}

        <div className="master-table-shell">
          <ProTable<InventoryTransactionRow>
            rowKey="key"
            columns={columns}
            dataSource={rows}
            loading={transactionsQuery.isFetching}
            search={false}
            options={false}
            pagination={{
              current: page,
              pageSize,
              total: transactionsQuery.data?.total ?? 0,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
              showTotal: (total) => `共 ${total} 条记录`,
              onChange: (nextPage, nextPageSize) => {
                setPage(nextPage);
                setPageSize(nextPageSize);
              },
            }}
            locale={{
              emptyText: <Empty description="暂无变动流水" />,
            }}
            scroll={{ x: 1425 }}
          />
        </div>
      </div>
    </div>
  );
}
