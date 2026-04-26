import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Empty, Result, Select, Skeleton, Space, Typography, theme } from 'antd';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { SalesOrderSource, SalesOrderStatus, SalesOrderType } from '@infitek/shared';
import { getCustomers, type Customer } from '../../api/customers.api';
import { getSalesOrders, type SalesOrder } from '../../api/sales-orders.api';
import { SearchForm } from '../../components/common/SearchForm';
import type { ActiveTag } from '../../components/common/SearchForm';
import { useDebouncedValue } from '../../hooks/useDebounce';
import '../master-data/master-page.css';

const ORDER_TYPE_OPTIONS = [
  { label: '销售订单', value: SalesOrderType.SALES },
  { label: '售后订单', value: SalesOrderType.AFTER_SALES },
  { label: '样品销售', value: SalesOrderType.SAMPLE },
];

const STATUS_OPTIONS = [
  { label: '待提交', value: SalesOrderStatus.PENDING_SUBMIT },
  { label: '审核中', value: SalesOrderStatus.IN_REVIEW },
  { label: '审核通过', value: SalesOrderStatus.APPROVED },
  { label: '已驳回', value: SalesOrderStatus.REJECTED },
  { label: '备货中', value: SalesOrderStatus.PREPARING },
  { label: '备货完成', value: SalesOrderStatus.PREPARED },
  { label: '部分发货', value: SalesOrderStatus.PARTIALLY_SHIPPED },
  { label: '已发货', value: SalesOrderStatus.SHIPPED },
  { label: '已作废', value: SalesOrderStatus.VOIDED },
];

const STATUS_STYLE_MAP: Record<string, { className: string; text: string }> = {
  [SalesOrderStatus.PENDING_SUBMIT]: { className: 'master-pill-default', text: '待提交' },
  [SalesOrderStatus.IN_REVIEW]: { className: 'master-pill-orange', text: '审核中' },
  [SalesOrderStatus.APPROVED]: { className: 'master-pill-blue', text: '审核通过' },
  [SalesOrderStatus.REJECTED]: { className: 'master-pill-red', text: '已驳回' },
  [SalesOrderStatus.PREPARING]: { className: 'master-pill-blue', text: '备货中' },
  [SalesOrderStatus.PREPARED]: { className: 'master-pill-success', text: '备货完成' },
  [SalesOrderStatus.PARTIALLY_SHIPPED]: { className: 'master-pill-orange', text: '部分发货' },
  [SalesOrderStatus.SHIPPED]: { className: 'master-pill-success', text: '已发货' },
  [SalesOrderStatus.VOIDED]: { className: 'master-pill-red', text: '已作废' },
};

const ORDER_SOURCE_LABELS: Record<string, string> = {
  [SalesOrderSource.MANUAL]: '手工录单',
  [SalesOrderSource.THIRD_PARTY]: '第三方获取',
};

function formatMoney(value?: string | null) {
  if (value == null || value === '') return '—';
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : value;
}

function formatOrderType(value?: string | null) {
  return ORDER_TYPE_OPTIONS.find((item) => item.value === value)?.label ?? value ?? '—';
}

export default function SalesOrdersListPage() {
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const [keywordInput, setKeywordInput] = useState('');
  const [customerId, setCustomerId] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState<SalesOrderStatus | undefined>(undefined);
  const [orderType, setOrderType] = useState<SalesOrderType | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const keyword = useDebouncedValue(keywordInput, 300).trim();
  const hasFilters = Boolean(keyword) || customerId != null || status != null || orderType != null;

  useEffect(() => {
    setPage(1);
  }, [keyword, customerId, status, orderType]);

  const salesOrdersQuery = useQuery({
    queryKey: ['sales-orders', keyword, customerId, status, orderType, page, pageSize],
    placeholderData: (previousData) => previousData,
    queryFn: () =>
      getSalesOrders({
        keyword: keyword || undefined,
        customerId,
        status,
        orderType,
        page,
        pageSize,
      }),
  });

  const customersQuery = useQuery({
    queryKey: ['customers', 'sales-order-filter'],
    queryFn: () => getCustomers({ page: 1, pageSize: 200 }),
  });

  if (salesOrdersQuery.isError && !salesOrdersQuery.data) {
    return (
      <Result
        status="error"
        title="加载销售订单列表失败"
        subTitle="请检查网络或稍后重试"
        extra={
          <Button type="primary" onClick={() => salesOrdersQuery.refetch()}>
            重试
          </Button>
        }
      />
    );
  }

  const customers = customersQuery.data?.list ?? [];
  const selectedCustomer = customers.find((item) => item.id === customerId);
  const selectedStatus = STATUS_OPTIONS.find((item) => item.value === status);
  const selectedOrderType = ORDER_TYPE_OPTIONS.find((item) => item.value === orderType);

  const columns: ProColumns<SalesOrder>[] = useMemo(
    () => [
      {
        title: 'ERP销售订单号',
        dataIndex: 'erpSalesOrderCode',
        width: 170,
        fixed: 'left',
        render: (_, record) => (
          <Link to={`/sales-orders/${record.id}`} style={{ color: token.colorLink }}>
            {record.erpSalesOrderCode}
          </Link>
        ),
      },
      {
        title: '订单号',
        dataIndex: 'externalOrderCode',
        width: 180,
        ellipsis: true,
      },
      {
        title: '客户',
        dataIndex: 'customerName',
        width: 220,
        ellipsis: true,
      },
      {
        title: '客户代码',
        dataIndex: 'customerCode',
        width: 140,
      },
      {
        title: '订单类型',
        dataIndex: 'orderType',
        width: 120,
        render: (_, record) => formatOrderType(record.orderType),
      },
      {
        title: '订单来源',
        dataIndex: 'orderSource',
        width: 120,
        render: (_, record) => ORDER_SOURCE_LABELS[record.orderSource] ?? record.orderSource ?? '—',
      },
      {
        title: '订单状态',
        dataIndex: 'status',
        width: 120,
        render: (_, record) => {
          const statusInfo = STATUS_STYLE_MAP[record.status] ?? {
            className: 'master-pill-default',
            text: record.status,
          };
          return <span className={`master-pill ${statusInfo.className}`}>{statusInfo.text}</span>;
        },
      },
      {
        title: '合同金额',
        dataIndex: 'contractAmount',
        width: 120,
        align: 'right',
        render: (_, record) => formatMoney(record.contractAmount),
      },
      {
        title: '已收款金额',
        dataIndex: 'receivedAmount',
        width: 120,
        align: 'right',
        render: (_, record) => formatMoney(record.receivedAmount),
      },
      {
        title: '待收款金额',
        dataIndex: 'outstandingAmount',
        width: 120,
        align: 'right',
        render: (_, record) => formatMoney(record.outstandingAmount),
      },
      {
        title: '销售员',
        dataIndex: 'salespersonName',
        width: 120,
        render: (_, record) =>
          record.salespersonName || <Typography.Text type="secondary">-</Typography.Text>,
      },
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        width: 140,
        render: (_, record) => dayjs(record.createdAt).format('YYYY-MM-DD'),
      },
      {
        title: '操作',
        key: 'actions',
        width: 100,
        fixed: 'right',
        render: (_, record) => (
          <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/sales-orders/${record.id}`)}>
            查看
          </Button>
        ),
      },
    ],
    [navigate, token.colorLink],
  );

  const emptyText = hasFilters ? (
    <Empty description="未找到匹配记录">
      <Button
        type="link"
        onClick={() => {
          setKeywordInput('');
          setCustomerId(undefined);
          setStatus(undefined);
          setOrderType(undefined);
          setPage(1);
        }}
      >
        清除筛选条件
      </Button>
    </Empty>
  ) : (
    <Empty description="暂无销售订单">
      <Button type="primary" onClick={() => navigate('/sales-orders/create')}>
        新建销售订单
      </Button>
    </Empty>
  );

  const activeTags: ActiveTag[] = [
    keyword
      ? {
          key: 'keyword',
          label: `关键词: ${keyword}`,
          onClose: () => {
            setKeywordInput('');
            setPage(1);
          },
        }
      : null,
    selectedCustomer
      ? {
          key: 'customer',
          label: `客户: ${selectedCustomer.customerName}`,
          onClose: () => {
            setCustomerId(undefined);
            setPage(1);
          },
        }
      : null,
    selectedStatus
      ? {
          key: 'status',
          label: `状态: ${selectedStatus.label}`,
          onClose: () => {
            setStatus(undefined);
            setPage(1);
          },
        }
      : null,
    selectedOrderType
      ? {
          key: 'orderType',
          label: `类型: ${selectedOrderType.label}`,
          onClose: () => {
            setOrderType(undefined);
            setPage(1);
          },
        }
      : null,
  ].filter(Boolean) as ActiveTag[];

  return (
    <div className="master-page">
      <div className="master-page-shell">
        <div className="master-page-header">
          <div className="master-page-heading">
            <div className="master-page-title">销售订单</div>
            <div className="master-page-description">集中查看销售订单进度、收款情况和订单状态流转。</div>
          </div>
          <div className="master-page-actions">
            <Button type="primary" onClick={() => navigate('/sales-orders/create')}>
              新建销售订单
            </Button>
          </div>
        </div>

        <div className="master-list-shell">
          <SearchForm
            searchValue={keywordInput}
            onSearchChange={(value) => {
              setKeywordInput(value);
              setPage(1);
            }}
            placeholder="快捷搜索 ERP销售订单号/订单号/客户/客户代码"
            advancedContent={
              <Space wrap size={12}>
                <Select<number>
                  placeholder="客户"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  style={{ width: 240 }}
                  loading={customersQuery.isLoading}
                  value={customerId}
                  options={customers.map((item: Customer) => ({
                    label: `${item.customerName} (${item.customerCode})`,
                    value: item.id,
                  }))}
                  onChange={(value) => {
                    setCustomerId(value);
                    setPage(1);
                  }}
                />
                <Select<SalesOrderStatus>
                  placeholder="订单状态"
                  allowClear
                  style={{ width: 180 }}
                  value={status}
                  options={STATUS_OPTIONS}
                  onChange={(value) => {
                    setStatus(value);
                    setPage(1);
                  }}
                />
                <Select<SalesOrderType>
                  placeholder="订单类型"
                  allowClear
                  style={{ width: 180 }}
                  value={orderType}
                  options={ORDER_TYPE_OPTIONS}
                  onChange={(value) => {
                    setOrderType(value);
                    setPage(1);
                  }}
                />
              </Space>
            }
            activeTags={activeTags}
            onClearAll={() => {
              setKeywordInput('');
              setCustomerId(undefined);
              setStatus(undefined);
              setOrderType(undefined);
              setPage(1);
            }}
            onQuery={() => {
              setPage(1);
              salesOrdersQuery.refetch();
            }}
            onReset={() => {
              setKeywordInput('');
              setCustomerId(undefined);
              setStatus(undefined);
              setOrderType(undefined);
              setPage(1);
            }}
          />

          <Skeleton active loading={salesOrdersQuery.isLoading && !salesOrdersQuery.data} style={{ marginTop: token.marginMD }}>
            <ProTable<SalesOrder>
              search={false}
              options={false}
              toolBarRender={false}
              rowKey="id"
              loading={salesOrdersQuery.isFetching}
              columns={columns}
              dataSource={salesOrdersQuery.data?.list ?? []}
              scroll={{ x: 1540, y: 540 }}
              rowClassName={() => 'sales-order-row-height'}
              locale={{ emptyText }}
              pagination={{
                current: page,
                pageSize,
                total: salesOrdersQuery.data?.total ?? 0,
                showSizeChanger: true,
                pageSizeOptions: [10, 20, 50],
                showTotal: (total) => `共 ${total} 条记录`,
                onChange: (nextPage, nextPageSize) => {
                  if (nextPageSize !== pageSize) {
                    setPage(1);
                  } else {
                    setPage(nextPage);
                  }
                  setPageSize(nextPageSize);
                },
              }}
            />
          </Skeleton>
        </div>
      </div>

      <style>{`
        .sales-order-row-height .ant-table-cell {
          height: 48px;
        }
      `}</style>
    </div>
  );
}
