import { useState } from 'react';
import { Button, Result, Skeleton } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { getPortById } from '../../../api/ports.api';
import { AnchorNav, MetaItem, OperationTimeline, SectionCard, SummaryMetaItem, displayOrDash } from '../components/page-scaffold';
import '../master-page.css';

export default function PortDetailPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const portId = Number(id);
  const [activeAnchor, setActiveAnchor] = useState('basic');

  const query = useQuery({
    queryKey: ['port-detail', portId],
    queryFn: () => getPortById(portId),
    enabled: Number.isInteger(portId) && portId > 0,
  });

  if (!Number.isInteger(portId) || portId <= 0) {
    return (
      <Result
        status="404"
        title="港口不存在"
        extra={<Button type="primary" onClick={() => navigate('/master-data/ports')}>返回列表</Button>}
      />
    );
  }

  if (query.isError && !query.data) {
    return (
      <Result
        status="error"
        title="港口详情加载失败"
        subTitle="请检查网络或稍后重试"
        extra={[
          <Button key="retry" type="primary" onClick={() => query.refetch()}>重试</Button>,
          <Button key="back" onClick={() => navigate('/master-data/ports')}>返回列表</Button>,
        ]}
      />
    );
  }

  const data = query.data;
  const operationRecords = [
    ...(data?.updatedAt
      ? [{ key: 'updated', operator: displayOrDash(data.updatedBy), action: '更新记录', time: dayjs(data.updatedAt).format('YYYY-MM-DD HH:mm') }]
      : []),
    ...(data?.createdAt
      ? [{ key: 'created', operator: displayOrDash(data.createdBy), action: '创建记录', time: dayjs(data.createdAt).format('YYYY-MM-DD HH:mm') }]
      : []),
  ];
  const anchors = [
    { key: 'basic', label: '基础信息' },
    { key: 'audit', label: '审计信息' },
    { key: 'operation', label: '操作记录' },
  ];

  return (
    <div className="master-page">
      <div className="master-summary-card">
        {query.isLoading && !data ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          <>
            <div className="master-summary-code">{displayOrDash(data?.portCode)}</div>
            <div className="master-summary-header">
              <div className="master-summary-title-wrap">
                <div className="master-summary-title-row">
                  <div className="master-summary-title">{displayOrDash(data?.nameCn)}</div>
                  <span className="master-pill master-pill-blue">已维护</span>
                </div>
              </div>
              <div className="master-summary-actions">
                <Button onClick={() => navigate(`/master-data/ports/${id}/edit`)}>编辑</Button>
              </div>
            </div>
            <div className="master-summary-meta">
              <SummaryMetaItem label="港口/机场代码" value={displayOrDash(data?.portCode)} />
              <SummaryMetaItem label="国家/地区" value={displayOrDash(data?.countryName)} />
              <SummaryMetaItem label="港口类型" value={displayOrDash(data?.portType)} />
              <SummaryMetaItem label="港口英文名" value={displayOrDash(data?.nameEn)} />
            </div>
          </>
        )}
      </div>

      <div className="master-detail-layout">
        <AnchorNav anchors={anchors} activeKey={activeAnchor} onChange={setActiveAnchor} />
        <div className="master-detail-main">
          <SectionCard id="basic" title="基础信息" description="展示港口名称、编码、国家与类型等基础资料。">
            {query.isLoading && !data ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : (
              <div className="master-meta-grid">
                <MetaItem label="港口中文名" value={displayOrDash(data?.nameCn)} />
                <MetaItem label="港口英文名" value={displayOrDash(data?.nameEn)} />
                <MetaItem label="港口/机场代码" value={displayOrDash(data?.portCode)} />
                <MetaItem label="国家/地区" value={displayOrDash(data?.countryName)} />
                <MetaItem label="港口类型" value={displayOrDash(data?.portType)} />
              </div>
            )}
          </SectionCard>

          <SectionCard id="audit" title="审计信息" description="记录港口资料的创建与维护时间。">
            {query.isLoading && !data ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : (
              <div className="master-meta-grid">
                <MetaItem label="创建人" value={displayOrDash(data?.createdBy)} />
                <MetaItem label="更新人" value={displayOrDash(data?.updatedBy)} />
                <MetaItem label="创建时间" value={data?.createdAt ? dayjs(data.createdAt).format('YYYY-MM-DD HH:mm') : '—'} />
                <MetaItem label="更新时间" value={data?.updatedAt ? dayjs(data.updatedAt).format('YYYY-MM-DD HH:mm') : '—'} />
              </div>
            )}
          </SectionCard>

          <SectionCard id="operation" title="操作记录" description="按时间查看港口档案维护轨迹。">
            {query.isLoading && !data ? <Skeleton active paragraph={{ rows: 3 }} /> : <OperationTimeline records={operationRecords} />}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
