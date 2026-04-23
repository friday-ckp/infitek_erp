import type { ReactNode } from 'react';
import { Breadcrumb, Button, Result, Skeleton, Tabs } from 'antd';
import type { TabsProps } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { getCompanyById } from '../../../api/companies.api';
import '../master-page.css';

function displayOrDash(value?: string | number | null): string {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

function MetaItem({ label, value, full = false }: { label: string; value: ReactNode; full?: boolean }) {
  return (
    <div className={`master-meta-item${full ? ' full' : ''}`}>
      <div className="master-meta-label">{label}</div>
      <div className={`master-meta-value${value === '—' ? ' empty' : ''}`}>{value}</div>
    </div>
  );
}

export default function CompanyDetailPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const companyId = Number(id);

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
      ? [
          {
            key: 'updated',
            operator: displayOrDash(data.updatedBy),
            action: '更新记录',
            time: dayjs(data.updatedAt).format('YYYY-MM-DD HH:mm'),
          },
        ]
      : []),
    ...(data?.createdAt
      ? [
          {
            key: 'created',
            operator: displayOrDash(data.createdBy),
            action: '创建记录',
            time: dayjs(data.createdAt).format('YYYY-MM-DD HH:mm'),
          },
        ]
      : []),
  ];

  const tabItems: TabsProps['items'] = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <div className="master-info-body">
          <div className="master-meta-grid">
            <MetaItem label="公司中文名称" value={displayOrDash(data?.nameCn)} />
            <MetaItem label="公司英文名称" value={displayOrDash(data?.nameEn)} />
            <MetaItem label="公司简称" value={displayOrDash(data?.abbreviation)} />
            <MetaItem label="国家/地区" value={displayOrDash(data?.countryName)} />
            <MetaItem label="签订地点" value={displayOrDash(data?.signingLocation)} />
          </div>
        </div>
      ),
    },
    {
      key: 'address',
      label: '地址信息',
      children: (
        <div className="master-info-body">
          <div className="master-meta-grid">
            <MetaItem label="中文地址" value={displayOrDash(data?.addressCn)} full />
            <MetaItem label="英文地址" value={displayOrDash(data?.addressEn)} full />
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      label: '联系信息',
      children: (
        <div className="master-info-body">
          <div className="master-meta-grid">
            <MetaItem label="联系人" value={displayOrDash(data?.contactPerson)} />
            <MetaItem label="联系电话" value={displayOrDash(data?.contactPhone)} />
            <MetaItem label="总账会计" value={displayOrDash(data?.chiefAccountantName)} />
          </div>
        </div>
      ),
    },
    {
      key: 'bank',
      label: '银行信息',
      children: (
        <div className="master-info-body">
          <div className="master-meta-grid">
            <MetaItem label="开户行" value={displayOrDash(data?.bankName)} />
            <MetaItem label="银行账号" value={displayOrDash(data?.bankAccount)} />
            <MetaItem label="SWIFT CODE" value={displayOrDash(data?.swiftCode)} />
            <MetaItem label="默认币种代码" value={displayOrDash(data?.defaultCurrencyCode)} />
            <MetaItem label="默认币种名称" value={displayOrDash(data?.defaultCurrencyName)} />
          </div>
        </div>
      ),
    },
    {
      key: 'compliance',
      label: '合规信息',
      children: (
        <div className="master-info-body">
          <div className="master-meta-grid">
            <MetaItem label="纳税人识别号" value={displayOrDash(data?.taxId)} />
            <MetaItem label="海关备案号" value={displayOrDash(data?.customsCode)} />
            <MetaItem label="检疫备案号" value={displayOrDash(data?.quarantineCode)} />
          </div>
        </div>
      ),
    },
    {
      key: 'audit',
      label: '审计信息',
      children: (
        <div className="master-info-body">
          <div className="master-meta-grid">
            <MetaItem
              label="创建时间"
              value={data?.createdAt ? dayjs(data.createdAt).format('YYYY-MM-DD HH:mm') : '—'}
            />
            <MetaItem
              label="更新时间"
              value={data?.updatedAt ? dayjs(data.updatedAt).format('YYYY-MM-DD HH:mm') : '—'}
            />
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
        <div className="master-info-body">
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
            <div className="master-meta-value empty">—</div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="master-page">
      <Breadcrumb
        items={[
          {
            title: (
              <Button type="link" className="master-breadcrumb-link" onClick={() => navigate('/master-data/companies')}>
                主数据
              </Button>
            ),
          },
          {
            title: (
              <Button type="link" className="master-breadcrumb-link" onClick={() => navigate('/master-data/companies')}>
                公司主体管理
              </Button>
            ),
          },
          { title: data?.nameCn || '详情' },
        ]}
      />

      <div className="master-summary-card">
        {query.isLoading && !data ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          <>
            <div className="master-summary-header">
              <div className="master-summary-title-wrap">
                <div className="master-summary-title">{displayOrDash(data?.nameCn)}</div>
                <span className="master-pill master-pill-blue">已维护</span>
              </div>
              <div className="master-summary-actions">
                <Button onClick={() => navigate(`/master-data/companies/${id}/edit`)}>编辑</Button>
              </div>
            </div>
            <div className="master-summary-meta">
              <div className="master-summary-meta-item">
                <div className="master-summary-meta-label">公司简称</div>
                <div className="master-summary-meta-value">{displayOrDash(data?.abbreviation)}</div>
              </div>
              <div className="master-summary-meta-item">
                <div className="master-summary-meta-label">国家/地区</div>
                <div className="master-summary-meta-value">{displayOrDash(data?.countryName)}</div>
              </div>
              <div className="master-summary-meta-item">
                <div className="master-summary-meta-label">默认币种</div>
                <div className="master-summary-meta-value">{displayOrDash(data?.defaultCurrencyCode)}</div>
              </div>
              <div className="master-summary-meta-item">
                <div className="master-summary-meta-label">签订地点</div>
                <div className="master-summary-meta-value">{displayOrDash(data?.signingLocation)}</div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="master-info-card">
        {query.isLoading && !data ? (
          <div className="master-info-body">
            <Skeleton active paragraph={{ rows: 8 }} />
          </div>
        ) : (
          <Tabs className="master-info-tabs" defaultActiveKey="basic" items={tabItems} />
        )}
      </div>
    </div>
  );
}
