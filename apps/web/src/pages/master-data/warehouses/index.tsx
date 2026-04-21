import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Badge,
  Button,
  Empty,
  Flex,
  Input,
  Popconfirm,
  Result,
  Select,
  Skeleton,
  Space,
  Tag,
  Tooltip,
  Typography,
  message,
  theme,
} from 'antd';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import type { WarehouseStatus } from '@infitek/shared';
import { getWarehouses, updateWarehouse, type Warehouse } from '../../../api/warehouses.api';

const WAREHOUSE_STATUS_ACTIVE = 'active' as WarehouseStatus;
const WAREHOUSE_STATUS_INACTIVE = 'inactive' as WarehouseStatus;

const statusOptions: Array<{ label: string; value: WarehouseStatus }> = [
  { label: '启用', value: WAREHOUSE_STATUS_ACTIVE },
  { label: '禁用', value: WAREHOUSE_STATUS_INACTIVE },
];

const statusTagMap = {
  active: { status: 'success', text: '启用' },
  inactive: { status: 'default', text: '禁用' },
} satisfies Record<WarehouseStatus, { status: 'success' | 'default'; text: string }>;

function useDebouncedValue(input: string, delay = 300) {
  const [value, setValue] = useState(input);

  useEffect(() => {
    const timer = window.setTimeout(() => setValue(input), delay);
    return () => window.clearTimeout(timer);
  }, [input, delay]);

  return value;
}

export default function WarehousesListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token } = theme.useToken();

  const [keywordInput, setKeywordInput] = useState('');
  const [status, setStatus] = useState<WarehouseStatus | undefined>();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const keyword = useDebouncedValue(keywordInput, 300).trim();
  const hasFilters = Boolean(keyword || status);

  const query = useQuery({
    queryKey: ['warehouses', keyword, status, page, pageSize],
    queryFn: () =>
      getWarehouses({
        keyword: keyword || undefined,
        status,
        page,
        pageSize,
      }),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: number; newStatus: WarehouseStatus }) =>
      updateWarehouse(id, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      message.success('操作成功');
    },
  });

  const columns: ProColumns<Warehouse>[] = useMemo(
    () => [
      {
        title: '仓库名称',
        dataIndex: 'name',
        width: 220,
        ellipsis: true,
        render: (_, record) => (
          <Link to={`/master-data/warehouses/${record.id}`} style={{ color: token.colorLink }}>
            {record.name}
          </Link>
        ),
      },
      {
        title: '仓库地址',
        dataIndex: 'address',
        width: 280,
        ellipsis: true,
        render: (_, record) =>
          record.address ? (
            <Tooltip title={record.address}>
              <Typography.Text ellipsis style={{ maxWidth: 240, display: 'inline-block' }}>
                {record.address}
              </Typography.Text>
            </Tooltip>
          ) : (
            <Typography.Text type="secondary">-</Typography.Text>
          ),
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
              onClick={() => navigate(`/master-data/warehouses/${record.id}`)}
            >
              查看
            </Button>
            <Button
              type="link"
              style={{ padding: 0 }}
              onClick={() => navigate(`/master-data/warehouses/${record.id}/edit`)}
            >
              编辑
            </Button>
            <Popconfirm
              title={record.status === WAREHOUSE_STATUS_ACTIVE ? '确认禁用该仓库？' : '确认启用该仓库？'}
              onConfirm={() =>
                toggleStatusMutation.mutate({
                  id: record.id,
                  newStatus:
                    record.status === WAREHOUSE_STATUS_ACTIVE
                      ? WAREHOUSE_STATUS_INACTIVE
                      : WAREHOUSE_STATUS_ACTIVE,
                })
              }
            >
              <Button type="link" style={{ padding: 0 }}>
                {record.status === WAREHOUSE_STATUS_ACTIVE ? '禁用' : '启用'}
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
        title="加载仓库列表失败"
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
      <Button type="primary" onClick={() => navigate('/master-data/warehouses/create')}>
        新建仓库
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
  ].filter(Boolean) as Array<{ key: string; label: string; onClose: () => void }>;

  return (
    <div>
      <Flex align="center" justify="space-between" style={{ marginBottom: token.marginMD }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          仓库管理
        </Typography.Title>
        <Button type="primary" onClick={() => navigate('/master-data/warehouses/create')}>
          新建仓库
        </Button>
      </Flex>

      <Space direction="vertical" size={token.marginSM} style={{ width: '100%' }}>
        <Flex gap={token.marginSM} wrap>
          <Input
            placeholder="快捷搜索仓库名称/地址"
            style={{ width: 320 }}
            value={keywordInput}
            onChange={(e) => {
              setKeywordInput(e.target.value);
              setPage(1);
            }}
            allowClear
          />
          <Button type="link" onClick={() => setShowAdvanced((prev) => !prev)}>
            {showAdvanced ? '收起高级筛选' : '展开高级筛选'}
          </Button>
        </Flex>

        {showAdvanced ? (
          <Flex gap={token.marginSM} wrap>
            <Select<WarehouseStatus>
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
          </Flex>
        ) : null}

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
                setStatus(undefined);
                setPage(1);
              }}
            >
              清除全部
            </Button>
          </Space>
        ) : null}
      </Space>

      <Skeleton active loading={query.isLoading && !query.data} style={{ marginTop: token.marginMD }}>
        <ProTable<Warehouse>
          search={false}
          options={false}
          toolBarRender={false}
          rowKey="id"
          loading={query.isFetching}
          columns={columns}
          dataSource={query.data?.list ?? []}
          scroll={{ x: 1000, y: 540 }}
          rowClassName={() => 'warehouse-row-height'}
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
        .warehouse-row-height .ant-table-cell {
          height: 48px;
        }
      `}</style>
    </div>
  );
}
