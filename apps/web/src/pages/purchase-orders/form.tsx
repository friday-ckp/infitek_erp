import { useMemo, useRef, useState } from "react";
import { App, Button } from "antd";
import {
  ProForm,
  ProFormDigit,
  ProFormList,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  type ProFormInstance,
} from "@ant-design/pro-components";
import {
  ContractTemplateStatus,
  PurchaseOrderApplicationType,
  PurchaseOrderDemandType,
  PurchaseOrderSettlementDateType,
  PurchaseOrderSettlementType,
  YesNo,
} from "@infitek/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  createPurchaseOrder,
  type CreatePurchaseOrderPayload,
} from "../../api/purchase-orders.api";
import { getContractTemplates } from "../../api/contract-templates.api";
import { getCompanies, type Company } from "../../api/companies.api";
import { getCurrencies } from "../../api/currencies.api";
import { getSkus } from "../../api/skus.api";
import { getSuppliers, type Supplier } from "../../api/suppliers.api";
import { getUsers, type User } from "../../api/users.api";
import {
  AnchorNav,
  SectionCard,
} from "../master-data/components/page-scaffold";
import "../master-data/master-page.css";

interface PurchaseOrderFormValues {
  supplierId: number;
  supplierName?: string;
  supplierContact?: string;
  supplierPaymentTermName?: string;
  purchaseCompanyId?: number;
  purchaseCompanyName?: string;
  currencyId?: number;
  purchaserId?: number;
  purchaseDate?: string;
  poDeliveryDate?: string;
  arrivalDate?: string;
  isPrepaid?: YesNo;
  prepaidRatio?: number;
  applicationType?: PurchaseOrderApplicationType;
  demandType?: PurchaseOrderDemandType;
  settlementDateType?: PurchaseOrderSettlementDateType;
  settlementType?: PurchaseOrderSettlementType;
  contractTermId?: number;
  remark?: string;
  items: Array<{
    skuId?: number;
    quantity: number;
    unitPrice: number;
  }>;
}

function formatSupplierContact(supplier?: Supplier | null) {
  if (!supplier) return undefined;
  return [supplier.contactPerson, supplier.contactPhone, supplier.contactEmail]
    .filter(Boolean)
    .join(" / ");
}

export default function PurchaseOrderFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notification } = App.useApp();
  const formRef = useRef<ProFormInstance<PurchaseOrderFormValues>>(undefined);
  const [activeAnchor, setActiveAnchor] = useState("basic");

  const createMutation = useMutation({
    mutationFn: (payload: CreatePurchaseOrderPayload) =>
      createPurchaseOrder(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      notification.success({
        message: "采购订单已创建",
        description: `${created.poCode} 已创建为待确认状态。`,
        duration: 5,
      });
      navigate("/purchase-orders/create");
    },
  });

  const initialValues = useMemo<Partial<PurchaseOrderFormValues>>(
    () => ({
      applicationType: PurchaseOrderApplicationType.STOCK_PURCHASE,
      isPrepaid: YesNo.NO,
      settlementDateType: PurchaseOrderSettlementDateType.ORDER_DATE,
      items: [{ quantity: 1, unitPrice: 0 }],
    }),
    [],
  );

  const anchors = [
    { key: "basic", label: "基本信息" },
    { key: "settlement", label: "商务结算" },
    { key: "items", label: "订单行项" },
    { key: "remark", label: "备注" },
  ];

  return (
    <div className="master-page master-form-page">
      <div className="master-page-header">
        <div className="master-page-heading">
          <div className="master-page-title">创建采购订单</div>
          <div className="master-page-description">
            手动创建备货型采购订单，提交后进入待确认状态。
          </div>
        </div>
      </div>

      <ProForm<PurchaseOrderFormValues>
        formRef={formRef}
        submitter={false}
        initialValues={initialValues}
        onFinish={async (values) => {
          const items = (values.items ?? []).filter(
            (item) => item.skuId && item.quantity > 0,
          );
          if (!items.length) return false;
          await createMutation.mutateAsync({
            supplierId: Number(values.supplierId),
            contractTermId: values.contractTermId
              ? Number(values.contractTermId)
              : undefined,
            purchaseCompanyId: values.purchaseCompanyId
              ? Number(values.purchaseCompanyId)
              : undefined,
            currencyId: values.currencyId
              ? Number(values.currencyId)
              : undefined,
            purchaserId: values.purchaserId
              ? Number(values.purchaserId)
              : undefined,
            purchaseDate: values.purchaseDate,
            poDeliveryDate: values.poDeliveryDate,
            arrivalDate: values.arrivalDate,
            isPrepaid: values.isPrepaid,
            prepaidRatio:
              values.prepaidRatio != null
                ? Number(values.prepaidRatio)
                : undefined,
            applicationType: values.applicationType,
            demandType: values.demandType,
            settlementDateType: values.settlementDateType,
            settlementType: values.settlementType,
            remark: values.remark,
            requestKey: `stock-po:${Date.now()}`,
            items: items.map((item) => ({
              skuId: Number(item.skuId),
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice ?? 0),
            })),
          });
          formRef.current?.resetFields();
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
              title="基本信息"
              description="选择供应商和合同条款，供应商联系信息自动带入只读展示。"
            >
              <div className="master-form-grid">
                <ProFormSelect
                  name="supplierId"
                  label="供应商"
                  placeholder="请选择供应商"
                  showSearch
                  rules={[{ required: true, message: "请选择供应商" }]}
                  request={async (params) => {
                    const res = await getSuppliers({
                      keyword: params.keyWords,
                      pageSize: 20,
                    });
                    return res.list.map((supplier) => ({
                      label: `${supplier.name} (${supplier.supplierCode})`,
                      value: Number(supplier.id),
                      supplier,
                    }));
                  }}
                  fieldProps={{
                    optionFilterProp: "label",
                    onChange: (_value, option: any) => {
                      const supplier = option?.supplier as Supplier | undefined;
                      formRef.current?.setFieldsValue({
                        supplierName: supplier?.name,
                        supplierContact: formatSupplierContact(supplier),
                        supplierPaymentTermName:
                          supplier?.paymentTerms?.[0]?.paymentTermName ??
                          undefined,
                      });
                    },
                  }}
                />
                <ProFormText name="supplierName" label="供应商名称" readonly />
                <ProFormText name="supplierContact" label="联系方式" readonly />
                <ProFormText
                  name="supplierPaymentTermName"
                  label="账期"
                  readonly
                />
                <ProFormSelect
                  name="contractTermId"
                  label="合同条款"
                  placeholder="默认使用已审批默认范本"
                  showSearch
                  request={async (params) => {
                    const res = await getContractTemplates({
                      keyword: params.keyWords,
                      status: ContractTemplateStatus.APPROVED,
                      pageSize: 20,
                    });
                    return res.list.map((template) => ({
                      label: template.name,
                      value: Number(template.id),
                    }));
                  }}
                  fieldProps={{ allowClear: true, optionFilterProp: "label" }}
                />
                <ProFormSelect
                  name="purchaseCompanyId"
                  label="采购主体"
                  placeholder="请选择公司主体"
                  showSearch
                  request={async (params) => {
                    const res = await getCompanies({
                      keyword: params.keyWords,
                      pageSize: 20,
                    });
                    return res.list.map((company: Company) => ({
                      label: company.nameCn,
                      value: Number(company.id),
                      company,
                    }));
                  }}
                  fieldProps={{
                    allowClear: true,
                    optionFilterProp: "label",
                    onChange: (_value, option: any) => {
                      formRef.current?.setFieldsValue({
                        purchaseCompanyName: option?.company?.nameCn,
                      });
                    },
                  }}
                />
                <ProFormText
                  name="purchaseCompanyName"
                  label="采购主体名称"
                  readonly
                />
              </div>
            </SectionCard>

            <SectionCard
              id="settlement"
              title="商务结算"
              description="补充采购日期、交期、币种和结算方式。"
            >
              <div className="master-form-grid">
                <ProFormSelect
                  name="applicationType"
                  label="申请类型"
                  options={[
                    {
                      label: "采购备货",
                      value: PurchaseOrderApplicationType.STOCK_PURCHASE,
                    },
                    {
                      label: "销售请购",
                      value: PurchaseOrderApplicationType.SALES_REQUISITION,
                    },
                  ]}
                />
                <ProFormSelect
                  name="demandType"
                  label="需求类型"
                  fieldProps={{ allowClear: true }}
                  options={[
                    {
                      label: "销售订单",
                      value: PurchaseOrderDemandType.SALES_ORDER,
                    },
                    {
                      label: "售后单",
                      value: PurchaseOrderDemandType.AFTER_SALES_ORDER,
                    },
                    {
                      label: "展会样品单",
                      value: PurchaseOrderDemandType.EXHIBITION_SAMPLE_ORDER,
                    },
                  ]}
                />
                <ProFormText
                  name="purchaseDate"
                  label="采购日期"
                  fieldProps={{ type: "date" }}
                />
                <ProFormText
                  name="poDeliveryDate"
                  label="PO交期"
                  fieldProps={{ type: "date" }}
                />
                <ProFormText
                  name="arrivalDate"
                  label="到货日期"
                  fieldProps={{ type: "date" }}
                />
                <ProFormSelect
                  name="currencyId"
                  label="币种"
                  placeholder="请选择币种"
                  showSearch
                  request={async (params) => {
                    const res = await getCurrencies({
                      keyword: params.keyWords,
                      pageSize: 20,
                    });
                    return res.list.map((currency) => ({
                      label: `${currency.code} / ${currency.name}`,
                      value: Number(currency.id),
                    }));
                  }}
                  fieldProps={{ allowClear: true, optionFilterProp: "label" }}
                />
                <ProFormSelect
                  name="purchaserId"
                  label="采购员"
                  placeholder="请选择采购员"
                  showSearch
                  request={async (params) => {
                    const res = await getUsers(1, 20, params.keyWords);
                    return res.list.map((user: User) => ({
                      label: user.name,
                      value: Number(user.id),
                    }));
                  }}
                  fieldProps={{ allowClear: true, optionFilterProp: "label" }}
                />
                <ProFormSelect
                  name="isPrepaid"
                  label="是否预付"
                  options={[
                    { label: "是", value: YesNo.YES },
                    { label: "否", value: YesNo.NO },
                  ]}
                />
                <ProFormDigit
                  name="prepaidRatio"
                  label="预付比例%"
                  min={0}
                  max={100}
                  fieldProps={{ precision: 0 }}
                />
                <ProFormSelect
                  name="settlementDateType"
                  label="结算日期类型"
                  options={[
                    {
                      label: "采购下单日期",
                      value: PurchaseOrderSettlementDateType.ORDER_DATE,
                    },
                    {
                      label: "采购入库日期",
                      value: PurchaseOrderSettlementDateType.RECEIPT_DATE,
                    },
                    {
                      label: "采购开票日期",
                      value: PurchaseOrderSettlementDateType.INVOICE_DATE,
                    },
                  ]}
                />
                <ProFormSelect
                  name="settlementType"
                  label="结算类型"
                  fieldProps={{ allowClear: true }}
                  options={[
                    {
                      label: "月结",
                      value: PurchaseOrderSettlementType.MONTHLY,
                    },
                    {
                      label: "半月结",
                      value: PurchaseOrderSettlementType.HALF_MONTHLY,
                    },
                    {
                      label: "票结",
                      value: PurchaseOrderSettlementType.INVOICE_BASED,
                    },
                  ]}
                />
              </div>
            </SectionCard>

            <SectionCard
              id="items"
              title="订单行项"
              description="选择 SKU、采购数量和采购单价。"
            >
              <ProFormList
                name="items"
                creatorButtonProps={{ creatorButtonText: "新增 SKU 行" }}
                min={1}
              >
                <div className="master-form-grid">
                  <ProFormSelect
                    name="skuId"
                    label="SKU"
                    placeholder="请选择 SKU"
                    showSearch
                    rules={[{ required: true, message: "请选择 SKU" }]}
                    request={async (params) => {
                      const res = await getSkus({
                        keyword: params.keyWords,
                        pageSize: 20,
                      });
                      return res.list.map((sku) => ({
                        label: `${sku.skuCode} / ${sku.nameCn ?? sku.nameEn ?? sku.specification}`,
                        value: Number(sku.id),
                      }));
                    }}
                    fieldProps={{ optionFilterProp: "label" }}
                  />
                  <ProFormDigit
                    name="quantity"
                    label="采购数量"
                    min={1}
                    fieldProps={{ precision: 0 }}
                    rules={[{ required: true, message: "请输入采购数量" }]}
                  />
                  <ProFormDigit
                    name="unitPrice"
                    label="采购单价"
                    min={0}
                    fieldProps={{ precision: 2 }}
                    rules={[{ required: true, message: "请输入采购单价" }]}
                  />
                </div>
              </ProFormList>
            </SectionCard>

            <SectionCard id="remark" title="备注">
              <ProFormTextArea
                name="remark"
                label="采购备注"
                fieldProps={{ rows: 4 }}
              />
            </SectionCard>

            <div className="master-form-actions">
              <Button onClick={() => navigate(-1)}>取消</Button>
              <Button
                type="primary"
                loading={createMutation.isPending}
                onClick={() => formRef.current?.submit()}
              >
                提交采购订单
              </Button>
            </div>
          </div>
        </div>
      </ProForm>
    </div>
  );
}

export function PurchaseOrdersPlaceholderPage() {
  return null;
}
