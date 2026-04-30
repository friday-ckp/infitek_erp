import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Empty, Result, Select, Skeleton, Space, theme } from "antd";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import {
  PurchaseOrderApplicationType,
  PurchaseOrderDemandType,
  PurchaseOrderReceiptStatus,
  PurchaseOrderStatus,
} from "@infitek/shared";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
  getPurchaseOrders,
  PURCHASE_ORDER_APPLICATION_TYPE_LABELS,
  PURCHASE_ORDER_DEMAND_TYPE_LABELS,
  PURCHASE_ORDER_RECEIPT_STATUS_LABELS,
  PURCHASE_ORDER_STATUS_LABELS,
  type PurchaseOrder,
} from "../../api/purchase-orders.api";
import { getSuppliers, type Supplier } from "../../api/suppliers.api";
import { SearchForm, type ActiveTag } from "../../components/common/SearchForm";
import { useDebouncedValue } from "../../hooks/useDebounce";
import "../master-data/master-page.css";

const STATUS_OPTIONS = Object.values(PurchaseOrderStatus).map((value) => ({
  label: PURCHASE_ORDER_STATUS_LABELS[value],
  value,
}));

const APPLICATION_TYPE_OPTIONS = Object.values(
  PurchaseOrderApplicationType,
).map((value) => ({
  label: PURCHASE_ORDER_APPLICATION_TYPE_LABELS[value],
  value,
}));

const DEMAND_TYPE_OPTIONS = Object.values(PurchaseOrderDemandType).map(
  (value) => ({
    label: PURCHASE_ORDER_DEMAND_TYPE_LABELS[value],
    value,
  }),
);

const RECEIPT_STATUS_OPTIONS = Object.values(PurchaseOrderReceiptStatus).map(
  (value) => ({
    label: PURCHASE_ORDER_RECEIPT_STATUS_LABELS[value],
    value,
  }),
);

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

export default function PurchaseOrdersListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token } = theme.useToken();
  const [keywordInput, setKeywordInput] = useState("");
  const [supplierId, setSupplierId] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState<PurchaseOrderStatus | undefined>(
    undefined,
  );
  const [applicationType, setApplicationType] = useState<
    PurchaseOrderApplicationType | undefined
  >(undefined);
  const [demandType, setDemandType] = useState<
    PurchaseOrderDemandType | undefined
  >(undefined);
  const [receiptStatus, setReceiptStatus] = useState<
    PurchaseOrderReceiptStatus | undefined
  >(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const keyword = useDebouncedValue(keywordInput, 300).trim();
  const shippingDemandId = useMemo(
    () => parsePositiveIntParam(searchParams.get("shippingDemandId")),
    [searchParams],
  );
  const hasFilters =
    Boolean(keyword) ||
    supplierId != null ||
    status != null ||
    applicationType != null ||
    demandType != null ||
    receiptStatus != null ||
    shippingDemandId != null;

  useEffect(() => {
    setPage(1);
  }, [
    keyword,
    supplierId,
    status,
    applicationType,
    demandType,
    receiptStatus,
    shippingDemandId,
  ]);

  const query = useQuery({
    queryKey: [
      "purchase-orders",
      keyword,
      supplierId,
      status,
      applicationType,
      demandType,
      receiptStatus,
      shippingDemandId,
      page,
      pageSize,
    ],
    placeholderData: (previousData) => previousData,
    queryFn: () =>
      getPurchaseOrders({
        keyword: keyword || undefined,
        supplierId,
        status,
        applicationType,
        demandType,
        receiptStatus,
        shippingDemandId,
        page,
        pageSize,
      }),
  });

  const suppliersQuery = useQuery({
    queryKey: ["suppliers", "purchase-order-filter"],
    queryFn: () => getSuppliers({ page: 1, pageSize: 200 }),
  });

  const clearShippingDemandFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("shippingDemandId");
    setSearchParams(next, { replace: true });
    setPage(1);
  };

  const clearAllFilters = () => {
    setKeywordInput("");
    setSupplierId(undefined);
    setStatus(undefined);
    setApplicationType(undefined);
    setDemandType(undefined);
    setReceiptStatus(undefined);
    if (searchParams.has("shippingDemandId")) {
      const next = new URLSearchParams(searchParams);
      next.delete("shippingDemandId");
      setSearchParams(next, { replace: true });
    }
    setPage(1);
  };

  const suppliers = suppliersQuery.data?.list ?? [];
  const selectedSupplier = suppliers.find((item) => item.id === supplierId);
  const selectedStatus = STATUS_OPTIONS.find((item) => item.value === status);
  const selectedApplicationType = APPLICATION_TYPE_OPTIONS.find(
    (item) => item.value === applicationType,
  );
  const selectedDemandType = DEMAND_TYPE_OPTIONS.find(
    (item) => item.value === demandType,
  );
  const selectedReceiptStatus = RECEIPT_STATUS_OPTIONS.find(
    (item) => item.value === receiptStatus,
  );

  const columns: ProColumns<PurchaseOrder>[] = useMemo(
    () => [
      {
        title: "采购订单号",
        dataIndex: "poCode",
        width: 180,
        fixed: "left",
        render: (_, record) => (
          <Link
            to={`/purchase-orders/${record.id}`}
            style={{ color: token.colorLink }}
          >
            {record.poCode}
          </Link>
        ),
      },
      {
        title: "供应商编码",
        dataIndex: "supplierCode",
        width: 130,
        render: (_, record) => displayOrDash(record.supplierCode),
      },
      {
        title: "供应商名称",
        dataIndex: "supplierName",
        width: 220,
        ellipsis: true,
      },
      {
        title: "采购状态",
        dataIndex: "status",
        width: 130,
        render: (_, record) => {
          const statusInfo = STATUS_STYLE_MAP[record.status] ?? {
            className: "master-pill-default",
            text: record.status,
          };
          return (
            <span className={`master-pill ${statusInfo.className}`}>
              {statusInfo.text}
            </span>
          );
        },
      },
      {
        title: "申请类型",
        dataIndex: "applicationType",
        width: 120,
        render: (_, record) =>
          record.applicationType
            ? PURCHASE_ORDER_APPLICATION_TYPE_LABELS[record.applicationType]
            : "—",
      },
      {
        title: "需求类型",
        dataIndex: "demandType",
        width: 120,
        render: (_, record) =>
          record.demandType
            ? PURCHASE_ORDER_DEMAND_TYPE_LABELS[record.demandType]
            : "—",
      },
      {
        title: "销售订单号",
        dataIndex: "salesOrderCode",
        width: 160,
        render: (_, record) =>
          record.salesOrderId ? (
            <Link
              to={`/sales-orders/${record.salesOrderId}`}
              style={{ color: token.colorLink }}
            >
              {displayOrDash(record.salesOrderCode)}
            </Link>
          ) : (
            displayOrDash(record.salesOrderCode)
          ),
      },
      {
        title: "发货需求编号",
        dataIndex: "shippingDemandCode",
        width: 170,
        render: (_, record) =>
          record.shippingDemandId ? (
            <Link
              to={`/shipping-demands/${record.shippingDemandId}`}
              style={{ color: token.colorLink }}
            >
              {displayOrDash(record.shippingDemandCode)}
            </Link>
          ) : (
            displayOrDash(record.shippingDemandCode)
          ),
      },
      {
        title: "采购日期",
        dataIndex: "purchaseDate",
        width: 120,
        render: (_, record) => formatDate(record.purchaseDate),
      },
      {
        title: "PO交期",
        dataIndex: "poDeliveryDate",
        width: 120,
        render: (_, record) => formatDate(record.poDeliveryDate),
      },
      {
        title: "到货日期",
        dataIndex: "arrivalDate",
        width: 120,
        render: (_, record) => formatDate(record.arrivalDate),
      },
      {
        title: "采购总数量",
        dataIndex: "totalQuantity",
        width: 120,
        align: "right",
        render: (_, record) => record.totalQuantity ?? 0,
      },
      {
        title: "采购金额合计",
        dataIndex: "totalAmount",
        width: 140,
        align: "right",
        render: (_, record) => formatMoney(record.totalAmount),
      },
      {
        title: "已入库总数",
        dataIndex: "receivedTotalQuantity",
        width: 120,
        align: "right",
        render: (_, record) => record.receivedTotalQuantity ?? 0,
      },
      {
        title: "入库状态",
        dataIndex: "receiptStatus",
        width: 120,
        render: (_, record) =>
          record.receiptStatus
            ? PURCHASE_ORDER_RECEIPT_STATUS_LABELS[record.receiptStatus]
            : "—",
      },
      {
        title: "创建时间",
        dataIndex: "createdAt",
        width: 140,
        render: (_, record) => dayjs(record.createdAt).format("YYYY-MM-DD"),
      },
      {
        title: "操作",
        key: "actions",
        width: 90,
        fixed: "right",
        render: (_, record) => (
          <Button
            type="link"
            style={{ padding: 0 }}
            onClick={() => navigate(`/purchase-orders/${record.id}`)}
          >
            查看
          </Button>
        ),
      },
    ],
    [navigate, token.colorLink],
  );

  if (query.isError && !query.data) {
    return (
      <Result
        status="error"
        title="加载采购订单列表失败"
        subTitle="请检查网络或稍后重试"
        extra={
          <Button type="primary" onClick={() => query.refetch()}>
            重试
          </Button>
        }
      />
    );
  }

  const activeTags: ActiveTag[] = [
    keyword
      ? {
          key: "keyword",
          label: `关键词: ${keyword}`,
          onClose: () => setKeywordInput(""),
        }
      : null,
    selectedSupplier
      ? {
          key: "supplier",
          label: `供应商: ${selectedSupplier.name}`,
          onClose: () => setSupplierId(undefined),
        }
      : null,
    selectedStatus
      ? {
          key: "status",
          label: `状态: ${selectedStatus.label}`,
          onClose: () => setStatus(undefined),
        }
      : null,
    selectedApplicationType
      ? {
          key: "applicationType",
          label: `申请类型: ${selectedApplicationType.label}`,
          onClose: () => setApplicationType(undefined),
        }
      : null,
    selectedDemandType
      ? {
          key: "demandType",
          label: `需求类型: ${selectedDemandType.label}`,
          onClose: () => setDemandType(undefined),
        }
      : null,
    selectedReceiptStatus
      ? {
          key: "receiptStatus",
          label: `入库状态: ${selectedReceiptStatus.label}`,
          onClose: () => setReceiptStatus(undefined),
        }
      : null,
    shippingDemandId
      ? {
          key: "shippingDemandId",
          label: `发货需求: #${shippingDemandId}`,
          onClose: clearShippingDemandFilter,
        }
      : null,
  ].filter(Boolean) as ActiveTag[];

  const emptyText = hasFilters ? (
    <Empty description="未找到匹配记录">
      <Button type="link" onClick={clearAllFilters}>
        清除筛选条件
      </Button>
    </Empty>
  ) : (
    <Empty description="暂无采购订单">
      <Button
        type="primary"
        onClick={() => navigate("/purchase-orders/create")}
      >
        创建采购订单
      </Button>
    </Empty>
  );

  return (
    <div className="master-page">
      <div className="master-page-shell">
        <div className="master-page-header">
          <div className="master-page-heading">
            <div className="master-page-title">采购订单</div>
            <div className="master-page-description">
              跟踪采购订单、供应商确认、入库进度和关联单据。
            </div>
          </div>
          <div className="master-page-actions">
            <Button
              type="primary"
              onClick={() => navigate("/purchase-orders/create")}
            >
              创建采购订单
            </Button>
          </div>
        </div>

        <div className="master-list-shell">
          <SearchForm
            searchValue={keywordInput}
            onSearchChange={(value) => {
              setKeywordInput(value);
              setPage(1);
            }}
            placeholder="快捷搜索 采购订单号/供应商编码/供应商名称/发货需求/销售订单"
            advancedContent={
              <Space wrap size={12}>
                <Select<number>
                  placeholder="供应商"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  style={{ width: 240 }}
                  loading={suppliersQuery.isLoading}
                  value={supplierId}
                  options={suppliers.map((item: Supplier) => ({
                    label: `${item.name} (${item.supplierCode})`,
                    value: item.id,
                  }))}
                  onChange={(value) => setSupplierId(value)}
                />
                <Select<PurchaseOrderStatus>
                  placeholder="采购状态"
                  allowClear
                  style={{ width: 180 }}
                  value={status}
                  options={STATUS_OPTIONS}
                  onChange={(value) => setStatus(value)}
                />
                <Select<PurchaseOrderApplicationType>
                  placeholder="申请类型"
                  allowClear
                  style={{ width: 180 }}
                  value={applicationType}
                  options={APPLICATION_TYPE_OPTIONS}
                  onChange={(value) => setApplicationType(value)}
                />
                <Select<PurchaseOrderDemandType>
                  placeholder="需求类型"
                  allowClear
                  style={{ width: 180 }}
                  value={demandType}
                  options={DEMAND_TYPE_OPTIONS}
                  onChange={(value) => setDemandType(value)}
                />
                <Select<PurchaseOrderReceiptStatus>
                  placeholder="入库状态"
                  allowClear
                  style={{ width: 180 }}
                  value={receiptStatus}
                  options={RECEIPT_STATUS_OPTIONS}
                  onChange={(value) => setReceiptStatus(value)}
                />
              </Space>
            }
            activeTags={activeTags}
            onClearAll={clearAllFilters}
            onQuery={() => {
              setPage(1);
              query.refetch();
            }}
            onReset={clearAllFilters}
          />

          <Skeleton
            active
            loading={query.isLoading && !query.data}
            style={{ marginTop: token.marginMD }}
          >
            <ProTable<PurchaseOrder>
              search={false}
              options={false}
              toolBarRender={false}
              rowKey="id"
              loading={query.isFetching}
              columns={columns}
              dataSource={query.data?.list ?? []}
              scroll={{ x: 2140, y: 540 }}
              rowClassName={() => "purchase-order-row-height"}
              locale={{ emptyText }}
              pagination={{
                current: page,
                pageSize,
                total: query.data?.total ?? 0,
                showSizeChanger: true,
                pageSizeOptions: [10, 20, 50],
                showTotal: (total) => `共 ${total} 条记录`,
                onChange: (nextPage, nextPageSize) => {
                  if (nextPageSize !== pageSize) {
                    setPage(1);
                  } else {
                    setPage(nextPage);
                  }
                  setPageSize(nextPageSize);
                },
              }}
            />
          </Skeleton>
        </div>
      </div>

      <style>{`
        .purchase-order-row-height .ant-table-cell {
          height: 48px;
        }
      `}</style>
    </div>
  );
}
