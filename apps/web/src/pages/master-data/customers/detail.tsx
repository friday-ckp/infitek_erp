import type { ReactNode } from 'react';
import { Button, Result, Skeleton, Tabs } from 'antd';
import type { TabsProps } from 'antd';
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
          <Button key="retry" type="primary" onClick={() => query.refetch()}>
            重试
          </Button>,
          <Button key="back" onClick={() => navigate('/master-data/customers')}>
            返回列表
          </Button>,
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
            <MetaItem label="客户代码" value={displayOrDash(data?.customerCode)} />
            <MetaItem label="客户名称" value={displayOrDash(data?.customerName)} />
            <MetaItem label="国家/地区" value={displayOrDash(data?.countryName)} />
            <MetaItem label="销售员" value={displayOrDash(data?.salespersonName)} />
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
            <MetaItem label="联系邮箱" value={displayOrDash(data?.contactEmail)} />
            <MetaItem label="联系地址" value={displayOrDash(data?.address)} full />
          </div>
        </div>
      ),
    },
    {
      key: 'billing',
      label: '开票需求',
      children: (
        <div className="master-info-body">
          <div className="master-meta-grid">
            <MetaItem label="开票需求" value={displayOrDash(data?.billingRequirements)} full />
          </div>
        </div>
      ),
    },
    {
      key: 'orders',
      label: '关联销售订单',
      children: (
        <div className="master-info-body">
          <div className="master-info-tip">
            该区域将在 Epic 5 销售订单模块落地后显示当前客户的关联销售订单列表。
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
      <div className="master-summary-card">
        {query.isLoading && !data ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          <>
            <div className="master-summary-header">
              <div className="master-summary-title-wrap">
                <div className="master-summary-title">{displayOrDash(data?.customerName)}</div>
                <span className="master-pill master-pill-blue">已维护</span>
              </div>
              <div className="master-summary-actions">
                <Button onClick={() => navigate(`/master-data/customers/${id}/edit`)}>编辑</Button>
              </div>
            </div>
            <div className="master-summary-meta">
              <div className="master-summary-meta-item">
                <div className="master-summary-meta-label">客户代码</div>
                <div className="master-summary-meta-value">{displayOrDash(data?.customerCode)}</div>
              </div>
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
