import { useState } from 'react';
import { Button, Result, Skeleton } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import type { WarehouseStatus } from '@infitek/shared';
import { ActivityTimeline } from '../../../components/ActivityTimeline';
import { getWarehouseById } from '../../../api/warehouses.api';
import { AnchorNav, MetaItem, SectionCard, SummaryMetaItem, displayOrDash } from '../components/page-scaffold';
import '../master-page.css';

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
  const [activeAnchor, setActiveAnchor] = useState('basic');

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
            <div className="master-summary-code">{displayOrDash(data?.warehouseCode)}</div>
            <div className="master-summary-header">
              <div className="master-summary-title-wrap">
                <div className="master-summary-title-row">
                  <div className="master-summary-title">{displayOrDash(data?.name)}</div>
                  {data ? <span className={`master-pill ${statusClass[data.status]}`}>{statusText[data.status]}</span> : null}
                </div>
              </div>
              <div className="master-summary-actions">
                <Button onClick={() => navigate(`/master-data/warehouses/${id}/edit`)}>编辑</Button>
              </div>
            </div>
            <div className="master-summary-meta">
              <SummaryMetaItem label="仓库编号" value={displayOrDash(data?.warehouseCode)} />
              <SummaryMetaItem label="仓库类型" value={displayOrDash(data?.warehouseType)} />
              <SummaryMetaItem label="仓库归属" value={displayOrDash(data?.ownership)} />
              <SummaryMetaItem label="关联供应商" value={displayOrDash(data?.supplierName)} />
            </div>
          </>
        )}
      </div>

      <div className="master-detail-layout">
        <AnchorNav anchors={anchors} activeKey={activeAnchor} onChange={setActiveAnchor} />
        <div className="master-detail-main">
          <SectionCard id="basic" title="基础信息" description="展示仓库主体信息、归属、发运区域与地址。">
            {query.isLoading && !data ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : (
              <div className="master-meta-grid">
                <MetaItem label="仓库名称" value={displayOrDash(data?.name)} />
                <MetaItem label="仓库编号" value={displayOrDash(data?.warehouseCode)} />
                <MetaItem label="状态" value={data ? <span className={`master-pill ${statusClass[data.status]}`}>{statusText[data.status]}</span> : '—'} />
                <MetaItem label="仓库类型" value={displayOrDash(data?.warehouseType)} />
                <MetaItem label="仓库归属" value={displayOrDash(data?.ownership)} />
                <MetaItem label="是否虚拟仓" value={data ? (data.isVirtual ? '是' : '否') : '—'} />
                <MetaItem label="默认发运省市" value={defaultShipArea} />
                <MetaItem label="关联供应商" value={displayOrDash(data?.supplierName)} />
                <MetaItem label="仓库地址" value={displayOrDash(data?.address)} full />
              </div>
            )}
          </SectionCard>

          <SectionCard id="audit" title="审计信息" description="记录仓库资料的创建与维护时间。">
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

          <SectionCard id="operation" title="操作记录" description="按时间查看仓库档案维护轨迹。">
            <ActivityTimeline resourceType="warehouses" resourceId={warehouseId} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
