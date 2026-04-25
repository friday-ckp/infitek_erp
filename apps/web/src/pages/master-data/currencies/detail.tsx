import { useState } from 'react';
import { Button, Result, Skeleton } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import type { CurrencyStatus } from '@infitek/shared';
import { getCurrencyById } from '../../../api/currencies.api';
import { AnchorNav, MetaItem, OperationTimeline, SectionCard, SummaryMetaItem, displayOrDash } from '../components/page-scaffold';
import '../master-page.css';

const statusText: Record<CurrencyStatus, string> = {
  active: '启用',
  inactive: '禁用',
};

const statusClass: Record<CurrencyStatus, string> = {
  active: 'master-pill-success',
  inactive: 'master-pill-default',
};

export default function CurrencyDetailPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const currencyId = Number(id);
  const [activeAnchor, setActiveAnchor] = useState('basic');

  const query = useQuery({
    queryKey: ['currency-detail', currencyId],
    queryFn: () => getCurrencyById(currencyId),
    enabled: Number.isInteger(currencyId) && currencyId > 0,
  });

  if (!Number.isInteger(currencyId) || currencyId <= 0) {
    return (
      <Result
        status="404"
        title="币种不存在"
        extra={<Button type="primary" onClick={() => navigate('/master-data/currencies')}>返回列表</Button>}
      />
    );
  }

  if (query.isError && !query.data) {
    return (
      <Result
        status="error"
        title="币种详情加载失败"
        subTitle="请检查网络或稍后重试"
        extra={[
          <Button key="retry" type="primary" onClick={() => query.refetch()}>重试</Button>,
          <Button key="back" onClick={() => navigate('/master-data/currencies')}>返回列表</Button>,
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
            <div className="master-summary-code">{displayOrDash(data?.code)}</div>
            <div className="master-summary-header">
              <div className="master-summary-title-wrap">
                <div className="master-summary-title-row">
                  <div className="master-summary-title">{displayOrDash(data?.name)}</div>
                  {data ? <span className={`master-pill ${statusClass[data.status]}`}>{statusText[data.status]}</span> : null}
                </div>
              </div>
              <div className="master-summary-actions">
                <Button onClick={() => navigate(`/master-data/currencies/${id}/edit`)}>编辑</Button>
              </div>
            </div>
            <div className="master-summary-meta">
              <SummaryMetaItem label="币种代码" value={displayOrDash(data?.code)} />
              <SummaryMetaItem label="币种符号" value={displayOrDash(data?.symbol)} />
              <SummaryMetaItem label="本位币" value={data?.isBaseCurrency === 1 ? '是' : '否'} />
              <SummaryMetaItem label="更新人" value={displayOrDash(data?.updatedBy)} />
            </div>
          </>
        )}
      </div>

      <div className="master-detail-layout">
        <AnchorNav anchors={anchors} activeKey={activeAnchor} onChange={setActiveAnchor} />
        <div className="master-detail-main">
          <SectionCard id="basic" title="基础信息" description="展示币种名称、符号、本位币标记与当前状态。">
            {query.isLoading && !data ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : (
              <div className="master-meta-grid">
                <MetaItem label="币种代码" value={displayOrDash(data?.code)} />
                <MetaItem label="币种名称" value={displayOrDash(data?.name)} />
                <MetaItem label="币种符号" value={displayOrDash(data?.symbol)} />
                <MetaItem label="是否本位币" value={data?.isBaseCurrency === 1 ? '是' : '否'} />
                <MetaItem label="状态" value={data ? <span className={`master-pill ${statusClass[data.status]}`}>{statusText[data.status]}</span> : '—'} />
              </div>
            )}
          </SectionCard>

          <SectionCard id="audit" title="审计信息" description="记录币种资料的创建与维护时间。">
            {query.isLoading && !data ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : (
              <div className="master-meta-grid">
                <MetaItem label="创建时间" value={data?.createdAt ? dayjs(data.createdAt).format('YYYY-MM-DD HH:mm') : '—'} />
                <MetaItem label="更新时间" value={data?.updatedAt ? dayjs(data.updatedAt).format('YYYY-MM-DD HH:mm') : '—'} />
                <MetaItem label="创建人" value={displayOrDash(data?.createdBy)} />
                <MetaItem label="更新人" value={displayOrDash(data?.updatedBy)} />
              </div>
            )}
          </SectionCard>

          <SectionCard id="operation" title="操作记录" description="按时间查看币种档案维护轨迹。">
            {query.isLoading && !data ? <Skeleton active paragraph={{ rows: 3 }} /> : <OperationTimeline records={operationRecords} />}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
