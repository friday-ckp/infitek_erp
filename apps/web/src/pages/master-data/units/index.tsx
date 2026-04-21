import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Badge,
  Button,
  Empty,
  Flex,
  Result,
  Select,
  Skeleton,
  Space,
  Tooltip,
  Typography,
  theme,
} from 'antd';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import type { UnitStatus } from '@infitek/shared';
import { SearchForm } from '../../../components/common/SearchForm';
import type { ActiveTag } from '../../../components/common/SearchForm';
import { useDebouncedValue } from '../../../hooks/useDebounce';
import { getUnits, type Unit } from '../../../api/units.api';

const UNIT_STATUS_ACTIVE = 'active' as UnitStatus;
const UNIT_STATUS_INACTIVE = 'inactive' as UnitStatus;

const statusOptions: Array<{ label: string; value: UnitStatus }> = [
  { label: '启用', value: UNIT_STATUS_ACTIVE },
  { label: '禁用', value: UNIT_STATUS_INACTIVE },
];

const statusTagMap = {
  active: { status: 'success', text: '启用' },
  inactive: { status: 'default', text: '禁用' },
} satisfies Record<UnitStatus, { status: 'success' | 'default'; text: string }>;

export default function UnitsListPage() {
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const [keywordInput, setKeywordInput] = useState('');
  const [status, setStatus] = useState<UnitStatus | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const keyword = useDebouncedValue(keywordInput, 300).trim();
  const hasFilters = Boolean(keyword || status);

  // 任何筛选条件变化时重置到第 1 页
  useEffect(() => {
    setPage(1);
  }, [keyword, status]);

  const queryParams = { keyword: keyword || undefined, status, page, pageSize };

  const query = useQuery({
    queryKey: ['units', 'list', queryParams],
    placeholderData: (previousData) => previousData,
    queryFn: () => getUnits(queryParams),
  });

  if (query.isError && !query.data) {
    return (
      <Result
        status="error"
        title="加载单位列表失败"
        subTitle="请检查网络或稍后重试"
        extra={
          <Button type="primary" onClick={() => query.refetch()}>
            重试
          </Button>
        }
      />
    );
  }

  const columns: ProColumns<Unit>[] = useMemo(
    () => [
      {
        title: '单位名称',
        dataIndex: 'name',
        width: 220,
        ellipsis: true,
        render: (_, record) => (
          <Link to={`/master-data/units/${record.id}`} style={{ color: token.colorLink }}>
            {record.name}
          </Link>
        ),
      },
      {
        title: '单位编码',
        dataIndex: 'code',
        width: 180,
        ellipsis: true,
        render: (_, record) => (
          <Tooltip title={record.code}>
            <Typography.Text ellipsis style={{ maxWidth: 150, display: 'inline-block' }}>
              {record.code}
            </Typography.Text>
          </Tooltip>
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
        title: '更新时间',
        dataIndex: 'updatedAt',
        width: 140,
        render: (_, record) => dayjs(record.updatedAt).format('YYYY-MM-DD'),
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
              onClick={() => navigate(`/master-data/units/${record.id}`)}
            >
              查看
            </Button>
            <Button
              type="link"
              style={{ padding: 0 }}
              onClick={() => navigate(`/master-data/units/${record.id}/edit`)}
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
          setStatus(undefined);
          setPage(1);
        }}
      >
        清除筛选条件
      </Button>
    </Empty>
  ) : (
    <Empty description="暂无数据">
      <Button type="primary" onClick={() => navigate('/master-data/units/create')}>
        新建单位
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
    <div>
      <Flex align="center" justify="space-between" style={{ marginBottom: token.marginMD }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          单位管理
        </Typography.Title>
        <Button type="primary" onClick={() => navigate('/master-data/units/create')}>
          新建单位
        </Button>
      </Flex>

      <SearchForm
        searchValue={keywordInput}
        onSearchChange={setKeywordInput}
        placeholder="快捷搜索单位名称/编码"
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
        advancedContent={
          <Select<UnitStatus>
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

      <Skeleton
        active
        loading={query.isLoading && !query.data}
        style={{ marginTop: token.marginMD }}
      >
        <ProTable<Unit>
          search={false}
          options={false}
          toolBarRender={false}
          rowKey="id"
          loading={query.isFetching}
          columns={columns}
          dataSource={query.data?.list ?? []}
          scroll={{ x: 960, y: 540 }}
          rowClassName={() => 'unit-row-height'}
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
        .unit-row-height .ant-table-cell {
          height: 48px;
        }
        .unit-row-height .ant-table-cell:nth-child(4),
        .unit-row-height .ant-table-cell:nth-child(5) {
          font-variant-numeric: tabular-nums;
        }
      `}</style>
    </div>
  );
}
