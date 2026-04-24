import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Button,
  Empty,
  Flex,
  Result,
  Skeleton,
  Space,
  Typography,
  theme,
} from 'antd';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getCountries } from '../../../api/countries.api';
import { getPorts, type Port } from '../../../api/ports.api';
import { SearchForm } from '../../../components/common/SearchForm';
import type { ActiveTag } from '../../../components/common/SearchForm';
import { useDebouncedValue } from '../../../hooks/useDebounce';

export default function PortsListPage() {
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const [keywordInput, setKeywordInput] = useState('');
  const [countryId, setCountryId] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const keyword = useDebouncedValue(keywordInput, 300).trim();
  const hasFilters = Boolean(keyword || countryId);

  useEffect(() => {
    setPage(1);
  }, [keyword, countryId]);

  const countriesQuery = useQuery({
    queryKey: ['countries', 'ports-filter'],
    queryFn: () => getCountries({ page: 1, pageSize: 100 }),
  });

  const query = useQuery({
    queryKey: ['ports', keyword, countryId, page, pageSize],
    placeholderData: (previousData) => previousData,
    queryFn: () =>
      getPorts({
        keyword: keyword || undefined,
        countryId,
        page,
        pageSize,
      }),
  });

  if (query.isError && !query.data) {
    return (
      <Result
        status="error"
        title="加载港口列表失败"
        subTitle="请检查网络或稍后重试"
        extra={<Button type="primary" onClick={() => query.refetch()}>重试</Button>}
      />
    );
  }

  const columns: ProColumns<Port>[] = useMemo(
    () => [
      {
        title: '港口名称',
        dataIndex: 'nameCn',
        width: 220,
        render: (_, record) => (
          <Link to={`/master-data/ports/${record.id}`} style={{ color: token.colorLink }}>
            {record.nameCn}
          </Link>
        ),
      },
      {
        title: '国家/地区',
        dataIndex: 'countryName',
        width: 180,
      },
      {
        title: '港口/机场代码',
        dataIndex: 'portCode',
        width: 160,
      },
      {
        title: '港口类型',
        dataIndex: 'portType',
        width: 120,
        renderText: (value) => value || '-',
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
            <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/master-data/ports/${record.id}`)}>
              查看
            </Button>
            <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/master-data/ports/${record.id}/edit`)}>
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
    countryId
      ? {
          key: 'countryId',
          label: `国家: ${countriesQuery.data?.list.find((item) => item.id === countryId)?.name ?? countryId}`,
          onClose: () => {
            setCountryId(undefined);
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
          setCountryId(undefined);
          setPage(1);
        }}
      >
        清除筛选条件
      </Button>
    </Empty>
  ) : (
    <Empty description="暂无数据">
      <Button type="primary" onClick={() => navigate('/master-data/ports/create')}>
        新建港口
      </Button>
    </Empty>
  );

  return (
    <div>
      <Flex align="center" justify="space-between" style={{ marginBottom: token.marginMD }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          港口信息管理
        </Typography.Title>
        <Button type="primary" onClick={() => navigate('/master-data/ports/create')}>
          新建港口
        </Button>
      </Flex>

      <SearchForm
        searchValue={keywordInput}
        onSearchChange={(value) => {
          setKeywordInput(value);
          setPage(1);
        }}
        placeholder="快捷搜索港口名称/代码"
        advancedContent={(
          <select
            value={countryId ?? ''}
            onChange={(event) => {
              const value = event.target.value;
              setCountryId(value ? Number(value) : undefined);
            }}
            style={{
              minWidth: 220,
              height: 32,
              borderColor: '#d9d9d9',
              borderRadius: 6,
              padding: '0 11px',
              background: '#fff',
            }}
          >
            <option value="">全部国家/地区</option>
            {(countriesQuery.data?.list ?? []).map((country) => (
              <option key={country.id} value={country.id}>
                {country.name} ({country.code})
              </option>
            ))}
          </select>
        )}
        activeTags={activeTags}
        onClearAll={() => {
          setKeywordInput('');
          setCountryId(undefined);
          setPage(1);
        }}
        onQuery={() => {
          setPage(1);
          query.refetch();
        }}
        onReset={() => {
          setKeywordInput('');
          setCountryId(undefined);
          setPage(1);
        }}
      />

      <Skeleton active loading={query.isLoading && !query.data} style={{ marginTop: token.marginMD }}>
        <ProTable<Port>
          search={false}
          options={false}
          toolBarRender={false}
          rowKey="id"
          loading={query.isFetching}
          columns={columns}
          dataSource={query.data?.list ?? []}
          scroll={{ x: 920, y: 540 }}
          rowClassName={() => 'port-row-height'}
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

      <style>{`
        .port-row-height .ant-table-cell {
          height: 48px;
        }
      `}</style>
    </div>
  );
}
