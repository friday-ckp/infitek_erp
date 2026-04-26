import { Button, Image, Popconfirm, Result, Skeleton, Space, Table, message } from 'antd';
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

export default function SalesOrderDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id = '' } = useParams();
  const salesOrderId = Number(id);
  const [activeAnchor, setActiveAnchor] = useState('basic');
  const [pendingAction, setPendingAction] = useState<'submit' | 'approve' | 'reject' | 'void' | null>(null);

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
        setPendingAction(null);
      },
      onError: () => {
        setPendingAction(null);
      },
    });

  const submitMutation = makeStatusMutation(submitSalesOrder, '订单已提交审核');
  const approveMutation = makeStatusMutation(approveSalesOrder, '订单已审核通过');
  const rejectMutation = makeStatusMutation(rejectSalesOrder, '订单已驳回');
  const voidMutation = makeStatusMutation(voidSalesOrder, '订单已作废');

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
    { key: 'audit', label: '审计信息' },
    { key: 'operation', label: '操作记录' },
  ];

  const statusInfo = STATUS_STYLE_MAP[query.data?.status ?? ''] ?? {
    className: 'master-pill-default',
    text: displayOrDash(query.data?.status),
  };

  const itemColumns = useMemo(
    () => [
      { title: 'SKU', dataIndex: 'skuCode', key: 'skuCode', width: 140 },
      { title: '产品中文名', dataIndex: 'productNameCn', key: 'productNameCn', width: 180 },
      { title: '产品英文名', dataIndex: 'productNameEn', key: 'productNameEn', width: 180 },
      { title: '类型', dataIndex: 'lineType', key: 'lineType', width: 100, render: displayOrDash },
      { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 100 },
      { title: '单价', dataIndex: 'unitPrice', key: 'unitPrice', width: 120 },
      { title: '金额', dataIndex: 'amount', key: 'amount', width: 120 },
      { title: '单位', dataIndex: 'unitName', key: 'unitName', width: 100, render: displayOrDash },
      { title: '采购人员', dataIndex: 'purchaserName', key: 'purchaserName', width: 120, render: displayOrDash },
      { title: '是否采购', dataIndex: 'needsPurchase', key: 'needsPurchase', width: 100, render: displayOrDash },
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
        extra={<Button type="primary" onClick={() => navigate('/sales-orders/create')}>新建销售订单</Button>}
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
          <Button key="back" onClick={() => navigate('/sales-orders/create')}>返回创建页</Button>,
        ]}
      />
    );
  }

  const data = query.data;
  const actionHandlers = {
    submit: () => submitMutation.mutateAsync(),
    approve: () => approveMutation.mutateAsync(),
    reject: () => rejectMutation.mutateAsync(),
    void: () => voidMutation.mutateAsync(),
  };

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
                  {data?.status === 'pending_submit' ? (
                    <Button type="primary" onClick={() => setPendingAction('submit')}>提交审核</Button>
                  ) : null}
                  {data?.status === 'in_review' ? (
                    <>
                      <Button type="primary" onClick={() => setPendingAction('approve')}>审核通过</Button>
                      <Button danger onClick={() => setPendingAction('reject')}>驳回</Button>
                    </>
                  ) : null}
                  {['pending_submit', 'in_review', 'rejected', 'approved'].includes(data?.status ?? '') ? (
                    <Button danger onClick={() => setPendingAction('void')}>作废</Button>
                  ) : null}
                  <Button onClick={() => navigate('/sales-orders/create')}>再建一单</Button>
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
                <MetaItem label="内外销" value={displayOrDash(data?.domesticTradeType)} />
                <MetaItem label="订单号" value={displayOrDash(data?.externalOrderCode)} />
                <MetaItem label="订单类型" value={displayOrDash(data?.orderType)} />
                <MetaItem label="客户" value={displayOrDash(data?.customerName)} />
                <MetaItem label="客户代码" value={displayOrDash(data?.customerCode)} />
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
              scroll={{ x: 1600 }}
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

          <SectionCard id="audit" title="审计信息" description="查看创建与更新时间。">
            <div className="master-meta-grid">
              <MetaItem label="创建时间" value={data?.createdAt ? dayjs(data.createdAt).format('YYYY-MM-DD HH:mm') : '—'} />
              <MetaItem label="更新时间" value={data?.updatedAt ? dayjs(data.updatedAt).format('YYYY-MM-DD HH:mm') : '—'} />
              <MetaItem label="创建人" value={displayOrDash(data?.createdBy)} />
              <MetaItem label="更新人" value={displayOrDash(data?.updatedBy)} />
            </div>
          </SectionCard>

          <SectionCard id="operation" title="操作记录" description="展示销售订单的状态流转与维护轨迹。">
            <ActivityTimeline resourceType="sales-orders" resourceId={salesOrderId} />
          </SectionCard>
        </div>
      </div>

      <Popconfirm
        title={
          pendingAction === 'submit'
            ? '确认提交审核？'
            : pendingAction === 'approve'
              ? '确认审核通过？'
              : pendingAction === 'reject'
                ? '确认驳回该订单？'
                : '确认作废该订单？'
        }
        description="本阶段只实现状态流转，不做真实审批权限。"
        open={Boolean(pendingAction)}
        okText="确认"
        cancelText="取消"
        onCancel={() => setPendingAction(null)}
        onConfirm={async () => {
          if (pendingAction) {
            await actionHandlers[pendingAction]();
          }
        }}
      >
        <span />
      </Popconfirm>
    </div>
  );
}
