import type { ReactNode } from 'react';
import { Breadcrumb, Button, Result, Skeleton } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { getUserById } from '../../../api/users.api';
import '../../master-data/master-page.css';

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

export default function UserDetailPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();

  const query = useQuery({
    queryKey: ['user-detail', id],
    queryFn: () => getUserById(id),
    enabled: Boolean(id),
  });

  if (!id) {
    return (
      <Result
        status="404"
        title="用户不存在"
        extra={<Button type="primary" onClick={() => navigate('/settings/users')}>返回列表</Button>}
      />
    );
  }

  if (query.isError && !query.data) {
    return (
      <Result
        status="error"
        title="用户详情加载失败"
        subTitle="请检查网络或稍后重试"
        extra={[
          <Button key="retry" type="primary" onClick={() => query.refetch()}>重试</Button>,
          <Button key="back" onClick={() => navigate('/settings/users')}>返回列表</Button>,
        ]}
      />
    );
  }

  const data = query.data;
  const statusText = data?.status === 'active' ? '活跃' : '停用';
  const statusClass = data?.status === 'active' ? 'master-pill-success' : 'master-pill-default';
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
              <Button type="link" className="master-breadcrumb-link" onClick={() => navigate('/settings/users')}>
                系统设置
              </Button>
            ),
          },
          {
            title: (
              <Button type="link" className="master-breadcrumb-link" onClick={() => navigate('/settings/users')}>
                用户管理
              </Button>
            ),
          },
          { title: data?.username || '详情' },
        ]}
      />

      <div className="master-summary-card">
        {query.isLoading && !data ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          <>
            <div className="master-summary-header">
              <div className="master-summary-title-wrap">
                <div className="master-summary-title">{displayOrDash(data?.username)}</div>
                <span className={`master-pill ${statusClass}`}>{statusText}</span>
              </div>
              <div className="master-summary-actions">
                <Button onClick={() => navigate(`/settings/users/${id}/edit`)}>编辑</Button>
              </div>
            </div>
            <div className="master-summary-meta">
              <div className="master-summary-meta-item">
                <div className="master-summary-meta-label">姓名</div>
                <div className="master-summary-meta-value">{displayOrDash(data?.name)}</div>
              </div>
              <div className="master-summary-meta-item">
                <div className="master-summary-meta-label">创建人</div>
                <div className="master-summary-meta-value">{displayOrDash(data?.createdBy)}</div>
              </div>
              <div className="master-summary-meta-item">
                <div className="master-summary-meta-label">更新人</div>
                <div className="master-summary-meta-value">{displayOrDash(data?.updatedBy)}</div>
              </div>
              <div className="master-summary-meta-item">
                <div className="master-summary-meta-label">最近更新时间</div>
                <div className="master-summary-meta-value">
                  {data?.updatedAt ? dayjs(data.updatedAt).format('YYYY-MM-DD HH:mm') : '—'}
                </div>
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
              <MetaItem label="用户名" value={displayOrDash(data?.username)} />
              <MetaItem label="姓名" value={displayOrDash(data?.name)} />
              <MetaItem label="账号状态" value={statusText} />
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
