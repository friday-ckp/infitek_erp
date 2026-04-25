import { useState } from 'react';
import { Button, Rate, Result, Skeleton } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { ActivityTimeline } from '../../../components/ActivityTimeline';
import { getLogisticsProviderById } from '../../../api/logistics-providers.api';
import { AnchorNav, MetaItem, SectionCard, SummaryMetaItem, displayOrDash } from '../components/page-scaffold';
import '../master-page.css';

function getStatusPill(status?: string) {
  if (status === '淘汰') return 'master-pill-default';
  if (status === '临拓') return 'master-pill-orange';
  return 'master-pill-blue';
}

export default function LogisticsProviderDetailPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const providerId = Number(id);
  const [activeAnchor, setActiveAnchor] = useState('basic');

  const query = useQuery({
    queryKey: ['logistics-provider-detail', providerId],
    queryFn: () => getLogisticsProviderById(providerId),
    enabled: Number.isInteger(providerId) && providerId > 0,
  });

  if (!Number.isInteger(providerId) || providerId <= 0) {
    return (
      <Result
        status="404"
        title="物流供应商不存在"
        extra={<Button type="primary" onClick={() => navigate('/master-data/logistics-providers')}>返回列表</Button>}
      />
    );
  }

  if (query.isError && !query.data) {
    return (
      <Result
        status="error"
        title="物流供应商详情加载失败"
        subTitle="请检查网络或稍后重试"
        extra={[
          <Button key="retry" type="primary" onClick={() => query.refetch()}>重试</Button>,
          <Button key="back" onClick={() => navigate('/master-data/logistics-providers')}>返回列表</Button>,
        ]}
      />
    );
  }

  const data = query.data;
  const anchors = [
    { key: 'basic', label: '基础信息' },
    { key: 'contact', label: '联系信息' },
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
            <div className="master-summary-code">{displayOrDash(data?.providerCode)}</div>
            <div className="master-summary-header">
              <div className="master-summary-title-wrap">
                <div className="master-summary-title-row">
                  <div className="master-summary-title">{displayOrDash(data?.name)}</div>
                  <span className={`master-pill ${getStatusPill(data?.status)}`}>{displayOrDash(data?.status)}</span>
                </div>
              </div>
              <div className="master-summary-actions">
                <Button onClick={() => navigate(`/master-data/logistics-providers/${id}/edit`)}>编辑</Button>
              </div>
            </div>
            <div className="master-summary-meta">
              <SummaryMetaItem label="供应商编码" value={displayOrDash(data?.providerCode)} />
              <SummaryMetaItem label="联系人" value={displayOrDash(data?.contactPerson)} />
              <SummaryMetaItem label="联系电话" value={displayOrDash(data?.contactPhone)} />
              <SummaryMetaItem label="国家/地区" value={displayOrDash(data?.countryName)} />
            </div>
          </>
        )}
      </div>

      <div className="master-detail-layout">
        <AnchorNav anchors={anchors} activeKey={activeAnchor} onChange={setActiveAnchor} />
        <div className="master-detail-main">
          <SectionCard id="basic" title="基础信息" description="展示物流供应商主标识、合作状态与等级。">
            {query.isLoading && !data ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : (
              <div className="master-meta-grid">
                <MetaItem label="供应商名称" value={displayOrDash(data?.name)} />
                <MetaItem label="供应商简称" value={displayOrDash(data?.shortName)} />
                <MetaItem label="供应商编码" value={displayOrDash(data?.providerCode)} />
                <MetaItem label="合作状态" value={<span className={`master-pill ${getStatusPill(data?.status)}`}>{displayOrDash(data?.status)}</span>} />
                <MetaItem label="国家/地区" value={displayOrDash(data?.countryName)} />
                <MetaItem label="默认合作主体" value={displayOrDash(data?.defaultCompanyName)} />
                <MetaItem label="供应商等级" value={data?.providerLevel ? <Rate disabled count={5} value={data.providerLevel} /> : '—'} />
              </div>
            )}
          </SectionCard>

          <SectionCard id="contact" title="联系信息" description="集中展示联系人、邮箱、电话与地址信息。">
            {query.isLoading && !data ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : (
              <div className="master-meta-grid">
                <MetaItem label="联系人" value={displayOrDash(data?.contactPerson)} />
                <MetaItem label="联系电话" value={displayOrDash(data?.contactPhone)} />
                <MetaItem label="联系邮箱" value={displayOrDash(data?.contactEmail)} />
                <MetaItem label="公司详细地址" value={displayOrDash(data?.address)} full />
              </div>
            )}
          </SectionCard>

          <SectionCard id="audit" title="审计信息" description="记录物流供应商资料的创建与维护时间。">
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

          <SectionCard id="operation" title="操作记录" description="按时间查看物流供应商档案维护轨迹。">
            <ActivityTimeline resourceType="logistics-providers" resourceId={providerId} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
