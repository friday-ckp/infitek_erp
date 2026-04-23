import type { ReactNode } from 'react';
import { Breadcrumb, Button, Result, Skeleton, Tabs } from 'antd';
import type { TabsProps } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import type { WarehouseStatus } from '@infitek/shared';
import { getWarehouseById } from '../../../api/warehouses.api';
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

const statusText: Record<WarehouseStatus, string> = {
  active: '启用',
  inactive: '禁用',
};

const statusClass: Record<WarehouseStatus, string> = {
  active: 'master-pill-success',
  inactive: 'master-pill-default',
};

export default function WarehouseDetailPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const warehouseId = Number(id);

  const query = useQuery({
    queryKey: ['warehouse-detail', warehouseId],
    queryFn: () => getWarehouseById(warehouseId),
    enabled: Number.isInteger(warehouseId) && warehouseId > 0,
  });

  if (!Number.isInteger(warehouseId) || warehouseId <= 0) {
    return (
      <Result
        status="404"
        title="仓库不存在"
        extra={<Button type="primary" onClick={() => navigate('/master-data/warehouses')}>返回列表</Button>}
      />
    );
  }

  if (query.isError && !query.data) {
    return (
      <Result
        status="error"
        title="仓库详情加载失败"
        subTitle="请检查网络或稍后重试"
        extra={[
          <Button key="retry" type="primary" onClick={() => query.refetch()}>重试</Button>,
          <Button key="back" onClick={() => navigate('/master-data/warehouses')}>返回列表</Button>,
        ]}
      />
    );
  }

  const data = query.data;
  const defaultShipArea = [data?.defaultShipProvince, data?.defaultShipCity].filter(Boolean).join(' / ') || '—';
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
      label: '基础信息',
      children: (
        <div className="master-info-body">
          <div className="master-meta-grid">
            <MetaItem label="仓库名称" value={displayOrDash(data?.name)} />
            <MetaItem label="仓库编号" value={displayOrDash(data?.warehouseCode)} />
            <MetaItem label="状态" value={data ? statusText[data.status] : '—'} />
            <MetaItem label="仓库类型" value={displayOrDash(data?.warehouseType)} />
            <MetaItem label="仓库归属" value={displayOrDash(data?.ownership)} />
            <MetaItem label="是否虚拟仓" value={data ? (data.isVirtual ? '是' : '否') : '—'} />
            <MetaItem label="默认发运省市" value={defaultShipArea} />
            <MetaItem label="关联供应商" value={displayOrDash(data?.supplierName)} />
            <MetaItem label="仓库地址" value={displayOrDash(data?.address)} full />
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
              <Button type="link" className="master-breadcrumb-link" onClick={() => navigate('/master-data/warehouses')}>
                主数据
              </Button>
            ),
          },
          {
            title: (
              <Button type="link" className="master-breadcrumb-link" onClick={() => navigate('/master-data/warehouses')}>
                仓库管理
              </Button>
            ),
          },
          { title: data?.name || '详情' },
        ]}
      />

      <div className="master-summary-card">
        {query.isLoading && !data ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          <>
            <div className="master-summary-header">
              <div className="master-summary-title-wrap">
                <div className="master-summary-title">{displayOrDash(data?.name)}</div>
                {data ? (
                  <span className={`master-pill ${statusClass[data.status]}`}>{statusText[data.status]}</span>
                ) : null}
              </div>
              <div className="master-summary-actions">
                <Button onClick={() => navigate(`/master-data/warehouses/${id}/edit`)}>编辑</Button>
              </div>
            </div>
            <div className="master-summary-meta">
              <div className="master-summary-meta-item">
                <div className="master-summary-meta-label">仓库编号</div>
                <div className="master-summary-meta-value">{displayOrDash(data?.warehouseCode)}</div>
              </div>
              <div className="master-summary-meta-item">
                <div className="master-summary-meta-label">仓库类型</div>
                <div className="master-summary-meta-value">{displayOrDash(data?.warehouseType)}</div>
              </div>
              <div className="master-summary-meta-item">
                <div className="master-summary-meta-label">仓库归属</div>
                <div className="master-summary-meta-value">{displayOrDash(data?.ownership)}</div>
              </div>
              <div className="master-summary-meta-item">
                <div className="master-summary-meta-label">关联供应商</div>
                <div className="master-summary-meta-value">{displayOrDash(data?.supplierName)}</div>
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
