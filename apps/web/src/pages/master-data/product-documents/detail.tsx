import type { ReactNode } from 'react';
import { Breadcrumb, Button, Modal, Result, Skeleton, Tabs, message } from 'antd';
import type { TabsProps } from 'antd/es/tabs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import {
  deleteProductDocument,
  getProductDocumentById,
  DOCUMENT_TYPE_LABELS,
  ATTRIBUTION_TYPE_LABELS,
} from '../../../api/product-documents.api';
import { getProductCategoryTree } from '../../../api/product-categories.api';
import { getCountries } from '../../../api/countries.api';
import { getSpus } from '../../../api/spus.api';
import { findCategoryName } from '../../../utils/category';
import '../master-page.css';
import './product-document-page.css';

function displayOrDash(value?: string | number | null): string {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

function MetaItem({ label, value, full = false }: { label: string; value: ReactNode; full?: boolean }) {
  return (
    <div className={`pd-meta-item${full ? ' full' : ''}`}>
      <div className="pd-meta-label">{label}</div>
      <div className={`pd-meta-value${value === '—' ? ' empty' : ''}`}>{value}</div>
    </div>
  );
}

export default function ProductDocumentDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id = '' } = useParams();
  const docId = Number(id);

  const query = useQuery({
    queryKey: ['product-document-detail', docId],
    queryFn: () => getProductDocumentById(docId),
    enabled: Number.isInteger(docId) && docId > 0,
  });

  const categoryTreeQuery = useQuery({
    queryKey: ['product-category-tree'],
    queryFn: getProductCategoryTree,
    staleTime: 5 * 60 * 1000,
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
    enabled: query.data?.attributionType === 'product',
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProductDocument(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-documents'] });
      message.success('资料已删除');
      navigate('/master-data/product-documents');
    },
  });

  if (!Number.isInteger(docId) || docId <= 0) {
    return (
      <Result
        status="404"
        title="资料不存在"
        extra={<Button type="primary" onClick={() => navigate('/master-data/product-documents')}>返回列表</Button>}
      />
    );
  }

  if (query.isError && !query.data) {
    return (
      <Result
        status="error"
        title="资料详情加载失败"
        subTitle="请检查网络或稍后重试"
        extra={[
          <Button key="retry" type="primary" onClick={() => query.refetch()}>重试</Button>,
          <Button key="back" onClick={() => navigate('/master-data/product-documents')}>返回列表</Button>,
        ]}
      />
    );
  }

  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除资料「${query.data?.documentName}」吗？删除后文件将从云存储永久删除，无法恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => deleteMutation.mutateAsync(),
    });
  };

  const data = query.data;
  const matchedSpu = data?.spuId
    ? spusQuery.data?.list.find((s) => s.id === data.spuId)
    : undefined;

  const countryName = data?.countryId
    ? countriesQuery.data?.list.find((c) => c.id === data.countryId)?.name ?? '—'
    : '—';

  const spuName = data?.spuId
    ? matchedSpu
      ? `${matchedSpu.spuCode} - ${matchedSpu.name}`
      : `SPU#${data.spuId}`
    : '—';

  const getCategoryLabel = () => {
    if (!categoryTreeQuery.data) return '—';
    const attribution = data?.attributionType;
    if (attribution === 'category_l1' && data?.categoryLevel1Id)
      return findCategoryName(categoryTreeQuery.data, data.categoryLevel1Id);
    if (attribution === 'category_l2' && data?.categoryLevel2Id)
      return findCategoryName(categoryTreeQuery.data, data.categoryLevel2Id);
    if (attribution === 'category_l3' && data?.categoryLevel3Id)
      return findCategoryName(categoryTreeQuery.data, data.categoryLevel3Id);
    return '—';
  };

  const operationRecords = [
    ...(data?.updatedAt
      ? [{ key: 'updated', operator: displayOrDash(data.updatedBy), action: '更新记录', time: dayjs(data.updatedAt).format('YYYY-MM-DD HH:mm') }]
      : []),
    ...(data?.createdAt
      ? [{ key: 'created', operator: displayOrDash(data.createdBy), action: '创建记录', time: dayjs(data.createdAt).format('YYYY-MM-DD HH:mm') }]
      : []),
  ];

  const tabItems: TabsProps['items'] = [
    {
      key: 'basic',
      label: '资料信息',
      children: (
        <div className="pd-tab-body">
          <div className="pd-meta-grid">
            <MetaItem label="资料名称" value={displayOrDash(data?.documentName)} />
            <MetaItem label="资料类型" value={data?.documentType ? DOCUMENT_TYPE_LABELS[data.documentType] ?? data.documentType : '—'} />
            <MetaItem label="归属类型" value={data?.attributionType ? ATTRIBUTION_TYPE_LABELS[data.attributionType] ?? data.attributionType : '—'} />
            <MetaItem label="国家/地区" value={countryName} />
            {data?.attributionType === 'product' && (
              <MetaItem label="所属产品" value={spuName} />
            )}
            {(data?.attributionType === 'category_l1' || data?.attributionType === 'category_l2' || data?.attributionType === 'category_l3') && (
              <MetaItem label="所属产品分类" value={getCategoryLabel()} />
            )}
            <MetaItem label="资料内容" value={displayOrDash(data?.content)} full />
          </div>
        </div>
      ),
    },
    {
      key: 'file',
      label: '附件与审计',
      children: (
        <div className="pd-tab-body">
          <div className="pd-meta-grid">
            <MetaItem
              label="资料文件"
              value={
                data?.fileUrl ? (
                  <Button type="link" style={{ padding: 0 }} onClick={() => window.open(data.fileUrl!, '_blank')}>
                    {data.fileName || '下载文件'}
                  </Button>
                ) : '—'
              }
            />
            <MetaItem label="文件名" value={displayOrDash(data?.fileName)} />
            <MetaItem label="创建时间" value={data?.createdAt ? dayjs(data.createdAt).format('YYYY-MM-DD HH:mm') : '—'} />
            <MetaItem label="更新时间" value={data?.updatedAt ? dayjs(data.updatedAt).format('YYYY-MM-DD HH:mm') : '—'} />
            <MetaItem label="创建人" value={displayOrDash(data?.createdBy)} />
            <MetaItem label="更新人" value={displayOrDash(data?.updatedBy)} />
          </div>
        </div>
      ),
    },
    {
      key: 'operation',
      label: '操作记录',
      children: (
        <div className="pd-tab-body">
          {operationRecords.length ? (
            <div className="master-status-timeline">
              {operationRecords.map((record, index) => (
                <div className="master-tl-item" key={record.key}>
                  <div className={`master-tl-dot${index === operationRecords.length - 1 ? ' gray' : ''}`} />
                  <div className="master-tl-content">
                    <div className="master-tl-operator">操作人：{record.operator}</div>
                    <div className="master-tl-action">操作记录：{record.action}</div>
                    <div className="master-tl-time">操作时间：{record.time}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="pd-meta-value empty">—</div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="pd-page">
      <Breadcrumb
        items={[
          {
            title: (
              <Button type="link" className="pd-breadcrumb-link" onClick={() => navigate('/master-data/product-documents')}>
                主数据
              </Button>
            ),
          },
          {
            title: (
              <Button type="link" className="pd-breadcrumb-link" onClick={() => navigate('/master-data/product-documents')}>
                产品资料库
              </Button>
            ),
          },
          { title: data?.documentName || '详情' },
        ]}
      />

      <div className="pd-summary-card">
        {query.isLoading && !data ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          <>
            <div className="pd-summary-header">
              <div className="pd-summary-title-wrap">
                <div className="pd-summary-title">{data?.documentName || '—'}</div>
                <span className="pd-pill pd-pill-default">
                  {data?.documentType ? DOCUMENT_TYPE_LABELS[data.documentType] ?? data.documentType : '—'}
                </span>
              </div>
              <div className="pd-summary-actions">
                <Button onClick={() => navigate(`/master-data/product-documents/${id}/edit`)}>编辑</Button>
                <Button danger onClick={handleDelete} loading={deleteMutation.isPending}>删除</Button>
              </div>
            </div>
            <div className="pd-summary-meta">
              <div className="pd-summary-meta-item">
                <div className="pd-summary-meta-label">归属类型</div>
                <div className="pd-summary-meta-value">
                  {data?.attributionType ? ATTRIBUTION_TYPE_LABELS[data.attributionType] ?? data.attributionType : '—'}
                </div>
              </div>
              <div className="pd-summary-meta-item">
                <div className="pd-summary-meta-label">国家/地区</div>
                <div className="pd-summary-meta-value">{countryName}</div>
              </div>
              <div className="pd-summary-meta-item">
                <div className="pd-summary-meta-label">上传时间</div>
                <div className="pd-summary-meta-value">
                  {data?.createdAt ? dayjs(data.createdAt).format('YYYY-MM-DD') : '—'}
                </div>
              </div>
              <div className="pd-summary-meta-item">
                <div className="pd-summary-meta-label">资料文件</div>
                <div className="pd-summary-meta-value">
                  {data?.fileUrl ? (
                    <Button type="link" style={{ padding: 0 }} onClick={() => window.open(data.fileUrl!, '_blank')}>
                      下载文件
                    </Button>
                  ) : '—'}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="pd-info-card">
        {query.isLoading && !data ? (
          <div className="pd-tab-body">
            <Skeleton active paragraph={{ rows: 8 }} />
          </div>
        ) : (
          <Tabs className="pd-info-tabs" defaultActiveKey="basic" items={tabItems} />
        )}
      </div>
    </div>
  );
}
