import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Empty, Result, Skeleton, Space, Typography, theme } from 'antd';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getSpus, type Spu } from '../../../api/spus.api';
import { getProductCategoryTree } from '../../../api/product-categories.api';
import { SearchForm } from '../../../components/common/SearchForm';
import type { ActiveTag } from '../../../components/common/SearchForm';
import { useDebouncedValue } from '../../../hooks/useDebounce';
import { findCategoryName } from '../../../utils/category';
import '../master-page.css';

export default function SpusListPage() {
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const [keywordInput, setKeywordInput] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const keyword = useDebouncedValue(keywordInput, 300).trim();
  const hasFilters = Boolean(keyword);

  useEffect(() => { setPage(1); }, [keyword]);

  const query = useQuery({
    queryKey: ['spus', keyword, page, pageSize],
    placeholderData: (prev) => prev,
    queryFn: () => getSpus({ keyword: keyword || undefined, page, pageSize }),
  });

  const categoryTreeQuery = useQuery({
    queryKey: ['product-categories', 'tree'],
    queryFn: getProductCategoryTree,
    staleTime: 5 * 60 * 1000,
  });

  if (query.isError && !query.data) {
    return (
      <Result
        status="error"
        title="加载 SPU 列表失败"
        subTitle="请检查网络或稍后重试"
        extra={<Button type="primary" onClick={() => query.refetch()}>重试</Button>}
      />
    );
  }

  const columns: ProColumns<Spu>[] = useMemo(
    () => [
      {
        title: 'SPU 编码',
        dataIndex: 'spuCode',
        width: 120,
        render: (_, record) => (
          <Link to={`/master-data/spus/${record.id}`} style={{ color: token.colorLink }}>
            {record.spuCode}
          </Link>
        ),
      },
      {
        title: 'SPU 名称',
        dataIndex: 'name',
        width: 200,
        ellipsis: true,
        render: (_, record) => (
          <Link to={`/master-data/spus/${record.id}`} style={{ color: token.colorLink }}>
            {record.name}
          </Link>
        ),
      },
      {
        title: '所属分类',
        dataIndex: 'categoryId',
        width: 180,
        ellipsis: true,
        render: (_, record) =>
          categoryTreeQuery.data
            ? (findCategoryName(categoryTreeQuery.data, record.categoryId) || '-')
            : '-',
      },
      {
        title: '单位',
        dataIndex: 'unit',
        width: 80,
        render: (_, record) => record.unit || <Typography.Text type="secondary">-</Typography.Text>,
      },
      {
        title: '供应商',
        dataIndex: 'supplierName',
        width: 160,
        ellipsis: true,
        render: (_, record) => record.supplierName || <Typography.Text type="secondary">-</Typography.Text>,
      },
      {
        title: '厂家型号',
        dataIndex: 'manufacturerModel',
        width: 160,
        ellipsis: true,
        render: (_, record) => record.manufacturerModel || <Typography.Text type="secondary">-</Typography.Text>,
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
            <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/master-data/spus/${record.id}`)}>
              查看
            </Button>
            <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/master-data/spus/${record.id}/edit`)}>
              编辑
            </Button>
          </Space>
        ),
      },
    ],
    [navigate, token.colorLink, categoryTreeQuery.data],
  );

  const emptyText = hasFilters ? (
    <Empty description="未找到匹配记录">
      <Button type="link" onClick={() => { setKeywordInput(''); setPage(1); }}>
        清除筛选条件
      </Button>
    </Empty>
  ) : (
    <Empty description="暂无 SPU 数据">
      <Button type="primary" onClick={() => navigate('/master-data/spus/create')}>
        新建 SPU
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
            <div className="master-page-title">SPU 管理</div>
            <div className="master-page-description">统一查看产品主数据、分类归属与供应信息。</div>
          </div>
          <div className="master-page-actions">
            <Button type="primary" onClick={() => navigate('/master-data/spus/create')}>
              新建 SPU
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
            placeholder="搜索 SPU 名称/编码"
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
            <ProTable<Spu>
              search={false}
              options={false}
              toolBarRender={false}
              rowKey="id"
              loading={query.isFetching}
              columns={columns}
              dataSource={query.data?.list ?? []}
              scroll={{ x: 1160, y: 540 }}
              rowClassName={() => 'spu-row-height'}
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

      <style>{`.spu-row-height .ant-table-cell { height: 48px; }`}</style>
    </div>
  );
}
