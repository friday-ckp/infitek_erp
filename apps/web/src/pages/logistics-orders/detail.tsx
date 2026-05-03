import {
  App,
  Button,
  Empty,
  Form,
  Input,
  Popconfirm,
  Result,
  Skeleton,
  Space,
  Table,
  DatePicker,
} from "antd";
import { LogisticsOrderStatus, YesNo } from "@infitek/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ActivityTimeline } from "../../components/ActivityTimeline";
import {
  getLogisticsOrderById,
  LOGISTICS_ORDER_STATUS_LABELS,
  TRANSPORTATION_METHOD_LABELS,
  updateLogisticsTracking,
  type LogisticsOrderItem,
  type LogisticsOrderPackage,
} from "../../api/logistics-orders.api";
import {
  AnchorNav,
  MetaItem,
  SectionCard,
  SummaryMetaItem,
  displayOrDash,
} from "../master-data/components/page-scaffold";
import "../master-data/master-page.css";

const STATUS_STYLE_MAP: Record<string, { className: string; text: string }> = {
  [LogisticsOrderStatus.CONFIRMED]: {
    className: "master-pill-blue",
    text: "已确认",
  },
  [LogisticsOrderStatus.SHIPPED]: {
    className: "master-pill-orange",
    text: "已发运",
  },
  [LogisticsOrderStatus.DELIVERED]: {
    className: "master-pill-success",
    text: "已送达",
  },
  [LogisticsOrderStatus.CANCELLED]: {
    className: "master-pill-red",
    text: "已取消",
  },
};

function formatDate(value?: string | null) {
  return value ? dayjs(value).format("YYYY-MM-DD") : "—";
}

function formatYesNo(value?: YesNo | null) {
  if (value === YesNo.YES) return "是";
  if (value === YesNo.NO) return "否";
  return "—";
}

function displayOrZero(value?: number | null) {
  return value == null ? "0" : String(value);
}

export default function LogisticsOrderDetailPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { id = "" } = useParams();
  const logisticsOrderId = Number(id);
  const [activeAnchor, setActiveAnchor] = useState("basic");
  const [trackingEdit, setTrackingEdit] = useState(false);
  const [trackingForm] = Form.useForm();

  const query = useQuery({
    queryKey: ["logistics-order-detail", logisticsOrderId],
    queryFn: () => getLogisticsOrderById(logisticsOrderId),
    enabled: Number.isInteger(logisticsOrderId) && logisticsOrderId > 0,
  });

  const refreshQueries = () => {
    queryClient.invalidateQueries({
      queryKey: ["logistics-order-detail", logisticsOrderId],
    });
    queryClient.invalidateQueries({ queryKey: ["logistics-orders"] });
    queryClient.invalidateQueries({
      queryKey: ["operation-logs", "logistics-orders", logisticsOrderId],
    });
  };

  const trackingMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      updateLogisticsTracking(logisticsOrderId, {
        etd: values.etd ? dayjs(values.etd as dayjs.Dayjs).format("YYYY-MM-DD") : null,
        eta: values.eta ? dayjs(values.eta as dayjs.Dayjs).format("YYYY-MM-DD") : null,
        bookingNumber: (values.bookingNumber as string) || null,
        carrier: (values.carrier as string) || null,
        vesselVoyage: (values.vesselVoyage as string) || null,
        blSoNumber: (values.blSoNumber as string) || null,
        actualDepartureDate: values.actualDepartureDate
          ? dayjs(values.actualDepartureDate as dayjs.Dayjs).format("YYYY-MM-DD")
          : null,
      }),
    onSuccess: () => {
      refreshQueries();
      setTrackingEdit(false);
      message.success("物流跟踪信息已更新");
    },
  });

  const anchors = [
    { key: "basic", label: "基础信息" },
    { key: "tracking", label: "物流跟踪" },
    { key: "items", label: "货物明细" },
    { key: "packages", label: "装箱信息" },
    { key: "customs", label: "报关信息" },
    { key: "relations", label: "关联单据" },
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
        key: "productName",
        width: 220,
        render: (_: unknown, record: LogisticsOrderItem) =>
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
        width: 120,
        align: "right" as const,
      },
      {
        title: "已出库数量",
        dataIndex: "outboundQuantity",
        key: "outboundQuantity",
        width: 120,
        align: "right" as const,
      },
    ],
    [],
  );

  const packageColumns = useMemo(
    () => [
      {
        title: "SKU",
        dataIndex: "skuCode",
        key: "skuCode",
        width: 140,
      },
      {
        title: "箱号",
        dataIndex: "packageNo",
        key: "packageNo",
        width: 140,
      },
      {
        title: "箱数",
        dataIndex: "boxCount",
        key: "boxCount",
        width: 100,
        align: "right" as const,
      },
      {
        title: "每箱数量",
        dataIndex: "quantityPerBox",
        key: "quantityPerBox",
        width: 120,
        align: "right" as const,
      },
      {
        title: "总数量",
        dataIndex: "totalQuantity",
        key: "totalQuantity",
        width: 120,
        align: "right" as const,
      },
      {
        title: "尺寸(cm)",
        key: "size",
        width: 180,
        render: (_: unknown, record: LogisticsOrderPackage) =>
          `${displayOrDash(record.lengthCm)} × ${displayOrDash(record.widthCm)} × ${displayOrDash(record.heightCm)}`,
      },
      {
        title: "毛重(kg)",
        dataIndex: "grossWeightKg",
        key: "grossWeightKg",
        width: 120,
        align: "right" as const,
        render: displayOrDash,
      },
    ],
    [],
  );

  if (!Number.isInteger(logisticsOrderId) || logisticsOrderId <= 0) {
    return (
      <Result
        status="404"
        title="物流单不存在"
        extra={
          <Button type="primary" onClick={() => navigate("/logistics-orders")}>
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
        title="物流单详情加载失败"
        extra={[
          <Button key="retry" type="primary" onClick={() => query.refetch()}>
            重试
          </Button>,
          <Button key="back" onClick={() => navigate("/logistics-orders")}>
            返回列表
          </Button>,
        ]}
      />
    );
  }

  const data = query.data;
  const currentStatus =
    STATUS_STYLE_MAP[data?.status ?? ""] ?? {
      className: "master-pill-default",
      text: data?.status ? LOGISTICS_ORDER_STATUS_LABELS[data.status] : "—",
    };
  const canEditTracking =
    data?.status === LogisticsOrderStatus.CONFIRMED ||
    data?.status === LogisticsOrderStatus.SHIPPED;
  const canCreateOutbound =
    data?.status === LogisticsOrderStatus.CONFIRMED &&
    (data?.items ?? []).some(
      (item) => Number(item.plannedQuantity ?? 0) > Number(item.outboundQuantity ?? 0),
    );

  const openTrackingEdit = () => {
    trackingForm.setFieldsValue({
      etd: data?.etd ? dayjs(data.etd) : null,
      eta: data?.eta ? dayjs(data.eta) : null,
      bookingNumber: data?.bookingNumber ?? undefined,
      carrier: data?.carrier ?? undefined,
      vesselVoyage: data?.vesselVoyage ?? undefined,
      blSoNumber: data?.blSoNumber ?? undefined,
      actualDepartureDate: data?.actualDepartureDate
        ? dayjs(data.actualDepartureDate)
        : null,
    });
    setTrackingEdit(true);
  };

  return (
    <div className="master-page">
      <div className="master-summary-card">
        {query.isLoading && !data ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          <>
            <div className="master-summary-code">
              {displayOrDash(data?.orderCode)}
            </div>
            <div className="master-summary-header">
              <div className="master-summary-title-wrap">
                <div className="master-summary-title-row">
                  <div className="master-summary-title">
                    {displayOrDash(data?.logisticsProviderName)}
                  </div>
                  <span className={`master-pill ${currentStatus.className}`}>
                    {currentStatus.text}
                  </span>
                </div>
              </div>
              <div className="master-summary-actions">
                <Space wrap>
                  <Button onClick={() => navigate("/logistics-orders")}>
                    返回列表
                  </Button>
                  <Button
                    onClick={() =>
                      navigate(`/shipping-demands/${data?.shippingDemandId}`)
                    }
                  >
                    查看发货需求
                  </Button>
                  {canEditTracking ? (
                    <Button type="primary" onClick={openTrackingEdit}>
                      编辑物流跟踪
                    </Button>
                  ) : null}
                  {canCreateOutbound ? (
                    <Button
                      type="primary"
                      onClick={() =>
                        navigate(`/outbound-orders/create?logisticsOrderId=${logisticsOrderId}`)
                      }
                    >
                      创建发货出库单
                    </Button>
                  ) : null}
                </Space>
              </div>
            </div>
            <div className="master-summary-meta">
              <SummaryMetaItem
                label="发货需求编号"
                value={displayOrDash(data?.shippingDemandCode)}
              />
              <SummaryMetaItem
                label="运输方式"
                value={
                  data?.transportationMethod
                    ? TRANSPORTATION_METHOD_LABELS[data.transportationMethod]
                    : "—"
                }
              />
              <SummaryMetaItem
                label="货物行数"
                value={displayOrZero(data?.items?.length)}
              />
              <SummaryMetaItem
                label="创建时间"
                value={formatDate(data?.createdAt)}
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
              <MetaItem label="物流单号" value={displayOrDash(data?.orderCode)} />
              <MetaItem
                label="物流供应商"
                value={displayOrDash(data?.logisticsProviderName)}
              />
              <MetaItem
                label="运输方式"
                value={
                  data?.transportationMethod
                    ? TRANSPORTATION_METHOD_LABELS[data.transportationMethod]
                    : "—"
                }
              />
              <MetaItem label="公司主体" value={displayOrDash(data?.companyName)} />
              <MetaItem label="起运港" value={displayOrDash(data?.originPortName)} />
              <MetaItem
                label="目的港"
                value={displayOrDash(data?.destinationPortName)}
              />
              <MetaItem
                label="运抵国"
                value={displayOrDash(data?.destinationCountryName)}
              />
              <MetaItem
                label="要求到货日期"
                value={formatDate(data?.requiredDeliveryAt)}
              />
            </div>
          </SectionCard>

          <SectionCard
            id="tracking"
            title="物流跟踪"
            extra={
              canEditTracking && !trackingEdit ? (
                <Button onClick={openTrackingEdit}>编辑</Button>
              ) : null
            }
          >
            {trackingEdit ? (
              <Form form={trackingForm} layout="vertical">
                <div className="master-meta-grid">
                  <Form.Item label="预计离港日期" name="etd">
                    <DatePicker style={{ width: "100%" }} />
                  </Form.Item>
                  <Form.Item label="预计到港日期" name="eta">
                    <DatePicker style={{ width: "100%" }} />
                  </Form.Item>
                  <Form.Item label="订舱号" name="bookingNumber">
                    <Input allowClear maxLength={120} />
                  </Form.Item>
                  <Form.Item label="船司/航司" name="carrier">
                    <Input allowClear maxLength={200} />
                  </Form.Item>
                  <Form.Item label="船名航次" name="vesselVoyage">
                    <Input allowClear maxLength={200} />
                  </Form.Item>
                  <Form.Item label="SO/提单号" name="blSoNumber">
                    <Input allowClear maxLength={120} />
                  </Form.Item>
                  <Form.Item label="实际离港日期" name="actualDepartureDate">
                    <DatePicker style={{ width: "100%" }} />
                  </Form.Item>
                </div>
                <Space>
                  <Popconfirm
                    title="确认保存物流跟踪信息？"
                    okText="确认"
                    cancelText="取消"
                    onConfirm={() =>
                      trackingForm
                        .validateFields()
                        .then((values) => trackingMutation.mutateAsync(values))
                    }
                  >
                    <Button
                      type="primary"
                      loading={trackingMutation.isPending}
                    >
                      保存
                    </Button>
                  </Popconfirm>
                  <Button onClick={() => setTrackingEdit(false)}>取消</Button>
                </Space>
              </Form>
            ) : (
              <div className="master-meta-grid">
                <MetaItem label="预计离港日期" value={formatDate(data?.etd)} />
                <MetaItem label="预计到港日期" value={formatDate(data?.eta)} />
                <MetaItem
                  label="订舱号"
                  value={displayOrDash(data?.bookingNumber)}
                />
                <MetaItem label="船司/航司" value={displayOrDash(data?.carrier)} />
                <MetaItem
                  label="船名航次"
                  value={displayOrDash(data?.vesselVoyage)}
                />
                <MetaItem label="SO/提单号" value={displayOrDash(data?.blSoNumber)} />
                <MetaItem
                  label="实际离港日期"
                  value={formatDate(data?.actualDepartureDate)}
                />
              </div>
            )}
          </SectionCard>

          <SectionCard id="items" title="货物明细">
            <Table<LogisticsOrderItem>
              rowKey="id"
              columns={itemColumns}
              dataSource={data?.items ?? []}
              pagination={false}
              locale={{
                emptyText: <Empty description="暂无货物明细" />,
              }}
              scroll={{ x: 900 }}
            />
          </SectionCard>

          <SectionCard id="packages" title="装箱信息">
            <Table<LogisticsOrderPackage>
              rowKey="id"
              columns={packageColumns}
              dataSource={data?.packages ?? []}
              pagination={false}
              locale={{
                emptyText: <Empty description="暂无装箱信息" />,
              }}
              scroll={{ x: 1100 }}
            />
          </SectionCard>

          <SectionCard id="customs" title="报关信息">
            <div className="master-meta-grid">
              <MetaItem
                label="是否出口报关"
                value={formatYesNo(data?.requiresExportCustoms)}
              />
              <MetaItem label="唛头" value={displayOrDash(data?.shippingMark)} full />
            </div>
          </SectionCard>

          <SectionCard id="relations" title="关联单据">
            <div className="master-meta-grid">
              <MetaItem
                label="发货需求"
                value={
                  data?.shippingDemandId ? (
                    <Link to={`/shipping-demands/${data.shippingDemandId}`}>
                      {displayOrDash(data.shippingDemandCode)}
                    </Link>
                  ) : (
                    "—"
                  )
                }
              />
              <MetaItem
                label="销售订单"
                value={
                  data?.salesOrderId ? (
                    <Link to={`/sales-orders/${data.salesOrderId}`}>
                      {displayOrDash(data.salesOrderCode)}
                    </Link>
                  ) : (
                    "—"
                  )
                }
              />
              <MetaItem
                label="出库单"
                value={
                  canCreateOutbound ? (
                    <Button
                      type="link"
                      style={{ padding: 0 }}
                      onClick={() =>
                        navigate(`/outbound-orders/create?logisticsOrderId=${logisticsOrderId}`)
                      }
                    >
                      创建发货出库单
                    </Button>
                  ) : (
                    "当前物流单无剩余待出库数量"
                  )
                }
                full
              />
            </div>
          </SectionCard>

          <SectionCard id="operation" title="操作记录">
            <ActivityTimeline
              resourceType="logistics-orders"
              resourceId={logisticsOrderId}
            />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
