import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Empty, Popconfirm, Result, Select, Skeleton, Space, Tag, Typography, message } from 'antd';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  QUESTION_TYPE_LABELS,
  QUESTION_TYPE_OPTIONS,
  deleteSpuFaq,
  getSpuFaqs,
  type SpuFaq,
  type SpuFaqQuestionType,
} from '../../../api/spu-faqs.api';
import { SearchForm } from '../../../components/common/SearchForm';
import type { ActiveTag } from '../../../components/common/SearchForm';
import { useDebouncedValue } from '../../../hooks/useDebounce';
import '../master-page.css';

export default function SpuFaqsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [keywordInput, setKeywordInput] = useState('');
  const [questionTypeFilter, setQuestionTypeFilter] = useState<SpuFaqQuestionType | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const keyword = useDebouncedValue(keywordInput, 300).trim();
  const hasFilters = Boolean(keyword || questionTypeFilter);

  useEffect(() => { setPage(1); }, [keyword, questionTypeFilter]);

  const query = useQuery({
    queryKey: ['spu-faqs', keyword, questionTypeFilter, page, pageSize],
    placeholderData: (prev) => prev,
    queryFn: () =>
      getSpuFaqs({
        keyword: keyword || undefined,
        questionType: questionTypeFilter,
        page,
        pageSize,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSpuFaq(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spu-faqs'] });
      message.success('已删除', 3);
    },
    onError: (e: any) => {
      message.error(e?.message ?? '删除失败，请稍后重试', 5);
    },
  });

  const columns: ProColumns<SpuFaq>[] = [
    {
      title: '问题类型',
      dataIndex: 'questionType',
      width: 120,
      render: (_, record) => {
        const label = QUESTION_TYPE_LABELS[record.questionType] ?? record.questionType;
        return <Tag>{label}</Tag>;
      },
    },
    {
      title: '问题',
      dataIndex: 'question',
      ellipsis: true,
      render: (_, record) => (
        <Link to={`/master-data/spu-faqs/${record.id}/edit`}>
          <Typography.Text ellipsis={{ tooltip: record.question }}>{record.question}</Typography.Text>
        </Link>
      ),
    },
    {
      title: '回答',
      dataIndex: 'answer',
      ellipsis: true,
      render: (_, record) => (
        <Typography.Paragraph ellipsis={{ rows: 2, tooltip: record.answer }} style={{ margin: 0 }}>
          {record.answer}
        </Typography.Paragraph>
      ),
    },
    {
      title: 'SPU 编码',
      dataIndex: 'spuCode',
      width: 110,
      render: (_, record) => record.spuCode || '-',
    },
    {
      title: '附件',
      dataIndex: 'attachmentUrl',
      width: 70,
      render: (_, record) => (record.attachmentUrl ? <Tag color="blue">有</Tag> : '-'),
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
      fixed: 'right' as const,
      render: (_, record) => (
        <Space size={0}>
          <Button
            type="link"
            style={{ padding: 0 }}
            onClick={() => navigate(`/master-data/spu-faqs/${record.id}/edit`)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除这条 FAQ 吗？"
            okText="删除"
            okButtonProps={{ danger: true }}
            cancelText="取消"
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Button
              type="link"
              danger
              style={{ padding: 0, marginLeft: 8 }}
              loading={deleteMutation.isPending && deleteMutation.variables === record.id}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (query.isError && !query.data) {
    return (
      <Result
        status="error"
        title="FAQ 列表加载失败"
        subTitle="请检查网络或稍后重试"
        extra={<Button type="primary" onClick={() => query.refetch()}>重试</Button>}
      />
    );
  }

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
    questionTypeFilter
      ? {
          key: 'type',
          label: `问题类型: ${QUESTION_TYPE_LABELS[questionTypeFilter] ?? questionTypeFilter}`,
          onClose: () => {
            setQuestionTypeFilter(undefined);
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
            <div className="master-page-title">FAQ 管理</div>
            <div className="master-page-description">统一沉淀产品 FAQ、附件材料和常见问题类型。</div>
          </div>
          <div className="master-page-actions">
            <Button type="primary" onClick={() => navigate('/master-data/spu-faqs/create')}>
              新建 FAQ
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
            placeholder="搜索问题或回答内容"
            activeTags={activeTags}
            onClearAll={() => {
              setKeywordInput('');
              setQuestionTypeFilter(undefined);
              setPage(1);
            }}
            onQuery={() => {
              setPage(1);
              query.refetch();
            }}
            onReset={() => {
              setKeywordInput('');
              setQuestionTypeFilter(undefined);
              setPage(1);
            }}
            advancedContent={(
              <Select
                placeholder="问题类型"
                style={{ width: 160 }}
                allowClear
                options={QUESTION_TYPE_OPTIONS}
                value={questionTypeFilter}
                onChange={(v) => setQuestionTypeFilter(v)}
              />
            )}
          />

          {query.isLoading ? (
            <Skeleton active />
          ) : query.data?.list.length === 0 && !hasFilters ? (
            <Empty description="暂无 FAQ 数据" style={{ padding: '56px 0 24px' }}>
              <Button type="primary" onClick={() => navigate('/master-data/spu-faqs/create')}>
                新建 FAQ
              </Button>
            </Empty>
          ) : (
            <ProTable<SpuFaq>
              search={false}
              options={false}
              toolBarRender={false}
              rowKey="id"
              loading={query.isFetching}
              columns={columns}
              dataSource={query.data?.list ?? []}
              scroll={{ x: 900 }}
              pagination={{
                current: page,
                pageSize,
                total: query.data?.total ?? 0,
                showSizeChanger: true,
                pageSizeOptions: [10, 20, 50],
                showTotal: (total) => `共 ${total} 条记录`,
                onChange: (p, ps) => {
                  if (ps !== pageSize) { setPage(1); } else { setPage(p); }
                  setPageSize(ps);
                },
              }}
              locale={{
                emptyText: hasFilters ? (
                  <Empty description="没有符合条件的 FAQ">
                    <Button
                      type="link"
                      onClick={() => {
                        setKeywordInput('');
                        setQuestionTypeFilter(undefined);
                      }}
                    >
                      清除筛选
                    </Button>
                  </Empty>
                ) : (
                  <Empty description="暂无 FAQ 数据" />
                ),
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
