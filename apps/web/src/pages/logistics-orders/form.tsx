import { useMemo, useRef, useState } from "react";
import { App, Button, Result, Skeleton, Space, Table } from "antd";
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
  { label: "空运", value: TransportationMethod.AIR },
  { label: "公路", value: TransportationMethod.ROAD },
  { label: "铁路", value: TransportationMethod.RAIL },
  { label: "快递", value: TransportationMethod.EXPRESS },
];

const YES_NO_OPTIONS = [
  { label: "是", value: YesNo.YES },
  { label: "否", value: YesNo.NO },
];

interface LogisticsOrderFormValues {
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
  remarks?: string;
  packages: Array<{
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

function numberValue(value?: number | string | null) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
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
  const totalPlannedQuantity = planItems.reduce(
    (sum, item) => sum + numberValue(item.plannedQuantity),
    0,
  );

  const initialValues = useMemo<Partial<LogisticsOrderFormValues>>(
    () => ({
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
      packages: [
        {
          packageNo: "PKG-001",
          quantityPerBox: totalPlannedQuantity || 1,
          boxCount: 1,
          totalQuantity: totalPlannedQuantity || 1,
        },
      ],
    }),
    [demand, totalPlannedQuantity],
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
        title: "SKU",
        dataIndex: "skuCode",
        key: "skuCode",
        width: 140,
        fixed: "left" as const,
      },
      {
        title: "产品",
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
    { key: "transport", label: "物流信息" },
    { key: "items", label: "产品明细" },
    { key: "packages", label: "装箱信息" },
    { key: "requirements", label: "继承要求" },
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
            remarks: values.remarks,
            items: planItems.map((item) => ({
              shippingDemandItemId: item.shippingDemandItemId,
              plannedQuantity: item.plannedQuantity,
            })),
            packages: values.packages,
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
              description="从发货需求继承，不可修改。"
            >
              <div className="master-meta-grid">
                <MetaItem
                  label="发货需求编号"
                  value={displayOrDash(demand?.demandCode)}
                />
                <MetaItem
                  label="来源销售订单"
                  value={displayOrDash(demand?.sourceDocumentCode)}
                />
                <MetaItem
                  label="客户"
                  value={displayOrDash(demand?.customerName)}
                />
                <MetaItem
                  label="客户代码"
                  value={displayOrDash(demand?.customerCode)}
                />
                <MetaItem
                  label="内外销"
                  value={displayOrDash(demand?.domesticTradeType)}
                />
                <MetaItem
                  label="要求到货日期"
                  value={displayOrDash(demand?.requiredDeliveryAt)}
                />
                <MetaItem
                  label="起运地"
                  value={displayOrDash(demand?.shipmentOriginCountryName)}
                />
                <MetaItem
                  label="目的港/目的地"
                  value={displayOrDash(demand?.destinationPortName)}
                />
                <MetaItem
                  label="运抵国"
                  value={displayOrDash(demand?.destinationCountryName)}
                />
                <MetaItem
                  label="签约公司"
                  value={displayOrDash(demand?.signingCompanyName)}
                />
              </div>
            </SectionCard>

            <SectionCard
              id="transport"
              title="物流信息"
              description="填写供应商、运输方式和本次运输口径。"
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
                  label="供应商名称"
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
                <ProFormSelect
                  name="requiresExportCustoms"
                  label="是否出口报关"
                  options={YES_NO_OPTIONS}
                />
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
              id="items"
              title="产品明细"
              description="只使用已锁定且尚未计划出运的数量。"
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
              description="填写本次物流单的装箱行。"
            >
              <ProFormList
                name="packages"
                creatorButtonProps={{ creatorButtonText: "添加装箱行" }}
                copyIconProps={false}
              >
                <div className="master-form-grid">
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
                    label="总数量"
                    min={1}
                    fieldProps={{ precision: 0 }}
                    rules={[{ required: true, message: "请输入总数量" }]}
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
                    fieldProps={{ precision: 3 }}
                  />
                  <ProFormText name="remarks" label="装箱备注" />
                </div>
              </ProFormList>
            </SectionCard>

            <SectionCard
              id="requirements"
              title="继承要求"
              description="从发货需求继承，不影响库存数量。"
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
                  label="唛头补充信息"
                  value={displayOrDash(demand?.shippingMarkNote)}
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
                <Button
                  type="primary"
                  loading={createMutation.isPending}
                  onClick={() => formRef.current?.submit()}
                >
                  创建物流单
                </Button>
              </Space>
            </div>
          </div>
        </div>
      </ProForm>
    </div>
  );
}
