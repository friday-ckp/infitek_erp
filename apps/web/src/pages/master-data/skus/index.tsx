import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Empty, Result, Skeleton, Space, Tag, theme } from 'antd';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getSkus, type Sku } from '../../../api/skus.api';
import { getSpus } from '../../../api/spus.api';
import { SearchForm } from '../../../components/common/SearchForm';
import type { ActiveTag } from '../../../components/common/SearchForm';
import { useDebouncedValue } from '../../../hooks/useDebounce';
import '../master-page.css';

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
        width: 100,
        render: (_, record) => {
          const map: Record<string, { color: string; text: string }> = {
            '上架': { color: 'success', text: '上架' },
            '下架可售': { color: 'warning', text: '下架可售' },
            '下架不可售': { color: 'default', text: '下架不可售' },
            '临拓': { color: 'processing', text: '临拓' },
          };
          const s = map[record.status] ?? { color: 'default', text: record.status };
          return <Tag color={s.color}>{s.text}</Tag>;
        },
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
            <div className="master-page-kicker">Product Management</div>
            <div className="master-page-title">SKU 管理</div>
            <div className="master-page-description">统一浏览变体规格、归属 SPU 与上架状态信息。</div>
          </div>
          <div className="master-page-actions">
            <Button type="primary" onClick={() => navigate('/master-data/skus/create')}>
              新建 SKU
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
            placeholder="搜索 SKU 编码、规格或名称"
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
        </div>
      </div>

      <style>{`.sku-row-height .ant-table-cell { height: 48px; }`}</style>
    </div>
  );
}
