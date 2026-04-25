import { useState } from 'react';
import { Button, Modal, Result, Skeleton, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { ActivityTimeline } from '../../../components/ActivityTimeline';
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
import {
  AnchorNav,
  MetaItem,
  SectionCard,
  SummaryMetaItem,
  displayOrDash,
} from '../components/page-scaffold';
import '../master-page.css';

export default function ProductDocumentDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id = '' } = useParams();
  const docId = Number(id);
  const [activeAnchor, setActiveAnchor] = useState('basic');

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
    if (attribution === 'category_l1' && data?.categoryLevel1Id) {
      return findCategoryName(categoryTreeQuery.data, data.categoryLevel1Id);
    }
    if (attribution === 'category_l2' && data?.categoryLevel2Id) {
      return findCategoryName(categoryTreeQuery.data, data.categoryLevel2Id);
    }
    if (attribution === 'category_l3' && data?.categoryLevel3Id) {
      return findCategoryName(categoryTreeQuery.data, data.categoryLevel3Id);
    }
    return '—';
  };

  const anchors = [
    { key: 'basic', label: '资料信息' },
    { key: 'file', label: '附件与审计' },
    { key: 'operation', label: '操作记录' },
  ];

  return (
    <div className="master-page">
      <div className="master-summary-card">
        {query.isLoading && !data ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          <>
            <div className="master-summary-code">
              {data?.documentType ? DOCUMENT_TYPE_LABELS[data.documentType] ?? data.documentType : '—'}
            </div>
            <div className="master-summary-header">
              <div className="master-summary-title-wrap">
                <div className="master-summary-title-row">
                  <div className="master-summary-title">{displayOrDash(data?.documentName)}</div>
                  <span className="master-pill master-pill-default">
                    {data?.documentType ? DOCUMENT_TYPE_LABELS[data.documentType] ?? data.documentType : '—'}
                  </span>
                </div>
              </div>
              <div className="master-summary-actions">
                <Button onClick={() => navigate(`/master-data/product-documents/${id}/edit`)}>编辑</Button>
                <Button danger onClick={handleDelete} loading={deleteMutation.isPending}>删除</Button>
              </div>
            </div>
            <div className="master-summary-meta">
              <SummaryMetaItem
                label="归属类型"
                value={data?.attributionType ? ATTRIBUTION_TYPE_LABELS[data.attributionType] ?? data.attributionType : '—'}
              />
              <SummaryMetaItem label="国家/地区" value={countryName} />
              <SummaryMetaItem label="上传时间" value={data?.createdAt ? dayjs(data.createdAt).format('YYYY-MM-DD') : '—'} />
              <SummaryMetaItem
                label="资料文件"
                value={
                  data?.fileUrl ? (
                    <Button type="link" style={{ padding: 0 }} onClick={() => window.open(data.fileUrl!, '_blank')}>
                      下载文件
                    </Button>
                  ) : '—'
                }
              />
            </div>
          </>
        )}
      </div>

      <div className="master-detail-layout">
        <AnchorNav anchors={anchors} activeKey={activeAnchor} onChange={setActiveAnchor} />

        <div className="master-detail-main">
          <SectionCard
            id="basic"
            title="资料信息"
            description="统一展示资料名称、类型、归属和内容说明。"
          >
            {query.isLoading && !data ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : (
              <div className="master-meta-grid">
                <MetaItem label="资料名称" value={displayOrDash(data?.documentName)} />
                <MetaItem label="资料类型" value={data?.documentType ? DOCUMENT_TYPE_LABELS[data.documentType] ?? data.documentType : '—'} />
                <MetaItem label="归属类型" value={data?.attributionType ? ATTRIBUTION_TYPE_LABELS[data.attributionType] ?? data.attributionType : '—'} />
                <MetaItem label="国家/地区" value={countryName} />
                {data?.attributionType === 'product' ? <MetaItem label="所属产品" value={spuName} /> : null}
                {data?.attributionType === 'category_l1' || data?.attributionType === 'category_l2' || data?.attributionType === 'category_l3'
                  ? <MetaItem label="所属产品分类" value={getCategoryLabel()} />
                  : null}
                <MetaItem label="资料内容" value={displayOrDash(data?.content)} full />
              </div>
            )}
          </SectionCard>

          <SectionCard
            id="file"
            title="附件与审计"
            description="查看资料附件、下载入口和维护审计信息。"
          >
            {query.isLoading && !data ? (
              <Skeleton active paragraph={{ rows: 3 }} />
            ) : (
              <div className="master-meta-grid">
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
            )}
          </SectionCard>

          <SectionCard
            id="operation"
            title="操作记录"
            description="按时间展示资料条目的创建与更新轨迹。"
          >
            <ActivityTimeline resourceType="product-documents" resourceId={docId} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
