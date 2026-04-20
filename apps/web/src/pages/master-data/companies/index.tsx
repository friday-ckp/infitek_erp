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
  Tooltip,
  Typography,
  theme,
} from 'antd';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getCompanies, type Company } from '../../../api/companies.api';

function useDebouncedValue(input: string, delay = 300) {
  const [value, setValue] = useState(input);

  useEffect(() => {
    const timer = window.setTimeout(() => setValue(input), delay);
    return () => window.clearTimeout(timer);
  }, [input, delay]);

  return value;
}

export default function CompaniesListPage() {
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
    queryKey: ['companies', keyword, page, pageSize],
    placeholderData: (previousData) => previousData,
    queryFn: () =>
      getCompanies({
        keyword: keyword || undefined,
        page,
        pageSize,
      }),
  });

  if (query.isError && !query.data) {
    return (
      <Result
        status="error"
        title="加载公司主体列表失败"
        subTitle="请检查网络或稍后重试"
        extra={
          <Button type="primary" onClick={() => query.refetch()}>
            重试
          </Button>
        }
      />
    );
  }

  const columns: ProColumns<Company>[] = useMemo(
    () => [
      {
        title: '公司名称',
        dataIndex: 'name',
        width: 280,
        ellipsis: true,
        render: (_, record) => (
          <Link to={`/master-data/companies/${record.id}`} style={{ color: token.colorLink }}>
            {record.name}
          </Link>
        ),
      },
      {
        title: '签订地点',
        dataIndex: 'signingLocation',
        width: 160,
        ellipsis: true,
        render: (_, record) =>
          record.signingLocation ? (
            <Tooltip title={record.signingLocation}>
              <Typography.Text ellipsis style={{ maxWidth: 140, display: 'inline-block' }}>
                {record.signingLocation}
              </Typography.Text>
            </Tooltip>
          ) : (
            <Typography.Text type="secondary">-</Typography.Text>
          ),
      },
      {
        title: '默认币种',
        dataIndex: 'defaultCurrencyCode',
        width: 120,
        render: (_, record) =>
          record.defaultCurrencyCode ? (
            <Tag>{record.defaultCurrencyCode}</Tag>
          ) : (
            <Typography.Text type="secondary">-</Typography.Text>
          ),
      },
      {
        title: '纳税人识别号',
        dataIndex: 'taxId',
        width: 180,
        ellipsis: true,
        render: (_, record) => record.taxId || <Typography.Text type="secondary">-</Typography.Text>,
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
        width: 160,
        fixed: 'right',
        render: (_, record) => (
          <Space size={12}>
            <Button
              type="link"
              style={{ padding: 0 }}
              onClick={() => navigate(`/master-data/companies/${record.id}`)}
            >
              查看
            </Button>
            <Button
              type="link"
              style={{ padding: 0 }}
              onClick={() => navigate(`/master-data/companies/${record.id}/edit`)}
            >
              编辑
            </Button>
          </Space>
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
          setPage(1);
        }}
      >
        清除筛选条件
      </Button>
    </Empty>
  ) : (
    <Empty description="暂无数据">
      <Button type="primary" onClick={() => navigate('/master-data/companies/create')}>
        新建公司主体
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
          公司主体管理
        </Typography.Title>
        <Button type="primary" onClick={() => navigate('/master-data/companies/create')}>
          新建公司主体
        </Button>
      </Flex>

      <Space direction="vertical" size={token.marginSM} style={{ width: '100%' }}>
        <Input
          placeholder="快捷搜索公司名称"
          style={{ width: 320 }}
          value={keywordInput}
          onChange={(e) => {
            setKeywordInput(e.target.value);
            setPage(1);
          }}
          allowClear
        />

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
        <ProTable<Company>
          search={false}
          options={false}
          toolBarRender={false}
          rowKey="id"
          loading={query.isFetching}
          columns={columns}
          dataSource={query.data?.list ?? []}
          scroll={{ x: 1060, y: 540 }}
          rowClassName={() => 'company-row-height'}
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
        .company-row-height .ant-table-cell {
          height: 48px;
        }
      `}</style>
    </div>
  );
}
