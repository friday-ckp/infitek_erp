import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Empty, Select, Space } from "antd";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { ReceiptOrderStatus, ReceiptOrderType } from "@infitek/shared";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
  getReceiptOrders,
  RECEIPT_ORDER_STATUS_LABELS,
  RECEIPT_ORDER_TYPE_LABELS,
  type ReceiptOrder,
} from "../../api/receipt-orders.api";
import { SearchForm, type ActiveTag } from "../../components/common/SearchForm";
import { useDebouncedValue } from "../../hooks/useDebounce";
import "../master-data/master-page.css";

const STATUS_OPTIONS = Object.values(ReceiptOrderStatus).map((value) => ({
  label: RECEIPT_ORDER_STATUS_LABELS[value],
  value,
}));

const TYPE_OPTIONS = Object.values(ReceiptOrderType).map((value) => ({
  label: RECEIPT_ORDER_TYPE_LABELS[value],
  value,
}));

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

function displayOrDash(value?: string | number | null) {
  return value == null || value === "" ? "—" : String(value);
}

export default function ReceiptOrdersListPage() {
  const navigate = useNavigate();
  const [keywordInput, setKeywordInput] = useState("");
  const [status, setStatus] = useState<ReceiptOrderStatus | undefined>();
  const [receiptType, setReceiptType] = useState<ReceiptOrderType | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const keyword = useDebouncedValue(keywordInput, 300).trim();
  const hasFilters = Boolean(keyword) || status != null || receiptType != null;

  const query = useQuery({
    queryKey: [
      "receipt-orders",
      keyword,
      status,
      receiptType,
      page,
      pageSize,
    ],
    placeholderData: (previousData) => previousData,
    queryFn: () =>
      getReceiptOrders({
        keyword: keyword || undefined,
        status,
        receiptType,
        page,
        pageSize,
      }),
  });

  const clearAllFilters = () => {
    setKeywordInput("");
    setStatus(undefined);
    setReceiptType(undefined);
    setPage(1);
  };

  const selectedStatus = STATUS_OPTIONS.find((item) => item.value === status);
  const selectedReceiptType = TYPE_OPTIONS.find(
    (item) => item.value === receiptType,
  );

  const columns: ProColumns<ReceiptOrder>[] = useMemo(
    () => [
      {
        title: "入库单号",
        dataIndex: "receiptCode",
        width: 180,
        fixed: "left",
        render: (_, record) => (
          <Link to={`/receipt-orders/${record.id}`}>{record.receiptCode}</Link>
        ),
      },
      {
        title: "入库类型",
        dataIndex: "receiptType",
        width: 140,
        render: (_, record) =>
          RECEIPT_ORDER_TYPE_LABELS[record.receiptType] ?? record.receiptType,
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
        title: "采购订单号",
        dataIndex: "purchaseOrderCode",
        width: 180,
        render: (_, record) => (
          <Link to={`/purchase-orders/${record.purchaseOrderId}`}>
            {displayOrDash(record.purchaseOrderCode)}
          </Link>
        ),
      },
      {
        title: "发货需求编号",
        dataIndex: "shippingDemandCode",
        width: 160,
        render: (_, record) =>
          record.shippingDemandId ? (
            <Link to={`/shipping-demands/${record.shippingDemandId}`}>
              {displayOrDash(record.shippingDemandCode)}
            </Link>
          ) : (
            displayOrDash(record.shippingDemandCode)
          ),
      },
      {
        title: "入库仓库",
        dataIndex: "warehouseName",
        width: 220,
        render: (_, record) => displayOrDash(record.warehouseName),
      },
      {
        title: "入库员",
        dataIndex: "receiverName",
        width: 180,
        render: (_, record) => displayOrDash(record.receiverName),
      },
      {
        title: "入库日期",
        dataIndex: "receiptDate",
        width: 120,
        render: (_, record) => formatDate(record.receiptDate),
      },
      {
        title: "入库总数量",
        dataIndex: "totalQuantity",
        width: 120,
        align: "right",
      },
      {
        title: "入库总金额",
        dataIndex: "totalAmount",
        width: 140,
        align: "right",
        render: (_, record) => formatMoney(record.totalAmount),
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
          <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/receipt-orders/${record.id}`)}>
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
  if (selectedReceiptType) {
    activeTags.push({
      key: "receiptType",
      label: `入库类型: ${selectedReceiptType.label}`,
      onClose: () => setReceiptType(undefined),
    });
  }

  return (
    <div className="master-page">
      <div className="master-page-header">
        <div className="master-page-heading">
          <div className="master-page-title">收货入库</div>
          <div className="master-page-description">
            跟踪采购入库记录、仓库去向、入库员和对应采购订单。
          </div>
        </div>
        <div className="master-page-actions">
          <Button type="primary" onClick={() => navigate("/receipt-orders/new")}>
            新建收货入库单
          </Button>
        </div>
      </div>

      <div className="master-list-shell">
        <SearchForm
          searchValue={keywordInput}
          onSearchChange={setKeywordInput}
          placeholder="快捷搜索 入库单号/采购订单号/发货需求编号/入库员/仓库"
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
                placeholder="入库类型"
                style={{ width: 180 }}
                value={receiptType}
                options={TYPE_OPTIONS}
                onChange={(value) => setReceiptType(value)}
              />
            </Space>
          }
        />

        <div className="master-table-shell">
          <ProTable<ReceiptOrder>
            rowKey="id"
            search={false}
            options={false}
            toolBarRender={false}
            columns={columns}
            dataSource={query.data?.list ?? []}
            loading={query.isLoading}
            scroll={{ x: 1800 }}
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
              emptyText: (
                <Empty description="暂无收货入库记录">
                  <Button type="primary" onClick={() => navigate("/receipt-orders/new")}>
                    新建收货入库单
                  </Button>
                </Empty>
              ),
            }}
          />
        </div>
      </div>
    </div>
  );
}
