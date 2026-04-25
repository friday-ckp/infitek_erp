import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Button,
  Empty,
  Result,
  Skeleton,
  Space,
  theme,
} from 'antd';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getCountries, type Country } from '../../../api/countries.api';
import { SearchForm } from '../../../components/common/SearchForm';
import type { ActiveTag } from '../../../components/common/SearchForm';
import { useDebouncedValue } from '../../../hooks/useDebounce';
import '../master-page.css';

export default function CountriesListPage() {
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
    queryKey: ['countries', keyword, page, pageSize],
    placeholderData: (previousData) => previousData,
    queryFn: () =>
      getCountries({
        keyword: keyword || undefined,
        page,
        pageSize,
      }),
  });

  const columns: ProColumns<Country>[] = useMemo(
    () => [
      {
        title: '国家/地区代码',
        dataIndex: 'code',
        width: 160,
        render: (_, record) => (
          <Link to={`/master-data/countries/${record.id}`} style={{ color: token.colorLink }}>
            {record.code}
          </Link>
        ),
      },
      {
        title: '国家/地区名称',
        dataIndex: 'name',
        width: 200,
        ellipsis: true,
      },
      {
        title: '英文名称',
        dataIndex: 'nameEn',
        width: 180,
        ellipsis: true,
        hideInTable: true,
        renderText: (v: string | null | undefined) => v || '-',
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
            <Button
              type="link"
              style={{ padding: 0 }}
              onClick={() => navigate(`/master-data/countries/${record.id}`)}
            >
              查看
            </Button>
            <Button
              type="link"
              style={{ padding: 0 }}
              onClick={() => navigate(`/master-data/countries/${record.id}/edit`)}
            >
              编辑
            </Button>
          </Space>
        ),
      },
    ],
    [navigate, token.colorLink],
  );

  if (query.isError && !query.data) {
    return (
      <Result
        status="error"
        title="加载国家/地区列表失败"
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
          setPage(1);
        }}
      >
        清除筛选条件
      </Button>
    </Empty>
  ) : (
    <Empty description="暂无数据">
      <Button type="primary" onClick={() => navigate('/master-data/countries/create')}>
        新建国家/地区
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
  ].filter(Boolean) as ActiveTag[];

  return (
    <div className="master-page">
      <div className="master-page-shell">
        <div className="master-page-header">
          <div className="master-page-heading">
            <div className="master-page-title">国家/地区管理</div>
            <div className="master-page-description">统一维护国家地区代码、名称与基础归档信息。</div>
          </div>
          <div className="master-page-actions">
            <Button type="primary" onClick={() => navigate('/master-data/countries/create')}>
              新建国家/地区
            </Button>
          </div>
        </div>

        <div className="master-list-shell">
          <SearchForm
            searchValue={keywordInput}
            onSearchChange={(v) => { setKeywordInput(v); setPage(1); }}
            placeholder="快捷搜索国家/地区代码/名称"
            activeTags={activeTags}
            onClearAll={() => { setKeywordInput(''); setPage(1); }}
            onQuery={() => { setPage(1); query.refetch(); }}
            onReset={() => { setKeywordInput(''); setPage(1); }}
          />

          <Skeleton active loading={query.isLoading && !query.data} style={{ marginTop: token.marginMD }}>
            <ProTable<Country>
              search={false}
              options={false}
              toolBarRender={false}
              rowKey="id"
              loading={query.isFetching}
              columns={columns}
              dataSource={query.data?.list ?? []}
              scroll={{ x: 700, y: 540 }}
              rowClassName={() => 'country-row-height'}
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
        .country-row-height .ant-table-cell {
          height: 48px;
        }
      `}</style>
    </div>
  );
}
