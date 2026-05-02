import { useMemo, useRef, useState } from "react";
import { App, Button, Popconfirm, Result, Skeleton, Space, Table } from "antd";
import {
  ProForm,
  ProFormDigit,
  ProFormList,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  type ProFormInstance,
} from "@ant-design/pro-components";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  TransportationMethod,
  YesNo,
  type TransportationMethod as TransportationMethodType,
} from "@infitek/shared";
import {
  createLogisticsOrder,
  getLogisticsOrderCreatePrefill,
  type CreateLogisticsOrderPayload,
  type LogisticsOrderPrefillItem,
} from "../../api/logistics-orders.api";
import { getCompanies } from "../../api/companies.api";
import { getCountries } from "../../api/countries.api";
import { getLogisticsProviders } from "../../api/logistics-providers.api";
import { getPorts } from "../../api/ports.api";
import {
  AnchorNav,
  MetaItem,
  SectionCard,
  displayOrDash,
} from "../master-data/components/page-scaffold";
import "../master-data/master-page.css";

const TRANSPORTATION_OPTIONS = [
  { label: "海运", value: TransportationMethod.SEA },
  { label: "陆运", value: TransportationMethod.ROAD },
  { label: "空运", value: TransportationMethod.AIR },
  { label: "快递", value: TransportationMethod.EXPRESS },
];

const YES_NO_OPTIONS = [
  { label: "是", value: YesNo.YES },
  { label: "否", value: YesNo.NO },
];

interface LogisticsOrderFormValues {
  sourceShippingDemandCode?: string;
  sourceSalesOrderCode?: string;
  sourceCustomerName?: string;
  sourceOrderType?: string;
  sourceDomesticTradeType?: string;
  sourceTradeTerm?: string;
  sourcePaymentTerm?: string;
  sourceRequiredDeliveryAt?: string;
  sourceOriginCountryName?: string;
  sourceDestinationCountryName?: string;
  sourceCurrencyCode?: string;
  sourceContractAmount?: string;
  sourceIsInsured?: string;
  logisticsProviderId: number;
  logisticsProviderName?: string;
  transportationMethod: TransportationMethodType;
  companyId: number;
  companyName?: string;
  originPortId?: number;
  originPortName: string;
  destinationPortId?: number;
  destinationPortName: string;
  destinationCountryId?: number;
  destinationCountryName: string;
  requiresExportCustoms?: YesNo;
  shippingMark?: string;
  remarks?: string;
  packages: Array<{
    shippingDemandItemId: number;
    packageNo: string;
    quantityPerBox: number;
    boxCount: number;
    totalQuantity: number;
    lengthCm?: number;
    widthCm?: number;
    heightCm?: number;
    grossWeightKg?: number;
    remarks?: string;
  }>;
}

function parsePositiveIntParam(value: string | null) {
  const normalized = value?.trim();
  if (!normalized || !/^\d+$/.test(normalized)) return undefined;
  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function buildPackageDefaults(planItems: LogisticsOrderPrefillItem[]) {
  return planItems.map((item, index) => ({
    shippingDemandItemId: item.shippingDemandItemId,
    packageNo: `PKG-${String(index + 1).padStart(3, "0")}`,
    quantityPerBox: item.plannedQuantity || 1,
    boxCount: 1,
    totalQuantity: item.plannedQuantity || 1,
  }));
}

export default function LogisticsOrderFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notification } = App.useApp();
  const formRef = useRef<ProFormInstance<LogisticsOrderFormValues>>(undefined);
  const [activeAnchor, setActiveAnchor] = useState("source");
  const [searchParams] = useSearchParams();
  const shippingDemandId = parsePositiveIntParam(
    searchParams.get("shippingDemandId"),
  );

  const prefillQuery = useQuery({
    queryKey: ["logistics-order-create-prefill", shippingDemandId],
    queryFn: () => getLogisticsOrderCreatePrefill(shippingDemandId as number),
    enabled: Boolean(shippingDemandId),
  });

  const demand = prefillQuery.data?.shippingDemand;
  const planItems = prefillQuery.data?.planItems ?? [];

  const initialValues = useMemo<Partial<LogisticsOrderFormValues>>(
    () => ({
      sourceShippingDemandCode: demand?.demandCode ?? undefined,
      sourceSalesOrderCode: demand?.sourceDocumentCode ?? undefined,
      sourceCustomerName: demand?.customerName ?? undefined,
      sourceOrderType: demand?.orderType ?? undefined,
      sourceDomesticTradeType: demand?.domesticTradeType ?? undefined,
      sourceTradeTerm: demand?.tradeTerm ?? undefined,
      sourcePaymentTerm: demand?.paymentTerm ?? undefined,
      sourceRequiredDeliveryAt: demand?.requiredDeliveryAt ?? undefined,
      sourceOriginCountryName: demand?.shipmentOriginCountryName ?? undefined,
      sourceDestinationCountryName: demand?.destinationCountryName ?? undefined,
      sourceCurrencyCode: demand?.currencyCode ?? undefined,
      sourceContractAmount: demand?.contractAmount ?? undefined,
      sourceIsInsured: demand?.isInsured ?? undefined,
      transportationMethod:
        demand?.transportationMethod ?? TransportationMethod.SEA,
      companyId: demand?.signingCompanyId ?? undefined,
      companyName: demand?.signingCompanyName ?? undefined,
      originPortName: demand?.shipmentOriginCountryName ?? undefined,
      destinationPortId: demand?.destinationPortId ?? undefined,
      destinationPortName: demand?.destinationPortName ?? undefined,
      destinationCountryId: demand?.destinationCountryId ?? undefined,
      destinationCountryName: demand?.destinationCountryName ?? undefined,
      requiresExportCustoms: demand?.requiresExportCustoms ?? undefined,
      shippingMark: demand?.shippingMarkNote ?? undefined,
      packages: buildPackageDefaults(planItems),
    }),
    [demand, planItems],
  );

  const createMutation = useMutation({
    mutationFn: (payload: CreateLogisticsOrderPayload) =>
      createLogisticsOrder(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({
        queryKey: ["shipping-demand-detail", shippingDemandId],
      });
      queryClient.invalidateQueries({ queryKey: ["logistics-orders"] });
      notification.success({
        message: "物流单已创建",
        description: `${created.orderCode} 已创建为已确认状态。`,
        duration: 5,
      });
      navigate(`/shipping-demands/${created.shippingDemandId}`);
    },
  });

  const itemColumns = useMemo(
    () => [
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
        width: 220,
        render: (_: unknown, record: LogisticsOrderPrefillItem) =>
          displayOrDash(record.productNameCn ?? record.productNameEn),
      },
      {
        title: "规格",
        dataIndex: "skuSpecification",
        key: "skuSpecification",
        width: 180,
        render: displayOrDash,
      },
      {
        title: "单位",
        dataIndex: "unitName",
        key: "unitName",
        width: 100,
        render: displayOrDash,
      },
      {
        title: "已锁定待发",
        dataIndex: "lockedRemainingQuantity",
        key: "lockedRemainingQuantity",
        width: 120,
      },
      {
        title: "已计划",
        dataIndex: "activePlannedQuantity",
        key: "activePlannedQuantity",
        width: 100,
      },
      {
        title: "可计划数量",
        dataIndex: "availableToPlan",
        key: "availableToPlan",
        width: 120,
      },
      {
        title: "本次计划数量",
        dataIndex: "plannedQuantity",
        key: "plannedQuantity",
        width: 130,
      },
    ],
    [],
  );

  const packageSkuOptions = useMemo(
    () =>
      planItems.map((item) => ({
        label: `${item.skuCode} / ${item.productNameCn ?? item.productNameEn ?? "-"}`,
        value: item.shippingDemandItemId,
      })),
    [planItems],
  );

  if (!shippingDemandId) {
    return (
      <Result
        status="404"
        title="缺少发货需求"
        extra={
          <Button type="primary" onClick={() => navigate("/shipping-demands")}>
            返回发货需求
          </Button>
        }
      />
    );
  }

  if (prefillQuery.isLoading)
    return <Skeleton active paragraph={{ rows: 6 }} />;

  if (prefillQuery.isError && !prefillQuery.data) {
    return (
      <Result
        status="error"
        title="物流单预填信息加载失败"
        extra={[
          <Button
            key="retry"
            type="primary"
            onClick={() => prefillQuery.refetch()}
          >
            重试
          </Button>,
          <Button
            key="back"
            onClick={() => navigate(`/shipping-demands/${shippingDemandId}`)}
          >
            返回发货需求
          </Button>,
        ]}
      />
    );
  }

  if (!planItems.length) {
    return (
      <Result
        status="warning"
        title="暂无可创建物流单的锁定待发数量"
        extra={
          <Button
            type="primary"
            onClick={() => navigate(`/shipping-demands/${shippingDemandId}`)}
          >
            返回发货需求
          </Button>
        }
      />
    );
  }

  const anchors = [
    { key: "source", label: "来源信息" },
    { key: "basic", label: "基本信息" },
    { key: "items", label: "产品明细" },
    { key: "packages", label: "装箱信息" },
    { key: "customs", label: "报关备注" },
    { key: "inherited", label: "继承要求" },
  ];

  return (
    <div className="master-page master-form-page">
      <div className="master-page-header">
        <div className="master-page-heading">
          <div className="master-page-title">创建物流单</div>
          <div className="master-page-description">
            {displayOrDash(demand?.demandCode)} /{" "}
            {displayOrDash(demand?.sourceDocumentCode)}
          </div>
        </div>
      </div>

      <ProForm<LogisticsOrderFormValues>
        formRef={formRef}
        submitter={false}
        initialValues={initialValues}
        onFinish={async (values) => {
          const payload: CreateLogisticsOrderPayload = {
            shippingDemandId,
            logisticsProviderId: Number(values.logisticsProviderId),
            logisticsProviderName: values.logisticsProviderName,
            transportationMethod: values.transportationMethod,
            companyId: Number(values.companyId),
            companyName: values.companyName,
            originPortId: values.originPortId
              ? Number(values.originPortId)
              : undefined,
            originPortName: values.originPortName,
            destinationPortId: values.destinationPortId
              ? Number(values.destinationPortId)
              : undefined,
            destinationPortName: values.destinationPortName,
            destinationCountryId: values.destinationCountryId
              ? Number(values.destinationCountryId)
              : undefined,
            destinationCountryName: values.destinationCountryName,
            requiresExportCustoms: values.requiresExportCustoms,
            shippingMark: values.shippingMark,
            remarks: values.remarks,
            items: planItems.map((item) => ({
              shippingDemandItemId: item.shippingDemandItemId,
              plannedQuantity: item.plannedQuantity,
            })),
            packages: values.packages.map((pkg) => ({
              shippingDemandItemId: Number(pkg.shippingDemandItemId),
              packageNo: pkg.packageNo,
              quantityPerBox: Number(pkg.quantityPerBox),
              boxCount: Number(pkg.boxCount),
              totalQuantity: Number(pkg.totalQuantity),
              lengthCm: pkg.lengthCm,
              widthCm: pkg.widthCm,
              heightCm: pkg.heightCm,
              grossWeightKg: pkg.grossWeightKg,
              remarks: pkg.remarks,
            })),
          };
          await createMutation.mutateAsync(payload);
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
              id="source"
              title="来源信息"
              description="来源字段灰底只读，不可修改。"
            >
              <div className="master-form-grid">
                <ProFormText
                  name="sourceShippingDemandCode"
                  label="发货需求编号"
                  readonly
                  fieldProps={{ disabled: true }}
                />
                <ProFormText
                  name="sourceSalesOrderCode"
                  label="ERP销售订单号"
                  readonly
                  fieldProps={{ disabled: true }}
                />
                <ProFormText
                  name="sourceCustomerName"
                  label="客户名称"
                  readonly
                  fieldProps={{ disabled: true }}
                />
                <ProFormText
                  name="sourceOrderType"
                  label="需求类型"
                  readonly
                  fieldProps={{ disabled: true }}
                />
                <ProFormText
                  name="sourceDomesticTradeType"
                  label="内外销"
                  readonly
                  fieldProps={{ disabled: true }}
                />
                <ProFormText
                  name="sourceTradeTerm"
                  label="贸易方式"
                  readonly
                  fieldProps={{ disabled: true }}
                />
                <ProFormText
                  name="sourcePaymentTerm"
                  label="付款方式"
                  readonly
                  fieldProps={{ disabled: true }}
                />
                <ProFormText
                  name="sourceRequiredDeliveryAt"
                  label="要求到货日期"
                  readonly
                  fieldProps={{ disabled: true }}
                />
                <ProFormText
                  name="sourceOriginCountryName"
                  label="起运地"
                  readonly
                  fieldProps={{ disabled: true }}
                />
                <ProFormText
                  name="sourceDestinationCountryName"
                  label="运抵国"
                  readonly
                  fieldProps={{ disabled: true }}
                />
                <ProFormText
                  name="sourceCurrencyCode"
                  label="外销币种"
                  readonly
                  fieldProps={{ disabled: true }}
                />
                <ProFormText
                  name="sourceContractAmount"
                  label="合同金额"
                  readonly
                  fieldProps={{ disabled: true }}
                />
                <ProFormText
                  name="sourceIsInsured"
                  label="是否投保"
                  readonly
                  fieldProps={{ disabled: true }}
                />
              </div>
            </SectionCard>

            <SectionCard
              id="basic"
              title="基本信息"
              description="填写本次物流安排的主体、港口和运输方式。"
            >
              <div className="master-form-grid">
                <ProFormSelect
                  name="logisticsProviderId"
                  label="物流供应商"
                  placeholder="请选择物流供应商"
                  showSearch
                  rules={[{ required: true, message: "请选择物流供应商" }]}
                  request={async (params) => {
                    const res = await getLogisticsProviders({
                      keyword: params.keyWords,
                      pageSize: 20,
                    });
                    return res.list.map((item) => ({
                      label: item.name,
                      value: Number(item.id),
                      name: item.name,
                    }));
                  }}
                  fieldProps={{
                    optionFilterProp: "label",
                    onChange: (_value, option: any) => {
                      formRef.current?.setFieldsValue({
                        logisticsProviderName: option?.name,
                      });
                    },
                  }}
                />
                <ProFormText
                  name="logisticsProviderName"
                  label="订舱代理/快递服务商"
                  readonly
                />
                <ProFormSelect
                  name="transportationMethod"
                  label="运输方式"
                  options={TRANSPORTATION_OPTIONS}
                  rules={[{ required: true, message: "请选择运输方式" }]}
                />
                <ProFormSelect
                  name="companyId"
                  label="公司主体"
                  placeholder="请选择公司主体"
                  showSearch
                  rules={[{ required: true, message: "请选择公司主体" }]}
                  request={async (params) => {
                    const res = await getCompanies({
                      keyword: params.keyWords,
                      pageSize: 20,
                    });
                    const options = res.list.map((item) => ({
                      label: item.nameCn,
                      value: Number(item.id),
                      name: item.nameCn,
                    }));
                    if (
                      !params.keyWords &&
                      demand?.signingCompanyId &&
                      demand.signingCompanyName
                    ) {
                      const exists = options.some(
                        (item) => item.value === demand.signingCompanyId,
                      );
                      if (!exists) {
                        options.unshift({
                          label: demand.signingCompanyName,
                          value: demand.signingCompanyId,
                          name: demand.signingCompanyName,
                        });
                      }
                    }
                    return options;
                  }}
                  fieldProps={{
                    optionFilterProp: "label",
                    onChange: (_value, option: any) => {
                      formRef.current?.setFieldsValue({
                        companyName: option?.name,
                      });
                    },
                  }}
                />
                <ProFormText name="companyName" label="公司主体名称" readonly />
                <ProFormSelect
                  name="originPortId"
                  label="起运港/地"
                  placeholder="可选港口主数据"
                  showSearch
                  request={async (params) => {
                    const res = await getPorts({
                      keyword: params.keyWords,
                      pageSize: 20,
                    });
                    return res.list.map((item) => ({
                      label: item.nameCn,
                      value: Number(item.id),
                      name: item.nameCn,
                    }));
                  }}
                  fieldProps={{
                    optionFilterProp: "label",
                    allowClear: true,
                    onChange: (_value, option: any) => {
                      if (option?.name) {
                        formRef.current?.setFieldsValue({
                          originPortName: option.name,
                        });
                      }
                    },
                  }}
                />
                <ProFormText
                  name="originPortName"
                  label="起运港/地名称"
                  rules={[{ required: true, message: "请输入起运港/地" }]}
                />
                <ProFormSelect
                  name="destinationPortId"
                  label="目的港/目的地"
                  placeholder="请选择目的港/目的地"
                  showSearch
                  request={async (params) => {
                    const res = await getPorts({
                      keyword: params.keyWords,
                      pageSize: 20,
                    });
                    const options = res.list.map((item) => ({
                      label: item.nameCn,
                      value: Number(item.id),
                      name: item.nameCn,
                    }));
                    if (
                      !params.keyWords &&
                      demand?.destinationPortId &&
                      demand.destinationPortName
                    ) {
                      const exists = options.some(
                        (item) => item.value === demand.destinationPortId,
                      );
                      if (!exists) {
                        options.unshift({
                          label: demand.destinationPortName,
                          value: demand.destinationPortId,
                          name: demand.destinationPortName,
                        });
                      }
                    }
                    return options;
                  }}
                  fieldProps={{
                    optionFilterProp: "label",
                    allowClear: true,
                    onChange: (_value, option: any) => {
                      if (option?.name) {
                        formRef.current?.setFieldsValue({
                          destinationPortName: option.name,
                        });
                      }
                    },
                  }}
                />
                <ProFormText
                  name="destinationPortName"
                  label="目的港/目的地名称"
                  rules={[{ required: true, message: "请输入目的港/目的地" }]}
                />
                <ProFormSelect
                  name="destinationCountryId"
                  label="运抵国"
                  placeholder="请选择运抵国"
                  showSearch
                  request={async (params) => {
                    const res = await getCountries({
                      keyword: params.keyWords,
                      pageSize: 20,
                    });
                    const options = res.list.map((item) => ({
                      label: item.name,
                      value: Number(item.id),
                      name: item.name,
                    }));
                    if (
                      !params.keyWords &&
                      demand?.destinationCountryId &&
                      demand.destinationCountryName
                    ) {
                      const exists = options.some(
                        (item) => item.value === demand.destinationCountryId,
                      );
                      if (!exists) {
                        options.unshift({
                          label: demand.destinationCountryName,
                          value: demand.destinationCountryId,
                          name: demand.destinationCountryName,
                        });
                      }
                    }
                    return options;
                  }}
                  fieldProps={{
                    optionFilterProp: "label",
                    allowClear: true,
                    onChange: (_value, option: any) => {
                      if (option?.name) {
                        formRef.current?.setFieldsValue({
                          destinationCountryName: option.name,
                        });
                      }
                    },
                  }}
                />
                <ProFormText
                  name="destinationCountryName"
                  label="运抵国名称"
                  rules={[{ required: true, message: "请输入运抵国" }]}
                />
              </div>
            </SectionCard>

            <SectionCard
              id="items"
              title="产品明细"
              description="只使用已锁定且尚未被其他 active 物流单计划的数量。"
            >
              <Table
                rowKey="shippingDemandItemId"
                pagination={false}
                columns={itemColumns as any}
                dataSource={planItems}
                scroll={{ x: 1200 }}
              />
            </SectionCard>

            <SectionCard
              id="packages"
              title="装箱信息"
              description="同一 SKU 可拆成多条装箱行，但每个 SKU 的装箱总数量必须等于本次计划数量。"
            >
              <ProFormList
                name="packages"
                creatorButtonProps={{ creatorButtonText: "添加装箱行" }}
                copyIconProps={false}
              >
                <div
                  className="master-form-grid"
                  style={{ gridTemplateColumns: "minmax(0, 1fr)" }}
                >
                  <ProFormSelect
                    name="shippingDemandItemId"
                    label="SKU"
                    options={packageSkuOptions}
                    rules={[{ required: true, message: "请选择 SKU" }]}
                  />
                  <ProFormText
                    name="packageNo"
                    label="箱号"
                    rules={[{ required: true, message: "请输入箱号" }]}
                  />
                  <ProFormDigit
                    name="quantityPerBox"
                    label="每箱数量"
                    min={1}
                    fieldProps={{ precision: 0 }}
                    rules={[{ required: true, message: "请输入每箱数量" }]}
                  />
                  <ProFormDigit
                    name="boxCount"
                    label="箱数"
                    min={1}
                    fieldProps={{ precision: 0 }}
                    rules={[{ required: true, message: "请输入箱数" }]}
                  />
                  <ProFormDigit
                    name="totalQuantity"
                    label="数量"
                    min={1}
                    fieldProps={{ precision: 0 }}
                    rules={[{ required: true, message: "请输入数量" }]}
                  />
                  <ProFormDigit
                    name="lengthCm"
                    label="长(cm)"
                    min={0}
                    fieldProps={{ precision: 2 }}
                  />
                  <ProFormDigit
                    name="widthCm"
                    label="宽(cm)"
                    min={0}
                    fieldProps={{ precision: 2 }}
                  />
                  <ProFormDigit
                    name="heightCm"
                    label="高(cm)"
                    min={0}
                    fieldProps={{ precision: 2 }}
                  />
                  <ProFormDigit
                    name="grossWeightKg"
                    label="毛重(kg)"
                    min={0}
                    fieldProps={{ precision: 1 }}
                  />
                  <ProFormText name="remarks" label="装箱备注" />
                </div>
              </ProFormList>
            </SectionCard>

            <SectionCard
              id="customs"
              title="报关与备注"
              description="创建期只处理报关和备注，不展示物流跟踪字段。"
            >
              <div className="master-form-grid">
                <ProFormSelect
                  name="requiresExportCustoms"
                  label="是否出口报关"
                  options={YES_NO_OPTIONS}
                />
                <div className="full">
                  <ProFormTextArea
                    name="shippingMark"
                    label="唛头"
                    fieldProps={{ rows: 3 }}
                  />
                </div>
                <div className="full">
                  <ProFormTextArea
                    name="remarks"
                    label="备注"
                    fieldProps={{ rows: 3 }}
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              id="inherited"
              title="继承要求"
              description="从发货需求继承的收发通与单据要求，创建时只读展示。"
            >
              <div className="master-meta-grid">
                <MetaItem
                  label="收货人公司"
                  value={displayOrDash(demand?.consigneeCompany)}
                  full
                />
                <MetaItem
                  label="收货人其他信息"
                  value={displayOrDash(demand?.consigneeOtherInfo)}
                  full
                />
                <MetaItem
                  label="通知人公司"
                  value={displayOrDash(demand?.notifyCompany)}
                  full
                />
                <MetaItem
                  label="通知人其他信息"
                  value={displayOrDash(demand?.notifyOtherInfo)}
                  full
                />
                <MetaItem
                  label="发货人公司"
                  value={displayOrDash(demand?.shipperCompany)}
                  full
                />
                <MetaItem
                  label="是否公司常规唛头"
                  value={displayOrDash(demand?.usesDefaultShippingMark)}
                />
                <MetaItem
                  label="唛头补充信息"
                  value={displayOrDash(demand?.shippingMarkNote)}
                  full
                />
                <MetaItem
                  label="随货文件"
                  value={displayOrDash(demand?.shippingDocumentsNote)}
                />
                <MetaItem
                  label="清关要求"
                  value={displayOrDash(demand?.customsDocumentNote)}
                  full
                />
                <MetaItem
                  label="其他要求及注意事项"
                  value={displayOrDash(demand?.otherRequirementNote)}
                  full
                />
              </div>
            </SectionCard>

            <div className="master-form-footer">
              <Space>
                <Button
                  onClick={() =>
                    navigate(`/shipping-demands/${shippingDemandId}`)
                  }
                >
                  取消
                </Button>
                <Popconfirm
                  title="确认创建物流单？"
                  description="创建成功后物流单状态将直接变为“已确认”。"
                  okText="确认创建"
                  cancelText="再检查一下"
                  onConfirm={() => formRef.current?.submit()}
                >
                  <Button type="primary" loading={createMutation.isPending}>
                    创建物流单
                  </Button>
                </Popconfirm>
              </Space>
            </div>
          </div>
        </div>
      </ProForm>
    </div>
  );
}
