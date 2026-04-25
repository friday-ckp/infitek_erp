import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Button,
  Empty,
  Result,
  Select,
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
import { getCertificates, type Certificate } from '../../../api/certificates.api';
import { SearchForm } from '../../../components/common/SearchForm';
import type { ActiveTag } from '../../../components/common/SearchForm';
import { useDebouncedValue } from '../../../hooks/useDebounce';
import '../master-page.css';

const STATUS_OPTIONS = [
  { label: '有效', value: 'valid' },
  { label: '已过期', value: 'expired' },
];

export default function CertificatesListPage() {
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const [keywordInput, setKeywordInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<'valid' | 'expired' | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const keyword = useDebouncedValue(keywordInput, 300).trim();
  const hasFilters = Boolean(keyword || statusFilter);

  useEffect(() => { setPage(1); }, [keyword, statusFilter]);

  const query = useQuery({
    queryKey: ['certificates', keyword, statusFilter, page, pageSize],
    placeholderData: (prev) => prev,
    queryFn: () =>
      getCertificates({
        keyword: keyword || undefined,
        status: statusFilter,
        page,
        pageSize,
      }),
  });

  if (query.isError && !query.data) {
    return (
      <Result
        status="error"
        title="加载证书库失败"
        subTitle="请检查网络或稍后重试"
        extra={<Button type="primary" onClick={() => query.refetch()}>重试</Button>}
      />
    );
  }

  const columns: ProColumns<Certificate>[] = useMemo(
    () => [
      {
        title: '证书编号',
        dataIndex: 'certificateNo',
        width: 110,
        render: (_, record) => (
          <Link to={`/master-data/certificates/${record.id}`} style={{ color: token.colorLink }}>
            {record.certificateNo}
          </Link>
        ),
      },
      {
        title: '证书名称',
        dataIndex: 'certificateName',
        width: 200,
        ellipsis: true,
        render: (_, record) => (
          <Link to={`/master-data/certificates/${record.id}`} style={{ color: token.colorLink }}>
            {record.certificateName}
          </Link>
        ),
      },
      {
        title: '证书类型',
        dataIndex: 'certificateType',
        width: 100,
      },
      {
        title: '指令法规',
        dataIndex: 'directive',
        width: 150,
        ellipsis: true,
        render: (_, record) => record.directive || <Typography.Text type="secondary">-</Typography.Text>,
      },
      {
        title: '有效期',
        key: 'validity',
        width: 200,
        render: (_, record) => `${record.validFrom} ~ ${record.validUntil}`,
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 80,
        render: (_, record) =>
          record.status === 'valid' ? (
            <Tag color="success">有效</Tag>
          ) : (
            <Tag color="error">已过期</Tag>
          ),
      },
      {
        title: '发证机构',
        dataIndex: 'issuingAuthority',
        width: 160,
        ellipsis: true,
      },
      {
        title: '证书文件',
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
        title: '创建时间',
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
              onClick={() => navigate(`/master-data/certificates/${record.id}`)}
            >
              查看
            </Button>
            <Button
              type="link"
              style={{ padding: 0 }}
              onClick={() => navigate(`/master-data/certificates/${record.id}/edit`)}
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
          setStatusFilter(undefined);
          setPage(1);
        }}
      >
        清除筛选条件
      </Button>
    </Empty>
  ) : (
    <Empty description="暂无证书数据">
      <Button type="primary" onClick={() => navigate('/master-data/certificates/create')}>
        新建证书
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
    statusFilter
      ? {
          key: 'status',
          label: `状态: ${statusFilter === 'valid' ? '有效' : '已过期'}`,
          onClose: () => {
            setStatusFilter(undefined);
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
            <div className="master-page-title">产品证书库</div>
            <div className="master-page-description">统一管理产品证书、法规信息与有效期状态。</div>
          </div>
          <div className="master-page-actions">
            <Button type="primary" onClick={() => navigate('/master-data/certificates/create')}>
              新建证书
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
            placeholder="搜索证书名称或编号"
            activeTags={activeTags}
            onClearAll={() => {
              setKeywordInput('');
              setStatusFilter(undefined);
              setPage(1);
            }}
            onQuery={() => {
              setPage(1);
              query.refetch();
            }}
            onReset={() => {
              setKeywordInput('');
              setStatusFilter(undefined);
              setPage(1);
            }}
            advancedContent={(
              <Select
                style={{ width: 160 }}
                placeholder="全部状态"
                value={statusFilter}
                onChange={(v) => { setStatusFilter(v); setPage(1); }}
                options={STATUS_OPTIONS}
                allowClear
              />
            )}
          />

          <Skeleton active loading={query.isLoading && !query.data}>
            <ProTable<Certificate>
              search={false}
              options={false}
              toolBarRender={false}
              rowKey="id"
              loading={query.isFetching}
              columns={columns}
              dataSource={query.data?.list ?? []}
              scroll={{ x: 1300, y: 540 }}
              rowClassName={() => 'cert-row-height'}
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

      <style>{`.cert-row-height .ant-table-cell { height: 48px; }`}</style>
    </div>
  );
}
