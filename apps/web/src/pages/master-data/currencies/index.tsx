import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Badge,
  Button,
  Empty,
  Popconfirm,
  Result,
  Select,
  Skeleton,
  Space,
  Tag,
  message,
  theme,
} from 'antd';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import type { CurrencyStatus } from '@infitek/shared';
import { getCurrencies, updateCurrency, type Currency } from '../../../api/currencies.api';
import { SearchForm } from '../../../components/common/SearchForm';
import type { ActiveTag } from '../../../components/common/SearchForm';
import { useDebouncedValue } from '../../../hooks/useDebounce';
import '../master-page.css';

const CURRENCY_STATUS_ACTIVE = 'active' as CurrencyStatus;
const CURRENCY_STATUS_INACTIVE = 'inactive' as CurrencyStatus;

const statusOptions: Array<{ label: string; value: CurrencyStatus }> = [
  { label: '启用', value: CURRENCY_STATUS_ACTIVE },
  { label: '禁用', value: CURRENCY_STATUS_INACTIVE },
];

const statusTagMap = {
  active: { status: 'success', text: '启用' },
  inactive: { status: 'default', text: '禁用' },
} satisfies Record<CurrencyStatus, { status: 'success' | 'default'; text: string }>;

export default function CurrenciesListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token } = theme.useToken();

  const [keywordInput, setKeywordInput] = useState('');
  const [status, setStatus] = useState<CurrencyStatus | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const keyword = useDebouncedValue(keywordInput, 300).trim();
  const hasFilters = Boolean(keyword || status);

  useEffect(() => {
    setPage(1);
  }, [keyword, status]);

  const query = useQuery({
    queryKey: ['currencies', keyword, status, page, pageSize],
    placeholderData: (previousData) => previousData,
    queryFn: () =>
      getCurrencies({
        keyword: keyword || undefined,
        status,
        page,
        pageSize,
      }),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: number; newStatus: CurrencyStatus }) =>
      updateCurrency(id, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      message.success('操作成功');
    },
  });

  const columns: ProColumns<Currency>[] = useMemo(
    () => [
      {
        title: '币种代码',
        dataIndex: 'code',
        width: 160,
        render: (_, record) => (
          <Link to={`/master-data/currencies/${record.id}`} style={{ color: token.colorLink }}>
            {record.code}
          </Link>
        ),
      },
      {
        title: '币种名称',
        dataIndex: 'name',
        width: 200,
        ellipsis: true,
      },
      {
        title: '本位币',
        dataIndex: 'isBaseCurrency',
        width: 100,
        render: (_, record) =>
          record.isBaseCurrency === 1 ? (
            <Tag color="processing">本位币</Tag>
          ) : null,
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 120,
        render: (_, record) => {
          const meta = statusTagMap[record.status];
          return <Badge status={meta.status} text={meta.text} />;
        },
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
        width: 180,
        fixed: 'right',
        render: (_, record) => (
          <Space size={12}>
            <Button
              type="link"
              style={{ padding: 0 }}
              onClick={() => navigate(`/master-data/currencies/${record.id}`)}
            >
              查看
            </Button>
            <Button
              type="link"
              style={{ padding: 0 }}
              onClick={() => navigate(`/master-data/currencies/${record.id}/edit`)}
            >
              编辑
            </Button>
            <Popconfirm
              title={record.status === CURRENCY_STATUS_ACTIVE ? '确认禁用该币种？' : '确认启用该币种？'}
              onConfirm={() =>
                toggleStatusMutation.mutate({
                  id: record.id,
                  newStatus:
                    record.status === CURRENCY_STATUS_ACTIVE
                      ? CURRENCY_STATUS_INACTIVE
                      : CURRENCY_STATUS_ACTIVE,
                })
              }
            >
              <Button type="link" style={{ padding: 0 }}>
                {record.status === CURRENCY_STATUS_ACTIVE ? '禁用' : '启用'}
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigate, token.colorLink],
  );

  if (query.isError && !query.data) {
    return (
      <Result
        status="error"
        title="加载币种列表失败"
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
    <Empty description="暂无数据">
      <Button type="primary" onClick={() => navigate('/master-data/currencies/create')}>
        新建币种
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
    status
      ? {
          key: 'status',
          label: `状态: ${statusTagMap[status].text}`,
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
            <div className="master-page-title">币种管理</div>
            <div className="master-page-description">统一维护币种代码、本位币标识与启停用状态。</div>
          </div>
          <div className="master-page-actions">
            <Button type="primary" onClick={() => navigate('/master-data/currencies/create')}>
              新建币种
            </Button>
          </div>
        </div>

        <div className="master-list-shell">
          <SearchForm
            searchValue={keywordInput}
            onSearchChange={(v) => { setKeywordInput(v); setPage(1); }}
            placeholder="快捷搜索币种代码/名称"
            activeTags={activeTags}
            onClearAll={() => { setKeywordInput(''); setStatus(undefined); setPage(1); }}
            onQuery={() => { setPage(1); query.refetch(); }}
            onReset={() => { setKeywordInput(''); setStatus(undefined); setPage(1); }}
            advancedContent={
              <Select<CurrencyStatus>
                allowClear
                placeholder="按状态筛选"
                options={statusOptions}
                value={status}
                onChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
                style={{ width: 200 }}
              />
            }
          />

          <Skeleton active loading={query.isLoading && !query.data} style={{ marginTop: token.marginMD }}>
            <ProTable<Currency>
              search={false}
              options={false}
              toolBarRender={false}
              rowKey="id"
              loading={query.isFetching}
              columns={columns}
              dataSource={query.data?.list ?? []}
              scroll={{ x: 900, y: 540 }}
              rowClassName={() => 'currency-row-height'}
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
        .currency-row-height .ant-table-cell {
          height: 48px;
        }
      `}</style>
    </div>
  );
}
