import { Button, Empty, Result, Skeleton, Space, Table } from "antd";
import { ReceiptOrderStatus } from "@infitek/shared";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ActivityTimeline } from "../../components/ActivityTimeline";
import {
  getReceiptOrderById,
  RECEIPT_ORDER_STATUS_LABELS,
  RECEIPT_ORDER_TYPE_LABELS,
  type ReceiptOrderItem,
} from "../../api/receipt-orders.api";
import {
  AnchorNav,
  MetaItem,
  SectionCard,
  SummaryMetaItem,
  displayOrDash,
} from "../master-data/components/page-scaffold";
import "../master-data/master-page.css";

const STATUS_STYLE_MAP: Record<string, { className: string; text: string }> = {
  [ReceiptOrderStatus.CONFIRMED]: {
    className: "master-pill-success",
    text: "已确认",
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

function formatList(values?: string[] | null) {
  return values?.length ? values.join("、") : "—";
}

export default function ReceiptOrderDetailPage() {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const receiptOrderId = Number(id);
  const query = useQuery({
    queryKey: ["receipt-order-detail", receiptOrderId],
    queryFn: () => getReceiptOrderById(receiptOrderId),
    enabled: Number.isInteger(receiptOrderId) && receiptOrderId > 0,
  });

  const anchors = [
    { key: "basic", label: "基础信息" },
    { key: "items", label: "入库明细" },
    { key: "relations", label: "关联单据" },
    { key: "notes", label: "备注说明" },
    { key: "operation", label: "操作记录" },
  ];

  const itemColumns = [
    {
      title: "SKU",
      dataIndex: "skuCode",
      key: "skuCode",
      width: 160,
      fixed: "left" as const,
    },
    {
      title: "产品名称",
      dataIndex: "productName",
      key: "productName",
      width: 180,
      render: displayOrDash,
    },
    {
      title: "产品分类",
      dataIndex: "productCategoryName",
      key: "productCategoryName",
      width: 160,
      render: displayOrDash,
    },
    {
      title: "入库数量",
      dataIndex: "receivedQuantity",
      key: "receivedQuantity",
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
      title: "目标仓库",
      dataIndex: "warehouseName",
      key: "warehouseName",
      width: 220,
      render: displayOrDash,
    },
    {
      title: "质检图片",
      dataIndex: "qcImageKeys",
      key: "qcImageKeys",
      width: 220,
      render: (_: unknown, record: ReceiptOrderItem) =>
        formatList(record.qcImageKeys),
    },
    {
      title: "库存批次ID",
      dataIndex: "inventoryBatchId",
      key: "inventoryBatchId",
      width: 140,
      render: (_: unknown, record: ReceiptOrderItem) =>
        displayOrDash(record.inventoryBatchId),
    },
  ];

  if (!Number.isInteger(receiptOrderId) || receiptOrderId <= 0) {
    return (
      <Result
        status="404"
        title="收货入库单不存在"
        extra={
          <Button type="primary" onClick={() => navigate("/receipt-orders")}>
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
        title="收货入库单详情加载失败"
        extra={[
          <Button key="retry" type="primary" onClick={() => query.refetch()}>
            重试
          </Button>,
          <Button key="back" onClick={() => navigate("/receipt-orders")}>
            返回列表
          </Button>,
        ]}
      />
    );
  }

  const data = query.data;
  const statusInfo =
    STATUS_STYLE_MAP[data?.status ?? ""] ?? {
      className: "master-pill-default",
      text: data?.status ? RECEIPT_ORDER_STATUS_LABELS[data.status] : "—",
    };

  return (
    <div className="master-page">
      <div className="master-summary-card">
        {query.isLoading && !data ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          <>
            <div className="master-summary-code">
              {displayOrDash(data?.receiptCode)}
            </div>
            <div className="master-summary-header">
              <div className="master-summary-title-wrap">
                <div className="master-summary-title-row">
                  <div className="master-summary-title">
                    {displayOrDash(data?.warehouseName)}
                  </div>
                  <span className={`master-pill ${statusInfo.className}`}>
                    {statusInfo.text}
                  </span>
                </div>
              </div>
              <div className="master-summary-actions">
                <Space wrap>
                  <Button onClick={() => navigate("/receipt-orders")}>
                    返回列表
                  </Button>
                  {data?.purchaseOrderId ? (
                    <Button onClick={() => navigate(`/purchase-orders/${data.purchaseOrderId}`)}>
                      查看采购订单
                    </Button>
                  ) : null}
                </Space>
              </div>
            </div>
            <div className="master-summary-meta">
              <SummaryMetaItem
                label="入库类型"
                value={
                  data?.receiptType
                    ? RECEIPT_ORDER_TYPE_LABELS[data.receiptType]
                    : "—"
                }
              />
              <SummaryMetaItem
                label="入库日期"
                value={formatDate(data?.receiptDate)}
              />
              <SummaryMetaItem
                label="入库总数量"
                value={displayOrDash(data?.totalQuantity ?? 0)}
              />
              <SummaryMetaItem
                label="入库总金额"
                value={formatMoney(data?.totalAmount)}
              />
            </div>
          </>
        )}
      </div>

      <div className="master-detail-layout">
        <AnchorNav
          anchors={anchors}
          activeKey={anchors[0].key}
          onChange={() => {}}
        />
        <div className="master-detail-main">
          <SectionCard id="basic" title="基础信息">
            <div className="master-meta-grid">
              <MetaItem
                label="入库单号"
                value={displayOrDash(data?.receiptCode)}
              />
              <MetaItem
                label="入库类型"
                value={
                  data?.receiptType
                    ? RECEIPT_ORDER_TYPE_LABELS[data.receiptType]
                    : "—"
                }
              />
              <MetaItem
                label="状态"
                value={
                  <span className={`master-pill ${statusInfo.className}`}>
                    {statusInfo.text}
                  </span>
                }
              />
              <MetaItem
                label="入库仓库"
                value={displayOrDash(data?.warehouseName)}
              />
              <MetaItem
                label="入库日期"
                value={formatDate(data?.receiptDate)}
              />
              <MetaItem
                label="入库员"
                value={displayOrDash(data?.receiverName)}
              />
              <MetaItem
                label="采购主体"
                value={displayOrDash(data?.purchaseCompanyName)}
              />
              <MetaItem
                label="发货需求编号"
                value={displayOrDash(data?.shippingDemandCode)}
              />
              <MetaItem
                label="入库总数量"
                value={displayOrDash(data?.totalQuantity ?? 0)}
              />
              <MetaItem
                label="入库总金额"
                value={formatMoney(data?.totalAmount)}
              />
            </div>
          </SectionCard>

          <SectionCard id="items" title="入库明细">
            <Table<ReceiptOrderItem>
              rowKey="id"
              pagination={false}
              columns={itemColumns as never}
              dataSource={data?.items ?? []}
              scroll={{ x: 1400 }}
              locale={{ emptyText: <Empty description="暂无入库明细" /> }}
            />
          </SectionCard>

          <SectionCard id="relations" title="关联单据">
            <div className="master-meta-grid">
              <MetaItem
                label="采购订单号"
                value={
                  data?.purchaseOrderId ? (
                    <Link to={`/purchase-orders/${data.purchaseOrderId}`}>
                      {displayOrDash(data.purchaseOrderCode)}
                    </Link>
                  ) : (
                    displayOrDash(data?.purchaseOrderCode)
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
            </div>
          </SectionCard>

          <SectionCard id="notes" title="备注说明">
            <div className="master-meta-grid">
              <MetaItem
                label="库存说明"
                value={displayOrDash(data?.inventoryNote)}
                full
              />
              <MetaItem
                label="备注"
                value={displayOrDash(data?.remark)}
                full
              />
            </div>
          </SectionCard>

          <SectionCard id="operation" title="操作记录">
            <ActivityTimeline
              resourceType="receipt-orders"
              resourceId={receiptOrderId}
            />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
