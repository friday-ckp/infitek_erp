import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Button,
  Empty,
  Rate,
  Result,
  Skeleton,
  Space,
  theme,
} from 'antd';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getLogisticsProviders, type LogisticsProvider } from '../../../api/logistics-providers.api';
import { SearchForm } from '../../../components/common/SearchForm';
import type { ActiveTag } from '../../../components/common/SearchForm';
import { useDebouncedValue } from '../../../hooks/useDebounce';
import '../master-page.css';

export default function LogisticsProvidersListPage() {
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const [keywordInput, setKeywordInput] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const keyword = useDebouncedValue(keywordInput, 300).trim();
  const hasFilters = Boolean(keyword);

  useEffect(() => {
    setPage(1);
  }, [keyword]);

  const query = useQuery({
    queryKey: ['logistics-providers', keyword, page, pageSize],
    placeholderData: (previousData) => previousData,
    queryFn: () =>
      getLogisticsProviders({
        keyword: keyword || undefined,
        page,
        pageSize,
      }),
  });

  if (query.isError && !query.data) {
    return (
      <Result
        status="error"
        title="加载物流供应商列表失败"
        subTitle="请检查网络或稍后重试"
        extra={<Button type="primary" onClick={() => query.refetch()}>重试</Button>}
      />
    );
  }

  const columns: ProColumns<LogisticsProvider>[] = useMemo(
    () => [
      {
        title: '供应商名称',
        dataIndex: 'name',
        width: 220,
        render: (_, record) => (
          <Link to={`/master-data/logistics-providers/${record.id}`} style={{ color: token.colorLink }}>
            {record.name}
          </Link>
        ),
      },
      {
        title: '联系电话',
        dataIndex: 'contactPhone',
        width: 180,
        renderText: (value) => value || '-',
      },
      {
        title: '联系人',
        dataIndex: 'contactPerson',
        width: 160,
        renderText: (value) => value || '-',
      },
      {
        title: '合作状态',
        dataIndex: 'status',
        width: 120,
      },
      {
        title: '国家/地区',
        dataIndex: 'countryName',
        width: 160,
        renderText: (value) => value || '-',
      },
      {
        title: '供应商等级',
        dataIndex: 'providerLevel',
        width: 160,
        render: (_, record) => (
          record.providerLevel ? <Rate disabled count={5} value={record.providerLevel} /> : '-'
        ),
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
        width: 140,
        fixed: 'right',
        render: (_, record) => (
          <Space size={12}>
            <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/master-data/logistics-providers/${record.id}`)}>
              查看
            </Button>
            <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/master-data/logistics-providers/${record.id}/edit`)}>
              编辑
            </Button>
          </Space>
        ),
      },
    ],
    [navigate, token.colorLink],
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
  ].filter(Boolean) as ActiveTag[];

  const emptyText = hasFilters ? (
    <Empty description="未找到匹配记录">
      <Button
        type="link"
        onClick={() => {
          setKeywordInput('');
          setPage(1);
        }}
      >
        清除筛选条件
      </Button>
    </Empty>
  ) : (
    <Empty description="暂无数据">
      <Button type="primary" onClick={() => navigate('/master-data/logistics-providers/create')}>
        新建物流供应商
      </Button>
    </Empty>
  );

  return (
    <div className="master-page">
      <div className="master-page-shell">
        <div className="master-page-header">
          <div className="master-page-heading">
            <div className="master-page-title">物流供应商管理</div>
            <div className="master-page-description">统一维护物流供应商、联系人、国家地区与合作等级。</div>
          </div>
          <div className="master-page-actions">
            <Button type="primary" onClick={() => navigate('/master-data/logistics-providers/create')}>
              新建物流供应商
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
            placeholder="快捷搜索名称/编码/联系人/电话"
            activeTags={activeTags}
            onClearAll={() => {
              setKeywordInput('');
              setPage(1);
            }}
            onQuery={() => {
              setPage(1);
              query.refetch();
            }}
            onReset={() => {
              setKeywordInput('');
              setPage(1);
            }}
          />

          <Skeleton active loading={query.isLoading && !query.data} style={{ marginTop: token.marginMD }}>
            <ProTable<LogisticsProvider>
              search={false}
              options={false}
              toolBarRender={false}
              rowKey="id"
              loading={query.isFetching}
              columns={columns}
              dataSource={query.data?.list ?? []}
              scroll={{ x: 1220, y: 540 }}
              rowClassName={() => 'logistics-provider-row-height'}
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
        .logistics-provider-row-height .ant-table-cell {
          height: 48px;
        }
      `}</style>
    </div>
  );
}
