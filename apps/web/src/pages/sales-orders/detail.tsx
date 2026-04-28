import { App, Button, Image, Popconfirm, Result, Skeleton, Space, Table } from 'antd';
import { SalesOrderSource, ShippingDemandStatus } from '@infitek/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ActivityTimeline } from '../../components/ActivityTimeline';
import {
  approveSalesOrder,
  getSalesOrderById,
  rejectSalesOrder,
  submitSalesOrder,
  voidSalesOrder,
  type SalesOrder,
} from '../../api/sales-orders.api';
import { generateShippingDemandFromSalesOrder } from '../../api/shipping-demands.api';
import {
  AnchorNav,
  MetaItem,
  SectionCard,
  SummaryMetaItem,
  displayOrDash,
} from '../master-data/components/page-scaffold';
import '../master-data/master-page.css';

const STATUS_STYLE_MAP: Record<string, { className: string; text: string }> = {
  pending_submit: { className: 'master-pill-default', text: '待提交' },
  in_review: { className: 'master-pill-orange', text: '审核中' },
  approved: { className: 'master-pill-blue', text: '审核通过' },
  rejected: { className: 'master-pill-red', text: '已驳回' },
  preparing: { className: 'master-pill-blue', text: '备货中' },
  prepared: { className: 'master-pill-success', text: '备货完成' },
  partially_shipped: { className: 'master-pill-orange', text: '部分发货' },
  shipped: { className: 'master-pill-success', text: '已发货' },
  voided: { className: 'master-pill-red', text: '已作废' },
};

const SHIPPING_DEMAND_STATUS_STYLE_MAP: Record<string, { className: string; text: string }> = {
  [ShippingDemandStatus.PENDING_ALLOCATION]: { className: 'master-pill-blue', text: '待分配库存' },
  [ShippingDemandStatus.PURCHASING]: { className: 'master-pill-orange', text: '采购中' },
  [ShippingDemandStatus.PREPARED]: { className: 'master-pill-success', text: '备货完成' },
  [ShippingDemandStatus.PARTIALLY_SHIPPED]: { className: 'master-pill-orange', text: '部分发货' },
  [ShippingDemandStatus.SHIPPED]: { className: 'master-pill-success', text: '已发货' },
  [ShippingDemandStatus.VOIDED]: { className: 'master-pill-red', text: '已作废' },
};

const ORDER_SOURCE_LABELS: Record<string, string> = {
  [SalesOrderSource.MANUAL]: '手工录单',
  [SalesOrderSource.THIRD_PARTY]: '第三方获取',
};

export default function SalesOrderDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { message, notification } = App.useApp();
  const { id = '' } = useParams();
  const salesOrderId = Number(id);
  const [activeAnchor, setActiveAnchor] = useState('basic');

  const query = useQuery({
    queryKey: ['sales-order-detail', salesOrderId],
    queryFn: () => getSalesOrderById(salesOrderId),
    enabled: Number.isInteger(salesOrderId) && salesOrderId > 0,
  });

  const makeStatusMutation = (
    mutationFn: (id: number) => Promise<SalesOrder>,
    successMessage: string,
  ) =>
    useMutation({
      mutationFn: () => mutationFn(salesOrderId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['sales-order-detail', salesOrderId] });
        queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
        message.success(successMessage);
      },
    });

  const submitMutation = makeStatusMutation(submitSalesOrder, '订单已提交审核');
  const approveMutation = makeStatusMutation(approveSalesOrder, '订单已审核通过');
  const rejectMutation = makeStatusMutation(rejectSalesOrder, '订单已驳回');
  const voidMutation = makeStatusMutation(voidSalesOrder, '订单已作废');
  const generateShippingDemandMutation = useMutation({
    mutationFn: () => generateShippingDemandFromSalesOrder(salesOrderId),
    onSuccess: (demand) => {
      queryClient.invalidateQueries({ queryKey: ['sales-order-detail', salesOrderId] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['shipping-demands'] });
      notification.success({
        message: '发货需求已生成',
        description: (
          <span>
          发货需求已生成：
          <a onClick={() => navigate(`/shipping-demands/${demand.id}`)}>{demand.demandCode}</a>
          </span>
        ),
        duration: 5,
      });
    },
  });

  const anchors = [
    { key: 'basic', label: '基础信息' },
    { key: 'order', label: '订单信息' },
    { key: 'items', label: '产品明细' },
    { key: 'expense', label: '加项费用' },
    { key: 'delivery', label: '收发通信息' },
    ...(query.data?.domesticTradeType === 'domestic'
      ? [{ key: 'domestic', label: '内销收货信息' }]
      : []),
    { key: 'shipping', label: '发货要求' },
    { key: 'relations', label: '关联单据' },
    { key: 'operation', label: '操作记录' },
  ];

  const statusInfo = STATUS_STYLE_MAP[query.data?.status ?? ''] ?? {
    className: 'master-pill-default',
    text: displayOrDash(query.data?.status),
  };

  const itemColumns = useMemo(
    () => [
      { title: 'SKU', dataIndex: 'skuCode', key: 'skuCode', width: 140, fixed: 'left' as const },
      { title: '产品中文名', dataIndex: 'productNameCn', key: 'productNameCn', width: 180, render: displayOrDash },
      { title: '产品英文名', dataIndex: 'productNameEn', key: 'productNameEn', width: 180, render: displayOrDash },
      { title: '规格', dataIndex: 'skuSpecification', key: 'skuSpecification', width: 180, render: displayOrDash },
      { title: '类型', dataIndex: 'lineType', key: 'lineType', width: 100, render: displayOrDash },
      { title: 'SPU', dataIndex: 'spuName', key: 'spuName', width: 140, render: displayOrDash },
      { title: '电参数', dataIndex: 'electricalParams', key: 'electricalParams', width: 160, render: displayOrDash },
      { title: '有无插头', dataIndex: 'hasPlug', key: 'hasPlug', width: 100, render: displayOrDash },
      { title: '插头类型', dataIndex: 'plugType', key: 'plugType', width: 100, render: displayOrDash },
      { title: '签约数量', dataIndex: 'quantity', key: 'quantity', width: 100 },
      { title: '销售单价', dataIndex: 'unitPrice', key: 'unitPrice', width: 120 },
      { title: '币种', dataIndex: 'currencyCode', key: 'currencyCode', width: 90, render: displayOrDash },
      { title: '总金额', dataIndex: 'amount', key: 'amount', width: 120 },
      { title: '单位', dataIndex: 'unitName', key: 'unitName', width: 100, render: displayOrDash },
      { title: '采购人员', dataIndex: 'purchaserName', key: 'purchaserName', width: 120, render: displayOrDash },
      { title: '是否需要采购', dataIndex: 'needsPurchase', key: 'needsPurchase', width: 120, render: displayOrDash },
      { title: '需采购数量', dataIndex: 'purchaseQuantity', key: 'purchaseQuantity', width: 120 },
      { title: '使用现有库存数量', dataIndex: 'useStockQuantity', key: 'useStockQuantity', width: 150 },
      { title: '已备货数量', dataIndex: 'preparedQuantity', key: 'preparedQuantity', width: 120 },
      { title: '已发货数量', dataIndex: 'shippedQuantity', key: 'shippedQuantity', width: 120 },
      { title: '产品材质', dataIndex: 'material', key: 'material', width: 120, render: displayOrDash },
      { title: '单品重量(kg)', dataIndex: 'unitWeightKg', key: 'unitWeightKg', width: 120 },
      { title: '单品体积(m³)', dataIndex: 'unitVolumeCbm', key: 'unitVolumeCbm', width: 130 },
      { title: '总重量(kg)', dataIndex: 'totalWeightKg', key: 'totalWeightKg', width: 120 },
      { title: '总体积(m³)', dataIndex: 'totalVolumeCbm', key: 'totalVolumeCbm', width: 120 },
      { title: '图片', dataIndex: 'imageUrl', key: 'imageUrl', width: 100, render: (value: string | null) => value ? <Image width={40} src={value} /> : '—' },
    ],
    [],
  );

  const expenseColumns = useMemo(
    () => [
      { title: '费用名称', dataIndex: 'expenseName', key: 'expenseName' },
      { title: '金额', dataIndex: 'amount', key: 'amount', width: 120 },
    ],
    [],
  );

  if (!Number.isInteger(salesOrderId) || salesOrderId <= 0) {
    return (
      <Result
        status="404"
        title="销售订单不存在"
        extra={<Button type="primary" onClick={() => navigate('/sales-orders')}>返回列表</Button>}
      />
    );
  }

  if (query.isError && !query.data) {
    return (
      <Result
        status="error"
        title="销售订单详情加载失败"
        extra={[
          <Button key="retry" type="primary" onClick={() => query.refetch()}>重试</Button>,
          <Button key="back" onClick={() => navigate('/sales-orders')}>返回列表</Button>,
        ]}
      />
    );
  }

  const data = query.data;
  const relatedShippingDemands = (data?.shippingDemands ?? []).filter(
    (item) => item.status !== 'voided',
  );
  const canGenerateShippingDemand =
    data?.status === 'approved' && relatedShippingDemands.length === 0;
  const isActionLoading =
    submitMutation.isPending ||
    approveMutation.isPending ||
    rejectMutation.isPending ||
    voidMutation.isPending ||
    generateShippingDemandMutation.isPending;

  return (
    <div className="master-page">
      <div className="master-summary-card">
        {query.isLoading && !data ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          <>
            <div className="master-summary-code">{displayOrDash(data?.erpSalesOrderCode)}</div>
            <div className="master-summary-header">
              <div className="master-summary-title-wrap">
                <div className="master-summary-title-row">
                  <div className="master-summary-title">{displayOrDash(data?.externalOrderCode)}</div>
                  <span className={`master-pill ${statusInfo.className}`}>{statusInfo.text}</span>
                </div>
              </div>
              <div className="master-summary-actions">
                <Space wrap>
                  <Button onClick={() => navigate('/sales-orders')}>返回列表</Button>
                  {['pending_submit', 'rejected'].includes(data?.status ?? '') ? (
                    <Popconfirm
                      title="确认提交审核？"
                      description="本阶段只实现状态流转，不做真实审批权限。"
                      okText="确认"
                      cancelText="取消"
                      onConfirm={() => submitMutation.mutateAsync()}
                    >
                      <Button type="primary" loading={submitMutation.isPending} disabled={isActionLoading}>
                        提交审核
                      </Button>
                    </Popconfirm>
                  ) : null}
                  {data?.status === 'in_review' ? (
                    <>
                      <Popconfirm
                        title="确认审核通过？"
                        description="本阶段只实现状态流转，不做真实审批权限。"
                        okText="确认"
                        cancelText="取消"
                        onConfirm={() => approveMutation.mutateAsync()}
                      >
                        <Button type="primary" loading={approveMutation.isPending} disabled={isActionLoading}>
                          审核通过
                        </Button>
                      </Popconfirm>
                      <Popconfirm
                        title="确认驳回该订单？"
                        description="本阶段只实现状态流转，不做真实审批权限。"
                        okText="确认"
                        cancelText="取消"
                        onConfirm={() => rejectMutation.mutateAsync()}
                      >
                        <Button danger loading={rejectMutation.isPending} disabled={isActionLoading}>
                          驳回
                        </Button>
                      </Popconfirm>
                    </>
                  ) : null}
                  {['pending_submit', 'in_review', 'rejected', 'approved'].includes(data?.status ?? '') ? (
                    <Popconfirm
                      title="确认作废该订单？"
                      description="本阶段只实现状态流转，不做真实审批权限。"
                      okText="确认"
                      cancelText="取消"
                      onConfirm={() => voidMutation.mutateAsync()}
                    >
                      <Button danger loading={voidMutation.isPending} disabled={isActionLoading}>
                        作废
                      </Button>
                    </Popconfirm>
                  ) : null}
                  {canGenerateShippingDemand ? (
                    <Popconfirm
                      title="确认为此订单生成发货需求？"
                      description="系统将复制订单产品明细和应发数量，并查询当前库存快照。"
                      okText="确认生成"
                      cancelText="取消"
                      onConfirm={() => generateShippingDemandMutation.mutateAsync()}
                    >
                      <Button
                        type="primary"
                        loading={generateShippingDemandMutation.isPending}
                        disabled={isActionLoading}
                      >
                        生成发货需求
                      </Button>
                    </Popconfirm>
                  ) : null}
                  <Button type="primary" ghost onClick={() => navigate('/sales-orders/create')}>新建销售订单</Button>
                </Space>
              </div>
            </div>
            <div className="master-summary-meta">
              <SummaryMetaItem label="客户" value={displayOrDash(data?.customerName)} />
              <SummaryMetaItem label="客户代码" value={displayOrDash(data?.customerCode)} />
              <SummaryMetaItem label="币种" value={displayOrDash(data?.currencyCode)} />
              <SummaryMetaItem label="总金额" value={displayOrDash(data?.totalAmount)} />
            </div>
          </>
        )}
      </div>

      <div className="master-detail-layout">
        <AnchorNav anchors={anchors} activeKey={activeAnchor} onChange={setActiveAnchor} />

        <div className="master-detail-main">
          <SectionCard id="basic" title="基础信息" description="查看销售订单的主键信息与客户归属。">
            {query.isLoading && !data ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : (
              <div className="master-meta-grid">
                <MetaItem label="ERP销售订单号" value={displayOrDash(data?.erpSalesOrderCode)} />
                <MetaItem label="订单来源" value={data?.orderSource ? ORDER_SOURCE_LABELS[data.orderSource] ?? data.orderSource : '—'} />
                <MetaItem label="内外销" value={displayOrDash(data?.domesticTradeType)} />
                <MetaItem label="订单号" value={displayOrDash(data?.externalOrderCode)} />
                <MetaItem label="订单类型" value={displayOrDash(data?.orderType)} />
                <MetaItem label="客户" value={displayOrDash(data?.customerName)} />
                <MetaItem label="客户代码" value={displayOrDash(data?.customerCode)} />
                <MetaItem label="联系人" value={displayOrDash(data?.customerContactPerson)} />
                <MetaItem label="售后原订单号" value={displayOrDash(data?.afterSalesSourceOrderCode)} />
                <MetaItem label="运抵国" value={displayOrDash(data?.destinationCountryName)} />
                <MetaItem label="付款方式" value={displayOrDash(data?.paymentTerm)} />
                <MetaItem label="起运地" value={displayOrDash(data?.shipmentOriginCountryName)} />
                <MetaItem label="签约公司" value={displayOrDash(data?.signingCompanyName)} />
                <MetaItem label="销售员" value={displayOrDash(data?.salespersonName)} />
                <MetaItem label="外销币种" value={displayOrDash(data?.currencyCode)} />
                <MetaItem label="目的地" value={displayOrDash(data?.destinationPortName)} />
                <MetaItem label="合同金额" value={displayOrDash(data?.contractAmount)} />
                <MetaItem label="已收款金额" value={displayOrDash(data?.receivedAmount)} />
                <MetaItem label="待收款金额" value={displayOrDash(data?.outstandingAmount)} />
                <MetaItem label="商务跟单" value={displayOrDash(data?.merchandiserName)} />
                <MetaItem label="商务跟单英文简写" value={displayOrDash(data?.merchandiserAbbr)} />
                <MetaItem label="所有售后产品品名及对应总价" value={displayOrDash(data?.afterSalesProductSummary)} full />
              </div>
            )}
          </SectionCard>

          <SectionCard id="order" title="订单信息" description="查看交付、收款和订单附加属性。">
            <div className="master-meta-grid">
              <MetaItem label="要求到货日期" value={data?.requiredDeliveryAt ? dayjs(data.requiredDeliveryAt).format('YYYY-MM-DD') : '—'} />
              <MetaItem label="是否分摊订单" value={displayOrDash(data?.isSharedOrder)} />
              <MetaItem label="是否中信保" value={displayOrDash(data?.isSinosure)} />
              <MetaItem label="是否打托" value={displayOrDash(data?.isPalletized)} />
              <MetaItem label="是否需要清关证书" value={displayOrDash(data?.requiresCustomsCertificate)} />
              <MetaItem label="是否提前分单" value={displayOrDash(data?.isSplitInAdvance)} />
              <MetaItem label="是否使用市场经费" value={displayOrDash(data?.usesMarketingFund)} />
              <MetaItem label="是否出口报关" value={displayOrDash(data?.requiresExportCustoms)} />
              <MetaItem label="是否需要质保卡" value={displayOrDash(data?.requiresWarrantyCard)} />
              <MetaItem label="是否产假交接单" value={displayOrDash(data?.requiresMaternityHandover)} />
              <MetaItem label="报关方式" value={displayOrDash(data?.customsDeclarationMethod)} />
              <MetaItem label="是否投保" value={displayOrDash(data?.isInsured)} />
              <MetaItem label="是否阿里信保订单" value={displayOrDash(data?.isAliTradeAssurance)} />
              <MetaItem label="阿里信保订单号" value={displayOrDash(data?.aliTradeAssuranceOrderCode)} />
              <MetaItem label="收款状态" value={displayOrDash(data?.receiptStatus)} />
              <MetaItem label="产品合计金额" value={displayOrDash(data?.productTotalAmount)} />
              <MetaItem label="加项费用合计" value={displayOrDash(data?.expenseTotalAmount)} />
              <MetaItem label="订单总金额" value={displayOrDash(data?.totalAmount)} />
              <MetaItem label="贸易术语" value={displayOrDash(data?.tradeTerm)} />
              <MetaItem label="运输方式" value={displayOrDash(data?.transportationMethod)} />
              <MetaItem label="一级行业" value={displayOrDash(data?.primaryIndustry)} />
              <MetaItem label="二级行业" value={displayOrDash(data?.secondaryIndustry)} />
              <MetaItem label="订单性质" value={displayOrDash(data?.orderNature)} />
              <MetaItem label="汇率" value={displayOrDash(data?.exchangeRate)} />
              <MetaItem label="CRM签约日期" value={data?.crmSignedAt ? dayjs(data.crmSignedAt).format('YYYY-MM-DD') : '—'} />
              <MetaItem label="银行账号" value={displayOrDash(data?.bankAccount)} />
              <MetaItem label="额外查看人" value={displayOrDash(data?.extraViewerName)} />
              <MetaItem label="其他行业说明" value={displayOrDash(data?.otherIndustryNote)} full />
              <MetaItem label="询价货代及费用" value={displayOrDash(data?.forwarderQuoteNote)} full />
              <MetaItem label="合同文件" value={data?.contractFileUrls?.length ? data.contractFileUrls.map((url, idx) => <div key={url}><a href={url} target="_blank" rel="noreferrer">{data.contractFileNames?.[idx] ?? `文件${idx + 1}`}</a></div>) : '—'} full />
              <MetaItem label="插头照片" value={data?.plugPhotoUrls?.length ? <Space wrap>{data.plugPhotoUrls.map((url) => <Image key={url} width={80} src={url} />)}</Space> : '—'} full />
            </div>
          </SectionCard>

          <SectionCard id="items" title="产品明细" description="查看 SKU 行项和数量金额信息。" bodyClassName="master-section-table">
            <Table
              rowKey="id"
              pagination={false}
              columns={itemColumns as any}
              dataSource={data?.items ?? []}
              scroll={{ x: 3300 }}
            />
          </SectionCard>

          <SectionCard id="expense" title="加项费用" description="查看附加费用明细。" bodyClassName="master-section-table">
            <Table
              rowKey="id"
              pagination={false}
              columns={expenseColumns as any}
              dataSource={data?.expenses ?? []}
            />
          </SectionCard>

          <SectionCard id="delivery" title="收发通信息" description="收货人、通知人和发货人信息。">
            <div className="master-meta-grid">
              <MetaItem label="收货人公司(Consignee)" value={displayOrDash(data?.consigneeCompany)} full />
              <MetaItem label="收货人其他信息" value={displayOrDash(data?.consigneeOtherInfo)} full />
              <MetaItem label="通知人公司(Notify)" value={displayOrDash(data?.notifyCompany)} full />
              <MetaItem label="通知人其他信息" value={displayOrDash(data?.notifyOtherInfo)} full />
              <MetaItem label="发货人公司(Shipper)" value={displayOrDash(data?.shipperCompany)} full />
              <MetaItem label="发货人其他信息" value={displayOrDash(data?.shipperOtherInfoCompanyName)} />
            </div>
          </SectionCard>

          {data?.domesticTradeType === 'domestic' ? (
            <SectionCard id="domestic" title="内销收货信息" description="内销订单的客户收货信息。">
              <div className="master-meta-grid">
                <MetaItem label="客户公司" value={displayOrDash(data?.domesticCustomerCompany)} full />
                <MetaItem
                  label="客户收货信息"
                  value={displayOrDash(data?.domesticCustomerDeliveryInfo)}
                  full
                />
              </div>
            </SectionCard>
          ) : null}

          <SectionCard id="shipping" title="发货要求" description="查看唛头、发票与清关要求。">
            <div className="master-meta-grid">
              <MetaItem label="是否公司常规唛头" value={displayOrDash(data?.usesDefaultShippingMark)} />
              <MetaItem label="唛头补充信息" value={displayOrDash(data?.shippingMarkNote)} />
              <MetaItem
                label="唛头模板"
                value={
                  data?.shippingMarkTemplateUrl ? (
                    <a href={data.shippingMarkTemplateUrl} target="_blank" rel="noreferrer">
                      {data.shippingMarkTemplateKey?.split('/').pop() ?? '查看模板'}
                    </a>
                  ) : (
                    displayOrDash(data?.shippingMarkTemplateKey)
                  )
                }
              />
              <MetaItem label="客户是否需要开票" value={displayOrDash(data?.needsInvoice)} />
              <MetaItem label="开票类型" value={displayOrDash(data?.invoiceType)} />
              <MetaItem label="随货文件" value={displayOrDash(data?.shippingDocumentsNote)} />
              <MetaItem label="签单/出提单方式" value={displayOrDash(data?.blType)} />
              <MetaItem label="正本邮寄地址" value={displayOrDash(data?.originalMailAddress)} full />
              <MetaItem label="业务整改要求" value={displayOrDash(data?.businessRectificationNote)} full />
              <MetaItem label="清关单据要求" value={displayOrDash(data?.customsDocumentNote)} full />
              <MetaItem label="其他要求及注意事项" value={displayOrDash(data?.otherRequirementNote)} full />
            </div>
          </SectionCard>

          <SectionCard id="relations" title="关联单据" description="查看由此销售订单生成的下游单据。">
            <div className="master-meta-grid">
              <MetaItem
                label="发货需求"
                value={
                  relatedShippingDemands.length ? (
                    <Space direction="vertical" size={4}>
                      {relatedShippingDemands.map((demand) => (
                        <a key={demand.id} onClick={() => navigate(`/shipping-demands/${demand.id}`)}>
                          {demand.demandCode}
                        </a>
                      ))}
                    </Space>
                  ) : (
                    '—'
                  )
                }
              />
              <MetaItem
                label="发货需求状态"
                value={
                  relatedShippingDemands.length ? (
                    <Space direction="vertical" size={4}>
                      {relatedShippingDemands.map((demand) => {
                        const info = SHIPPING_DEMAND_STATUS_STYLE_MAP[demand.status] ?? {
                          className: 'master-pill-default',
                          text: demand.status,
                        };
                        return (
                          <span key={demand.id} className={`master-pill ${info.className}`}>
                            {info.text}
                          </span>
                        );
                      })}
                    </Space>
                  ) : (
                    '—'
                  )
                }
              />
              <MetaItem
                label="生成时间"
                value={
                  relatedShippingDemands.length ? (
                    <Space direction="vertical" size={4}>
                      {relatedShippingDemands.map((demand) => (
                        <span key={demand.id}>
                          {dayjs(demand.createdAt).format('YYYY-MM-DD HH:mm')}
                        </span>
                      ))}
                    </Space>
                  ) : (
                    '—'
                  )
                }
              />
            </div>
          </SectionCard>

          <SectionCard id="operation" title="操作记录" description="展示销售订单的状态流转与维护轨迹。">
            <ActivityTimeline resourceType="sales-orders" resourceId={salesOrderId} />
          </SectionCard>
        </div>
      </div>

    </div>
  );
}
