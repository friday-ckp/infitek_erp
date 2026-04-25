import { useState } from 'react';
import { Button, Result, Skeleton } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { ActivityTimeline } from '../../../components/ActivityTimeline';
import { getCountryById } from '../../../api/countries.api';
import { AnchorNav, MetaItem, SectionCard, SummaryMetaItem, displayOrDash } from '../components/page-scaffold';
import '../master-page.css';

export default function CountryDetailPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const countryId = Number(id);
  const [activeAnchor, setActiveAnchor] = useState('basic');

  const query = useQuery({
    queryKey: ['country-detail', countryId],
    queryFn: () => getCountryById(countryId),
    enabled: Number.isInteger(countryId) && countryId > 0,
  });

  if (!Number.isInteger(countryId) || countryId <= 0) {
    return (
      <Result
        status="404"
        title="国家/地区不存在"
        extra={<Button type="primary" onClick={() => navigate('/master-data/countries')}>返回列表</Button>}
      />
    );
  }

  if (query.isError && !query.data) {
    return (
      <Result
        status="error"
        title="国家/地区详情加载失败"
        subTitle="请检查网络或稍后重试"
        extra={[
          <Button key="retry" type="primary" onClick={() => query.refetch()}>重试</Button>,
          <Button key="back" onClick={() => navigate('/master-data/countries')}>返回列表</Button>,
        ]}
      />
    );
  }

  const data = query.data;
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
                  <span className="master-pill master-pill-blue">已维护</span>
                </div>
              </div>
              <div className="master-summary-actions">
                <Button onClick={() => navigate(`/master-data/countries/${id}/edit`)}>编辑</Button>
              </div>
            </div>
            <div className="master-summary-meta">
              <SummaryMetaItem label="国家/地区代码" value={displayOrDash(data?.code)} />
              <SummaryMetaItem label="英文名称" value={displayOrDash(data?.nameEn)} />
              <SummaryMetaItem label="简称" value={displayOrDash(data?.abbreviation)} />
              <SummaryMetaItem label="更新人" value={displayOrDash(data?.updatedBy)} />
            </div>
          </>
        )}
      </div>

      <div className="master-detail-layout">
        <AnchorNav anchors={anchors} activeKey={activeAnchor} onChange={setActiveAnchor} />
        <div className="master-detail-main">
          <SectionCard id="basic" title="基础信息" description="展示国家地区主标识、多语言名称与简称。">
            {query.isLoading && !data ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : (
              <div className="master-meta-grid">
                <MetaItem label="国家/地区代码" value={displayOrDash(data?.code)} />
                <MetaItem label="国家/地区名称" value={displayOrDash(data?.name)} />
                <MetaItem label="英文名称" value={displayOrDash(data?.nameEn)} />
                <MetaItem label="简称" value={displayOrDash(data?.abbreviation)} />
              </div>
            )}
          </SectionCard>

          <SectionCard id="audit" title="审计信息" description="记录国家地区资料的创建与维护时间。">
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

          <SectionCard id="operation" title="操作记录" description="按时间查看国家地区档案维护轨迹。">
            <ActivityTimeline resourceType="countries" resourceId={countryId} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
