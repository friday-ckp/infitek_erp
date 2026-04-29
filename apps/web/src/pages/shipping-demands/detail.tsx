import {
  App,
  Button,
  Image,
  InputNumber,
  Modal,
  Result,
  Select,
  Skeleton,
  Space,
  Table,
  Tooltip,
} from "antd";
import {
  BlType,
  CustomsDeclarationMethod,
  DomesticTradeType,
  FulfillmentType,
  InvoiceType,
  OrderNature,
  PlugType,
  PrimaryIndustry,
  ProductLineType,
  ReceiptStatus,
  SalesOrderSource,
  SalesOrderType,
  SecondaryIndustry,
  ShippingDemandStatus,
  TransportationMethod,
  YesNo,
} from "@infitek/shared";
import {
  CheckCircleOutlined,
  DeleteOutlined,
  ExportOutlined,
  FileDoneOutlined,
  FileProtectOutlined,
  FileSearchOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ActivityTimeline } from "../../components/ActivityTimeline";
import {
  confirmShippingDemandAllocation,
  getShippingDemandById,
  voidShippingDemand,
  type ConfirmShippingDemandAllocationPayload,
  type ShippingDemandItem,
} from "../../api/shipping-demands.api";
import {
  getInventoryBatches,
  type InventoryBatchItem,
} from "../../api/inventory.api";
import { getWarehouses, type Warehouse } from "../../api/warehouses.api";
import {
  AnchorNav,
  MetaItem,
  SectionCard,
  SummaryMetaItem,
  displayOrDash,
} from "../master-data/components/page-scaffold";
import "../master-data/master-page.css";

const STATUS_STYLE_MAP: Record<string, { className: string; text: string }> = {
  [ShippingDemandStatus.PENDING_ALLOCATION]: {
    className: "master-pill-blue",
    text: "待分配库存",
  },
  [ShippingDemandStatus.PURCHASING]: {
    className: "master-pill-orange",
    text: "采购中",
  },
  [ShippingDemandStatus.PREPARED]: {
    className: "master-pill-success",
    text: "备货完成",
  },
  [ShippingDemandStatus.PARTIALLY_SHIPPED]: {
    className: "master-pill-orange",
    text: "部分发货",
  },
  [ShippingDemandStatus.SHIPPED]: {
    className: "master-pill-success",
    text: "已发货",
  },
  [ShippingDemandStatus.VOIDED]: {
    className: "master-pill-red",
    text: "已作废",
  },
};

const ORDER_SOURCE_LABELS: Record<string, string> = {
  [SalesOrderSource.MANUAL]: "手工录单",
  [SalesOrderSource.THIRD_PARTY]: "第三方获取",
};

const INVENTORY_BATCH_SOURCE_LABELS: Record<string, string> = {
  initial: "期初录入",
  purchase_receipt: "采购入库",
};

const FULFILLMENT_OPTIONS = [
  { label: "全部采购", value: FulfillmentType.FULL_PURCHASE },
  { label: "部分采购", value: FulfillmentType.PARTIAL_PURCHASE },
  { label: "使用现有库存", value: FulfillmentType.USE_STOCK },
];

interface AllocationDraft {
  fulfillmentType?: FulfillmentType;
  stockQuantity: number;
  warehouseId?: number;
}

interface WarehouseOption {
  label: string;
  value: number;
  availableQuantity: number;
}

const LABEL_MAP: Record<string, string> = {
  [DomesticTradeType.DOMESTIC]: "内销",
  [DomesticTradeType.FOREIGN]: "外销",
  [SalesOrderType.SALES]: "销售订单",
  [SalesOrderType.AFTER_SALES]: "售后订单",
  [SalesOrderType.SAMPLE]: "样品销售",
  [YesNo.YES]: "是",
  [YesNo.NO]: "否",
  [ProductLineType.MAIN]: "主品",
  [ProductLineType.OPTIONAL]: "选配",
  [ProductLineType.STANDARD]: "标配",
  [ProductLineType.GIFT]: "赠品",
  [PlugType.EU]: "欧标",
  [PlugType.UK]: "英标",
  [PlugType.US]: "美标",
  [PlugType.CN]: "中标",
  [PlugType.OTHER]: "其他",
  [PlugType.NONE]: "无",
  [TransportationMethod.SEA]: "海运",
  [TransportationMethod.AIR]: "空运",
  [TransportationMethod.ROAD]: "公路",
  [TransportationMethod.RAIL]: "铁路",
  [TransportationMethod.EXPRESS]: "快递",
  [PrimaryIndustry.EDUCATION]: "教育(教学、科研）",
  [PrimaryIndustry.GOVERNMENT]: "政府",
  [PrimaryIndustry.MEDICAL]: "医疗",
  [PrimaryIndustry.ENTERPRISE]: "企业",
  [SecondaryIndustry.AGRICULTURE_COLLEGE]: "农学院",
  [SecondaryIndustry.FOOD]: "食品",
  [SecondaryIndustry.ANIMAL_SCIENCE]: "动物科学学院",
  [SecondaryIndustry.PHARMACY]: "药学院",
  [SecondaryIndustry.MEDICAL_COLLEGE]: "医学院",
  [SecondaryIndustry.PUBLIC_HEALTH]: "公共卫生学院",
  [SecondaryIndustry.LIFE_SCIENCE]: "生命科学",
  [SecondaryIndustry.ENVIRONMENT]: "环境",
  [OrderNature.BIDDING]: "投标订单",
  [OrderNature.RETAIL]: "零售订单",
  [OrderNature.STOCK_PREPARE]: "备库存订单",
  [ReceiptStatus.UNPAID]: "未收款",
  [ReceiptStatus.PARTIALLY_PAID]: "部分收款",
  [ReceiptStatus.PAID]: "已收款",
  [CustomsDeclarationMethod.SELF]: "公司自行报关",
  [CustomsDeclarationMethod.ALI_ONE_TOUCH]: "阿里一达通报关",
  [InvoiceType.VAT_SPECIAL]: "增值税专用发票",
  [InvoiceType.VAT_NORMAL]: "增值税普通发票",
  [BlType.TELEX_RELEASE]: "电放",
  [BlType.ORIGINAL]: "正本",
  [FulfillmentType.FULL_PURCHASE]: "全部采购",
  [FulfillmentType.PARTIAL_PURCHASE]: "部分采购",
  [FulfillmentType.USE_STOCK]: "使用现有库存",
};

function formatLabel(value?: string | null) {
  if (!value) return "—";
  return LABEL_MAP[value] ?? value;
}

function formatBatchSource(value?: string | null) {
  if (!value) return "—";
  return INVENTORY_BATCH_SOURCE_LABELS[value] ?? value;
}

function formatDate(value?: string | null) {
  return value ? dayjs(value).format("YYYY-MM-DD") : "—";
}

function numberValue(value?: number | string | null) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sumAvailableStock(item: ShippingDemandItem) {
  return (item.availableStockSnapshot ?? []).reduce(
    (sum, row) => sum + numberValue(row.availableQuantity),
    0,
  );
}

function getWarehouseDisplayName(
  warehouseMap: Map<number, Warehouse>,
  warehouseId?: number | null,
) {
  if (!warehouseId) return "未指定仓库";
  const warehouse = warehouseMap.get(warehouseId);
  if (!warehouse) return `仓库 #${warehouseId}`;
  return warehouse.warehouseCode
    ? `${warehouse.name} (${warehouse.warehouseCode})`
    : warehouse.name;
}

function uniqueWarehouses(
  item: ShippingDemandItem,
  warehouseMap: Map<number, Warehouse> = new Map(),
): WarehouseOption[] {
  const map = new Map<number, WarehouseOption>();
  for (const row of item.availableStockSnapshot ?? []) {
    const warehouseId = row.warehouseId;
    if (!warehouseId) continue;
    const current = map.get(warehouseId);
    const availableQuantity = numberValue(row.availableQuantity);
    const totalAvailable =
      availableQuantity + (current?.availableQuantity ?? 0);
    map.set(warehouseId, {
      label: `${getWarehouseDisplayName(warehouseMap, warehouseId)} / 可用 ${totalAvailable}`,
      value: warehouseId,
      availableQuantity: totalAvailable,
    });
  }
  return [...map.values()];
}

function selectWarehouse(
  item: ShippingDemandItem,
  targetQuantity: number,
  warehouseMap: Map<number, Warehouse> = new Map(),
) {
  const warehouses = uniqueWarehouses(item, warehouseMap);
  return (
    warehouses.find(
      (warehouse) => warehouse.availableQuantity >= targetQuantity,
    ) ??
    [...warehouses].sort((a, b) => b.availableQuantity - a.availableQuantity)[0]
  );
}

function getWarehouseAvailable(
  item: ShippingDemandItem,
  warehouseId?: number,
  warehouseMap: Map<number, Warehouse> = new Map(),
) {
  if (!warehouseId) return 0;
  return (
    uniqueWarehouses(item, warehouseMap).find(
      (warehouse) => warehouse.value === warehouseId,
    )?.availableQuantity ?? 0
  );
}

function getFifoPreviewBatches(
  batches: InventoryBatchItem[],
  item: ShippingDemandItem,
  warehouseId?: number,
) {
  if (!warehouseId) return [];
  const skuId = numberValue(item.skuId);
  return batches
    .filter(
      (batch) =>
        numberValue(batch.skuId) === skuId &&
        numberValue(batch.warehouseId) === warehouseId &&
        numberValue(batch.batchAvailableQuantity) > 0,
    )
    .sort((a, b) => {
      const dateCompare = String(a.receiptDate ?? "").localeCompare(
        String(b.receiptDate ?? ""),
      );
      return dateCompare || numberValue(a.id) - numberValue(b.id);
    });
}

function defaultAllocationDraft(
  item: ShippingDemandItem,
  warehouseMap: Map<number, Warehouse> = new Map(),
): AllocationDraft {
  const required = numberValue(item.requiredQuantity);
  const stockQuantity = numberValue(item.stockRequiredQuantity);
  if (item.fulfillmentType) {
    return {
      fulfillmentType: item.fulfillmentType,
      stockQuantity,
      warehouseId:
        stockQuantity > 0
          ? selectWarehouse(item, stockQuantity, warehouseMap)?.value
          : undefined,
    };
  }
  const warehouse = selectWarehouse(item, required, warehouseMap);
  if (warehouse && warehouse.availableQuantity >= required && required > 0) {
    return {
      fulfillmentType: FulfillmentType.USE_STOCK,
      stockQuantity: required,
      warehouseId: warehouse.value,
    };
  }
  if (warehouse && warehouse.availableQuantity > 0 && required > 0) {
    return {
      fulfillmentType: FulfillmentType.PARTIAL_PURCHASE,
      stockQuantity: Math.min(warehouse.availableQuantity, required - 1),
      warehouseId: warehouse.value,
    };
  }
  return {
    fulfillmentType: FulfillmentType.FULL_PURCHASE,
    stockQuantity: 0,
  };
}

function InventoryIndicator({
  available,
  required,
}: {
  available: number;
  required: number;
}) {
  const tone =
    available >= required && required > 0
      ? "success"
      : available > 0
        ? "warning"
        : "danger";
  const text =
    tone === "success" ? "充足" : tone === "warning" ? "部分不足" : "无库存";
  return (
    <span
      className={`shipping-demand-inventory shipping-demand-inventory-${tone}`}
    >
      {text} {available}/{required}
    </span>
  );
}

function StatCard({
  label,
  value,
  subtitle,
  tone,
}: {
  label: string;
  value: ReactNode;
  subtitle: string;
  tone: "blue" | "green" | "orange" | "default";
}) {
  return (
    <div className={`shipping-demand-stat shipping-demand-stat-${tone}`}>
      <div className="shipping-demand-stat-label">{label}</div>
      <div className="shipping-demand-stat-value">{value}</div>
      <div className="shipping-demand-stat-subtitle">{subtitle}</div>
    </div>
  );
}

function FlowProgress({ status }: { status?: ShippingDemandStatus }) {
  const activeIndexByStatus: Record<string, number> = {
    [ShippingDemandStatus.PENDING_ALLOCATION]: 1,
    [ShippingDemandStatus.PURCHASING]: 2,
    [ShippingDemandStatus.PREPARED]: 3,
    [ShippingDemandStatus.PARTIALLY_SHIPPED]: 5,
    [ShippingDemandStatus.SHIPPED]: 6,
    [ShippingDemandStatus.VOIDED]: 0,
  };
  const activeIndex = activeIndexByStatus[status ?? ""] ?? 0;
  const steps = [
    "需求创建",
    "库存检查",
    "采购备货",
    "库存锁定",
    "创建物流",
    "出库发货",
    "完成",
  ];

  return (
    <div className="shipping-demand-flow">
      {steps.map((step, index) => {
        const done = index < activeIndex;
        const active =
          index === activeIndex && status !== ShippingDemandStatus.VOIDED;
        const className = done ? "done" : active ? "active" : "pending";
        return (
          <div className={`shipping-demand-flow-step ${className}`} key={step}>
            <div className="shipping-demand-flow-node">
              {done ? <CheckCircleOutlined /> : index + 1}
            </div>
            <div className="shipping-demand-flow-label">{step}</div>
          </div>
        );
      })}
    </div>
  );
}

function SmartButton({
  icon,
  label,
  count,
  disabled,
  disabledTooltip = "下游模块尚未实现",
  onClick,
}: {
  icon: ReactNode;
  label: string;
  count: number;
  disabled?: boolean;
  disabledTooltip?: string;
  onClick?: () => void;
}) {
  const isDisabled = disabled || !onClick;
  const content = (
    <button
      type="button"
      className={`shipping-demand-smart-button${isDisabled ? " disabled" : ""}`}
      disabled={isDisabled}
      onClick={onClick}
    >
      <span className="shipping-demand-smart-icon">{icon}</span>
      <span>{label}</span>
      <span
        className={`shipping-demand-smart-badge${count === 0 ? " zero" : ""}`}
      >
        {count}
      </span>
    </button>
  );

  return isDisabled ? (
    <Tooltip title={disabledTooltip}>
      <span className="shipping-demand-smart-tooltip">{content}</span>
    </Tooltip>
  ) : (
    content
  );
}

export default function ShippingDemandDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { message, modal, notification } = App.useApp();
  const { id = "" } = useParams();
  const demandId = Number(id);
  const [activeAnchor, setActiveAnchor] = useState("basic");
  const [allocationDrafts, setAllocationDrafts] = useState<
    Record<number, AllocationDraft>
  >({});
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);

  const query = useQuery({
    queryKey: ["shipping-demand-detail", demandId],
    queryFn: () => getShippingDemandById(demandId),
    enabled: Number.isInteger(demandId) && demandId > 0,
  });

  const data = query.data;
  const items = data?.items ?? [];
  const canConfirmAllocation =
    data?.status === ShippingDemandStatus.PENDING_ALLOCATION;
  const canVoidDemand =
    data?.status === ShippingDemandStatus.PENDING_ALLOCATION;
  const canEditDemand = Boolean(data && data.status !== ShippingDemandStatus.VOIDED);
  const canCreateLogisticsOrder =
    (data?.status === ShippingDemandStatus.PREPARED ||
      data?.status === ShippingDemandStatus.PARTIALLY_SHIPPED) &&
    items.some((item) => numberValue(item.lockedRemainingQuantity) > 0);
  const sourceSalesOrderLink = data?.salesOrderId
    ? () => navigate(`/sales-orders/${data.salesOrderId}`)
    : undefined;
  const editSourceSalesOrderLink =
    data?.salesOrderId
      ? () => navigate(`/sales-orders/${data.salesOrderId}/edit`)
      : undefined;
  const totalSkuCount = data?.skuCount ?? items.length;
  const totalRequiredQuantity = items.reduce(
    (sum, item) => sum + numberValue(item.requiredQuantity),
    0,
  );
  const totalLockedQuantity = items.reduce(
    (sum, item) => sum + numberValue(item.lockedRemainingQuantity),
    0,
  );
  const totalShippedQuantity = items.reduce(
    (sum, item) => sum + numberValue(item.shippedQuantity),
    0,
  );
  const batchSkuIds = useMemo(
    () =>
      [
        ...new Set(
          items
            .map((item) => numberValue(item.skuId))
            .filter((skuId) => skuId > 0),
        ),
      ].sort((a, b) => a - b),
    [items],
  );

  const batchesQuery = useQuery({
    queryKey: ["inventory-batches", "shipping-demand-detail", batchSkuIds],
    queryFn: () => getInventoryBatches({ skuIds: batchSkuIds }),
    enabled: canConfirmAllocation && batchSkuIds.length > 0,
  });
  const warehousesQuery = useQuery({
    queryKey: ["shipping-demand-warehouses"],
    queryFn: () => getWarehouses({ page: 1, pageSize: 500 }),
  });
  const warehouseMap = useMemo(() => {
    const map = new Map<number, Warehouse>();
    for (const warehouse of warehousesQuery.data?.list ?? []) {
      const warehouseId = numberValue(warehouse.id);
      if (warehouseId > 0) map.set(warehouseId, warehouse);
    }
    return map;
  }, [warehousesQuery.data]);

  useEffect(() => {
    if (!data?.items?.length) {
      setAllocationDrafts({});
      return;
    }
    setAllocationDrafts(
      Object.fromEntries(
        data.items.map((item) => [item.id, defaultAllocationDraft(item)]),
      ),
    );
  }, [data?.id, data?.status, data?.items]);

  const confirmAllocationMutation = useMutation({
    mutationFn: (payload: ConfirmShippingDemandAllocationPayload) =>
      confirmShippingDemandAllocation(demandId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["shipping-demand-detail", demandId],
      });
      queryClient.invalidateQueries({ queryKey: ["shipping-demands"] });
      queryClient.invalidateQueries({
        queryKey: ["operation-logs", "shipping-demands", demandId],
      });
      setAllocationModalOpen(false);
      notification.success({
        message: "库存分配已确认",
        description:
          "系统已按履行类型更新发货需求，并完成现有库存的 FIFO 锁定。",
        duration: 5,
      });
    },
    onError: (error: unknown) => {
      const err = error as {
        message?: string;
        response?: { data?: { message?: string } };
      };
      message.error(
        err.response?.data?.message ?? err.message ?? "确认分配失败",
      );
    },
  });

  const voidDemandMutation = useMutation({
    mutationFn: () => voidShippingDemand(demandId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["shipping-demand-detail", demandId],
      });
      queryClient.invalidateQueries({ queryKey: ["shipping-demands"] });
      queryClient.invalidateQueries({
        queryKey: ["sales-order-detail", data?.salesOrderId],
      });
      queryClient.invalidateQueries({
        queryKey: ["operation-logs", "shipping-demands", demandId],
      });
      if (data?.salesOrderId) {
        queryClient.invalidateQueries({
          queryKey: ["operation-logs", "sales-orders", data.salesOrderId],
        });
      }
      notification.success({
        message: "发货需求已作废",
        description:
          "系统已释放锁定库存并将销售订单回退为审核通过，可重新生成新的发货需求。",
        duration: 5,
      });
    },
    onError: (error: unknown) => {
      const err = error as {
        message?: string;
        response?: { data?: { message?: string } };
      };
      message.error(
        err.response?.data?.message ?? err.message ?? "作废发货需求失败",
      );
    },
  });

  const handleVoidDemand = () => {
    modal.confirm({
      title: "确认作废此发货需求？",
      content:
        "确认作废此发货需求？作废后将释放已锁定库存，销售订单状态回退为‘审核通过’，操作不可撤销",
      okText: "确认作废",
      cancelText: "取消",
      okButtonProps: { danger: true, loading: voidDemandMutation.isPending },
      onOk: () => voidDemandMutation.mutateAsync(),
    });
  };

  const updateDraft = (itemId: number, patch: Partial<AllocationDraft>) => {
    setAllocationDrafts((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] ?? { stockQuantity: 0 }),
        ...patch,
      },
    }));
  };

  const handleFulfillmentChange = (
    item: ShippingDemandItem,
    fulfillmentType: FulfillmentType,
  ) => {
    const required = numberValue(item.requiredQuantity);
    const warehouse = selectWarehouse(item, required, warehouseMap);
    if (fulfillmentType === FulfillmentType.FULL_PURCHASE) {
      updateDraft(item.id, {
        fulfillmentType,
        stockQuantity: 0,
        warehouseId: undefined,
      });
      return;
    }
    if (fulfillmentType === FulfillmentType.USE_STOCK) {
      updateDraft(item.id, {
        fulfillmentType,
        stockQuantity: required,
        warehouseId: warehouse?.value,
      });
      return;
    }
    updateDraft(item.id, {
      fulfillmentType,
      stockQuantity: warehouse
        ? Math.max(1, Math.min(warehouse.availableQuantity, required - 1))
        : 0,
      warehouseId: warehouse?.value,
    });
  };

  const buildConfirmAllocationPayload =
    (): ConfirmShippingDemandAllocationPayload | null => {
      if (!items.length) {
        message.error("发货需求没有产品明细");
        return null;
      }
      const payloadItems: ConfirmShippingDemandAllocationPayload["items"] = [];
      for (const item of items) {
        const draft = allocationDrafts[item.id];
        const required = numberValue(item.requiredQuantity);
        if (!draft?.fulfillmentType) {
          message.error(`${item.skuCode} 请选择履行类型`);
          return null;
        }
        const stockQuantity = numberValue(draft.stockQuantity);
        const warehouseAvailable = getWarehouseAvailable(
          item,
          draft.warehouseId,
          warehouseMap,
        );
        if (
          !Number.isInteger(stockQuantity) ||
          stockQuantity < 0 ||
          stockQuantity > required
        ) {
          message.error(
            `${item.skuCode} 使用库存数量必须在 0 到 ${required} 之间`,
          );
          return null;
        }
        if (
          draft.fulfillmentType === FulfillmentType.FULL_PURCHASE &&
          stockQuantity !== 0
        ) {
          message.error(`${item.skuCode} 全部采购时使用库存数量必须为 0`);
          return null;
        }
        if (
          draft.fulfillmentType === FulfillmentType.USE_STOCK &&
          stockQuantity !== required
        ) {
          message.error(`${item.skuCode} 使用现有库存时必须覆盖全部应发数量`);
          return null;
        }
        if (
          draft.fulfillmentType === FulfillmentType.PARTIAL_PURCHASE &&
          (stockQuantity <= 0 || stockQuantity >= required)
        ) {
          message.error(
            `${item.skuCode} 部分采购时库存数量必须大于 0 且小于应发数量`,
          );
          return null;
        }
        if (stockQuantity > 0 && !draft.warehouseId) {
          message.error(`${item.skuCode} 使用库存时必须选择仓库`);
          return null;
        }
        if (stockQuantity > 0 && stockQuantity > warehouseAvailable) {
          message.error(
            `${item.skuCode} 可用库存不足，当前仓库可用 ${warehouseAvailable}`,
          );
          return null;
        }
        payloadItems.push({
          itemId: item.id,
          fulfillmentType: draft.fulfillmentType,
          stockQuantity,
          warehouseId: stockQuantity > 0 ? draft.warehouseId : undefined,
        });
      }
      return { items: payloadItems };
    };

  const submitConfirmAllocation = () => {
    const payload = buildConfirmAllocationPayload();
    if (!payload) return;
    confirmAllocationMutation.mutate(payload);
  };

  const allocationColumns = useMemo<ColumnsType<ShippingDemandItem>>(
    () => [
      {
        title: "SKU",
        dataIndex: "skuCode",
        key: "skuCode",
        width: 150,
        fixed: "left" as const,
        render: (value: string, record) => (
          <div className="shipping-demand-allocation-sku">
            <strong>{displayOrDash(value)}</strong>
            <span>
              {displayOrDash(record.productNameCn ?? record.productNameEn)}
            </span>
          </div>
        ),
      },
      {
        title: "规格",
        dataIndex: "skuSpecification",
        key: "skuSpecification",
        width: 150,
        render: displayOrDash,
      },
      {
        title: "应发",
        dataIndex: "requiredQuantity",
        key: "requiredQuantity",
        width: 80,
      },
      {
        title: "可用库存",
        key: "availableStock",
        width: 130,
        render: (_: unknown, record) => (
          <InventoryIndicator
            available={sumAvailableStock(record)}
            required={numberValue(record.requiredQuantity)}
          />
        ),
      },
      {
        title: "履行类型",
        key: "fulfillmentType",
        width: 150,
        render: (_: unknown, record) => (
          <Select<FulfillmentType>
            className="shipping-demand-allocation-control"
            value={allocationDrafts[record.id]?.fulfillmentType}
            options={FULFILLMENT_OPTIONS}
            onChange={(nextValue) => handleFulfillmentChange(record, nextValue)}
          />
        ),
      },
      {
        title: "使用仓库",
        key: "warehouseId",
        width: 190,
        render: (_: unknown, record) => {
          const draft = allocationDrafts[record.id];
          const options = uniqueWarehouses(record, warehouseMap).map(
            ({ label, value }) => ({ label, value }),
          );
          return (
            <Select<number>
              className="shipping-demand-allocation-control"
              value={draft?.warehouseId}
              options={options}
              placeholder="选择仓库"
              disabled={
                !draft?.fulfillmentType ||
                draft.fulfillmentType === FulfillmentType.FULL_PURCHASE ||
                options.length === 0
              }
              onChange={(warehouseId) =>
                updateDraft(record.id, { warehouseId })
              }
            />
          );
        },
      },
      {
        title: "使用库存",
        key: "stockQuantity",
        width: 110,
        render: (_: unknown, record) => {
          const draft = allocationDrafts[record.id];
          return (
            <InputNumber
              className="shipping-demand-allocation-control"
              min={0}
              max={numberValue(record.requiredQuantity)}
              precision={0}
              value={draft?.stockQuantity ?? 0}
              disabled={
                !draft?.fulfillmentType ||
                draft.fulfillmentType === FulfillmentType.FULL_PURCHASE ||
                draft.fulfillmentType === FulfillmentType.USE_STOCK
              }
              onChange={(value) =>
                updateDraft(record.id, { stockQuantity: numberValue(value) })
              }
            />
          );
        },
      },
      {
        title: "需采购",
        key: "purchaseQuantity",
        width: 90,
        render: (_: unknown, record) =>
          Math.max(
            0,
            numberValue(record.requiredQuantity) -
              numberValue(allocationDrafts[record.id]?.stockQuantity),
          ),
      },
      {
        title: "FIFO 批次预览",
        key: "fifoBatchPreview",
        width: 310,
        render: (_: unknown, record) => {
          const draft = allocationDrafts[record.id];
          if (!draft?.warehouseId || numberValue(draft.stockQuantity) <= 0) {
            return "—";
          }
          if (batchesQuery.isLoading) {
            return "加载中...";
          }
          const batches = getFifoPreviewBatches(
            batchesQuery.data ?? [],
            record,
            draft.warehouseId,
          );
          if (!batches.length) {
            return "—";
          }
          return (
            <Space direction="vertical" size={2}>
              {batches.map((batch) => (
                <span key={String(batch.id)}>
                  {formatDate(batch.receiptDate)} /{" "}
                  {formatBatchSource(batch.sourceType)} / 批次{" "}
                  {batch.batchQuantity} / 可用 {batch.batchAvailableQuantity}
                </span>
              ))}
            </Space>
          );
        },
      },
    ],
    [allocationDrafts, batchesQuery.data, batchesQuery.isLoading, warehouseMap],
  );

  const columns = useMemo<ColumnsType<ShippingDemandItem>>(
    () => [
      {
        title: "SKU",
        dataIndex: "skuCode",
        key: "skuCode",
        width: 140,
        fixed: "left" as const,
      },
      {
        title: "产品中文名",
        dataIndex: "productNameCn",
        key: "productNameCn",
        width: 180,
        render: displayOrDash,
      },
      {
        title: "产品英文名",
        dataIndex: "productNameEn",
        key: "productNameEn",
        width: 180,
        render: displayOrDash,
      },
      {
        title: "规格",
        dataIndex: "skuSpecification",
        key: "skuSpecification",
        width: 180,
        render: displayOrDash,
      },
      {
        title: "类型",
        dataIndex: "lineType",
        key: "lineType",
        width: 100,
        render: formatLabel,
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
        title: "有无插头",
        dataIndex: "hasPlug",
        key: "hasPlug",
        width: 100,
        render: formatLabel,
      },
      {
        title: "插头类型",
        dataIndex: "plugType",
        key: "plugType",
        width: 100,
        render: formatLabel,
      },
      {
        title: "应发数量",
        dataIndex: "requiredQuantity",
        key: "requiredQuantity",
        width: 100,
      },
      {
        title: "可用库存",
        key: "availableStock",
        width: 150,
        render: (_: unknown, record: ShippingDemandItem) => (
          <InventoryIndicator
            available={sumAvailableStock(record)}
            required={numberValue(record.requiredQuantity)}
          />
        ),
      },
      {
        title: "履行类型",
        dataIndex: "fulfillmentType",
        key: "fulfillmentType",
        width: 130,
        render: formatLabel,
      },
      {
        title: "销售单价",
        dataIndex: "unitPrice",
        key: "unitPrice",
        width: 120,
      },
      {
        title: "币种",
        dataIndex: "currencyCode",
        key: "currencyCode",
        width: 90,
        render: displayOrDash,
      },
      { title: "总金额", dataIndex: "amount", key: "amount", width: 120 },
      {
        title: "单位",
        dataIndex: "unitName",
        key: "unitName",
        width: 100,
        render: displayOrDash,
      },
      {
        title: "采购人员",
        dataIndex: "purchaserName",
        key: "purchaserName",
        width: 120,
        render: displayOrDash,
      },
      {
        title: "是否需要采购",
        dataIndex: "needsPurchase",
        key: "needsPurchase",
        width: 120,
        render: formatLabel,
      },
      {
        title: "需采购数量",
        dataIndex: "purchaseRequiredQuantity",
        key: "purchaseRequiredQuantity",
        width: 120,
        render: displayOrDash,
      },
      {
        title: "使用现有库存数量",
        dataIndex: "stockRequiredQuantity",
        key: "stockRequiredQuantity",
        width: 150,
        render: displayOrDash,
      },
      {
        title: "已锁定待发",
        dataIndex: "lockedRemainingQuantity",
        key: "lockedRemainingQuantity",
        width: 120,
      },
      {
        title: "已发货数量",
        dataIndex: "shippedQuantity",
        key: "shippedQuantity",
        width: 120,
      },
      {
        title: "采购已下单",
        dataIndex: "purchaseOrderedQuantity",
        key: "purchaseOrderedQuantity",
        width: 120,
      },
      {
        title: "已收货数量",
        dataIndex: "receivedQuantity",
        key: "receivedQuantity",
        width: 120,
      },
      {
        title: "产品材质",
        dataIndex: "material",
        key: "material",
        width: 120,
        render: displayOrDash,
      },
      {
        title: "单品重量(kg)",
        dataIndex: "unitWeightKg",
        key: "unitWeightKg",
        width: 120,
      },
      {
        title: "单品体积(m³)",
        dataIndex: "unitVolumeCbm",
        key: "unitVolumeCbm",
        width: 130,
      },
      {
        title: "总重量(kg)",
        dataIndex: "totalWeightKg",
        key: "totalWeightKg",
        width: 120,
      },
      {
        title: "总体积(m³)",
        dataIndex: "totalVolumeCbm",
        key: "totalVolumeCbm",
        width: 120,
      },
      {
        title: "图片",
        dataIndex: "imageUrl",
        key: "imageUrl",
        width: 100,
        render: (value: string | null) =>
          value ? <Image width={40} src={value} /> : "—",
      },
      {
        title: "库存快照",
        dataIndex: "availableStockSnapshot",
        key: "availableStockSnapshot",
        width: 240,
        render: (value: ShippingDemandItem["availableStockSnapshot"]) =>
          value?.length ? (
            <Space direction="vertical" size={2}>
              {value.map((row) => (
                <span
                  key={`${row.warehouseId ?? "none"}-${row.availableQuantity}`}
                >
                  {getWarehouseDisplayName(warehouseMap, row.warehouseId)}：实存{" "}
                  {row.actualQuantity} / 锁定 {row.lockedQuantity} / 可用{" "}
                  {row.availableQuantity}
                </span>
              ))}
            </Space>
          ) : (
            "—"
          ),
      },
    ],
    [warehouseMap],
  );

  if (!Number.isInteger(demandId) || demandId <= 0) {
    return (
      <Result
        status="404"
        title="发货需求不存在"
        extra={
          <Button type="primary" onClick={() => navigate("/shipping-demands")}>
            返回发货需求
          </Button>
        }
      />
    );
  }

  if (query.isError && !query.data) {
    return (
      <Result
        status="error"
        title="发货需求详情加载失败"
        extra={[
          <Button key="retry" type="primary" onClick={() => query.refetch()}>
            重试
          </Button>,
          <Button key="back" onClick={() => navigate("/shipping-demands")}>
            返回发货需求
          </Button>,
        ]}
      />
    );
  }

  const statusInfo = STATUS_STYLE_MAP[data?.status ?? ""] ?? {
    className: "master-pill-default",
    text: displayOrDash(data?.status),
  };
  const anchors = [
    { key: "basic", label: "基础信息" },
    { key: "order", label: "订单信息" },
    { key: "items", label: "产品明细" },
    { key: "delivery", label: "收发通信息" },
    ...(data?.domesticTradeType === DomesticTradeType.DOMESTIC
      ? [{ key: "domestic", label: "内销收货信息" }]
      : []),
    { key: "shipping", label: "发货要求" },
    { key: "operation", label: "操作记录" },
  ];

  return (
    <div className="master-page">
      <div className="master-summary-card">
        {query.isLoading && !data ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          <>
            <div className="master-summary-code">
              {displayOrDash(data?.demandCode)}
            </div>
            <div className="master-summary-header">
              <div className="master-summary-title-wrap">
                <div className="master-summary-title-row">
                  <div className="master-summary-title">
                    {displayOrDash(data?.sourceDocumentCode)}
                  </div>
                  <span className={`master-pill ${statusInfo.className}`}>
                    {statusInfo.text}
                  </span>
                </div>
              </div>
              <div className="master-summary-actions">
                <Space wrap>
                  <Button onClick={() => navigate("/shipping-demands")}>
                    返回列表
                  </Button>
                  <Button
                    disabled={!sourceSalesOrderLink}
                    onClick={sourceSalesOrderLink}
                  >
                    来源销售订单
                  </Button>
                  <Button
                    disabled={!editSourceSalesOrderLink}
                    onClick={editSourceSalesOrderLink}
                  >
                    编辑来源销售订单
                  </Button>
                  {canEditDemand ? (
                    <Button onClick={() => navigate(`/shipping-demands/${demandId}/edit`)}>
                      编辑发货需求
                    </Button>
                  ) : null}
                  {canConfirmAllocation ? (
                    <Button
                      type="primary"
                      onClick={() => setAllocationModalOpen(true)}
                    >
                      分配库存
                    </Button>
                  ) : null}
                  {canVoidDemand ? (
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      loading={voidDemandMutation.isPending}
                      onClick={handleVoidDemand}
                    >
                      作废
                    </Button>
                  ) : null}
                </Space>
              </div>
            </div>
            <div className="master-summary-meta">
              <SummaryMetaItem
                label="客户"
                value={displayOrDash(data?.customerName)}
              />
              <SummaryMetaItem
                label="客户代码"
                value={displayOrDash(data?.customerCode)}
              />
              <SummaryMetaItem
                label="币种"
                value={displayOrDash(data?.currencyCode)}
              />
              <SummaryMetaItem
                label="总金额"
                value={displayOrDash(data?.totalAmount)}
              />
            </div>
          </>
        )}
      </div>

      <SectionCard
        id="hub"
        title="发货枢纽"
        description="查看流程阶段、关联入口和履约数量摘要。"
      >
        <div className="shipping-demand-hub">
          <FlowProgress status={data?.status} />
          <div className="shipping-demand-smart-row">
            <SmartButton
              icon={<FileSearchOutlined />}
              label="来源销售订单"
              count={data ? 1 : 0}
              disabledTooltip="发货需求加载后可跳转"
              onClick={sourceSalesOrderLink}
            />
            <SmartButton
              icon={<FileProtectOutlined />}
              label="采购订单"
              count={0}
              disabled
            />
            <SmartButton
              icon={<ExportOutlined />}
              label="物流单"
              count={0}
              disabled={!canCreateLogisticsOrder}
              disabledTooltip={
                data?.status === ShippingDemandStatus.VOIDED
                  ? "已作废的发货需求不能创建物流单"
                  : "备货完成且存在已锁定待发数量后可创建物流单"
              }
              onClick={
                canCreateLogisticsOrder
                  ? () =>
                      navigate(
                        `/logistics-orders/create?shippingDemandId=${demandId}`,
                      )
                  : undefined
              }
            />
            <SmartButton
              icon={<FileDoneOutlined />}
              label="出库单"
              count={0}
              disabled
            />
          </div>
          <div className="shipping-demand-stat-grid">
            <StatCard
              label="总 SKU 种类"
              value={totalSkuCount}
              subtitle="按发货需求明细统计"
              tone="blue"
            />
            <StatCard
              label="总应发数量"
              value={totalRequiredQuantity}
              subtitle="来自销售订单签约数量"
              tone="default"
            />
            <StatCard
              label="已锁定数量"
              value={totalLockedQuantity}
              subtitle="当前锁定待发数量"
              tone="green"
            />
            <StatCard
              label="已出库数量"
              value={totalShippedQuantity}
              subtitle="累计已发货数量"
              tone="orange"
            />
          </div>
        </div>
      </SectionCard>

      <div className="master-detail-layout">
        <AnchorNav
          anchors={anchors}
          activeKey={activeAnchor}
          onChange={setActiveAnchor}
        />
        <div className="master-detail-main">
          <SectionCard
            id="basic"
            title="基础信息"
            description="查看发货需求来源、客户和主键信息。"
          >
            <div className="master-meta-grid">
              <MetaItem
                label="发货需求编号"
                value={displayOrDash(data?.demandCode)}
              />
              <MetaItem
                label="来源销售订单"
                value={
                  data?.salesOrderId ? (
                    <a onClick={sourceSalesOrderLink}>
                      {displayOrDash(data.sourceDocumentCode)}
                    </a>
                  ) : (
                    displayOrDash(data?.sourceDocumentCode)
                  )
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
                label="订单来源"
                value={
                  data?.orderSource
                    ? (ORDER_SOURCE_LABELS[data.orderSource] ??
                      data.orderSource)
                    : "—"
                }
              />
              <MetaItem
                label="内外销"
                value={formatLabel(data?.domesticTradeType)}
              />
              <MetaItem
                label="订单号"
                value={displayOrDash(data?.externalOrderCode)}
              />
              <MetaItem label="订单类型" value={formatLabel(data?.orderType)} />
              <MetaItem
                label="客户"
                value={displayOrDash(data?.customerName)}
              />
              <MetaItem
                label="客户代码"
                value={displayOrDash(data?.customerCode)}
              />
              <MetaItem
                label="联系人"
                value={displayOrDash(data?.customerContactPerson)}
              />
              <MetaItem
                label="售后原订单号"
                value={displayOrDash(data?.afterSalesSourceOrderCode)}
              />
              <MetaItem
                label="运抵国"
                value={displayOrDash(data?.destinationCountryName)}
              />
              <MetaItem
                label="起运地"
                value={displayOrDash(data?.shipmentOriginCountryName)}
              />
              <MetaItem
                label="签约公司"
                value={displayOrDash(data?.signingCompanyName)}
              />
              <MetaItem
                label="销售员"
                value={displayOrDash(data?.salespersonName)}
              />
              <MetaItem
                label="商务跟单"
                value={displayOrDash(data?.merchandiserName)}
              />
              <MetaItem
                label="商务跟单英文简写"
                value={displayOrDash(data?.merchandiserAbbr)}
              />
              <MetaItem
                label="所有售后产品品名及对应总价"
                value={displayOrDash(data?.afterSalesProductSummary)}
                full
              />
            </div>
          </SectionCard>

          <SectionCard
            id="order"
            title="订单信息"
            description="查看交付、收款和订单附加属性。"
          >
            <div className="master-meta-grid">
              <MetaItem
                label="要求到货日期"
                value={formatDate(data?.requiredDeliveryAt)}
              />
              <MetaItem
                label="付款方式"
                value={displayOrDash(data?.paymentTerm)}
              />
              <MetaItem
                label="外销币种"
                value={displayOrDash(data?.currencyCode)}
              />
              <MetaItem
                label="目的地"
                value={displayOrDash(data?.destinationPortName)}
              />
              <MetaItem
                label="合同金额"
                value={displayOrDash(data?.contractAmount)}
              />
              <MetaItem
                label="已收款金额"
                value={displayOrDash(data?.receivedAmount)}
              />
              <MetaItem
                label="待收款金额"
                value={displayOrDash(data?.outstandingAmount)}
              />
              <MetaItem
                label="产品合计金额"
                value={displayOrDash(data?.productTotalAmount)}
              />
              <MetaItem
                label="加项费用合计"
                value={displayOrDash(data?.expenseTotalAmount)}
              />
              <MetaItem
                label="订单总金额"
                value={displayOrDash(data?.totalAmount)}
              />
              <MetaItem
                label="贸易术语"
                value={displayOrDash(data?.tradeTerm)}
              />
              <MetaItem
                label="运输方式"
                value={formatLabel(data?.transportationMethod)}
              />
              <MetaItem
                label="一级行业"
                value={formatLabel(data?.primaryIndustry)}
              />
              <MetaItem
                label="二级行业"
                value={formatLabel(data?.secondaryIndustry)}
              />
              <MetaItem
                label="订单性质"
                value={formatLabel(data?.orderNature)}
              />
              <MetaItem
                label="汇率"
                value={displayOrDash(data?.exchangeRate)}
              />
              <MetaItem
                label="CRM签约日期"
                value={formatDate(data?.crmSignedAt)}
              />
              <MetaItem
                label="银行账号"
                value={displayOrDash(data?.bankAccount)}
              />
              <MetaItem
                label="额外查看人"
                value={displayOrDash(data?.extraViewerName)}
              />
              <MetaItem
                label="收款状态"
                value={formatLabel(data?.receiptStatus)}
              />
              <MetaItem
                label="是否分摊订单"
                value={formatLabel(data?.isSharedOrder)}
              />
              <MetaItem
                label="是否中信保"
                value={formatLabel(data?.isSinosure)}
              />
              <MetaItem
                label="是否打托"
                value={formatLabel(data?.isPalletized)}
              />
              <MetaItem
                label="是否需要清关证书"
                value={formatLabel(data?.requiresCustomsCertificate)}
              />
              <MetaItem
                label="是否提前分单"
                value={formatLabel(data?.isSplitInAdvance)}
              />
              <MetaItem
                label="是否使用市场经费"
                value={formatLabel(data?.usesMarketingFund)}
              />
              <MetaItem
                label="是否出口报关"
                value={formatLabel(data?.requiresExportCustoms)}
              />
              <MetaItem
                label="是否需要质保卡"
                value={formatLabel(data?.requiresWarrantyCard)}
              />
              <MetaItem
                label="是否产假交接单"
                value={formatLabel(data?.requiresMaternityHandover)}
              />
              <MetaItem
                label="报关方式"
                value={formatLabel(data?.customsDeclarationMethod)}
              />
              <MetaItem label="是否投保" value={formatLabel(data?.isInsured)} />
              <MetaItem
                label="是否阿里信保订单"
                value={formatLabel(data?.isAliTradeAssurance)}
              />
              <MetaItem
                label="阿里信保订单号"
                value={displayOrDash(data?.aliTradeAssuranceOrderCode)}
              />
              <MetaItem
                label="询价货代及费用"
                value={displayOrDash(data?.forwarderQuoteNote)}
                full
              />
              <MetaItem
                label="合同文件"
                value={
                  data?.contractFileUrls?.length
                    ? data.contractFileUrls.map((url, idx) => (
                        <div key={url}>
                          <a href={url} target="_blank" rel="noreferrer">
                            {data.contractFileNames?.[idx] ?? `文件${idx + 1}`}
                          </a>
                        </div>
                      ))
                    : "—"
                }
                full
              />
              <MetaItem
                label="插头照片"
                value={
                  data?.plugPhotoUrls?.length ? (
                    <Space wrap>
                      {data.plugPhotoUrls.map((url) => (
                        <Image key={url} width={80} src={url} />
                      ))}
                    </Space>
                  ) : (
                    "—"
                  )
                }
                full
              />
            </div>
          </SectionCard>

          <SectionCard
            id="items"
            title="产品明细"
            description="查看生成时继承的订单 SKU、履约数量和库存快照。待分配状态可确认履行类型。"
            bodyClassName="master-section-table"
          >
            <Table
              rowKey="id"
              pagination={false}
              columns={columns as any}
              dataSource={items}
              scroll={{ x: 4200 }}
            />
          </SectionCard>

          <SectionCard
            id="delivery"
            title="收发通信息"
            description="收货人、通知人和发货人信息。"
          >
            <div className="master-meta-grid">
              <MetaItem
                label="收货人公司(Consignee)"
                value={displayOrDash(data?.consigneeCompany)}
                full
              />
              <MetaItem
                label="收货人其他信息"
                value={displayOrDash(data?.consigneeOtherInfo)}
                full
              />
              <MetaItem
                label="通知人公司(Notify)"
                value={displayOrDash(data?.notifyCompany)}
                full
              />
              <MetaItem
                label="通知人其他信息"
                value={displayOrDash(data?.notifyOtherInfo)}
                full
              />
              <MetaItem
                label="发货人公司(Shipper)"
                value={displayOrDash(data?.shipperCompany)}
                full
              />
              <MetaItem
                label="发货人其他信息"
                value={displayOrDash(data?.shipperOtherInfoCompanyName)}
              />
            </div>
          </SectionCard>

          {data?.domesticTradeType === DomesticTradeType.DOMESTIC ? (
            <SectionCard
              id="domestic"
              title="内销收货信息"
              description="内销订单的客户收货信息。"
            >
              <div className="master-meta-grid">
                <MetaItem
                  label="客户公司"
                  value={displayOrDash(data?.domesticCustomerCompany)}
                  full
                />
                <MetaItem
                  label="客户收货信息"
                  value={displayOrDash(data?.domesticCustomerDeliveryInfo)}
                  full
                />
              </div>
            </SectionCard>
          ) : null}

          <SectionCard
            id="shipping"
            title="发货要求"
            description="查看唛头、发票与清关要求。"
          >
            <div className="master-meta-grid">
              <MetaItem
                label="是否公司常规唛头"
                value={formatLabel(data?.usesDefaultShippingMark)}
              />
              <MetaItem
                label="唛头补充信息"
                value={displayOrDash(data?.shippingMarkNote)}
              />
              <MetaItem
                label="唛头模板"
                value={
                  data?.shippingMarkTemplateUrl ? (
                    <a
                      href={data.shippingMarkTemplateUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {data.shippingMarkTemplateKey?.split("/").pop() ??
                        "查看模板"}
                    </a>
                  ) : (
                    displayOrDash(data?.shippingMarkTemplateKey)
                  )
                }
              />
              <MetaItem
                label="客户是否需要开票"
                value={formatLabel(data?.needsInvoice)}
              />
              <MetaItem
                label="开票类型"
                value={formatLabel(data?.invoiceType)}
              />
              <MetaItem
                label="随货文件"
                value={displayOrDash(data?.shippingDocumentsNote)}
              />
              <MetaItem
                label="签单/出提单方式"
                value={formatLabel(data?.blType)}
              />
              <MetaItem
                label="正本邮寄地址"
                value={displayOrDash(data?.originalMailAddress)}
                full
              />
              <MetaItem
                label="业务整改要求"
                value={displayOrDash(data?.businessRectificationNote)}
                full
              />
              <MetaItem
                label="清关单据要求"
                value={displayOrDash(data?.customsDocumentNote)}
                full
              />
              <MetaItem
                label="其他要求及注意事项"
                value={displayOrDash(data?.otherRequirementNote)}
                full
              />
            </div>
          </SectionCard>

          <SectionCard
            id="operation"
            title="操作记录"
            description="展示发货需求的生成和后续处理轨迹。"
          >
            <ActivityTimeline
              resourceType="shipping-demands"
              resourceId={demandId}
            />
          </SectionCard>
        </div>
      </div>
      <Modal
        title={
          <div className="shipping-demand-allocation-title">
            <span>分配库存</span>
            <small>
              {displayOrDash(data?.demandCode)} /{" "}
              {displayOrDash(data?.sourceDocumentCode)}
            </small>
          </div>
        }
        open={allocationModalOpen}
        width="min(1440px, calc(100vw - 48px))"
        centered
        rootClassName="shipping-demand-allocation-dialog"
        destroyOnHidden
        okText="确认分配"
        cancelText="取消"
        confirmLoading={confirmAllocationMutation.isPending}
        onOk={submitConfirmAllocation}
        onCancel={() => setAllocationModalOpen(false)}
      >
        <div className="shipping-demand-allocation-modal">
          <div className="shipping-demand-allocation-summary">
            <span>总 SKU {totalSkuCount}</span>
            <span>总应发 {totalRequiredQuantity}</span>
            <span>
              当前可用{" "}
              {items.reduce((sum, item) => sum + sumAvailableStock(item), 0)}
            </span>
            <span>确认后按 FIFO 锁定库存并刷新明细</span>
          </div>
          <Table
            rowKey="id"
            pagination={false}
            columns={allocationColumns as any}
            dataSource={items}
            loading={batchesQuery.isLoading || warehousesQuery.isLoading}
            scroll={{ x: 1280, y: "calc(100vh - 360px)" }}
          />
        </div>
      </Modal>
    </div>
  );
}
