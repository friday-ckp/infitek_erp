import { useState } from 'react';
import { Button, Result, Skeleton } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { getCompanyById } from '../../../api/companies.api';
import { AnchorNav, MetaItem, OperationTimeline, SectionCard, SummaryMetaItem, displayOrDash } from '../components/page-scaffold';
import '../master-page.css';

export default function CompanyDetailPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const companyId = Number(id);
  const [activeAnchor, setActiveAnchor] = useState('basic');

  const query = useQuery({
    queryKey: ['company-detail', companyId],
    queryFn: () => getCompanyById(companyId),
    enabled: Number.isInteger(companyId) && companyId > 0,
  });

  if (!Number.isInteger(companyId) || companyId <= 0) {
    return (
      <Result
        status="404"
        title="公司主体不存在"
        extra={<Button type="primary" onClick={() => navigate('/master-data/companies')}>返回列表</Button>}
      />
    );
  }

  if (query.isError && !query.data) {
    return (
      <Result
        status="error"
        title="公司主体详情加载失败"
        subTitle="请检查网络或稍后重试"
        extra={[
          <Button key="retry" type="primary" onClick={() => query.refetch()}>重试</Button>,
          <Button key="back" onClick={() => navigate('/master-data/companies')}>返回列表</Button>,
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
    { key: 'address', label: '地址信息' },
    { key: 'contact', label: '联系信息' },
    { key: 'bank', label: '银行信息' },
    { key: 'compliance', label: '合规信息' },
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
            <div className="master-summary-code">{displayOrDash(data?.abbreviation)}</div>
            <div className="master-summary-header">
              <div className="master-summary-title-wrap">
                <div className="master-summary-title-row">
                  <div className="master-summary-title">{displayOrDash(data?.nameCn)}</div>
                  <span className="master-pill master-pill-blue">已维护</span>
                </div>
              </div>
              <div className="master-summary-actions">
                <Button onClick={() => navigate(`/master-data/companies/${id}/edit`)}>编辑</Button>
              </div>
            </div>
            <div className="master-summary-meta">
              <SummaryMetaItem label="公司简称" value={displayOrDash(data?.abbreviation)} />
              <SummaryMetaItem label="国家/地区" value={displayOrDash(data?.countryName)} />
              <SummaryMetaItem label="默认币种" value={displayOrDash(data?.defaultCurrencyCode)} />
              <SummaryMetaItem label="签订地点" value={displayOrDash(data?.signingLocation)} />
            </div>
          </>
        )}
      </div>

      <div className="master-detail-layout">
        <AnchorNav anchors={anchors} activeKey={activeAnchor} onChange={setActiveAnchor} />
        <div className="master-detail-main">
          <SectionCard id="basic" title="基础信息" description="展示公司主体名称、多语言标识与签订地点。">
            {query.isLoading && !data ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : (
              <div className="master-meta-grid">
                <MetaItem label="公司中文名称" value={displayOrDash(data?.nameCn)} />
                <MetaItem label="公司英文名称" value={displayOrDash(data?.nameEn)} />
                <MetaItem label="公司简称" value={displayOrDash(data?.abbreviation)} />
                <MetaItem label="国家/地区" value={displayOrDash(data?.countryName)} />
                <MetaItem label="签订地点" value={displayOrDash(data?.signingLocation)} />
              </div>
            )}
          </SectionCard>

          <SectionCard id="address" title="地址信息" description="集中展示公司主体的中英文地址。">
            {query.isLoading && !data ? (
              <Skeleton active paragraph={{ rows: 3 }} />
            ) : (
              <div className="master-meta-grid">
                <MetaItem label="中文地址" value={displayOrDash(data?.addressCn)} full />
                <MetaItem label="英文地址" value={displayOrDash(data?.addressEn)} full />
              </div>
            )}
          </SectionCard>

          <SectionCard id="contact" title="联系信息" description="维护联系人、联系电话与总账会计信息。">
            {query.isLoading && !data ? (
              <Skeleton active paragraph={{ rows: 3 }} />
            ) : (
              <div className="master-meta-grid">
                <MetaItem label="联系人" value={displayOrDash(data?.contactPerson)} />
                <MetaItem label="联系电话" value={displayOrDash(data?.contactPhone)} />
                <MetaItem label="总账会计" value={displayOrDash(data?.chiefAccountantName)} />
              </div>
            )}
          </SectionCard>

          <SectionCard id="bank" title="银行信息" description="展示开户行、账号、SWIFT 与默认币种信息。">
            {query.isLoading && !data ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : (
              <div className="master-meta-grid">
                <MetaItem label="开户行" value={displayOrDash(data?.bankName)} />
                <MetaItem label="银行账号" value={displayOrDash(data?.bankAccount)} />
                <MetaItem label="SWIFT CODE" value={displayOrDash(data?.swiftCode)} />
                <MetaItem label="默认币种代码" value={displayOrDash(data?.defaultCurrencyCode)} />
                <MetaItem label="默认币种名称" value={displayOrDash(data?.defaultCurrencyName)} />
              </div>
            )}
          </SectionCard>

          <SectionCard id="compliance" title="合规信息" description="展示纳税、海关与检疫备案信息。">
            {query.isLoading && !data ? (
              <Skeleton active paragraph={{ rows: 3 }} />
            ) : (
              <div className="master-meta-grid">
                <MetaItem label="纳税人识别号" value={displayOrDash(data?.taxId)} />
                <MetaItem label="海关备案号" value={displayOrDash(data?.customsCode)} />
                <MetaItem label="检疫备案号" value={displayOrDash(data?.quarantineCode)} />
              </div>
            )}
          </SectionCard>

          <SectionCard id="audit" title="审计信息" description="记录公司主体资料的创建与维护时间。">
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

          <SectionCard id="operation" title="操作记录" description="按时间查看公司主体档案维护轨迹。">
            {query.isLoading && !data ? <Skeleton active paragraph={{ rows: 3 }} /> : <OperationTimeline records={operationRecords} />}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
