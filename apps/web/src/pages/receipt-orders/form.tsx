import { UploadOutlined } from "@ant-design/icons";
import {
  App,
  Button,
  Empty,
  InputNumber,
  Popconfirm,
  Result,
  Select,
  Table,
  Upload,
  type UploadFile,
} from "antd";
import {
  ProForm,
  ProFormDatePicker,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  type ProFormInstance,
} from "@ant-design/pro-components";
import { ReceiptOrderType } from "@infitek/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs, { type Dayjs } from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getCompanies } from "../../api/companies.api";
import {
  createReceiptOrder,
  getReceiptOrderCreatePrefill,
  getReceiptPurchaseOrderOptions,
  RECEIPT_ORDER_TYPE_LABELS,
  uploadReceiptOrderQcImage,
  type ReceiptOrderPrefillItem,
} from "../../api/receipt-orders.api";
import { getUsers } from "../../api/users.api";
import { getWarehouses } from "../../api/warehouses.api";
import {
  AnchorNav,
  SectionCard,
  displayOrDash,
} from "../master-data/components/page-scaffold";
import "../master-data/master-page.css";

interface ReceiptOrderFormValues {
  purchaseOrderId?: number;
  receiptType?: ReceiptOrderType;
  warehouseId?: number;
  receiptDate?: Dayjs;
  receiverId?: number;
  purchaseCompanyId?: number;
  shippingDemandCode?: string;
  purchaseOrderCode?: string;
  totalQuantity?: string;
  totalAmount?: string;
  inventoryNote?: string;
  remark?: string;
}

interface EditableReceiptItem extends ReceiptOrderPrefillItem {
  inputReceivedQuantity: number;
  warehouseId?: number;
}

function formatMoney(value: number) {
  return value.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ReceiptOrderFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const { message, notification } = App.useApp();
  const formRef = useRef<ProFormInstance<ReceiptOrderFormValues>>(undefined);
  const [activeAnchor, setActiveAnchor] = useState("basic");
  const [selectedPurchaseOrderId, setSelectedPurchaseOrderId] = useState<
    number | undefined
  >(() => {
    const raw = searchParams.get("purchaseOrderId");
    return raw ? Number(raw) : undefined;
  });
  const [receiptItems, setReceiptItems] = useState<EditableReceiptItem[]>([]);
  const [qcFileLists, setQcFileLists] = useState<Record<number, UploadFile[]>>(
    {},
  );
  const [uploadingItemId, setUploadingItemId] = useState<number | null>(null);

  const prefillQuery = useQuery({
    queryKey: ["receipt-order-create-prefill", selectedPurchaseOrderId],
    queryFn: () => getReceiptOrderCreatePrefill(selectedPurchaseOrderId!),
    enabled:
      Number.isInteger(selectedPurchaseOrderId) &&
      Number(selectedPurchaseOrderId) > 0,
  });

  const warehouseQuery = useQuery({
    queryKey: ["receipt-order-warehouses"],
    queryFn: () => getWarehouses({ pageSize: 100 }),
  });

  const warehouseOptions = useMemo(
    () =>
      (warehouseQuery.data?.list ?? []).map((warehouse) => ({
        label: `${warehouse.name}${warehouse.warehouseCode ? ` (${warehouse.warehouseCode})` : ""}`,
        value: Number(warehouse.id),
      })),
    [warehouseQuery.data],
  );

  useEffect(() => {
    if (!prefillQuery.data) return;
    const { purchaseOrder, items } = prefillQuery.data;
    setReceiptItems(
      items.map((item) => ({
        ...item,
        inputReceivedQuantity: item.remainingQuantity,
        warehouseId: undefined,
      })),
    );
    setQcFileLists({});
    formRef.current?.setFieldsValue({
      purchaseOrderId: purchaseOrder.id,
      receiptType: ReceiptOrderType.PURCHASE_RECEIPT,
      receiptDate: dayjs(),
      purchaseCompanyId: purchaseOrder.purchaseCompanyId ?? undefined,
      shippingDemandCode: purchaseOrder.shippingDemandCode ?? undefined,
      purchaseOrderCode: purchaseOrder.poCode,
    });
  }, [prefillQuery.data]);

  const totals = useMemo(() => {
    const totalQuantity = receiptItems.reduce(
      (sum, item) => sum + Number(item.inputReceivedQuantity ?? 0),
      0,
    );
    const totalAmount = receiptItems.reduce(
      (sum, item) =>
        sum +
        Number(item.inputReceivedQuantity ?? 0) * Number(item.unitPrice ?? 0),
      0,
    );
    return { totalQuantity, totalAmount };
  }, [receiptItems]);

  useEffect(() => {
    formRef.current?.setFieldsValue({
      totalQuantity: String(totals.totalQuantity),
      totalAmount: formatMoney(totals.totalAmount),
    });
  }, [totals]);

  const createMutation = useMutation({
    mutationFn: createReceiptOrder,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({
        queryKey: ["purchase-order-detail", created.purchaseOrderId],
      });
      queryClient.invalidateQueries({
        queryKey: ["receipt-order-create-prefill", created.purchaseOrderId],
      });
      notification.success({
        message: "收货入库已确认",
        description: `${created.receiptCode} 已完成入库，关联采购订单 ${created.purchaseOrderCode}。`,
        duration: 5,
      });
      navigate(`/purchase-orders/${created.purchaseOrderId}`);
    },
  });

  const anchors = [
    { key: "basic", label: "基础信息" },
    { key: "receipt", label: "入库明细" },
    { key: "notes", label: "备注说明" },
  ];

  const handleDefaultWarehouseChange = (warehouseId?: number) => {
    if (!warehouseId) return;
    setReceiptItems((current) =>
      current.map((item) => ({
        ...item,
        warehouseId,
      })),
    );
  };

  const handleItemChange = (
    purchaseOrderItemId: number,
    patch: Partial<EditableReceiptItem>,
  ) => {
    setReceiptItems((current) =>
      current.map((item) =>
        item.purchaseOrderItemId === purchaseOrderItemId
          ? { ...item, ...patch }
          : item,
      ),
    );
  };

  const handleQcUpload = async (
    purchaseOrderItemId: number,
    file: File,
  ): Promise<boolean> => {
    setUploadingItemId(purchaseOrderItemId);
    try {
      const result = await uploadReceiptOrderQcImage(file);
      const currentKeys =
        receiptItems.find(
          (item) => item.purchaseOrderItemId === purchaseOrderItemId,
        )?.qcImageKeys ?? [];
      handleItemChange(purchaseOrderItemId, {
        qcImageKeys: [...currentKeys, result.key],
      });
      setQcFileLists((current) => ({
        ...current,
        [purchaseOrderItemId]: [
          ...(current[purchaseOrderItemId] ?? []),
          {
            uid: result.key,
            name: file.name,
            status: "done",
          },
        ],
      }));
      return false;
    } finally {
      setUploadingItemId(null);
    }
  };

  const itemColumns = [
    {
      title: "SKU",
      dataIndex: "skuCode",
      key: "skuCode",
      width: 140,
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
      width: 140,
      render: displayOrDash,
    },
    {
      title: "采购数量",
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      align: "right" as const,
    },
    {
      title: "已收货数量",
      dataIndex: "receivedQuantity",
      key: "receivedQuantity",
      width: 110,
      align: "right" as const,
      render: (_: unknown, record: EditableReceiptItem) => record.receivedQuantity,
    },
    {
      title: "剩余可收货",
      dataIndex: "remainingQuantity",
      key: "remainingQuantity",
      width: 120,
      align: "right" as const,
    },
    {
      title: "入库数量",
      dataIndex: "editableQuantity",
      key: "editableQuantity",
      width: 120,
      render: (_: unknown, record: EditableReceiptItem) => (
        <InputNumber
          min={0}
          max={record.remainingQuantity}
          precision={0}
          value={record.receivedQuantity}
          style={{ width: "100%" }}
          onChange={(value) =>
            handleItemChange(record.purchaseOrderItemId, {
              inputReceivedQuantity: Number(value ?? 0),
            })
          }
        />
      ),
    },
    {
      title: "采购单价",
      dataIndex: "unitPrice",
      key: "unitPrice",
      width: 120,
      align: "right" as const,
      render: (value: number) => formatMoney(Number(value ?? 0)),
    },
    {
      title: "目标仓库",
      dataIndex: "warehouseId",
      key: "warehouseId",
      width: 220,
      render: (_: unknown, record: EditableReceiptItem) => (
        <Select
          showSearch
          allowClear
          placeholder="选择目标仓库"
          options={warehouseOptions}
          value={record.warehouseId}
          style={{ width: "100%" }}
          optionFilterProp="label"
          onChange={(value) =>
            handleItemChange(record.purchaseOrderItemId, {
              warehouseId: value,
            })
          }
        />
      ),
    },
    {
      title: "质检图片",
      dataIndex: "qcImageKeys",
      key: "qcImageKeys",
      width: 220,
      render: (_: unknown, record: EditableReceiptItem) => (
        <Upload
          multiple
          fileList={qcFileLists[record.purchaseOrderItemId] ?? []}
          beforeUpload={(file) =>
            handleQcUpload(record.purchaseOrderItemId, file)
          }
          onRemove={(file) => {
            setQcFileLists((current) => ({
              ...current,
              [record.purchaseOrderItemId]: (
                current[record.purchaseOrderItemId] ?? []
              ).filter((item) => item.uid !== file.uid),
            }));
            handleItemChange(record.purchaseOrderItemId, {
              qcImageKeys: (record.qcImageKeys ?? []).filter(
                (key) => key !== file.uid,
              ),
            });
          }}
        >
          <Button
            icon={<UploadOutlined />}
            loading={uploadingItemId === record.purchaseOrderItemId}
          >
            上传
          </Button>
        </Upload>
      ),
    },
  ];

  if (
    selectedPurchaseOrderId &&
    prefillQuery.isError &&
    !prefillQuery.data
  ) {
    return (
      <Result
        status="error"
        title="收货入库预填失败"
        extra={[
          <Button key="retry" type="primary" onClick={() => prefillQuery.refetch()}>
            重试
          </Button>,
          <Button key="back" onClick={() => navigate("/purchase-orders")}>
            返回采购订单
          </Button>,
        ]}
      />
    );
  }

  return (
    <div className="master-page master-form-page">
      <div className="master-page-header">
        <div className="master-page-heading">
          <div className="master-page-title">创建收货入库单</div>
          <div className="master-page-description">
            关联采购订单录入本次实收数量，确认后自动生成采购入库批次和库存流水。
          </div>
        </div>
      </div>

      <ProForm<ReceiptOrderFormValues>
        formRef={formRef}
        submitter={false}
        initialValues={{
          receiptType: ReceiptOrderType.PURCHASE_RECEIPT,
          receiptDate: dayjs(),
        }}
        onFinish={async (values) => {
          if (!values.purchaseOrderId) {
            message.error("请选择采购订单");
            return false;
          }
          if (!values.warehouseId) {
            message.error("请选择默认入库仓库");
            return false;
          }
          if (!values.receiverId) {
            message.error("请选择入库员");
            return false;
          }

          const positiveItems = receiptItems
            .filter((item) => Number(item.inputReceivedQuantity ?? 0) > 0)
            .map((item) => ({
              purchaseOrderItemId: item.purchaseOrderItemId,
              receivedQuantity: Number(item.inputReceivedQuantity ?? 0),
              warehouseId: item.warehouseId,
              qcImageKeys: item.qcImageKeys,
            }));

          if (!positiveItems.length) {
            message.error("至少需要录入一条入库数量大于 0 的明细");
            return false;
          }

          const missingWarehouseItem = positiveItems.find(
            (item) => !item.warehouseId && !values.warehouseId,
          );
          if (missingWarehouseItem) {
            message.error("请为所有入库数量大于 0 的明细选择目标仓库");
            return false;
          }

          await createMutation.mutateAsync({
            purchaseOrderId: Number(values.purchaseOrderId),
            requestKey: `receipt-order:${Date.now()}`,
            receiptType: ReceiptOrderType.PURCHASE_RECEIPT,
            warehouseId: Number(values.warehouseId),
            receiptDate: (values.receiptDate ?? dayjs()).format("YYYY-MM-DD"),
            receiverId: Number(values.receiverId),
            purchaseCompanyId: values.purchaseCompanyId
              ? Number(values.purchaseCompanyId)
              : undefined,
            inventoryNote: values.inventoryNote,
            remark: values.remark,
            items: positiveItems,
          });
          return true;
        }}
      >
        <div className="master-form-layout">
          <AnchorNav
            anchors={anchors}
            activeKey={activeAnchor}
            onChange={setActiveAnchor}
          />
          <div className="master-form-main">
            <SectionCard
              id="basic"
              title="基础信息"
              description="先选择采购订单，再确认本次入库的默认仓库、日期和入库员。"
            >
              <div className="master-form-grid">
                <ProFormSelect
                  name="purchaseOrderId"
                  label="采购订单"
                  placeholder="搜索采购订单号 / 供应商 / 发货需求"
                  showSearch
                  rules={[{ required: true, message: "请选择采购订单" }]}
                  request={async ({ keyWords }) => {
                    const options = await getReceiptPurchaseOrderOptions(
                      keyWords,
                    );
                    return options.map((option) => ({
                      label: `${option.poCode} / ${option.supplierName} / 剩余 ${option.remainingTotalQuantity}`,
                      value: option.id,
                    }));
                  }}
                  fieldProps={{
                    optionFilterProp: "label",
                    onChange: (value) => {
                      setSelectedPurchaseOrderId(
                        value ? Number(value) : undefined,
                      );
                    },
                  }}
                />
                <ProFormText
                  name="purchaseOrderCode"
                  label="采购订单号"
                  readonly
                />
                <ProFormSelect
                  name="receiptType"
                  label="入库类型"
                  disabled
                  options={Object.entries(RECEIPT_ORDER_TYPE_LABELS).map(
                    ([value, label]) => ({
                      label,
                      value,
                    }),
                  )}
                />
                <ProFormDatePicker
                  name="receiptDate"
                  label="入库日期"
                  rules={[{ required: true, message: "请选择入库日期" }]}
                />
                <ProFormSelect
                  name="warehouseId"
                  label="入库仓库"
                  showSearch
                  rules={[{ required: true, message: "请选择默认入库仓库" }]}
                  request={async ({ keyWords }) => {
                    const response = await getWarehouses({
                      keyword: keyWords,
                      pageSize: 100,
                    });
                    return response.list.map((warehouse) => ({
                      label: `${warehouse.name}${warehouse.warehouseCode ? ` (${warehouse.warehouseCode})` : ""}`,
                      value: Number(warehouse.id),
                    }));
                  }}
                  fieldProps={{
                    optionFilterProp: "label",
                    onChange: (value) =>
                      handleDefaultWarehouseChange(
                        value ? Number(value) : undefined,
                      ),
                  }}
                />
                <ProFormSelect
                  name="receiverId"
                  label="入库员"
                  showSearch
                  rules={[{ required: true, message: "请选择入库员" }]}
                  request={async ({ keyWords }) => {
                    const response = await getUsers(1, 100, keyWords);
                    return response.list.map((user) => ({
                      label: `${user.name} (${user.username})`,
                      value: Number(user.id),
                    }));
                  }}
                  fieldProps={{ optionFilterProp: "label" }}
                />
                <ProFormSelect
                  name="purchaseCompanyId"
                  label="采购主体"
                  showSearch
                  request={async ({ keyWords }) => {
                    const response = await getCompanies({
                      keyword: keyWords,
                      pageSize: 100,
                    });
                    return response.list.map((company) => ({
                      label: company.nameCn,
                      value: Number(company.id),
                    }));
                  }}
                  fieldProps={{ optionFilterProp: "label" }}
                />
                <ProFormText
                  name="shippingDemandCode"
                  label="发货需求编号"
                  readonly
                />
                <ProFormText
                  name="totalQuantity"
                  label="入库总数量"
                  readonly
                />
                <ProFormText
                  name="totalAmount"
                  label="入库总金额"
                  readonly
                />
              </div>
            </SectionCard>

            <SectionCard
              id="receipt"
              title="入库明细"
              description="默认按剩余可收货数量全额预填；可把本次未到货行改为 0，系统只处理入库数量大于 0 的明细。"
            >
              <Table<EditableReceiptItem>
                rowKey="purchaseOrderItemId"
                pagination={false}
                columns={itemColumns as never}
                dataSource={receiptItems}
                scroll={{ x: 1400 }}
                locale={{ emptyText: <Empty description="请选择采购订单后加载明细" /> }}
              />
            </SectionCard>

            <SectionCard id="notes" title="备注说明">
              <div className="master-form-grid">
                <div className="full">
                  <ProFormTextArea
                    name="inventoryNote"
                    label="库存说明"
                    fieldProps={{ rows: 3 }}
                  />
                </div>
                <div className="full">
                  <ProFormTextArea
                    name="remark"
                    label="备注"
                    fieldProps={{ rows: 3 }}
                  />
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

        <div className="master-form-footer">
          <div className="master-form-footer-tip">
            确认后会立即创建收货入库单、库存批次和采购入库流水；请先核对入库数量与目标仓库。
          </div>
          <div className="master-form-footer-actions">
            <Button
              onClick={() =>
                navigate(
                  selectedPurchaseOrderId
                    ? `/purchase-orders/${selectedPurchaseOrderId}`
                    : "/purchase-orders",
                )
              }
            >
              取消
            </Button>
            <Popconfirm
              title="确认收货并写入库存？"
              description="确认后会立即创建收货入库单、库存批次和采购入库流水。"
              okText="确认"
              cancelText="取消"
              onConfirm={() => formRef.current?.submit?.()}
            >
              <Button type="primary" loading={createMutation.isPending}>
                确认收货
              </Button>
            </Popconfirm>
          </div>
        </div>
      </ProForm>
    </div>
  );
}
