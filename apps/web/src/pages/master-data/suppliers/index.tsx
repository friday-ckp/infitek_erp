import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Button,
  Empty,
  Select,
  Skeleton,
  Space,
  Tag,
  Typography,
  Result,
  theme,
} from 'antd';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getSuppliers, type Supplier, type SuppliersListParams } from '../../../api/suppliers.api';
import { SearchForm } from '../../../components/common/SearchForm';
import type { ActiveTag } from '../../../components/common/SearchForm';
import { useDebouncedValue } from '../../../hooks/useDebounce';
import '../master-page.css';

const SupplierStatus = {
  COOPERATING: '合作',
  ELIMINATED: '淘汰',
  TEMPORARY: '临拓',
} as const;

type SupplierStatus = NonNullable<SuppliersListParams['status']>;

const STATUS_OPTIONS = [
  { label: '合作', value: SupplierStatus.COOPERATING },
  { label: '淘汰', value: SupplierStatus.ELIMINATED },
  { label: '临拓', value: SupplierStatus.TEMPORARY },
];

const STATUS_COLOR_MAP: Record<string, string> = {
  [SupplierStatus.COOPERATING]: 'processing',
  [SupplierStatus.ELIMINATED]: 'error',
  [SupplierStatus.TEMPORARY]: 'warning',
};

export default function SuppliersListPage() {
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const [keywordInput, setKeywordInput] = useState('');
  const [status, setStatus] = useState<SupplierStatus | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const keyword = useDebouncedValue(keywordInput, 300).trim();
  const hasFilters = Boolean(keyword || status);

  useEffect(() => {
    setPage(1);
  }, [keyword, status]);

  const suppliersQuery = useQuery({
    queryKey: ['suppliers', keyword, status, page, pageSize],
    placeholderData: (previousData) => previousData,
    queryFn: () =>
      getSuppliers({
        keyword: keyword || undefined,
        status,
        page,
        pageSize,
      }),
  });

  if (suppliersQuery.isError && !suppliersQuery.data) {
    return (
      <Result
        status="error"
        title="加载供应商列表失败"
        subTitle="请检查网络或稍后重试"
        extra={
          <Button type="primary" onClick={() => suppliersQuery.refetch()}>
            重试
          </Button>
        }
      />
    );
  }

  const columns: ProColumns<Supplier>[] = useMemo(
    () => [
      {
        title: '供应商名称',
        dataIndex: 'name',
        width: 240,
        render: (_, record) => (
          <Link to={`/master-data/suppliers/${record.id}`} style={{ color: token.colorLink }}>
            {record.name}
          </Link>
        ),
      },
      {
        title: '供应商编码',
        dataIndex: 'supplierCode',
        width: 140,
      },
      {
        title: '联系人',
        dataIndex: 'contactPerson',
        width: 140,
        render: (_, record) => record.contactPerson || <Typography.Text type="secondary">-</Typography.Text>,
      },
      {
        title: '联系电话',
        dataIndex: 'contactPhone',
        width: 150,
        render: (_, record) => record.contactPhone || <Typography.Text type="secondary">-</Typography.Text>,
      },
      {
        title: '账期名称',
        key: 'paymentTermName',
        width: 110,
        render: (_, record) => {
          const value = record.paymentTerms[0]?.paymentTermName;
          return value ?? <Typography.Text type="secondary">-</Typography.Text>;
        },
      },
      {
        title: '结算类型',
        key: 'settlementType',
        width: 140,
        render: (_, record) => {
          const value = record.paymentTerms[0]?.settlementType;
          return value ?? <Typography.Text type="secondary">-</Typography.Text>;
        },
      },
      {
        title: '是否年度返点',
        key: 'annualRebateEnabled',
        width: 120,
        render: (_, record) =>
          record.annualRebateEnabled ? '是' : <Typography.Text type="secondary">否</Typography.Text>,
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 100,
        render: (_, record) => <Tag color={STATUS_COLOR_MAP[record.status]}>{record.status}</Tag>,
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
            <Button
              type="link"
              style={{ padding: 0 }}
              onClick={() => navigate(`/master-data/suppliers/${record.id}`)}
            >
              查看
            </Button>
            <Button
              type="link"
              style={{ padding: 0 }}
              onClick={() => navigate(`/master-data/suppliers/${record.id}/edit`)}
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
      <Button type="primary" onClick={() => navigate('/master-data/suppliers/create')}>
        新建供应商
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
          label: `合作状态: ${status}`,
          onClose: () => {
            setStatus(undefined);
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
            <div className="master-page-title">供应商档案管理</div>
            <div className="master-page-description">统一查看供应商档案、合作状态与账期结算信息。</div>
          </div>
          <div className="master-page-actions">
            <Button type="primary" onClick={() => navigate('/master-data/suppliers/create')}>
              新建供应商
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
            placeholder="快捷搜索供应商名称/联系人/电话/编码"
            activeTags={activeTags}
            onClearAll={() => {
              setKeywordInput('');
              setStatus(undefined);
              setPage(1);
            }}
            onQuery={() => {
              setPage(1);
              suppliersQuery.refetch();
            }}
            onReset={() => {
              setKeywordInput('');
              setStatus(undefined);
              setPage(1);
            }}
            advancedContent={
              <Select<SupplierStatus>
                allowClear
                placeholder="按合作状态筛选"
                options={STATUS_OPTIONS}
                value={status}
                onChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
                style={{ width: 180 }}
              />
            }
          />

          <Skeleton active loading={suppliersQuery.isLoading && !suppliersQuery.data} style={{ marginTop: token.marginMD }}>
            <ProTable<Supplier>
              search={false}
              options={false}
              toolBarRender={false}
              rowKey="id"
              loading={suppliersQuery.isFetching}
              columns={columns}
              dataSource={suppliersQuery.data?.list ?? []}
              scroll={{ x: 1460, y: 540 }}
              rowClassName={() => 'supplier-row-height'}
              locale={{ emptyText }}
              pagination={{
                current: page,
                pageSize,
                total: suppliersQuery.data?.total ?? 0,
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
        .supplier-row-height .ant-table-cell {
          height: 48px;
        }
      `}</style>
    </div>
  );
}
