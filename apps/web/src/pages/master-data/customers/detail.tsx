import { useState, type ReactNode } from 'react';
import { Button, Result, Skeleton } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { getCustomerById } from '../../../api/customers.api';
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

export default function CustomerDetailPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const customerId = Number(id);
  const [activeAnchor, setActiveAnchor] = useState('basic');

  const query = useQuery({
    queryKey: ['customer-detail', customerId],
    queryFn: () => getCustomerById(customerId),
    enabled: Number.isInteger(customerId) && customerId > 0,
  });

  if (!Number.isInteger(customerId) || customerId <= 0) {
    return (
      <Result
        status="404"
        title="客户不存在"
        extra={<Button type="primary" onClick={() => navigate('/master-data/customers')}>返回列表</Button>}
      />
    );
  }

  if (query.isError && !query.data) {
    return (
      <Result
        status="error"
        title="客户详情加载失败"
        subTitle="请检查网络或稍后重试"
        extra={[
          <Button key="retry" type="primary" onClick={() => query.refetch()}>重试</Button>,
          <Button key="back" onClick={() => navigate('/master-data/customers')}>返回列表</Button>,
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

  const anchors = [
    { key: 'basic', label: '基础信息' },
    { key: 'contact', label: '联系信息' },
    { key: 'billing', label: '开票需求' },
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
            <div className="master-summary-code">{displayOrDash(data?.customerCode)}</div>
            <div className="master-summary-header">
              <div className="master-summary-title-wrap">
                <div className="master-summary-title-row">
                  <div className="master-summary-title">{displayOrDash(data?.customerName)}</div>
                  <span className="master-pill master-pill-blue">已维护</span>
                </div>
              </div>
              <div className="master-summary-actions">
                <Button onClick={() => navigate(`/master-data/customers/${id}/edit`)}>编辑</Button>
              </div>
            </div>
            <div className="master-summary-meta">
              <div className="master-summary-meta-item">
                <div className="master-summary-meta-label">国家/地区</div>
                <div className="master-summary-meta-value">{displayOrDash(data?.countryName)}</div>
              </div>
              <div className="master-summary-meta-item">
                <div className="master-summary-meta-label">销售员</div>
                <div className="master-summary-meta-value">{displayOrDash(data?.salespersonName)}</div>
              </div>
              <div className="master-summary-meta-item">
                <div className="master-summary-meta-label">联系人</div>
                <div className="master-summary-meta-value">{displayOrDash(data?.contactPerson)}</div>
              </div>
              <div className="master-summary-meta-item">
                <div className="master-summary-meta-label">联系电话</div>
                <div className="master-summary-meta-value">{displayOrDash(data?.contactPhone)}</div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="master-detail-layout">
        <div className="master-anchor-nav">
          {anchors.map((anchor) => (
            <a
              key={anchor.key}
              href={`#${anchor.key}`}
              className={`master-anchor-link${activeAnchor === anchor.key ? ' active' : ''}`}
              onClick={() => setActiveAnchor(anchor.key)}
            >
              {anchor.label}
            </a>
          ))}
        </div>

        <div className="master-detail-main">
          <section id="basic" className="master-section-card">
            <div className="master-section-header">
              <div className="master-section-heading">
                <div className="master-section-title">基础信息</div>
                <div className="master-section-description">查看客户主体编码、国家归属与负责人分配情况。</div>
              </div>
            </div>
            <div className="master-section-body">
              {query.isLoading && !data ? (
                <Skeleton active paragraph={{ rows: 4 }} />
              ) : (
                <div className="master-meta-grid">
                  <MetaItem label="客户代码" value={displayOrDash(data?.customerCode)} />
                  <MetaItem label="客户名称" value={displayOrDash(data?.customerName)} />
                  <MetaItem label="国家/地区" value={displayOrDash(data?.countryName)} />
                  <MetaItem label="销售员" value={displayOrDash(data?.salespersonName)} />
                </div>
              )}
            </div>
          </section>

          <section id="contact" className="master-section-card">
            <div className="master-section-header">
              <div className="master-section-heading">
                <div className="master-section-title">联系信息</div>
                <div className="master-section-description">集中展示客户联系人、电话、邮箱和联系地址。</div>
              </div>
            </div>
            <div className="master-section-body">
              {query.isLoading && !data ? (
                <Skeleton active paragraph={{ rows: 4 }} />
              ) : (
                <div className="master-meta-grid">
                  <MetaItem label="联系人" value={displayOrDash(data?.contactPerson)} />
                  <MetaItem label="联系电话" value={displayOrDash(data?.contactPhone)} />
                  <MetaItem label="联系邮箱" value={displayOrDash(data?.contactEmail)} />
                  <MetaItem label="联系地址" value={displayOrDash(data?.address)} full />
                </div>
              )}
            </div>
          </section>

          <section id="billing" className="master-section-card">
            <div className="master-section-header">
              <div className="master-section-heading">
                <div className="master-section-title">开票需求</div>
                <div className="master-section-description">记录客户开票偏好与特殊需求说明。</div>
              </div>
            </div>
            <div className="master-section-body">
              {query.isLoading && !data ? (
                <Skeleton active paragraph={{ rows: 2 }} />
              ) : (
                <div className="master-meta-grid">
                  <MetaItem label="开票需求" value={displayOrDash(data?.billingRequirements)} full />
                </div>
              )}
            </div>
          </section>

          <section id="audit" className="master-section-card">
            <div className="master-section-header">
              <div className="master-section-heading">
                <div className="master-section-title">审计信息</div>
                <div className="master-section-description">记录客户资料的创建人、更新人与时间戳。</div>
              </div>
            </div>
            <div className="master-section-body">
              {query.isLoading && !data ? (
                <Skeleton active paragraph={{ rows: 3 }} />
              ) : (
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
              )}
            </div>
          </section>

          <section id="operation" className="master-section-card">
            <div className="master-section-header">
              <div className="master-section-heading">
                <div className="master-section-title">操作记录</div>
                <div className="master-section-description">按时间展示客户主数据的维护轨迹。</div>
              </div>
            </div>
            <div className="master-section-body">
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
          </section>
        </div>
      </div>
    </div>
  );
}
