import { Button, Result, Skeleton, Space, Table } from 'antd';
import { ShippingDemandStatus } from '@infitek/shared';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ActivityTimeline } from '../../components/ActivityTimeline';
import { getShippingDemandById } from '../../api/shipping-demands.api';
import {
  AnchorNav,
  MetaItem,
  SectionCard,
  SummaryMetaItem,
  displayOrDash,
} from '../master-data/components/page-scaffold';
import '../master-data/master-page.css';

const STATUS_STYLE_MAP: Record<string, { className: string; text: string }> = {
  [ShippingDemandStatus.PENDING_ALLOCATION]: { className: 'master-pill-blue', text: '待分配库存' },
  [ShippingDemandStatus.PURCHASING]: { className: 'master-pill-orange', text: '采购中' },
  [ShippingDemandStatus.PREPARED]: { className: 'master-pill-success', text: '备货完成' },
  [ShippingDemandStatus.PARTIALLY_SHIPPED]: { className: 'master-pill-orange', text: '部分发货' },
  [ShippingDemandStatus.SHIPPED]: { className: 'master-pill-success', text: '已发货' },
  [ShippingDemandStatus.VOIDED]: { className: 'master-pill-red', text: '已作废' },
};

export default function ShippingDemandDetailPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const demandId = Number(id);
  const [activeAnchor, setActiveAnchor] = useState('basic');

  const query = useQuery({
    queryKey: ['shipping-demand-detail', demandId],
    queryFn: () => getShippingDemandById(demandId),
    enabled: Number.isInteger(demandId) && demandId > 0,
  });

  const columns = useMemo(
    () => [
      { title: 'SKU', dataIndex: 'skuCode', key: 'skuCode', width: 140, fixed: 'left' as const },
      { title: '产品中文名', dataIndex: 'productNameCn', key: 'productNameCn', width: 180, render: displayOrDash },
      { title: '产品英文名', dataIndex: 'productNameEn', key: 'productNameEn', width: 180, render: displayOrDash },
      { title: '应发数量', dataIndex: 'requiredQuantity', key: 'requiredQuantity', width: 100 },
      { title: '履行类型', dataIndex: 'fulfillmentType', key: 'fulfillmentType', width: 120, render: displayOrDash },
      { title: '使用现有库存', dataIndex: 'stockRequiredQuantity', key: 'stockRequiredQuantity', width: 130 },
      { title: '需采购数量', dataIndex: 'purchaseRequiredQuantity', key: 'purchaseRequiredQuantity', width: 120 },
      { title: '已锁定待发', dataIndex: 'lockedRemainingQuantity', key: 'lockedRemainingQuantity', width: 120 },
      { title: '已发货数量', dataIndex: 'shippedQuantity', key: 'shippedQuantity', width: 120 },
      {
        title: '库存快照',
        dataIndex: 'availableStockSnapshot',
        key: 'availableStockSnapshot',
        width: 220,
        render: (value: Array<{ warehouseId: number | null; availableQuantity: number }> | null) =>
          value?.length ? (
            <Space direction="vertical" size={2}>
              {value.map((row) => (
                <span key={`${row.warehouseId ?? 'none'}-${row.availableQuantity}`}>
                  仓库 {row.warehouseId ?? '未指定'}：可用 {row.availableQuantity}
                </span>
              ))}
            </Space>
          ) : (
            '—'
          ),
      },
    ],
    [],
  );

  if (!Number.isInteger(demandId) || demandId <= 0) {
    return (
      <Result
        status="404"
        title="发货需求不存在"
        extra={<Button type="primary" onClick={() => navigate('/sales-orders')}>返回销售订单</Button>}
      />
    );
  }

  if (query.isError && !query.data) {
    return (
      <Result
        status="error"
        title="发货需求详情加载失败"
        extra={[
          <Button key="retry" type="primary" onClick={() => query.refetch()}>重试</Button>,
          <Button key="back" onClick={() => navigate('/sales-orders')}>返回销售订单</Button>,
        ]}
      />
    );
  }

  const data = query.data;
  const statusInfo = STATUS_STYLE_MAP[data?.status ?? ''] ?? {
    className: 'master-pill-default',
    text: displayOrDash(data?.status),
  };
  const anchors = [
    { key: 'basic', label: '基础信息' },
    { key: 'items', label: '产品明细' },
    { key: 'operation', label: '操作记录' },
  ];

  return (
    <div className="master-page">
      <div className="master-summary-card">
        {query.isLoading && !data ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          <>
            <div className="master-summary-code">{displayOrDash(data?.demandCode)}</div>
            <div className="master-summary-header">
              <div className="master-summary-title-wrap">
                <div className="master-summary-title-row">
                  <div className="master-summary-title">{displayOrDash(data?.sourceDocumentCode)}</div>
                  <span className={`master-pill ${statusInfo.className}`}>{statusInfo.text}</span>
                </div>
              </div>
              <div className="master-summary-actions">
                <Button onClick={() => navigate(`/sales-orders/${data?.salesOrderId}`)}>返回销售订单</Button>
              </div>
            </div>
            <div className="master-summary-meta">
              <SummaryMetaItem label="客户" value={displayOrDash(data?.customerName)} />
              <SummaryMetaItem label="客户代码" value={displayOrDash(data?.customerCode)} />
              <SummaryMetaItem label="币种" value={displayOrDash(data?.currencyCode)} />
              <SummaryMetaItem label="订单金额" value={displayOrDash(data?.totalAmount)} />
            </div>
          </>
        )}
      </div>

      <div className="master-detail-layout">
        <AnchorNav anchors={anchors} activeKey={activeAnchor} onChange={setActiveAnchor} />
        <div className="master-detail-main">
          <SectionCard id="basic" title="基础信息" description="查看发货需求来源和状态。">
            <div className="master-meta-grid">
              <MetaItem label="发货需求编号" value={displayOrDash(data?.demandCode)} />
              <MetaItem label="来源销售订单" value={displayOrDash(data?.sourceDocumentCode)} />
              <MetaItem label="状态" value={<span className={`master-pill ${statusInfo.className}`}>{statusInfo.text}</span>} />
              <MetaItem label="客户" value={displayOrDash(data?.customerName)} />
              <MetaItem label="运抵国" value={displayOrDash(data?.destinationCountryName)} />
              <MetaItem label="目的地" value={displayOrDash(data?.destinationPortName)} />
              <MetaItem label="商务跟单" value={displayOrDash(data?.merchandiserName)} />
              <MetaItem label="要求到货日期" value={data?.requiredDeliveryAt ? dayjs(data.requiredDeliveryAt).format('YYYY-MM-DD') : '—'} />
            </div>
          </SectionCard>

          <SectionCard id="items" title="产品明细" description="查看生成时继承的订单 SKU 和库存快照。" bodyClassName="master-section-table">
            <Table
              rowKey="id"
              pagination={false}
              columns={columns as any}
              dataSource={data?.items ?? []}
              scroll={{ x: 1400 }}
            />
          </SectionCard>

          <SectionCard id="operation" title="操作记录" description="展示发货需求的生成和后续处理轨迹。">
            <ActivityTimeline resourceType="shipping-demands" resourceId={demandId} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
