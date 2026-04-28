import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Empty, Result, Select, Skeleton, Space, Typography, theme } from 'antd';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { ShippingDemandStatus } from '@infitek/shared';
import { getShippingDemands, type ShippingDemand } from '../../api/shipping-demands.api';
import { SearchForm } from '../../components/common/SearchForm';
import type { ActiveTag } from '../../components/common/SearchForm';
import { useDebouncedValue } from '../../hooks/useDebounce';
import '../master-data/master-page.css';

const STATUS_OPTIONS = [
  { label: '待分配库存', value: ShippingDemandStatus.PENDING_ALLOCATION },
  { label: '采购中', value: ShippingDemandStatus.PURCHASING },
  { label: '备货完成', value: ShippingDemandStatus.PREPARED },
  { label: '部分发货', value: ShippingDemandStatus.PARTIALLY_SHIPPED },
  { label: '已发货', value: ShippingDemandStatus.SHIPPED },
  { label: '已作废', value: ShippingDemandStatus.VOIDED },
];

const STATUS_STYLE_MAP: Record<string, { className: string; text: string }> = {
  [ShippingDemandStatus.PENDING_ALLOCATION]: { className: 'master-pill-blue', text: '待分配库存' },
  [ShippingDemandStatus.PURCHASING]: { className: 'master-pill-orange', text: '采购中' },
  [ShippingDemandStatus.PREPARED]: { className: 'master-pill-success', text: '备货完成' },
  [ShippingDemandStatus.PARTIALLY_SHIPPED]: { className: 'master-pill-orange', text: '部分发货' },
  [ShippingDemandStatus.SHIPPED]: { className: 'master-pill-success', text: '已发货' },
  [ShippingDemandStatus.VOIDED]: { className: 'master-pill-red', text: '已作废' },
};

function formatMoney(value?: string | null) {
  if (value == null || value === '') return '-';
  const [integerPart, decimalPart = ''] = value.split('.');
  if (!/^-?\d+$/.test(integerPart) || !/^\d*$/.test(decimalPart)) return value;
  return `${integerPart}.${decimalPart.padEnd(2, '0').slice(0, 2)}`;
}

export default function ShippingDemandsListPage() {
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const [keywordInput, setKeywordInput] = useState('');
  const [status, setStatus] = useState<ShippingDemandStatus | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const keyword = useDebouncedValue(keywordInput, 300).trim();
  const hasFilters = Boolean(keyword) || status != null;

  useEffect(() => {
    setPage(1);
  }, [keyword, status]);

  const query = useQuery({
    queryKey: ['shipping-demands', keyword, status, page, pageSize],
    placeholderData: (previousData) => previousData,
    queryFn: () =>
      getShippingDemands({
        keyword: keyword || undefined,
        status,
        page,
        pageSize,
      }),
  });

  const selectedStatus = STATUS_OPTIONS.find((item) => item.value === status);

  const columns: ProColumns<ShippingDemand>[] = useMemo(
    () => [
      {
        title: '发货需求编号',
        dataIndex: 'demandCode',
        width: 170,
        fixed: 'left',
        render: (_, record) => (
          <Link to={`/shipping-demands/${record.id}`} style={{ color: token.colorLink }}>
            {record.demandCode}
          </Link>
        ),
      },
      {
        title: '来源销售订单',
        dataIndex: 'sourceDocumentCode',
        width: 170,
        render: (_, record) => (
          <Link to={`/sales-orders/${record.salesOrderId}`} style={{ color: token.colorLink }}>
            {record.sourceDocumentCode}
          </Link>
        ),
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
        title: '状态',
        dataIndex: 'status',
        width: 130,
        render: (_, record) => {
          const statusInfo = STATUS_STYLE_MAP[record.status] ?? {
            className: 'master-pill-default',
            text: record.status,
          };
          return <span className={`master-pill ${statusInfo.className}`}>{statusInfo.text}</span>;
        },
      },
      {
        title: '币种',
        dataIndex: 'currencyCode',
        width: 90,
        render: (_, record) =>
          record.currencyCode || <Typography.Text type="secondary">-</Typography.Text>,
      },
      {
        title: '订单金额',
        dataIndex: 'totalAmount',
        width: 120,
        align: 'right',
        render: (_, record) => formatMoney(record.totalAmount),
      },
      {
        title: '运抵国',
        dataIndex: 'destinationCountryName',
        width: 130,
        render: (_, record) =>
          record.destinationCountryName || <Typography.Text type="secondary">-</Typography.Text>,
      },
      {
        title: '目的港',
        dataIndex: 'destinationPortName',
        width: 160,
        render: (_, record) =>
          record.destinationPortName || <Typography.Text type="secondary">-</Typography.Text>,
      },
      {
        title: '商务跟单',
        dataIndex: 'merchandiserName',
        width: 120,
        render: (_, record) =>
          record.merchandiserName || <Typography.Text type="secondary">-</Typography.Text>,
      },
      {
        title: '要求到货日期',
        dataIndex: 'requiredDeliveryAt',
        width: 130,
        render: (_, record) =>
          record.requiredDeliveryAt ? dayjs(record.requiredDeliveryAt).format('YYYY-MM-DD') : '-',
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
          <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/shipping-demands/${record.id}`)}>
            查看
          </Button>
        ),
      },
    ],
    [navigate, token.colorLink],
  );

  if (query.isError && !query.data) {
    return (
      <Result
        status="error"
        title="加载发货需求列表失败"
        subTitle="请检查网络或稍后重试"
        extra={
          <Button type="primary" onClick={() => query.refetch()}>
            重试
          </Button>
        }
      />
    );
  }

  const emptyText = hasFilters ? (
    <Empty description="未找到匹配记录">
      <Button
        type="link"
        onClick={() => {
          setKeywordInput('');
          setStatus(undefined);
          setPage(1);
        }}
      >
        清除筛选条件
      </Button>
    </Empty>
  ) : (
    <Empty description="暂无发货需求">
      <Button type="primary" onClick={() => navigate('/sales-orders')}>
        查看销售订单
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
  ].filter(Boolean) as ActiveTag[];

  return (
    <div className="master-page">
      <div className="master-page-shell">
        <div className="master-page-header">
          <div className="master-page-heading">
            <div className="master-page-title">发货需求</div>
            <div className="master-page-description">集中查看销售订单审核后生成的发货需求和备货状态。</div>
          </div>
        </div>

        <div className="master-list-shell">
          <SearchForm
            searchValue={keywordInput}
            onSearchChange={(value) => {
              setKeywordInput(value);
              setPage(1);
            }}
            placeholder="快捷搜索 发货需求编号/销售订单号/客户/客户代码"
            advancedContent={
              <Space wrap size={12}>
                <Select<ShippingDemandStatus>
                  placeholder="需求状态"
                  allowClear
                  style={{ width: 180 }}
                  value={status}
                  options={STATUS_OPTIONS}
                  onChange={(value) => {
                    setStatus(value);
                    setPage(1);
                  }}
                />
              </Space>
            }
            activeTags={activeTags}
            onClearAll={() => {
              setKeywordInput('');
              setStatus(undefined);
              setPage(1);
            }}
            onQuery={() => {
              setPage(1);
              query.refetch();
            }}
            onReset={() => {
              setKeywordInput('');
              setStatus(undefined);
              setPage(1);
            }}
          />

          <Skeleton active loading={query.isLoading && !query.data} style={{ marginTop: token.marginMD }}>
            <ProTable<ShippingDemand>
              search={false}
              options={false}
              toolBarRender={false}
              rowKey="id"
              loading={query.isFetching}
              columns={columns}
              dataSource={query.data?.list ?? []}
              scroll={{ x: 1700, y: 540 }}
              rowClassName={() => 'shipping-demand-row-height'}
              locale={{ emptyText }}
              pagination={{
                current: page,
                pageSize,
                total: query.data?.total ?? 0,
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
        .shipping-demand-row-height .ant-table-cell {
          height: 48px;
        }
      `}</style>
    </div>
  );
}
