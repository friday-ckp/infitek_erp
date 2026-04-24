import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Empty, Flex, Input, Result, Select, Skeleton, Space, Typography, theme } from 'antd';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  getProductDocuments,
  DOCUMENT_TYPE_LABELS,
  ATTRIBUTION_TYPE_LABELS,
  DOCUMENT_TYPE_OPTIONS,
  ATTRIBUTION_TYPE_OPTIONS,
  type ProductDocument,
} from '../../../api/product-documents.api';
import { getCountries } from '../../../api/countries.api';
import { getSpus } from '../../../api/spus.api';
import { getProductCategoryTree } from '../../../api/product-categories.api';
import { findCategoryName } from '../../../utils/category';
import { useDebouncedValue } from '../../../hooks/useDebounce';

export default function ProductDocumentsListPage() {
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const [keywordInput, setKeywordInput] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState<string | undefined>();
  const [attributionFilter, setAttributionFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const keyword = useDebouncedValue(keywordInput, 300).trim();
  const hasFilters = Boolean(keyword || docTypeFilter || attributionFilter);

  useEffect(() => { setPage(1); }, [keyword, docTypeFilter, attributionFilter]);

  const query = useQuery({
    queryKey: ['product-documents', keyword, docTypeFilter, attributionFilter, page, pageSize],
    placeholderData: (prev) => prev,
    queryFn: () =>
      getProductDocuments({
        keyword: keyword || undefined,
        documentType: docTypeFilter,
        attributionType: attributionFilter,
        page,
        pageSize,
      }),
  });

  const countriesQuery = useQuery({
    queryKey: ['countries-all'],
    queryFn: () => getCountries({ pageSize: 300 }),
    staleTime: 10 * 60 * 1000,
  });

  const spusQuery = useQuery({
    queryKey: ['spus-options'],
    queryFn: () => getSpus({ pageSize: 300 }),
    staleTime: 5 * 60 * 1000,
  });

  const categoryTreeQuery = useQuery({
    queryKey: ['product-category-tree'],
    queryFn: getProductCategoryTree,
    staleTime: 5 * 60 * 1000,
  });

  if (query.isError && !query.data) {
    return (
      <Result
        status="error"
        title="加载资料库失败"
        subTitle="请检查网络或稍后重试"
        extra={<Button type="primary" onClick={() => query.refetch()}>重试</Button>}
      />
    );
  }

  const columns: ProColumns<ProductDocument>[] = useMemo(
    () => [
      {
        title: '资料名称',
        dataIndex: 'documentName',
        width: 220,
        ellipsis: true,
        render: (_, record) => (
          <Link to={`/master-data/product-documents/${record.id}`} style={{ color: token.colorLink }}>
            {record.documentName}
          </Link>
        ),
      },
      {
        title: '资料类型',
        dataIndex: 'documentType',
        width: 120,
        render: (_, record) => DOCUMENT_TYPE_LABELS[record.documentType] ?? record.documentType,
      },
      {
        title: '归属类型',
        dataIndex: 'attributionType',
        width: 160,
        render: (_, record) => ATTRIBUTION_TYPE_LABELS[record.attributionType] ?? record.attributionType,
      },
      {
        title: '所属产品/分类',
        key: 'subject',
        width: 220,
        render: (_, record) => {
          if (record.attributionType === 'product' && record.spuId) {
            const spu = spusQuery.data?.list.find((item) => item.id === record.spuId);
            return spu ? `${spu.spuCode} - ${spu.name}` : `SPU#${record.spuId}`;
          }

          const categoryId = record.categoryLevel3Id ?? record.categoryLevel2Id ?? record.categoryLevel1Id;
          if (categoryId && categoryTreeQuery.data) {
            return findCategoryName(categoryTreeQuery.data, categoryId);
          }

          return '-';
        },
      },
      {
        title: '国家/地区',
        key: 'country',
        width: 140,
        render: (_, record) => {
          if (!record.countryId) return '-';
          return countriesQuery.data?.list.find((item) => item.id === record.countryId)?.name ?? `国家#${record.countryId}`;
        },
      },
      {
        title: '资料文件',
        key: 'file',
        width: 100,
        render: (_, record) =>
          record.fileUrl ? (
            <Button
              type="link"
              size="small"
              style={{ padding: 0 }}
              onClick={() => window.open(record.fileUrl!, '_blank')}
            >
              下载
            </Button>
          ) : (
            <Typography.Text type="secondary">-</Typography.Text>
          ),
      },
      {
        title: '上传时间',
        dataIndex: 'createdAt',
        width: 110,
        render: (_, record) => dayjs(record.createdAt).format('YYYY-MM-DD'),
      },
      {
        title: '操作',
        key: 'actions',
        width: 120,
        fixed: 'right',
        render: (_, record) => (
          <Space size={12}>
            <Button
              type="link"
              style={{ padding: 0 }}
              onClick={() => navigate(`/master-data/product-documents/${record.id}`)}
            >
              查看
            </Button>
            <Button
              type="link"
              style={{ padding: 0 }}
              onClick={() => navigate(`/master-data/product-documents/${record.id}/edit`)}
            >
              编辑
            </Button>
          </Space>
        ),
      },
    ],
    [categoryTreeQuery.data, countriesQuery.data?.list, navigate, spusQuery.data?.list, token.colorLink],
  );

  const emptyText = hasFilters ? (
    <Empty description="未找到匹配记录">
      <Button
        type="link"
        onClick={() => {
          setKeywordInput('');
          setDocTypeFilter(undefined);
          setAttributionFilter(undefined);
          setPage(1);
        }}
      >
        清除筛选条件
      </Button>
    </Empty>
  ) : (
    <Empty description="暂无资料数据">
      <Button type="primary" onClick={() => navigate('/master-data/product-documents/create')}>
        新建资料
      </Button>
    </Empty>
  );

  return (
    <div>
      <Flex align="center" justify="space-between" style={{ marginBottom: token.marginMD }}>
        <Typography.Title level={3} style={{ margin: 0 }}>产品资料库</Typography.Title>
        <Button type="primary" onClick={() => navigate('/master-data/product-documents/create')}>
          + 新建资料
        </Button>
      </Flex>

      <Space size={token.marginSM} style={{ marginBottom: token.marginSM }}>
        <Input
          placeholder="搜索资料名称..."
          style={{ width: 260 }}
          value={keywordInput}
          onChange={(e) => { setKeywordInput(e.target.value); setPage(1); }}
          allowClear
        />
        <Select
          style={{ width: 140 }}
          placeholder="全部类型"
          value={docTypeFilter}
          onChange={(v) => { setDocTypeFilter(v); setPage(1); }}
          options={DOCUMENT_TYPE_OPTIONS}
          allowClear
        />
        <Select
          style={{ width: 180 }}
          placeholder="全部归属"
          value={attributionFilter}
          onChange={(v) => { setAttributionFilter(v); setPage(1); }}
          options={ATTRIBUTION_TYPE_OPTIONS}
          allowClear
        />
      </Space>

      <Skeleton active loading={query.isLoading && !query.data}>
        <ProTable<ProductDocument>
          search={false}
          options={false}
          toolBarRender={false}
          rowKey="id"
          loading={query.isFetching}
          columns={columns}
          dataSource={query.data?.list ?? []}
          scroll={{ x: 1000, y: 540 }}
          rowClassName={() => 'product-doc-row-height'}
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

      <style>{`.product-doc-row-height .ant-table-cell { height: 48px; }`}</style>
    </div>
  );
}
