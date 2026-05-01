import {
  App,
  Button,
  Empty,
  Popconfirm,
  Result,
  Skeleton,
  Space,
  Table,
} from "antd";
import { PurchaseOrderStatus, type YesNo } from "@infitek/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ActivityTimeline } from "../../components/ActivityTimeline";
import {
  confirmInternalPurchaseOrder,
  confirmSupplierPurchaseOrder,
  getPurchaseOrderById,
  PURCHASE_ORDER_APPLICATION_TYPE_LABELS,
  PURCHASE_ORDER_DEMAND_TYPE_LABELS,
  PURCHASE_ORDER_RECEIPT_STATUS_LABELS,
  PURCHASE_ORDER_SETTLEMENT_DATE_TYPE_LABELS,
  PURCHASE_ORDER_SETTLEMENT_TYPE_LABELS,
  PURCHASE_ORDER_TYPE_LABELS,
  YES_NO_LABELS,
  type PurchaseOrder,
  type PurchaseOrderItem,
} from "../../api/purchase-orders.api";
import {
  AnchorNav,
  MetaItem,
  SectionCard,
  SummaryMetaItem,
  displayOrDash,
} from "../master-data/components/page-scaffold";
import "../master-data/master-page.css";

const STATUS_STYLE_MAP: Record<string, { className: string; text: string }> = {
  [PurchaseOrderStatus.PENDING_CONFIRM]: {
    className: "master-pill-default",
    text: "待确认",
  },
  [PurchaseOrderStatus.SUPPLIER_CONFIRMING]: {
    className: "master-pill-orange",
    text: "待供应商确认",
  },
  [PurchaseOrderStatus.PENDING_RECEIPT]: {
    className: "master-pill-blue",
    text: "待收货",
  },
  [PurchaseOrderStatus.PARTIALLY_RECEIVED]: {
    className: "master-pill-orange",
    text: "部分收货",
  },
  [PurchaseOrderStatus.RECEIVED]: {
    className: "master-pill-success",
    text: "全部收货",
  },
  [PurchaseOrderStatus.INVOICED]: {
    className: "master-pill-success",
    text: "已开票",
  },
  [PurchaseOrderStatus.CANCELLED]: {
    className: "master-pill-red",
    text: "已取消",
  },
};

function formatMoney(value?: string | number | null) {
  if (value == null || value === "") return "—";
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? parsed.toLocaleString("zh-CN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : String(value);
}

function formatDate(value?: string | null) {
  return value ? dayjs(value).format("YYYY-MM-DD") : "—";
}

function formatYesNo(value?: YesNo | null) {
  return value ? YES_NO_LABELS[value] : "—";
}

function formatList(values?: string[] | null) {
  return values?.length ? values.join("、") : "—";
}

function statusInfo(order?: PurchaseOrder) {
  return (
    STATUS_STYLE_MAP[order?.status ?? ""] ?? {
      className: "master-pill-default",
      text: displayOrDash(order?.status),
    }
  );
}

export default function PurchaseOrderDetailPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { id = "" } = useParams();
  const purchaseOrderId = Number(id);
  const [activeAnchor, setActiveAnchor] = useState("basic");

  const query = useQuery({
    queryKey: ["purchase-order-detail", purchaseOrderId],
    queryFn: () => getPurchaseOrderById(purchaseOrderId),
    enabled: Number.isInteger(purchaseOrderId) && purchaseOrderId > 0,
  });

  const refreshQueries = () => {
    queryClient.invalidateQueries({
      queryKey: ["purchase-order-detail", purchaseOrderId],
    });
    queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    queryClient.invalidateQueries({
      queryKey: ["operation-logs", "purchase-orders", purchaseOrderId],
    });
  };

  const confirmInternalMutation = useMutation({
    mutationFn: () => confirmInternalPurchaseOrder(purchaseOrderId),
    onSuccess: () => {
      refreshQueries();
      message.success("采购订单已内部确认");
    },
  });

  const confirmSupplierMutation = useMutation({
    mutationFn: () => confirmSupplierPurchaseOrder(purchaseOrderId),
    onSuccess: () => {
      refreshQueries();
      message.success("采购订单已供应商确认");
    },
  });

  const anchors = [
    { key: "basic", label: "基础信息" },
    { key: "settlement", label: "商务结算" },
    { key: "contract", label: "合同附件" },
    { key: "company", label: "公司主体" },
    { key: "supplier", label: "供应商" },
    { key: "receipt", label: "履约入库" },
    { key: "items", label: "采购明细" },
    { key: "relations", label: "关联单据" },
    { key: "notes", label: "备注异常" },
    { key: "operation", label: "操作记录" },
  ];

  const itemColumns = useMemo(
    () => [
      {
        title: "SKU",
        dataIndex: "skuCode",
        key: "skuCode",
        width: 140,
        fixed: "left" as const,
      },
      {
        title: "产品名称",
        dataIndex: "productNameCn",
        key: "productNameCn",
        width: 180,
        render: displayOrDash,
      },
      {
        title: "产品英文名称",
        dataIndex: "productNameEn",
        key: "productNameEn",
        width: 180,
        render: displayOrDash,
      },
      {
        title: "产品类型",
        dataIndex: "productType",
        key: "productType",
        width: 120,
        render: displayOrDash,
      },
      {
        title: "厂家型号",
        dataIndex: "manufacturerModel",
        key: "manufacturerModel",
        width: 140,
        render: displayOrDash,
      },
      {
        title: "插头类型",
        dataIndex: "plugType",
        key: "plugType",
        width: 120,
        render: displayOrDash,
      },
      {
        title: "价目表单价",
        dataIndex: "listPrice",
        key: "listPrice",
        width: 120,
        align: "right" as const,
        render: formatMoney,
      },
      {
        title: "是否开票",
        dataIndex: "isInvoiced",
        key: "isInvoiced",
        width: 100,
        render: formatYesNo,
      },
      {
        title: "采购数量",
        dataIndex: "quantity",
        key: "quantity",
        width: 100,
        align: "right" as const,
      },
      {
        title: "采购单价",
        dataIndex: "unitPrice",
        key: "unitPrice",
        width: 120,
        align: "right" as const,
        render: formatMoney,
      },
      {
        title: "单位",
        dataIndex: "unitName",
        key: "unitName",
        width: 90,
        render: displayOrDash,
      },
      {
        title: "价格合计",
        dataIndex: "amount",
        key: "amount",
        width: 120,
        align: "right" as const,
        render: formatMoney,
      },
      {
        title: "SPU",
        dataIndex: "spuName",
        key: "spuName",
        width: 140,
        render: displayOrDash,
      },
      {
        title: "电参数",
        dataIndex: "electricalParams",
        key: "electricalParams",
        width: 160,
        render: displayOrDash,
      },
      {
        title: "核心参数",
        dataIndex: "coreParams",
        key: "coreParams",
        width: 160,
        render: displayOrDash,
      },
      {
        title: "有无插头",
        dataIndex: "hasPlugText",
        key: "hasPlugText",
        width: 100,
        render: displayOrDash,
      },
      {
        title: "特殊属性备注说明",
        dataIndex: "specialAttributeNote",
        key: "specialAttributeNote",
        width: 180,
        render: displayOrDash,
      },
      {
        title: "已入库数量",
        dataIndex: "receivedQuantity",
        key: "receivedQuantity",
        width: 120,
        align: "right" as const,
      },
      {
        title: "是否已全部入库",
        dataIndex: "isFullyReceived",
        key: "isFullyReceived",
        width: 140,
        render: formatYesNo,
      },
    ],
    [],
  );

  if (!Number.isInteger(purchaseOrderId) || purchaseOrderId <= 0) {
    return (
      <Result
        status="404"
        title="采购订单不存在"
        extra={
          <Button type="primary" onClick={() => navigate("/purchase-orders")}>
            返回列表
          </Button>
        }
      />
    );
  }

  if (query.isError && !query.data) {
    return (
      <Result
        status="error"
        title="采购订单详情加载失败"
        extra={[
          <Button key="retry" type="primary" onClick={() => query.refetch()}>
            重试
          </Button>,
          <Button key="back" onClick={() => navigate("/purchase-orders")}>
            返回列表
          </Button>,
        ]}
      />
    );
  }

  const data = query.data;
  const currentStatus = statusInfo(data);
  const isActionLoading =
    confirmInternalMutation.isPending || confirmSupplierMutation.isPending;
  const canCreateReceiptOrder =
    data?.status === PurchaseOrderStatus.PENDING_RECEIPT ||
    data?.status === PurchaseOrderStatus.PARTIALLY_RECEIVED;

  return (
    <div className="master-page">
      <div className="master-summary-card">
        {query.isLoading && !data ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          <>
            <div className="master-summary-code">
              {displayOrDash(data?.poCode)}
            </div>
            <div className="master-summary-header">
              <div className="master-summary-title-wrap">
                <div className="master-summary-title-row">
                  <div className="master-summary-title">
                    {displayOrDash(data?.supplierName)}
                  </div>
                  <span className={`master-pill ${currentStatus.className}`}>
                    {currentStatus.text}
                  </span>
                </div>
              </div>
              <div className="master-summary-actions">
                <Space wrap>
                  <Button onClick={() => navigate("/purchase-orders")}>
                    返回列表
                  </Button>
                  {data?.status === PurchaseOrderStatus.PENDING_CONFIRM ? (
                    <Popconfirm
                      title="确认内部确认该采购订单？"
                      okText="确认"
                      cancelText="取消"
                      onConfirm={() => confirmInternalMutation.mutateAsync()}
                    >
                      <Button
                        type="primary"
                        loading={confirmInternalMutation.isPending}
                        disabled={isActionLoading}
                      >
                        内部确认
                      </Button>
                    </Popconfirm>
                  ) : null}
                  {data?.status === PurchaseOrderStatus.SUPPLIER_CONFIRMING ? (
                    <Popconfirm
                      title="确认供应商已确认该采购订单？"
                      okText="确认"
                      cancelText="取消"
                      onConfirm={() => confirmSupplierMutation.mutateAsync()}
                    >
                      <Button
                        type="primary"
                        loading={confirmSupplierMutation.isPending}
                        disabled={isActionLoading}
                      >
                        供应商确认
                      </Button>
                    </Popconfirm>
                  ) : null}
                  {canCreateReceiptOrder ? (
                    <Button
                      type="primary"
                      onClick={() =>
                        navigate(
                          `/receipt-orders/new?purchaseOrderId=${purchaseOrderId}`,
                        )
                      }
                    >
                      创建收货入库单
                    </Button>
                  ) : null}
                </Space>
              </div>
            </div>
            <div className="master-summary-meta">
              <SummaryMetaItem
                label="供应商编码"
                value={displayOrDash(data?.supplierCode)}
              />
              <SummaryMetaItem
                label="申请类型"
                value={
                  data?.applicationType
                    ? PURCHASE_ORDER_APPLICATION_TYPE_LABELS[
                        data.applicationType
                      ]
                    : "—"
                }
              />
              <SummaryMetaItem
                label="采购总数量"
                value={displayOrDash(data?.totalQuantity ?? 0)}
              />
              <SummaryMetaItem
                label="采购金额合计"
                value={formatMoney(data?.totalAmount)}
              />
            </div>
          </>
        )}
      </div>

      <div className="master-detail-layout">
        <AnchorNav
          anchors={anchors}
          activeKey={activeAnchor}
          onChange={setActiveAnchor}
        />

        <div className="master-detail-main">
          <SectionCard id="basic" title="基础信息">
            <div className="master-meta-grid">
              <MetaItem
                label="采购订单号"
                value={displayOrDash(data?.poCode)}
              />
              <MetaItem
                label="订单类型"
                value={
                  data?.orderType
                    ? PURCHASE_ORDER_TYPE_LABELS[data.orderType]
                    : "—"
                }
              />
              <MetaItem
                label="采购状态"
                value={
                  <span className={`master-pill ${currentStatus.className}`}>
                    {currentStatus.text}
                  </span>
                }
              />
              <MetaItem
                label="申请类型"
                value={
                  data?.applicationType
                    ? PURCHASE_ORDER_APPLICATION_TYPE_LABELS[
                        data.applicationType
                      ]
                    : "—"
                }
              />
              <MetaItem
                label="需求类型"
                value={
                  data?.demandType
                    ? PURCHASE_ORDER_DEMAND_TYPE_LABELS[data.demandType]
                    : "—"
                }
              />
              <MetaItem
                label="采购日期"
                value={formatDate(data?.purchaseDate)}
              />
              <MetaItem
                label="PO交期"
                value={formatDate(data?.poDeliveryDate)}
              />
              <MetaItem
                label="到货日期"
                value={formatDate(data?.arrivalDate)}
              />
              <MetaItem
                label="插头照片"
                value={formatList(data?.plugPhotoKeys)}
                full
              />
            </div>
          </SectionCard>

          <SectionCard id="settlement" title="商务结算">
            <div className="master-meta-grid">
              <MetaItem label="是否预付" value={formatYesNo(data?.isPrepaid)} />
              <MetaItem
                label="预付比例%"
                value={displayOrDash(data?.prepaidRatio)}
              />
              <MetaItem
                label="币种"
                value={displayOrDash(data?.currencyCode ?? data?.currencyName)}
              />
              <MetaItem
                label="结算日期类型"
                value={
                  data?.settlementDateType
                    ? PURCHASE_ORDER_SETTLEMENT_DATE_TYPE_LABELS[
                        data.settlementDateType
                      ]
                    : "—"
                }
              />
              <MetaItem
                label="结算类型"
                value={
                  data?.settlementType
                    ? PURCHASE_ORDER_SETTLEMENT_TYPE_LABELS[data.settlementType]
                    : "—"
                }
              />
              <MetaItem
                label="采购员"
                value={displayOrDash(data?.purchaserName)}
              />
              <MetaItem
                label="销售员"
                value={displayOrDash(data?.salespersonName)}
              />
              <MetaItem
                label="已付款金额"
                value={formatMoney(data?.paidAmount)}
              />
              <MetaItem
                label="是否已全部付款"
                value={formatYesNo(data?.isFullyPaid)}
              />
              <MetaItem
                label="开票完成日期"
                value={formatDate(data?.invoiceCompletedAt)}
              />
              <MetaItem
                label="付款完成日期"
                value={formatDate(data?.paymentCompletedAt)}
              />
            </div>
          </SectionCard>

          <SectionCard id="contract" title="合同附件">
            <div className="master-meta-grid">
              <MetaItem
                label="合同条款范本"
                value={displayOrDash(data?.contractTermName)}
              />
              <MetaItem
                label="合同模板ID"
                value={displayOrDash(data?.contractTemplateIdText)}
              />
              <MetaItem
                label="供应商盖章合同"
                value={formatList(data?.supplierStampedContractKeys)}
              />
              <MetaItem
                label="双方盖章合同"
                value={formatList(data?.bothStampedContractKeys)}
              />
              <MetaItem
                label="供应商合同已上传"
                value={formatYesNo(data?.supplierContractUploaded)}
              />
              <MetaItem
                label="双方盖章合同已上传"
                value={formatYesNo(data?.bothContractUploaded)}
              />
            </div>
          </SectionCard>

          <SectionCard id="company" title="公司主体">
            <div className="master-meta-grid">
              <MetaItem
                label="采购主体"
                value={displayOrDash(data?.purchaseCompanyName)}
              />
              <MetaItem
                label="公司主体中文地址"
                value={displayOrDash(data?.companyAddressCn)}
                full
              />
              <MetaItem
                label="公司主体签订地点"
                value={displayOrDash(data?.companySigningLocation)}
              />
              <MetaItem
                label="公司主体联系人"
                value={displayOrDash(data?.companyContactPerson)}
              />
              <MetaItem
                label="公司主体联系电话"
                value={displayOrDash(data?.companyContactPhone)}
              />
            </div>
          </SectionCard>

          <SectionCard id="supplier" title="供应商">
            <div className="master-meta-grid">
              <MetaItem
                label="供应商编码"
                value={displayOrDash(data?.supplierCode)}
              />
              <MetaItem
                label="供应商名称"
                value={displayOrDash(data?.supplierName)}
              />
              <MetaItem
                label="供应商名称(文本)"
                value={displayOrDash(data?.supplierNameText)}
              />
              <MetaItem
                label="供应商账期"
                value={displayOrDash(data?.supplierPaymentTermName)}
              />
              <MetaItem
                label="供应商联系人"
                value={displayOrDash(data?.supplierContactPerson)}
              />
              <MetaItem
                label="供应商联系电话"
                value={displayOrDash(data?.supplierContactPhone)}
              />
              <MetaItem
                label="供应商公司详细地址"
                value={displayOrDash(data?.supplierAddress)}
                full
              />
            </div>
          </SectionCard>

          <SectionCard id="receipt" title="履约入库">
            <div className="master-meta-grid">
              <MetaItem
                label="采购总数量"
                value={displayOrDash(data?.totalQuantity ?? 0)}
              />
              <MetaItem
                label="采购金额合计"
                value={formatMoney(data?.totalAmount)}
              />
              <MetaItem
                label="已入库总数"
                value={displayOrDash(data?.receivedTotalQuantity ?? 0)}
              />
              <MetaItem
                label="入库状态"
                value={
                  data?.receiptStatus
                    ? PURCHASE_ORDER_RECEIPT_STATUS_LABELS[data.receiptStatus]
                    : "—"
                }
              />
            </div>
          </SectionCard>

          <SectionCard id="items" title="采购产品明细">
            <Table<PurchaseOrderItem>
              rowKey="id"
              pagination={false}
              columns={itemColumns as any}
              dataSource={data?.items ?? []}
              scroll={{ x: 2300 }}
              locale={{ emptyText: <Empty description="暂无采购产品明细" /> }}
            />
          </SectionCard>

          <SectionCard
            id="relations"
            title="关联单据"
            extra={
              canCreateReceiptOrder ? (
                <Button
                  type="primary"
                  onClick={() =>
                    navigate(
                      `/receipt-orders/new?purchaseOrderId=${purchaseOrderId}`,
                    )
                  }
                >
                  创建收货入库单
                </Button>
              ) : undefined
            }
          >
            <div className="master-meta-grid">
              <MetaItem
                label="销售订单号"
                value={
                  data?.salesOrderId ? (
                    <Link to={`/sales-orders/${data.salesOrderId}`}>
                      {displayOrDash(data.salesOrderCode)}
                    </Link>
                  ) : (
                    displayOrDash(data?.salesOrderCode)
                  )
                }
              />
              <MetaItem
                label="发货需求编号"
                value={
                  data?.shippingDemandId ? (
                    <Link to={`/shipping-demands/${data.shippingDemandId}`}>
                      {displayOrDash(data.shippingDemandCode)}
                    </Link>
                  ) : (
                    displayOrDash(data?.shippingDemandCode)
                  )
                }
              />
              <MetaItem
                label="收货入库单"
                value={
                  data?.receiptOrders?.length ? (
                    <Space direction="vertical" size={4}>
                      {data.receiptOrders.map((receiptOrder) => (
                        <span key={receiptOrder.id}>
                          {receiptOrder.receiptCode} /{" "}
                          {formatDate(receiptOrder.receiptDate)} / 数量{" "}
                          {receiptOrder.totalQuantity}
                        </span>
                      ))}
                    </Space>
                  ) : (
                    "暂无收货入库记录"
                  )
                }
                full
              />
            </div>
          </SectionCard>

          <SectionCard id="notes" title="备注异常">
            <div className="master-meta-grid">
              <MetaItem
                label="采购备注"
                value={displayOrDash(data?.remark)}
                full
              />
              <MetaItem
                label="业务整改要求"
                value={displayOrDash(data?.businessRectificationRequirement)}
                full
              />
              <MetaItem
                label="商务整改要求"
                value={displayOrDash(data?.commercialRectificationRequirement)}
                full
              />
              <MetaItem
                label="表单错误信息"
                value={displayOrDash(data?.formErrorMessage)}
                full
              />
            </div>
          </SectionCard>

          <SectionCard id="operation" title="操作记录">
            <ActivityTimeline
              resourceType="purchase-orders"
              resourceId={purchaseOrderId}
            />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
