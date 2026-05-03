import { App, Button, InputNumber, Popconfirm, Result, Skeleton, Table } from "antd";
import {
  ProForm,
  ProFormDatePicker,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  type ProFormInstance,
} from "@ant-design/pro-components";
import dayjs from "dayjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { OutboundOrderType, type OutboundOrderType as OutboundOrderTypeValue } from "@infitek/shared";
import { createOutboundOrder, getOutboundOrderCreatePrefill, OUTBOUND_ORDER_TYPE_LABELS, type CreateOutboundOrderPayload, type OutboundOrderPrefillItem } from "../../api/outbound-orders.api";
import { getCompanies } from "../../api/companies.api";
import { getUsers } from "../../api/users.api";
import { getWarehouses } from "../../api/warehouses.api";
import { AnchorNav, SectionCard, displayOrDash } from "../master-data/components/page-scaffold";
import "../master-data/master-page.css";

interface OutboundOrderFormValues {
  logisticsOrderCode?: string;
  shippingDemandCode?: string;
  salesOrderCode?: string;
  outboundUserId?: number;
  outboundDate?: string;
  outboundType?: OutboundOrderTypeValue;
  salesCompanyId?: number;
  warehouseId?: number;
  remark?: string;
}

interface EditableOutboundItem extends OutboundOrderPrefillItem {
  inputOutboundQuantity?: number;
}

function parsePositiveIntParam(value: string | null) {
  const normalized = value?.trim();
  if (!normalized || !/^\d+$/.test(normalized)) return undefined;
  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function buildRequestKey(logisticsOrderId: number) {
  return `outbound:${logisticsOrderId}:${Date.now()}`;
}

function getProductName(item: OutboundOrderPrefillItem) {
  return item.productNameCn ?? item.productNameEn ?? "—";
}

export default function OutboundOrderFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { message, notification } = App.useApp();
  const formRef = useRef<ProFormInstance<OutboundOrderFormValues>>(undefined);
  const [editableItems, setEditableItems] = useState<EditableOutboundItem[]>([]);
  const [searchParams] = useSearchParams();
  const logisticsOrderId = parsePositiveIntParam(searchParams.get("logisticsOrderId"));
  const requestKey = useMemo(
    () => (logisticsOrderId ? buildRequestKey(logisticsOrderId) : ""),
    [logisticsOrderId],
  );

  const prefillQuery = useQuery({
    queryKey: ["outbound-order-create-prefill", logisticsOrderId],
    queryFn: () => getOutboundOrderCreatePrefill(logisticsOrderId as number),
    enabled: Boolean(logisticsOrderId),
  });

  const warehouseQuery = useQuery({
    queryKey: ["outbound-order-warehouses"],
    queryFn: () => getWarehouses({ page: 1, pageSize: 500 }),
  });

  const userQuery = useQuery({
    queryKey: ["outbound-order-users"],
    queryFn: () => getUsers(1, 200),
  });

  const companyQuery = useQuery({
    queryKey: ["outbound-order-companies"],
    queryFn: () => getCompanies({ page: 1, pageSize: 200 }),
  });

  const warehouseOptions = useMemo(
    () =>
      (warehouseQuery.data?.list ?? []).map((warehouse) => ({
        label: `${warehouse.name}${warehouse.warehouseCode ? ` (${warehouse.warehouseCode})` : ""}`,
        value: Number(warehouse.id),
      })),
    [warehouseQuery.data],
  );

  const userOptions = useMemo(
    () =>
      (userQuery.data?.list ?? []).map((user) => ({
        label: user.name || user.username,
        value: Number(user.id),
      })),
    [userQuery.data],
  );

  const companyOptions = useMemo(
    () =>
      (companyQuery.data?.list ?? []).map((company) => ({
        label: company.nameCn,
        value: Number(company.id),
      })),
    [companyQuery.data],
  );

  const outboundTypeOptions = useMemo(
    () =>
      Object.entries(OUTBOUND_ORDER_TYPE_LABELS).map(([value, label]) => ({
        label,
        value,
      })),
    [],
  );

  const createMutation = useMutation({
    mutationFn: (payload: CreateOutboundOrderPayload) =>
      createOutboundOrder(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({
        queryKey: ["logistics-order-detail", created.logisticsOrderId],
      });
      queryClient.invalidateQueries({ queryKey: ["logistics-orders"] });
      queryClient.invalidateQueries({
        queryKey: ["shipping-demand-detail", created.shippingDemandId],
      });
      queryClient.invalidateQueries({
        queryKey: ["sales-order-detail", created.salesOrderId],
      });
      notification.success({
        message: "发货出库已确认",
        description: `${created.outboundCode} 已完成出库确认。`,
        duration: 5,
      });
      navigate(`/logistics-orders/${created.logisticsOrderId}`);
    },
  });

  const initialValues = useMemo(() => {
    const data = prefillQuery.data;
    return {
      logisticsOrderCode: data?.logisticsOrder.orderCode,
      shippingDemandCode: data?.logisticsOrder.shippingDemandCode,
      salesOrderCode: data?.logisticsOrder.salesOrderCode,
      outboundDate: dayjs().format("YYYY-MM-DD"),
      outboundType: OutboundOrderType.SALES,
      warehouseId: undefined,
    } satisfies Partial<OutboundOrderFormValues>;
  }, [prefillQuery.data]);

  const totals = useMemo(() => {
    return editableItems.reduce(
      (acc, item) => {
        const quantity = Number(item.inputOutboundQuantity ?? 0);
        const salesUnitPrice = Number(item.salesUnitPrice ?? 0);
        const costUnitPrice = Number(item.costUnitPrice ?? 0);
        return {
          salesTotalAmount: acc.salesTotalAmount + salesUnitPrice * quantity,
          costTotalAmount: acc.costTotalAmount + costUnitPrice * quantity,
        };
      },
      { salesTotalAmount: 0, costTotalAmount: 0 },
    );
  }, [editableItems]);

  useEffect(() => {
    const items = prefillQuery.data?.items ?? [];
    setEditableItems(
      items.map((item) => ({
        ...item,
        inputOutboundQuantity: item.remainingQuantity,
      })),
    );
  }, [prefillQuery.data]);

  if (!logisticsOrderId) {
    return (
      <Result
        status="404"
        title="缺少物流单"
        extra={
          <Button type="primary" onClick={() => navigate("/logistics-orders")}>
            返回物流单
          </Button>
        }
      />
    );
  }

  if (prefillQuery.isLoading) {
    return <Skeleton active paragraph={{ rows: 6 }} />;
  }

  if (prefillQuery.isError || !prefillQuery.data) {
    return (
      <Result
        status="error"
        title="发货出库预填信息加载失败"
        extra={[
          <Button key="retry" type="primary" onClick={() => prefillQuery.refetch()}>
            重试
          </Button>,
          <Button key="back" onClick={() => navigate(`/logistics-orders/${logisticsOrderId}`)}>
            返回物流单
          </Button>,
        ]}
      />
    );
  }

  if (!editableItems.length) {
    return (
      <Result
        status="warning"
        title="当前物流单没有可继续出库的货物明细"
        extra={
          <Button type="primary" onClick={() => navigate(`/logistics-orders/${logisticsOrderId}`)}>
            返回物流单
          </Button>
        }
      />
      );
  }

  const anchors = [
    { key: "source", label: "来源信息" },
    { key: "items", label: "出库明细" },
    { key: "remark", label: "备注" },
  ];

  const handleItemChange = (
    logisticsOrderItemId: number,
    patch: Partial<EditableOutboundItem>,
  ) => {
    setEditableItems((current) =>
      current.map((item) =>
        item.logisticsOrderItemId === logisticsOrderItemId
          ? { ...item, ...patch }
          : item,
      ),
    );
  };

  const validateItems = () => {
    for (const item of editableItems) {
      if (
        !Number.isInteger(item.inputOutboundQuantity) ||
        Number(item.inputOutboundQuantity) <= 0
      ) {
        throw new Error(`${item.skuCode} 的实际出库数量必须为正整数`);
      }
      if (Number(item.inputOutboundQuantity) > Number(item.remainingQuantity)) {
        throw new Error(
          `${item.skuCode} 的实际出库数量不能超过剩余可出库数量 ${item.remainingQuantity}`,
        );
      }
    }
  };

  function formatMoney(value: number) {
    return value.toLocaleString("zh-CN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  const columns = [
    {
      title: "SKU编码",
      dataIndex: "skuCode",
      key: "skuCode",
      width: 140,
      fixed: "left" as const,
    },
    {
      title: "产品名称",
      key: "productName",
      width: 200,
      render: (_: unknown, record: OutboundOrderPrefillItem) => getProductName(record),
    },
    {
      title: "单位",
      dataIndex: "unitName",
      key: "unitName",
      width: 90,
      render: displayOrDash,
    },
    {
      title: "批次出库数量",
      key: "editableQuantity",
      width: 150,
      align: "right" as const,
      render: (_: unknown, record: EditableOutboundItem) => (
        <InputNumber
          min={1}
          max={record.remainingQuantity}
          precision={0}
          style={{ width: "100%" }}
          value={record.inputOutboundQuantity}
          onChange={(value) =>
            handleItemChange(record.logisticsOrderItemId, {
              inputOutboundQuantity: typeof value === "number" ? value : undefined,
            })
          }
        />
      ),
    },
    {
      title: "批次号",
      key: "batchNo",
      width: 260,
      render: () => "按已锁定批次 FIFO 自动分配，允许跨批次",
    },
    {
      title: "采购主体",
      dataIndex: "purchaseSubject",
      key: "purchaseSubject",
      width: 180,
      render: displayOrDash,
    },
    {
      title: "销售单价",
      key: "salesUnitPrice",
      width: 120,
      align: "right" as const,
      render: (_: unknown, record: EditableOutboundItem) =>
        record.salesUnitPrice ? formatMoney(Number(record.salesUnitPrice)) : "—",
    },
    {
      title: "销售合计",
      key: "salesAmount",
      width: 120,
      align: "right" as const,
      render: (_: unknown, record: EditableOutboundItem) => {
        const unitPrice = Number(record.salesUnitPrice ?? 0);
        const quantity = Number(record.inputOutboundQuantity ?? 0);
        if (!unitPrice || !quantity) return "—";
        return formatMoney(unitPrice * quantity);
      },
    },
    {
      title: "成本单价",
      key: "costUnitPrice",
      width: 120,
      align: "right" as const,
      render: (_: unknown, record: EditableOutboundItem) =>
        record.costUnitPrice ? formatMoney(Number(record.costUnitPrice)) : "—",
    },
    {
      title: "成本合计",
      key: "costAmount",
      width: 120,
      align: "right" as const,
      render: (_: unknown, record: EditableOutboundItem) => {
        const unitPrice = Number(record.costUnitPrice ?? 0);
        const quantity = Number(record.inputOutboundQuantity ?? 0);
        if (!unitPrice || !quantity) return "—";
        return formatMoney(unitPrice * quantity);
      },
    },
  ];

  return (
    <div className="master-page master-form-page">
      <div className="master-page-header">
        <div className="master-page-heading">
          <div className="master-page-title">创建发货出库单</div>
          <div className="master-page-description">
            {displayOrDash(prefillQuery.data.logisticsOrder.orderCode)} /{" "}
            {displayOrDash(prefillQuery.data.logisticsOrder.shippingDemandCode)}
          </div>
        </div>
      </div>

      <ProForm<OutboundOrderFormValues>
        formRef={formRef}
        submitter={false}
        initialValues={initialValues}
        onFinish={async (values) => {
          try {
            if (!values.warehouseId) {
              message.error("请选择出库仓库");
              return false;
            }
            if (!values.outboundUserId) {
              message.error("请选择出库员");
              return false;
            }
            if (!values.outboundDate) {
              message.error("请选择出库日期");
              return false;
            }
            if (!values.outboundType) {
              message.error("请选择出库类型");
              return false;
            }
            if (!values.salesCompanyId) {
              message.error("请选择销售主体");
              return false;
            }
            validateItems();
          } catch (error) {
            message.error(
              error instanceof Error ? error.message : "请检查出库明细填写",
            );
            return false;
          }
          const payload: CreateOutboundOrderPayload = {
            logisticsOrderId,
            outboundUserId: Number(values.outboundUserId),
            outboundDate: values.outboundDate,
            outboundType: values.outboundType,
            salesCompanyId: Number(values.salesCompanyId),
            warehouseId: Number(values.warehouseId),
            requestKey,
            remark: values.remark?.trim() || undefined,
            items: editableItems.map((item) => ({
              logisticsOrderItemId: Number(item.logisticsOrderItemId),
              outboundQuantity: Number(item.inputOutboundQuantity),
            })),
          };
          await createMutation.mutateAsync(payload);
        }}
      >
        <div className="master-detail-layout">
          <AnchorNav anchors={anchors} activeKey="source" onChange={() => undefined} />

          <div className="master-detail-main">
            <SectionCard id="source" title="来源信息">
              <div className="master-meta-grid">
                <ProFormText name="logisticsOrderCode" label="物流单号" readonly />
                <ProFormText name="shippingDemandCode" label="发货需求编号" readonly />
                <ProFormText name="salesOrderCode" label="销售订单号" readonly />
                <ProFormSelect
                  name="outboundUserId"
                  label="出库员"
                  options={userOptions}
                  fieldProps={{ showSearch: true, optionFilterProp: "label" }}
                />
                <ProFormDatePicker
                  name="outboundDate"
                  label="出库日期"
                  fieldProps={{ style: { width: "100%" } }}
                />
                <ProFormSelect
                  name="outboundType"
                  label="出库类型"
                  options={outboundTypeOptions}
                />
                <ProFormSelect
                  name="salesCompanyId"
                  label="销售主体"
                  options={companyOptions}
                  fieldProps={{ showSearch: true, optionFilterProp: "label" }}
                />
                <ProFormSelect
                  name="warehouseId"
                  label="出库仓库"
                  options={warehouseOptions}
                  fieldProps={{ showSearch: true, optionFilterProp: "label" }}
                />
                <ProFormText
                  label="销售总金额"
                  readonly
                  fieldProps={{
                    value: formatMoney(totals.salesTotalAmount),
                  }}
                />
                <ProFormText
                  label="出库成本金额"
                  readonly
                  fieldProps={{
                    value: formatMoney(totals.costTotalAmount),
                  }}
                />
              </div>
            </SectionCard>

            <SectionCard id="items" title="出库明细">
              <Table<OutboundOrderPrefillItem>
                rowKey="logisticsOrderItemId"
                columns={columns}
                dataSource={editableItems}
                pagination={false}
                scroll={{ x: 1600 }}
              />
              <div
                style={{
                  marginTop: 12,
                  color: "#64748B",
                  fontSize: 12,
                  lineHeight: "20px",
                }}
              >
                批次处理规则：系统按发货需求已锁定库存执行先进先出；若锁定量分布在多个批次，本次出库会自动跨批次消费。
              </div>
            </SectionCard>

            <SectionCard id="remark" title="备注">
              <ProFormTextArea
                name="remark"
                label="仓库出库说明"
                placeholder="填写本次发货出库的补充说明"
                fieldProps={{ maxLength: 1000, showCount: true }}
              />
            </SectionCard>

            <div className="master-page-footer">
              <Popconfirm
                title="确认执行发货出库？"
                description="确认后将扣减实际库存并释放对应锁定量。"
                okText="确认出库"
                cancelText="取消"
                onConfirm={() => formRef.current?.submit()}
              >
                <Button type="primary" loading={createMutation.isPending}>
                  确认出库
                </Button>
              </Popconfirm>
              <Button onClick={() => navigate(`/logistics-orders/${logisticsOrderId}`)}>
                返回物流单
              </Button>
            </div>
          </div>
        </div>
      </ProForm>
    </div>
  );
}
