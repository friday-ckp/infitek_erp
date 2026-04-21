import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Button,
  Empty,
  Flex,
  Input,
  Result,
  Skeleton,
  Space,
  Tag,
  Typography,
  theme,
} from 'antd';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getCountries, type Country } from '../../../api/countries.api';

function useDebouncedValue(input: string, delay = 300) {
  const [value, setValue] = useState(input);

  useEffect(() => {
    const timer = window.setTimeout(() => setValue(input), delay);
    return () => window.clearTimeout(timer);
  }, [input, delay]);

  return value;
}

export default function CountriesListPage() {
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const [keywordInput, setKeywordInput] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const keyword = useDebouncedValue(keywordInput, 300).trim();
  const hasFilters = Boolean(keyword);

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

  const tags = [
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
  ].filter(Boolean) as Array<{ key: string; label: string; onClose: () => void }>;

  return (
    <div>
      <Flex align="center" justify="space-between" style={{ marginBottom: token.marginMD }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          国家/地区管理
        </Typography.Title>
        <Button type="primary" onClick={() => navigate('/master-data/countries/create')}>
          新建国家/地区
        </Button>
      </Flex>

      <Space direction="vertical" size={token.marginSM} style={{ width: '100%' }}>
        <Flex gap={token.marginSM} wrap>
          <Input
            placeholder="快捷搜索国家/地区代码/名称"
            style={{ width: 320 }}
            value={keywordInput}
            onChange={(e) => {
              setKeywordInput(e.target.value);
              setPage(1);
            }}
            allowClear
          />
        </Flex>

        {tags.length > 0 ? (
          <Space wrap>
            {tags.map((item) => (
              <Tag closable key={item.key} onClose={item.onClose}>
                {item.label}
              </Tag>
            ))}
            <Button
              type="link"
              onClick={() => {
                setKeywordInput('');
                setPage(1);
              }}
            >
              清除全部
            </Button>
          </Space>
        ) : null}
      </Space>

      <Skeleton active loading={query.isLoading && !query.data} style={{ marginTop: token.marginMD }}>
        <ProTable<Country>
          search={false}
          options={{ density: false, setting: true }}
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

      <style>{`
        .country-row-height .ant-table-cell {
          height: 48px;
        }
      `}</style>
    </div>
  );
}
