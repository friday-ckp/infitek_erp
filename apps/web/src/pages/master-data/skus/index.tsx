import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Empty, Flex, Input, Result, Skeleton, Space, Tag, Typography, theme } from 'antd';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getSkus, type Sku } from '../../../api/skus.api';
import { getSpus } from '../../../api/spus.api';
import { useDebouncedValue } from '../../../hooks/useDebounce';

export default function SkusListPage() {
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const [keywordInput, setKeywordInput] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const keyword = useDebouncedValue(keywordInput, 300).trim();
  const hasFilters = Boolean(keyword);

  useEffect(() => { setPage(1); }, [keyword]);

  const query = useQuery({
    queryKey: ['skus', keyword, page, pageSize],
    placeholderData: (prev) => prev,
    queryFn: () => getSkus({ keyword: keyword || undefined, page, pageSize }),
  });

  const spusQuery = useQuery({
    queryKey: ['spus-options'],
    queryFn: () => getSpus({ pageSize: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  const spuMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const s of spusQuery.data?.list ?? []) m.set(s.id, s.name);
    return m;
  }, [spusQuery.data]);

  if (query.isError && !query.data) {
    return (
      <Result
        status="error"
        title="加载 SKU 列表失败"
        subTitle="请检查网络或稍后重试"
        extra={<Button type="primary" onClick={() => query.refetch()}>重试</Button>}
      />
    );
  }

  const columns: ProColumns<Sku>[] = useMemo(
    () => [
      {
        title: 'SKU 编码',
        dataIndex: 'skuCode',
        width: 120,
        render: (_, record) => (
          <Link to={`/master-data/skus/${record.id}`} style={{ color: token.colorLink }}>
            {record.skuCode}
          </Link>
        ),
      },
      {
        title: '规格描述',
        dataIndex: 'specification',
        width: 200,
        ellipsis: true,
      },
      {
        title: '所属 SPU',
        dataIndex: 'spuId',
        width: 160,
        ellipsis: true,
        render: (_, record) => spuMap.get(record.spuId) ?? record.spuId,
      },
      {
        title: 'HS 码',
        dataIndex: 'hsCode',
        width: 120,
      },
      {
        title: '净重(KG)',
        dataIndex: 'weightKg',
        width: 90,
      },
      {
        title: '体积(CBM)',
        dataIndex: 'volumeCbm',
        width: 100,
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 80,
        render: (_, record) =>
          record.status === 'active' ? (
            <Tag color="success">启用</Tag>
          ) : (
            <Tag>停用</Tag>
          ),
      },
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        width: 120,
        render: (_, record) => dayjs(record.createdAt).format('YYYY-MM-DD'),
      },
      {
        title: '操作',
        key: 'actions',
        width: 120,
        fixed: 'right',
        render: (_, record) => (
          <Space size={12}>
            <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/master-data/skus/${record.id}`)}>
              查看
            </Button>
            <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/master-data/skus/${record.id}/edit`)}>
              编辑
            </Button>
          </Space>
        ),
      },
    ],
    [navigate, token.colorLink, spuMap],
  );

  const emptyText = hasFilters ? (
    <Empty description="未找到匹配记录">
      <Button type="link" onClick={() => { setKeywordInput(''); setPage(1); }}>
        清除筛选条件
      </Button>
    </Empty>
  ) : (
    <Empty description="暂无 SKU 数据">
      <Button type="primary" onClick={() => navigate('/master-data/skus/create')}>
        新建 SKU
      </Button>
    </Empty>
  );

  return (
    <div>
      <Flex align="center" justify="space-between" style={{ marginBottom: token.marginMD }}>
        <Typography.Title level={3} style={{ margin: 0 }}>SKU 管理</Typography.Title>
        <Button type="primary" onClick={() => navigate('/master-data/skus/create')}>
          + 新建 SKU
        </Button>
      </Flex>

      <Space direction="vertical" size={token.marginSM} style={{ width: '100%' }}>
        <Input
          placeholder="搜索 SKU 编码/规格/名称..."
          style={{ width: 320 }}
          value={keywordInput}
          onChange={(e) => { setKeywordInput(e.target.value); setPage(1); }}
          allowClear
        />
      </Space>

      <Skeleton active loading={query.isLoading && !query.data} style={{ marginTop: token.marginMD }}>
        <ProTable<Sku>
          search={false}
          options={false}
          toolBarRender={false}
          rowKey="id"
          loading={query.isFetching}
          columns={columns}
          dataSource={query.data?.list ?? []}
          scroll={{ x: 960, y: 540 }}
          rowClassName={() => 'sku-row-height'}
          locale={{ emptyText }}
          pagination={{
            current: page,
            pageSize,
            total: query.data?.total ?? 0,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (nextPage, nextPageSize) => {
              if (nextPageSize !== pageSize) { setPage(1); } else { setPage(nextPage); }
              setPageSize(nextPageSize);
            },
          }}
        />
      </Skeleton>

      <style>{`.sku-row-height .ant-table-cell { height: 48px; }`}</style>
    </div>
  );
}
