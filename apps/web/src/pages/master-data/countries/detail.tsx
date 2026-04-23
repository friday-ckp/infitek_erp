import type { ReactNode } from 'react';
import { Breadcrumb, Button, Result, Skeleton } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { getCountryById } from '../../../api/countries.api';
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

export default function CountryDetailPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const countryId = Number(id);

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

  return (
    <div className="master-page">
      <Breadcrumb
        items={[
          {
            title: (
              <Button type="link" className="master-breadcrumb-link" onClick={() => navigate('/master-data/countries')}>
                主数据
              </Button>
            ),
          },
          {
            title: (
              <Button type="link" className="master-breadcrumb-link" onClick={() => navigate('/master-data/countries')}>
                国家/地区管理
              </Button>
            ),
          },
          { title: data?.code || '详情' },
        ]}
      />

      <div className="master-summary-card">
        {query.isLoading && !data ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          <>
            <div className="master-summary-header">
              <div className="master-summary-title-wrap">
                <div className="master-summary-title">{data?.code || '—'}</div>
                <span className="master-pill master-pill-blue">已维护</span>
              </div>
              <div className="master-summary-actions">
                <Button onClick={() => navigate(`/master-data/countries/${id}/edit`)}>编辑</Button>
              </div>
            </div>
            <div className="master-summary-meta">
              <div className="master-summary-meta-item">
                <div className="master-summary-meta-label">国家/地区名称</div>
                <div className="master-summary-meta-value">{displayOrDash(data?.name)}</div>
              </div>
              <div className="master-summary-meta-item">
                <div className="master-summary-meta-label">英文名称</div>
                <div className="master-summary-meta-value">{displayOrDash(data?.nameEn)}</div>
              </div>
              <div className="master-summary-meta-item">
                <div className="master-summary-meta-label">简称</div>
                <div className="master-summary-meta-value">{displayOrDash(data?.abbreviation)}</div>
              </div>
              <div className="master-summary-meta-item">
                <div className="master-summary-meta-label">更新人</div>
                <div className="master-summary-meta-value">{displayOrDash(data?.updatedBy)}</div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="master-info-card">
        <div className="master-info-body">
          {query.isLoading && !data ? (
            <Skeleton active paragraph={{ rows: 6 }} />
          ) : (
            <div className="master-meta-grid">
              <MetaItem label="国家/地区代码" value={displayOrDash(data?.code)} />
              <MetaItem label="国家/地区名称" value={displayOrDash(data?.name)} />
              <MetaItem label="英文名称" value={displayOrDash(data?.nameEn)} />
              <MetaItem label="简称" value={displayOrDash(data?.abbreviation)} />
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
          )}
        </div>
      </div>

      <div className="master-info-card">
        <div className="master-info-body">
          {query.isLoading && !data ? (
            <Skeleton active paragraph={{ rows: 3 }} />
          ) : operationRecords.length ? (
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
      </div>
    </div>
  );
}
