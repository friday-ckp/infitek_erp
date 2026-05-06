import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Empty, Select, Space } from "antd";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import {
  OutboundOrderStatus,
  OutboundOrderType,
  type OutboundOrderType as OutboundOrderTypeValue,
} from "@infitek/shared";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
  getOutboundOrders,
  OUTBOUND_ORDER_STATUS_LABELS,
  OUTBOUND_ORDER_TYPE_LABELS,
  type OutboundOrder,
} from "../../api/outbound-orders.api";
import { SearchForm, type ActiveTag } from "../../components/common/SearchForm";
import { useDebouncedValue } from "../../hooks/useDebounce";
import "../master-data/master-page.css";

const STATUS_OPTIONS = Object.values(OutboundOrderStatus).map((value) => ({
  label: OUTBOUND_ORDER_STATUS_LABELS[value],
  value,
}));

const TYPE_OPTIONS = Object.values(OutboundOrderType).map((value) => ({
  label: OUTBOUND_ORDER_TYPE_LABELS[value],
  value,
}));

const STATUS_STYLE_MAP: Record<string, { className: string; text: string }> = {
  [OutboundOrderStatus.CONFIRMED]: {
    className: "master-pill-success",
    text: "已确认",
  },
};

function parsePositiveIntParam(value: string | null) {
  const normalized = value?.trim();
  if (!normalized || !/^\d+$/.test(normalized)) return undefined;
  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

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

function displayOrDash(value?: string | number | null) {
  return value == null || value === "" ? "—" : String(value);
}

export default function OutboundOrdersListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const logisticsOrderId = parsePositiveIntParam(
    searchParams.get("logisticsOrderId"),
  );
  const shippingDemandId = parsePositiveIntParam(
    searchParams.get("shippingDemandId"),
  );
  const [keywordInput, setKeywordInput] = useState("");
  const [status, setStatus] = useState<OutboundOrderStatus | undefined>();
  const [outboundType, setOutboundType] = useState<
    OutboundOrderTypeValue | undefined
  >();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const keyword = useDebouncedValue(keywordInput, 300).trim();
  const hasFilters =
    Boolean(keyword) ||
    status != null ||
    outboundType != null ||
    logisticsOrderId != null ||
    shippingDemandId != null;

  const query = useQuery({
    queryKey: [
      "outbound-orders",
      keyword,
      status,
      outboundType,
      logisticsOrderId,
      shippingDemandId,
      page,
      pageSize,
    ],
    placeholderData: (previousData) => previousData,
    queryFn: () =>
      getOutboundOrders({
        keyword: keyword || undefined,
        status,
        outboundType,
        logisticsOrderId,
        shippingDemandId,
        page,
        pageSize,
      }),
  });

  const clearAllFilters = () => {
    setKeywordInput("");
    setStatus(undefined);
    setOutboundType(undefined);
    setSearchParams({});
    setPage(1);
  };

  const clearContextFilter = (key: "logisticsOrderId" | "shippingDemandId") => {
    const next = new URLSearchParams(searchParams);
    next.delete(key);
    setSearchParams(next);
    setPage(1);
  };

  const selectedStatus = STATUS_OPTIONS.find((item) => item.value === status);
  const selectedOutboundType = TYPE_OPTIONS.find(
    (item) => item.value === outboundType,
  );

  const columns: ProColumns<OutboundOrder>[] = useMemo(
    () => [
      {
        title: "出库单号",
        dataIndex: "outboundCode",
        width: 180,
        fixed: "left",
        render: (_, record) => (
          <Link to={`/outbound-orders/${record.id}`}>{record.outboundCode}</Link>
        ),
      },
      {
        title: "出库类型",
        dataIndex: "outboundType",
        width: 140,
        render: (_, record) =>
          OUTBOUND_ORDER_TYPE_LABELS[record.outboundType] ?? record.outboundType,
      },
      {
        title: "状态",
        dataIndex: "status",
        width: 120,
        render: (_, record) => {
          const info = STATUS_STYLE_MAP[record.status] ?? {
            className: "master-pill-default",
            text: record.status,
          };
          return (
            <span className={`master-pill ${info.className}`}>{info.text}</span>
          );
        },
      },
      {
        title: "物流单号",
        dataIndex: "logisticsOrderCode",
        width: 180,
        render: (_, record) => (
          <Link to={`/logistics-orders/${record.logisticsOrderId}`}>
            {displayOrDash(record.logisticsOrderCode)}
          </Link>
        ),
      },
      {
        title: "发货需求编号",
        dataIndex: "shippingDemandCode",
        width: 160,
        render: (_, record) => (
          <Link to={`/shipping-demands/${record.shippingDemandId}`}>
            {displayOrDash(record.shippingDemandCode)}
          </Link>
        ),
      },
      {
        title: "销售订单号",
        dataIndex: "salesOrderCode",
        width: 180,
        render: (_, record) => (
          <Link to={`/sales-orders/${record.salesOrderId}`}>
            {displayOrDash(record.salesOrderCode)}
          </Link>
        ),
      },
      {
        title: "出库仓库",
        dataIndex: "warehouseName",
        width: 200,
        render: (_, record) => displayOrDash(record.warehouseName),
      },
      {
        title: "出库员",
        dataIndex: "outboundUserName",
        width: 140,
        render: (_, record) => displayOrDash(record.outboundUserName),
      },
      {
        title: "出库日期",
        dataIndex: "outboundDate",
        width: 120,
        render: (_, record) => formatDate(record.outboundDate),
      },
      {
        title: "销售总金额",
        dataIndex: "salesTotalAmount",
        width: 140,
        align: "right",
        render: (_, record) => formatMoney(record.salesTotalAmount),
      },
      {
        title: "成本总金额",
        dataIndex: "costTotalAmount",
        width: 140,
        align: "right",
        render: (_, record) => formatMoney(record.costTotalAmount),
      },
      {
        title: "创建时间",
        dataIndex: "createdAt",
        width: 160,
        render: (_, record) => formatDate(record.createdAt),
      },
      {
        title: "操作",
        key: "actions",
        width: 100,
        fixed: "right",
        render: (_, record) => (
          <Button
            type="link"
            style={{ padding: 0 }}
            onClick={() => navigate(`/outbound-orders/${record.id}`)}
          >
            查看
          </Button>
        ),
      },
    ],
    [navigate],
  );

  const activeTags: ActiveTag[] = [];
  if (selectedStatus) {
    activeTags.push({
      key: "status",
      label: `状态: ${selectedStatus.label}`,
      onClose: () => setStatus(undefined),
    });
  }
  if (selectedOutboundType) {
    activeTags.push({
      key: "outboundType",
      label: `出库类型: ${selectedOutboundType.label}`,
      onClose: () => setOutboundType(undefined),
    });
  }
  if (logisticsOrderId) {
    activeTags.push({
      key: "logisticsOrderId",
      label: `物流单筛选: #${logisticsOrderId}`,
      onClose: () => clearContextFilter("logisticsOrderId"),
    });
  }
  if (shippingDemandId) {
    activeTags.push({
      key: "shippingDemandId",
      label: `发货需求筛选: #${shippingDemandId}`,
      onClose: () => clearContextFilter("shippingDemandId"),
    });
  }

  return (
    <div className="master-page">
      <div className="master-page-header">
        <div className="master-page-heading">
          <div className="master-page-title">发货出库</div>
          <div className="master-page-description">
            查看物流单生成后的发货出库记录、仓库去向、出库员和关联单据。
          </div>
        </div>
        <div className="master-page-actions">
          {logisticsOrderId ? (
            <Button onClick={() => navigate(`/logistics-orders/${logisticsOrderId}`)}>
              返回物流单
            </Button>
          ) : null}
          {shippingDemandId ? (
            <Button onClick={() => navigate(`/shipping-demands/${shippingDemandId}`)}>
              查看发货需求
            </Button>
          ) : null}
        </div>
      </div>

      <div className="master-list-shell">
        <SearchForm
          searchValue={keywordInput}
          onSearchChange={setKeywordInput}
          placeholder="快捷搜索 出库单号/物流单号/发货需求编号/销售订单号/出库员/仓库"
          activeTags={activeTags}
          onClearAll={hasFilters ? clearAllFilters : undefined}
          onQuery={() => setPage(1)}
          onReset={clearAllFilters}
          advancedContent={
            <Space wrap>
              <Select
                allowClear
                placeholder="状态"
                style={{ width: 160 }}
                value={status}
                options={STATUS_OPTIONS}
                onChange={(value) => setStatus(value)}
              />
              <Select
                allowClear
                placeholder="出库类型"
                style={{ width: 180 }}
                value={outboundType}
                options={TYPE_OPTIONS}
                onChange={(value) => setOutboundType(value)}
              />
            </Space>
          }
        />

        <div className="master-table-shell">
          <ProTable<OutboundOrder>
            rowKey="id"
            search={false}
            options={false}
            toolBarRender={false}
            columns={columns}
            dataSource={query.data?.list ?? []}
            loading={query.isLoading}
            scroll={{ x: 1900 }}
            pagination={{
              current: page,
              pageSize,
              total: query.data?.total ?? 0,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
              showTotal: (total) => `共 ${total} 条记录`,
              onChange: (nextPage, nextPageSize) => {
                setPage(nextPage);
                setPageSize(nextPageSize);
              },
            }}
            locale={{
              emptyText: <Empty description="暂无发货出库记录" />,
            }}
          />
        </div>
      </div>
    </div>
  );
}
