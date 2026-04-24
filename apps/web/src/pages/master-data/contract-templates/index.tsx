import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Empty, Flex, Result, Skeleton, Space, Tag, Typography, theme } from 'antd';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import type { ContractTemplateStatus } from '@infitek/shared';
import {
  CONTRACT_TEMPLATE_STATUS_LABELS,
  CONTRACT_TEMPLATE_STATUS_OPTIONS,
  getContractTemplates,
  type ContractTemplate,
} from '../../../api/contract-templates.api';
import { SearchForm } from '../../../components/common/SearchForm';
import type { ActiveTag } from '../../../components/common/SearchForm';
import { useDebouncedValue } from '../../../hooks/useDebounce';

const statusColorMap: Record<ContractTemplateStatus, string> = {
  pending_submit: 'default',
  in_review: 'warning',
  approved: 'success',
  rejected: 'error',
  voided: 'error',
};

export default function ContractTemplatesListPage() {
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const [keywordInput, setKeywordInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContractTemplateStatus | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const keyword = useDebouncedValue(keywordInput, 300).trim();
  const hasFilters = Boolean(keyword || statusFilter);

  useEffect(() => {
    setPage(1);
  }, [keyword, statusFilter]);

  const query = useQuery({
    queryKey: ['contract-templates', keyword, statusFilter, page, pageSize],
    placeholderData: (previousData) => previousData,
    queryFn: () =>
      getContractTemplates({
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
        title="加载合同条款范本失败"
        subTitle="请检查网络或稍后重试"
        extra={
          <Button type="primary" onClick={() => query.refetch()}>
            重试
          </Button>
        }
      />
    );
  }

  const columns: ProColumns<ContractTemplate>[] = useMemo(
    () => [
      {
        title: '合同模板名称',
        dataIndex: 'name',
        width: 220,
        ellipsis: true,
        render: (_, record) => (
          <Link to={`/master-data/contract-templates/${record.id}`} style={{ color: token.colorLink }}>
            {record.name}
          </Link>
        ),
      },
      {
        title: '默认模板',
        dataIndex: 'isDefault',
        width: 100,
        render: (_, record) =>
          record.isDefault ? <Tag color="blue">是</Tag> : <Typography.Text type="secondary">否</Typography.Text>,
      },
      {
        title: '法务审核模板',
        dataIndex: 'requiresLegalReview',
        width: 120,
        render: (_, record) =>
          record.requiresLegalReview ? <Tag color="purple">是</Tag> : <Typography.Text type="secondary">否</Typography.Text>,
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 120,
        render: (_, record) => (
          <Tag color={statusColorMap[record.status]}>
            {CONTRACT_TEMPLATE_STATUS_LABELS[record.status]}
          </Tag>
        ),
      },
      {
        title: '文件模板',
        key: 'templateFile',
        width: 140,
        render: (_, record) =>
          record.templateFileUrl ? (
            <Button
              type="link"
              size="small"
              style={{ padding: 0 }}
              onClick={() => window.open(record.templateFileUrl!, '_blank')}
            >
              {record.templateFileName || '下载文件'}
            </Button>
          ) : (
            <Typography.Text type="secondary">-</Typography.Text>
          ),
      },
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        width: 120,
        render: (_, record) => dayjs(record.createdAt).format('YYYY-MM-DD'),
      },
      {
        title: '更新时间',
        dataIndex: 'updatedAt',
        width: 120,
        render: (_, record) => dayjs(record.updatedAt).format('YYYY-MM-DD'),
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
              onClick={() => navigate(`/master-data/contract-templates/${record.id}`)}
            >
              查看
            </Button>
            <Button
              type="link"
              style={{ padding: 0 }}
              onClick={() => navigate(`/master-data/contract-templates/${record.id}/edit`)}
              disabled={record.status === 'voided'}
            >
              编辑
            </Button>
          </Space>
        ),
      },
    ],
    [navigate, token.colorLink],
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
          label: `状态: ${CONTRACT_TEMPLATE_STATUS_LABELS[statusFilter]}`,
          onClose: () => {
            setStatusFilter(undefined);
            setPage(1);
          },
        }
      : null,
  ].filter(Boolean) as ActiveTag[];

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
    <Empty description="暂无合同条款范本">
      <Button type="primary" onClick={() => navigate('/master-data/contract-templates/create')}>
        新建条款范本
      </Button>
    </Empty>
  );

  return (
    <div>
      <Flex align="center" justify="space-between" style={{ marginBottom: token.marginMD }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          合同条款范本
        </Typography.Title>
        <Button type="primary" onClick={() => navigate('/master-data/contract-templates/create')}>
          新建条款范本
        </Button>
      </Flex>

      <SearchForm
        searchValue={keywordInput}
        onSearchChange={(value) => {
          setKeywordInput(value);
          setPage(1);
        }}
        placeholder="快捷搜索模板名称/说明/合同条款"
        advancedContent={
          <Space>
            <select
              value={statusFilter ?? ''}
              onChange={(event) => {
                setStatusFilter((event.target.value || undefined) as ContractTemplateStatus | undefined);
                setPage(1);
              }}
              style={{
                minWidth: 160,
                height: 32,
                borderRadius: 8,
                border: '1px solid #d9d9d9',
                padding: '0 12px',
                background: '#fff',
              }}
            >
              <option value="">全部状态</option>
              {CONTRACT_TEMPLATE_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Space>
        }
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
      />

      <Skeleton active loading={query.isLoading && !query.data} style={{ marginTop: token.marginMD }}>
        <ProTable<ContractTemplate>
          search={false}
          options={false}
          toolBarRender={false}
          rowKey="id"
          loading={query.isFetching}
          columns={columns}
          dataSource={query.data?.list ?? []}
          scroll={{ x: 1100, y: 540 }}
          rowClassName={() => 'contract-template-row-height'}
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
        .contract-template-row-height .ant-table-cell {
          height: 48px;
        }
      `}</style>
    </div>
  );
}
