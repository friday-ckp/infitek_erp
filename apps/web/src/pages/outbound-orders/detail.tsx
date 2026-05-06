import { Button, Empty, Result, Skeleton, Space, Table } from "antd";
import { OutboundOrderStatus } from "@infitek/shared";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ActivityTimeline } from "../../components/ActivityTimeline";
import {
  getOutboundOrderById,
  OUTBOUND_ORDER_STATUS_LABELS,
  OUTBOUND_ORDER_TYPE_LABELS,
  type OutboundOrderItem,
} from "../../api/outbound-orders.api";
import {
  AnchorNav,
  MetaItem,
  SectionCard,
  SummaryMetaItem,
  displayOrDash,
} from "../master-data/components/page-scaffold";
import "../master-data/master-page.css";

const STATUS_STYLE_MAP: Record<string, { className: string; text: string }> = {
  [OutboundOrderStatus.CONFIRMED]: {
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

export default function OutboundOrderDetailPage() {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const outboundOrderId = Number(id);
  const [activeAnchor, setActiveAnchor] = useState("basic");
  const query = useQuery({
    queryKey: ["outbound-order-detail", outboundOrderId],
    queryFn: () => getOutboundOrderById(outboundOrderId),
    enabled: Number.isInteger(outboundOrderId) && outboundOrderId > 0,
  });

  const anchors = [
    { key: "basic", label: "基础信息" },
    { key: "items", label: "出库明细" },
    { key: "relations", label: "关联单据" },
    { key: "remark", label: "备注" },
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
      key: "productName",
      width: 220,
      render: (_: unknown, record: OutboundOrderItem) =>
        displayOrDash(record.productNameCn ?? record.productNameEn),
    },
    {
      title: "单位",
      dataIndex: "unitName",
      key: "unitName",
      width: 100,
      render: displayOrDash,
    },
    {
      title: "计划数量",
      dataIndex: "plannedQuantity",
      key: "plannedQuantity",
      width: 100,
      align: "right" as const,
    },
    {
      title: "出库前累计已出",
      dataIndex: "previousOutboundQuantity",
      key: "previousOutboundQuantity",
      width: 140,
      align: "right" as const,
    },
    {
      title: "本次出库数量",
      dataIndex: "outboundQuantity",
      key: "outboundQuantity",
      width: 120,
      align: "right" as const,
    },
    {
      title: "出库仓库",
      dataIndex: "warehouseName",
      key: "warehouseName",
      width: 220,
      render: displayOrDash,
    },
  ];

  if (!Number.isInteger(outboundOrderId) || outboundOrderId <= 0) {
    return (
      <Result
        status="404"
        title="发货出库单不存在"
        extra={
          <Button type="primary" onClick={() => navigate("/outbound-orders")}>
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
        title="发货出库单详情加载失败"
        extra={[
          <Button key="retry" type="primary" onClick={() => query.refetch()}>
            重试
          </Button>,
          <Button key="back" onClick={() => navigate("/outbound-orders")}>
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
      text: data?.status ? OUTBOUND_ORDER_STATUS_LABELS[data.status] : "—",
    };
  const totalOutboundQuantity = (data?.items ?? []).reduce(
    (sum, item) => sum + Number(item.outboundQuantity ?? 0),
    0,
  );

  return (
    <div className="master-page">
      <div className="master-summary-card">
        {query.isLoading && !data ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          <>
            <div className="master-summary-code">
              {displayOrDash(data?.outboundCode)}
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
                  <Button onClick={() => navigate("/outbound-orders")}>
                    返回列表
                  </Button>
                  {data?.logisticsOrderId ? (
                    <Button
                      onClick={() =>
                        navigate(`/logistics-orders/${data.logisticsOrderId}`)
                      }
                    >
                      查看物流单
                    </Button>
                  ) : null}
                  {data?.shippingDemandId ? (
                    <Button
                      onClick={() =>
                        navigate(`/shipping-demands/${data.shippingDemandId}`)
                      }
                    >
                      查看发货需求
                    </Button>
                  ) : null}
                </Space>
              </div>
            </div>
            <div className="master-summary-meta">
              <SummaryMetaItem
                label="出库类型"
                value={
                  data?.outboundType
                    ? OUTBOUND_ORDER_TYPE_LABELS[data.outboundType]
                    : "—"
                }
              />
              <SummaryMetaItem
                label="出库日期"
                value={formatDate(data?.outboundDate)}
              />
              <SummaryMetaItem
                label="本次出库总数量"
                value={displayOrDash(totalOutboundQuantity)}
              />
              <SummaryMetaItem
                label="出库员"
                value={displayOrDash(data?.outboundUserName)}
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
                label="出库单号"
                value={displayOrDash(data?.outboundCode)}
              />
              <MetaItem
                label="出库类型"
                value={
                  data?.outboundType
                    ? OUTBOUND_ORDER_TYPE_LABELS[data.outboundType]
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
                label="出库仓库"
                value={displayOrDash(data?.warehouseName)}
              />
              <MetaItem
                label="出库日期"
                value={formatDate(data?.outboundDate)}
              />
              <MetaItem
                label="出库员"
                value={displayOrDash(data?.outboundUserName)}
              />
              <MetaItem
                label="销售主体"
                value={displayOrDash(data?.salesCompanyName)}
              />
              <MetaItem
                label="销售总金额"
                value={formatMoney(data?.salesTotalAmount)}
              />
              <MetaItem
                label="成本总金额"
                value={formatMoney(data?.costTotalAmount)}
              />
              <MetaItem
                label="创建时间"
                value={formatDate(data?.createdAt)}
              />
            </div>
          </SectionCard>

          <SectionCard id="items" title="出库明细">
            <Table<OutboundOrderItem>
              rowKey="id"
              pagination={false}
              columns={itemColumns as never}
              dataSource={data?.items ?? []}
              scroll={{ x: 1200 }}
              locale={{ emptyText: <Empty description="暂无出库明细" /> }}
            />
          </SectionCard>

          <SectionCard id="relations" title="关联单据">
            <div className="master-meta-grid">
              <MetaItem
                label="物流单号"
                value={
                  data?.logisticsOrderId ? (
                    <Link to={`/logistics-orders/${data.logisticsOrderId}`}>
                      {displayOrDash(data.logisticsOrderCode)}
                    </Link>
                  ) : (
                    displayOrDash(data?.logisticsOrderCode)
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
            </div>
          </SectionCard>

          <SectionCard id="remark" title="备注">
            <div className="master-meta-grid">
              <MetaItem
                label="仓库出库说明"
                value={displayOrDash(data?.remark)}
                full
              />
            </div>
          </SectionCard>

          <SectionCard id="operation" title="操作记录">
            <ActivityTimeline
              resourceType="outbound-orders"
              resourceId={outboundOrderId}
            />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
