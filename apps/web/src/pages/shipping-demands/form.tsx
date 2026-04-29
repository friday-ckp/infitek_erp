import { UploadOutlined } from "@ant-design/icons";
import {
  ProForm,
  ProFormDatePicker,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  type ProFormInstance,
} from "@ant-design/pro-components";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  App,
  Button,
  Result,
  Skeleton,
  Table,
  Upload,
  type UploadFile,
} from "antd";
import {
  BlType,
  CustomsDeclarationMethod,
  DomesticTradeType,
  FulfillmentType,
  InvoiceType,
  OrderNature,
  PaymentTerm,
  PlugType,
  PrimaryIndustry,
  ProductLineType,
  ReceiptStatus,
  SecondaryIndustry,
  ShippingDemandStatus,
  SalesOrderType,
  TradeTerm,
  TransportationMethod,
  YesNo,
} from "@infitek/shared";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getShippingDemandById,
  updateShippingDemand,
  uploadShippingDemandFile,
  type ShippingDemand,
  type ShippingDemandItem,
  type UpdateShippingDemandPayload,
} from "../../api/shipping-demands.api";
import { AnchorNav, SectionCard, displayOrDash } from "../master-data/components/page-scaffold";
import "../master-data/master-page.css";

const YES_NO_OPTIONS = [
  { label: "是", value: YesNo.YES },
  { label: "否", value: YesNo.NO },
];

const PAYMENT_TERM_OPTIONS = [
  { label: "100% TT IN ADVANCE", value: PaymentTerm.TT_IN_ADVANCE_100 },
  {
    label: "30% DEPOSIT+70% BALANCE PAYMENT BEFORE DELIVERY",
    value: PaymentTerm.DEPOSIT_30_BALANCE_70_BEFORE_DELIVERY,
  },
  {
    label: "40% DEPOSIT+60% BALANCE PAYMENT BEFORE DELIVERY",
    value: PaymentTerm.DEPOSIT_40_BALANCE_60_BEFORE_DELIVERY,
  },
  {
    label: "50% DEPOSIT+50% BALANCE PAYMENT BEFORE DELIVERY",
    value: PaymentTerm.DEPOSIT_50_BALANCE_50_BEFORE_DELIVERY,
  },
  {
    label: "60% DEPOSIT+40% BALANCE PAYMENT BEFORE DELIVERY",
    value: PaymentTerm.DEPOSIT_60_BALANCE_40_BEFORE_DELIVERY,
  },
  {
    label: "70% DEPOSIT+30% BALANCE PAYMENT BEFORE DELIVERY",
    value: PaymentTerm.DEPOSIT_70_BALANCE_30_BEFORE_DELIVERY,
  },
  {
    label: "100% payment before delivery",
    value: PaymentTerm.PAYMENT_100_BEFORE_DELIVERY,
  },
  {
    label: "40% DEPOSIT+60% BALANCE PAYMENT AGAINST BL COPY WITHIN ** DAYS",
    value: PaymentTerm.DEPOSIT_40_BALANCE_60_AGAINST_BL_COPY,
  },
  {
    label: "50% DEPOSIT+50% BALANCE PAYMENT AGAINST BL COPY WITHIN ** DAYS",
    value: PaymentTerm.DEPOSIT_50_BALANCE_50_AGAINST_BL_COPY,
  },
  {
    label: "70% DEPOSIT+30% BALANCE PAYMENT AGAINST BL COPY WITHIN ** DAYS",
    value: PaymentTerm.DEPOSIT_70_BALANCE_30_AGAINST_BL_COPY,
  },
  { label: "LC AT SIGHT", value: PaymentTerm.LC_AT_SIGHT },
  { label: "CAD", value: PaymentTerm.CAD },
  { label: "DP AT SIGHT", value: PaymentTerm.DP_AT_SIGHT },
  { label: "DA 30 DAYS", value: PaymentTerm.DA_30_DAYS },
  { label: "OA 30 DAYS", value: PaymentTerm.OA_30_DAYS },
];

const TRADE_TERM_OPTIONS = Object.values(TradeTerm).map((value) => ({ label: value, value }));
const TRANSPORTATION_OPTIONS = [
  { label: "海运", value: TransportationMethod.SEA },
  { label: "空运", value: TransportationMethod.AIR },
  { label: "公路", value: TransportationMethod.ROAD },
  { label: "铁路", value: TransportationMethod.RAIL },
  { label: "快递", value: TransportationMethod.EXPRESS },
  { label: "其他", value: TransportationMethod.OTHER },
];
const PRIMARY_INDUSTRY_OPTIONS = [
  { label: "教育(教学、科研）", value: PrimaryIndustry.EDUCATION },
  { label: "政府", value: PrimaryIndustry.GOVERNMENT },
  { label: "医疗", value: PrimaryIndustry.MEDICAL },
  { label: "企业", value: PrimaryIndustry.ENTERPRISE },
];
const SECONDARY_INDUSTRY_OPTIONS = [
  { label: "农学院", value: SecondaryIndustry.AGRICULTURE_COLLEGE },
  { label: "食品", value: SecondaryIndustry.FOOD },
  { label: "动物科学学院", value: SecondaryIndustry.ANIMAL_SCIENCE },
  { label: "药学院", value: SecondaryIndustry.PHARMACY },
  { label: "医学院", value: SecondaryIndustry.MEDICAL_COLLEGE },
  { label: "公共卫生学院", value: SecondaryIndustry.PUBLIC_HEALTH },
  { label: "生命科学", value: SecondaryIndustry.LIFE_SCIENCE },
  { label: "环境", value: SecondaryIndustry.ENVIRONMENT },
];
const ORDER_NATURE_OPTIONS = [
  { label: "投标订单", value: OrderNature.BIDDING },
  { label: "零售订单", value: OrderNature.RETAIL },
  { label: "备库存订单", value: OrderNature.STOCK_PREPARE },
];
const RECEIPT_STATUS_OPTIONS = [
  { label: "未收款", value: ReceiptStatus.UNPAID },
  { label: "部分收款", value: ReceiptStatus.PARTIALLY_PAID },
  { label: "已收款", value: ReceiptStatus.PAID },
];
const CUSTOMS_METHOD_OPTIONS = [
  { label: "公司自行报关", value: CustomsDeclarationMethod.SELF },
  { label: "阿里一达通报关", value: CustomsDeclarationMethod.ALI_ONE_TOUCH },
];
const INVOICE_TYPE_OPTIONS = [
  { label: "增值税专用发票", value: InvoiceType.VAT_SPECIAL },
  { label: "增值税普通发票", value: InvoiceType.VAT_NORMAL },
];
const BL_TYPE_OPTIONS = [
  { label: "电放", value: BlType.TELEX_RELEASE },
  { label: "正本", value: BlType.ORIGINAL },
];

const LABEL_MAP: Record<string, string> = {
  [ShippingDemandStatus.PENDING_ALLOCATION]: "待分配库存",
  [ShippingDemandStatus.PENDING_PURCHASE_ORDER]: "待生成采购单",
  [ShippingDemandStatus.PURCHASING]: "采购中",
  [ShippingDemandStatus.PREPARED]: "备货完成",
  [ShippingDemandStatus.PARTIALLY_SHIPPED]: "部分发货",
  [ShippingDemandStatus.SHIPPED]: "已发货",
  [ShippingDemandStatus.VOIDED]: "已作废",
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
  [FulfillmentType.FULL_PURCHASE]: "全部采购",
  [FulfillmentType.PARTIAL_PURCHASE]: "部分采购",
  [FulfillmentType.USE_STOCK]: "使用现有库存",
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
};

const SHIPPING_DEMAND_STATUS_STYLE_MAP: Record<
  ShippingDemandStatus,
  { className: string; text: string }
> = {
  [ShippingDemandStatus.PENDING_ALLOCATION]: {
    className: "master-pill-blue",
    text: "待分配库存",
  },
  [ShippingDemandStatus.PENDING_PURCHASE_ORDER]: {
    className: "master-pill-orange",
    text: "待生成采购单",
  },
  [ShippingDemandStatus.PURCHASING]: {
    className: "master-pill-blue",
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

function dateValue(value?: string | null) {
  return value ? dayjs(value) : undefined;
}

function toNullableString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return String(value);
}

function toNullableNumber(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatLabel(value?: string | null) {
  if (!value) return "—";
  return LABEL_MAP[value] ?? value;
}

function demandToFormValues(demand: ShippingDemand) {
  const { status, domesticTradeType, ...formValues } = demand;
  return {
    ...formValues,
    statusDisplay: formatLabel(status),
    domesticTradeTypeDisplay: formatLabel(domesticTradeType),
    crmSignedAt: dateValue(demand.crmSignedAt),
    requiredDeliveryAt: dateValue(demand.requiredDeliveryAt),
    exchangeRate: demand.exchangeRate == null ? undefined : Number(demand.exchangeRate),
  };
}

function canEditShippingDemand(demand?: ShippingDemand | null) {
  return Boolean(demand && demand.status !== ShippingDemandStatus.VOIDED);
}

function getShippingDemandStatusInfo(status?: ShippingDemandStatus | null) {
  return status
    ? SHIPPING_DEMAND_STATUS_STYLE_MAP[status] ?? {
        className: "master-pill-default",
        text: formatLabel(status),
      }
    : {
        className: "master-pill-default",
        text: "—",
      };
}

export default function ShippingDemandFormPage() {
  const { modal, message } = App.useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const formRef = useRef<ProFormInstance>(undefined);
  const { id = "" } = useParams();
  const demandId = Number(id);
  const [activeAnchor, setActiveAnchor] = useState("basic");
  const [contractFiles, setContractFiles] = useState<Array<{ key: string; name: string }>>([]);
  const [contractFileList, setContractFileList] = useState<UploadFile[]>([]);
  const [plugPhotoKeys, setPlugPhotoKeys] = useState<string[]>([]);
  const [plugPhotoFileList, setPlugPhotoFileList] = useState<UploadFile[]>([]);
  const [shippingMarkTemplate, setShippingMarkTemplate] = useState<{ key: string; name: string } | null>(null);
  const [shippingMarkTemplateFileList, setShippingMarkTemplateFileList] = useState<UploadFile[]>([]);
  const [uploadingContract, setUploadingContract] = useState(false);
  const [uploadingPlugPhoto, setUploadingPlugPhoto] = useState(false);
  const [uploadingShippingMarkTemplate, setUploadingShippingMarkTemplate] = useState(false);
  const [domesticTradeType, setDomesticTradeType] = useState<DomesticTradeType>(DomesticTradeType.FOREIGN);

  const isValidId = Number.isInteger(demandId) && demandId > 0;
  const detailQuery = useQuery({
    queryKey: ["shipping-demand-detail", demandId],
    queryFn: () => getShippingDemandById(demandId),
    enabled: isValidId,
  });
  const demand = detailQuery.data;
  const statusInfo = getShippingDemandStatusInfo(demand?.status);

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateShippingDemandPayload) =>
      updateShippingDemand(demandId, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["shipping-demands"] });
      queryClient.invalidateQueries({ queryKey: ["shipping-demand-detail", demandId] });
      message.success("发货需求保存成功");
      navigate(`/shipping-demands/${updated.id}`);
    },
  });

  const anchors = [
    { key: "basic", label: "基础信息" },
    { key: "order", label: "订单信息" },
    { key: "items", label: "产品明细" },
    { key: "delivery", label: "收发通信息" },
    ...(domesticTradeType === DomesticTradeType.DOMESTIC
      ? [{ key: "domestic", label: "内销收货信息" }]
      : []),
    { key: "shipping", label: "发货要求" },
  ];

  const formInitialValues = useMemo(
    () => (demand ? demandToFormValues(demand) : {}),
    [demand],
  );

  useEffect(() => {
    if (!demand) return;
    setDomesticTradeType(demand.domesticTradeType);
    setContractFiles(
      (demand.contractFileKeys ?? []).map((key, index) => ({
        key,
        name: demand.contractFileNames?.[index] ?? key.split("/").pop() ?? key,
      })),
    );
    setContractFileList(
      (demand.contractFileKeys ?? []).map((key, index) => ({
        uid: `existing-contract-${key}`,
        name: demand.contractFileNames?.[index] ?? key.split("/").pop() ?? key,
        status: "done",
        url: demand.contractFileUrls?.[index],
      })),
    );
    setPlugPhotoKeys(demand.plugPhotoKeys ?? []);
    setPlugPhotoFileList(
      (demand.plugPhotoKeys ?? []).map((key, index) => ({
        uid: `existing-plug-${key}`,
        name: key.split("/").pop() ?? `插头照片${index + 1}`,
        status: "done",
        url: demand.plugPhotoUrls?.[index],
      })),
    );
    setShippingMarkTemplate(
      demand.shippingMarkTemplateKey
        ? {
            key: demand.shippingMarkTemplateKey,
            name: demand.shippingMarkTemplateKey.split("/").pop() ?? demand.shippingMarkTemplateKey,
          }
        : null,
    );
    setShippingMarkTemplateFileList(
      demand.shippingMarkTemplateKey
        ? [
            {
              uid: `existing-shipping-mark-${demand.shippingMarkTemplateKey}`,
              name: demand.shippingMarkTemplateKey.split("/").pop() ?? demand.shippingMarkTemplateKey,
              status: "done",
              url: demand.shippingMarkTemplateUrl ?? undefined,
            },
          ]
        : [],
    );
  }, [demand]);

  const itemColumns = useMemo<ColumnsType<ShippingDemandItem>>(
    () => [
      { title: "SKU", dataIndex: "skuCode", key: "skuCode", width: 140, fixed: "left" },
      {
        title: "产品",
        key: "productName",
        width: 220,
        render: (_: unknown, record) => displayOrDash(record.productNameCn ?? record.productNameEn),
      },
      { title: "规格", dataIndex: "skuSpecification", key: "skuSpecification", width: 160, render: displayOrDash },
      { title: "类型", dataIndex: "lineType", key: "lineType", width: 100, render: formatLabel },
      { title: "应发数量", dataIndex: "requiredQuantity", key: "requiredQuantity", width: 100 },
      { title: "履行类型", dataIndex: "fulfillmentType", key: "fulfillmentType", width: 130, render: formatLabel },
      { title: "使用现有库存数量", dataIndex: "stockRequiredQuantity", key: "stockRequiredQuantity", width: 150 },
      { title: "需采购数量", dataIndex: "purchaseRequiredQuantity", key: "purchaseRequiredQuantity", width: 120 },
      { title: "已锁定待发", dataIndex: "lockedRemainingQuantity", key: "lockedRemainingQuantity", width: 120 },
      { title: "已发货数量", dataIndex: "shippedQuantity", key: "shippedQuantity", width: 120 },
      { title: "采购已下单", dataIndex: "purchaseOrderedQuantity", key: "purchaseOrderedQuantity", width: 120 },
      { title: "已收货数量", dataIndex: "receivedQuantity", key: "receivedQuantity", width: 120 },
      { title: "销售单价", dataIndex: "unitPrice", key: "unitPrice", width: 120 },
      { title: "币种", dataIndex: "currencyCode", key: "currencyCode", width: 90, render: displayOrDash },
      { title: "总金额", dataIndex: "amount", key: "amount", width: 120 },
      { title: "单位", dataIndex: "unitName", key: "unitName", width: 100, render: displayOrDash },
      { title: "采购人员", dataIndex: "purchaserName", key: "purchaserName", width: 120, render: displayOrDash },
      { title: "是否需要采购", dataIndex: "needsPurchase", key: "needsPurchase", width: 120, render: formatLabel },
    ],
    [],
  );

  const uploadContract = async (file: File) => {
    setUploadingContract(true);
    try {
      const result = await uploadShippingDemandFile(file, "documents");
      setContractFiles((prev) => [...prev, { key: result.key, name: file.name }]);
      setContractFileList((prev) => [
        ...prev,
        { uid: `${Date.now()}-${file.name}`, name: file.name, status: "done" },
      ]);
      message.success(`${file.name} 上传成功`);
    } catch {
      message.error(`${file.name} 上传失败`);
    } finally {
      setUploadingContract(false);
    }
    return false;
  };

  const uploadPlugPhoto = async (file: File) => {
    setUploadingPlugPhoto(true);
    try {
      const result = await uploadShippingDemandFile(file, "general");
      setPlugPhotoKeys((prev) => [...prev, result.key]);
      setPlugPhotoFileList((prev) => [
        ...prev,
        { uid: `${Date.now()}-${file.name}`, name: file.name, status: "done" },
      ]);
      message.success(`${file.name} 上传成功`);
    } catch {
      message.error(`${file.name} 上传失败`);
    } finally {
      setUploadingPlugPhoto(false);
    }
    return false;
  };

  const uploadShippingMarkTemplate = async (file: File) => {
    setUploadingShippingMarkTemplate(true);
    try {
      const result = await uploadShippingDemandFile(file, "documents");
      setShippingMarkTemplate({ key: result.key, name: file.name });
      setShippingMarkTemplateFileList([
        { uid: `${Date.now()}-${file.name}`, name: file.name, status: "done" },
      ]);
      message.success(`${file.name} 上传成功`);
    } catch {
      message.error(`${file.name} 上传失败`);
    } finally {
      setUploadingShippingMarkTemplate(false);
    }
    return false;
  };

  const buildPayload = (values: Record<string, any>): UpdateShippingDemandPayload => ({
    afterSalesProductSummary: toNullableString(values.afterSalesProductSummary),
    tradeTerm: values.tradeTerm ?? null,
    bankAccount: toNullableString(values.bankAccount),
    primaryIndustry: values.primaryIndustry ?? null,
    secondaryIndustry: values.secondaryIndustry ?? null,
    exchangeRate: toNullableNumber(values.exchangeRate),
    crmSignedAt: values.crmSignedAt ? dayjs(values.crmSignedAt).format("YYYY-MM-DD") : null,
    paymentTerm: values.paymentTerm ?? null,
    orderNature: values.orderNature ?? null,
    receiptStatus: values.receiptStatus ?? null,
    merchandiserAbbr: toNullableString(values.merchandiserAbbr),
    transportationMethod: values.transportationMethod ?? null,
    requiredDeliveryAt: values.requiredDeliveryAt ? dayjs(values.requiredDeliveryAt).format("YYYY-MM-DD") : null,
    isSharedOrder: values.isSharedOrder ?? null,
    isSinosure: values.isSinosure ?? null,
    isAliTradeAssurance: values.isAliTradeAssurance ?? null,
    isInsured: values.isInsured ?? null,
    isPalletized: values.isPalletized ?? null,
    isSplitInAdvance: values.isSplitInAdvance ?? null,
    requiresExportCustoms: values.requiresExportCustoms ?? null,
    requiresWarrantyCard: values.requiresWarrantyCard ?? null,
    requiresCustomsCertificate: values.requiresCustomsCertificate ?? null,
    requiresMaternityHandover: values.requiresMaternityHandover ?? null,
    customsDeclarationMethod: values.customsDeclarationMethod ?? null,
    usesMarketingFund: values.usesMarketingFund ?? null,
    aliTradeAssuranceOrderCode: toNullableString(values.aliTradeAssuranceOrderCode),
    forwarderQuoteNote: toNullableString(values.forwarderQuoteNote),
    contractFileKeys: contractFiles.map((item) => item.key),
    contractFileNames: contractFiles.map((item) => item.name),
    plugPhotoKeys,
    consigneeCompany: toNullableString(values.consigneeCompany),
    consigneeOtherInfo: toNullableString(values.consigneeOtherInfo),
    notifyCompany: toNullableString(values.notifyCompany),
    notifyOtherInfo: toNullableString(values.notifyOtherInfo),
    shipperCompany: toNullableString(values.shipperCompany),
    domesticCustomerCompany: toNullableString(values.domesticCustomerCompany),
    domesticCustomerDeliveryInfo: toNullableString(values.domesticCustomerDeliveryInfo),
    usesDefaultShippingMark: values.usesDefaultShippingMark ?? null,
    shippingMarkNote: toNullableString(values.shippingMarkNote),
    shippingMarkTemplateKey: shippingMarkTemplate?.key ?? null,
    needsInvoice: values.needsInvoice ?? null,
    invoiceType: values.invoiceType ?? null,
    shippingDocumentsNote: toNullableString(values.shippingDocumentsNote),
    blType: values.blType ?? null,
    originalMailAddress: toNullableString(values.originalMailAddress),
    businessRectificationNote: toNullableString(values.businessRectificationNote),
    customsDocumentNote: toNullableString(values.customsDocumentNote),
    otherRequirementNote: toNullableString(values.otherRequirementNote),
  });

  const handleClickSubmit = async () => {
    try {
      const values = await formRef.current?.validateFields();
      if (!values) {
        message.error("表单尚未初始化，请刷新后重试");
        return;
      }
      modal.confirm({
        title: "确认保存发货需求？",
        content: "保存后将更新发货需求业务资料，不会修改产品明细数量和履约数量。",
        okText: "确认保存",
        cancelText: "取消",
        onOk: async () => {
          await updateMutation.mutateAsync(buildPayload(values as Record<string, any>));
        },
      });
    } catch (error) {
      const errorFields = (error as { errorFields?: Array<{ name: (string | number)[]; errors?: string[] }> })?.errorFields;
      if (errorFields?.length) {
        formRef.current?.scrollToField?.(errorFields[0].name);
        message.error(errorFields[0]?.errors?.[0] || "请先完善必填信息");
      }
    }
  };

  if (!isValidId) {
    return (
      <Result
        status="404"
        title="发货需求不存在"
        extra={<Button type="primary" onClick={() => navigate("/shipping-demands")}>返回列表</Button>}
      />
    );
  }

  if (detailQuery.isLoading && !demand) return <Skeleton active />;

  if (detailQuery.isError && !demand) {
    return (
      <Result
        status="error"
        title="加载发货需求失败"
        extra={<Button type="primary" onClick={() => detailQuery.refetch()}>重试</Button>}
      />
    );
  }

  if (!canEditShippingDemand(demand)) {
    return (
      <Result
        status="warning"
        title="当前发货需求不允许编辑"
        subTitle="已作废发货需求不允许编辑。"
        extra={<Button type="primary" onClick={() => navigate(`/shipping-demands/${demandId}`)}>返回详情</Button>}
      />
    );
  }

  return (
    <div className="master-page master-form-page">
      <div className="master-page-header">
        <div className="master-page-heading">
          <div className="master-page-title">编辑发货需求</div>
          <div className="master-page-description">维护发货需求业务资料；产品明细和履约数量由来源订单、库存分配和出库流程控制。</div>
        </div>
      </div>

      <ProForm
        formRef={formRef}
        submitter={false}
        initialValues={formInitialValues}
        onFinish={async (values) => {
          modal.confirm({
            title: "确认保存发货需求？",
            content: "保存后将更新发货需求业务资料，不会修改产品明细数量和履约数量。",
            okText: "确认保存",
            cancelText: "取消",
            onOk: async () => {
              await updateMutation.mutateAsync(buildPayload(values as Record<string, any>));
            },
          });
          return false;
        }}
      >
        <div className="master-form-layout">
          <AnchorNav anchors={anchors} activeKey={activeAnchor} onChange={setActiveAnchor} />

          <div className="master-form-main">
            <SectionCard id="basic" title="基础信息" description="来源和状态信息只读，避免破坏上游关联。">
              <div className="master-form-grid">
                <ProFormText name="demandCode" label="发货需求编号" readonly />
                <ProFormText name="sourceDocumentCode" label="来源销售订单" readonly />
                <ProForm.Item label="状态">
                  <span className={`master-pill ${statusInfo.className}`}>
                    {statusInfo.text}
                  </span>
                </ProForm.Item>
                <ProFormText name="domesticTradeTypeDisplay" label="内外销" readonly />
                <ProFormText name="externalOrderCode" label="订单号" readonly />
                <ProFormText name="customerName" label="客户" readonly />
                <ProFormText name="customerCode" label="客户代码" readonly />
                <ProFormText name="customerContactPerson" label="联系人" readonly />
                <ProFormText name="afterSalesSourceOrderCode" label="售后原订单号" readonly />
                <div className="full">
                  <ProFormTextArea name="afterSalesProductSummary" label="所有售后产品品名及对应总价" fieldProps={{ rows: 3 }} />
                </div>
              </div>
            </SectionCard>

            <SectionCard id="order" title="订单信息" description="维护交付、报关、收款和订单附加属性。">
              <div className="master-form-grid">
                <ProFormDatePicker name="requiredDeliveryAt" label="要求到货日期" />
                <ProFormSelect name="paymentTerm" label="付款方式" options={PAYMENT_TERM_OPTIONS} />
                <ProFormText name="currencyCode" label="外销币种" readonly />
                <ProFormSelect name="tradeTerm" label="贸易术语" options={TRADE_TERM_OPTIONS} />
                <ProFormText name="destinationCountryName" label="运抵国" readonly />
                <ProFormText name="shipmentOriginCountryName" label="起运地" readonly />
                <ProFormText name="destinationPortName" label="目的地" readonly />
                <ProFormText name="signingCompanyName" label="签约公司" readonly />
                <ProFormText name="salespersonName" label="销售员" readonly />
                <ProFormText name="bankAccount" label="银行账号" />
                <ProFormText name="extraViewerName" label="额外查看人" readonly />
                <ProFormSelect name="primaryIndustry" label="一级行业" options={PRIMARY_INDUSTRY_OPTIONS} />
                <ProFormDigit name="exchangeRate" label="汇率" min={0} fieldProps={{ precision: 6 }} />
                <ProFormSelect name="transportationMethod" label="运输方式" options={TRANSPORTATION_OPTIONS} />
                <ProFormDatePicker name="crmSignedAt" label="CRM签约日期" />
                <ProFormText name="contractAmount" label="合同金额" readonly />
                <ProFormText name="receivedAmount" label="已收款金额" readonly />
                <ProFormText name="outstandingAmount" label="待收款金额" readonly />
                <ProFormSelect name="orderNature" label="订单性质" options={ORDER_NATURE_OPTIONS} />
                <ProFormSelect name="secondaryIndustry" label="二级行业" options={SECONDARY_INDUSTRY_OPTIONS} />
                <ProFormSelect name="receiptStatus" label="收款状态" options={RECEIPT_STATUS_OPTIONS} />
                <ProFormText name="merchandiserName" label="商务跟单" readonly />
                <ProFormText name="merchandiserAbbr" label="商务跟单英文简写" />
                <ProFormSelect name="isSharedOrder" label="是否分摊订单" options={YES_NO_OPTIONS} />
                <ProFormSelect name="isSinosure" label="是否中信保" options={YES_NO_OPTIONS} />
                <ProFormSelect name="isPalletized" label="是否打托" options={YES_NO_OPTIONS} />
                <ProFormSelect name="requiresCustomsCertificate" label="是否需要清关证书" options={YES_NO_OPTIONS} />
                <ProFormSelect name="isSplitInAdvance" label="是否提前分单" options={YES_NO_OPTIONS} />
                <ProFormSelect name="usesMarketingFund" label="是否使用市场经费" options={YES_NO_OPTIONS} />
                <ProFormSelect name="requiresExportCustoms" label="是否出口报关" options={YES_NO_OPTIONS} />
                <ProFormSelect name="requiresWarrantyCard" label="是否需要质保卡" options={YES_NO_OPTIONS} />
                <ProFormSelect name="requiresMaternityHandover" label="是否产假交接单" options={YES_NO_OPTIONS} />
                <ProFormSelect name="customsDeclarationMethod" label="报关方式" options={CUSTOMS_METHOD_OPTIONS} />
                <ProFormSelect name="isInsured" label="是否投保" options={YES_NO_OPTIONS} />
                <ProFormSelect name="isAliTradeAssurance" label="是否阿里信保订单" options={YES_NO_OPTIONS} />
                <ProFormText name="aliTradeAssuranceOrderCode" label="阿里信保订单号" />
                <div className="full">
                  <ProFormTextArea name="forwarderQuoteNote" label="询价货代及费用" fieldProps={{ rows: 3 }} />
                </div>
                <div className="full master-upload-field">
                  <label className="master-upload-label">PI&SC合同文件</label>
                  <Upload
                    multiple
                    fileList={contractFileList}
                    beforeUpload={uploadContract}
                    onRemove={(file) => {
                      setContractFileList((prev) => prev.filter((item) => item.uid !== file.uid));
                      setContractFiles((prev) => prev.filter((item) => item.name !== file.name));
                    }}
                  >
                    <Button icon={<UploadOutlined />} loading={uploadingContract}>上传合同文件</Button>
                  </Upload>
                </div>
                <div className="full master-upload-field">
                  <label className="master-upload-label">插头照片</label>
                  <Upload
                    multiple
                    listType="picture"
                    fileList={plugPhotoFileList}
                    beforeUpload={uploadPlugPhoto}
                    onRemove={(file) => {
                      const index = plugPhotoFileList.findIndex((item) => item.uid === file.uid);
                      setPlugPhotoFileList((prev) => prev.filter((item) => item.uid !== file.uid));
                      setPlugPhotoKeys((prev) => prev.filter((_, idx) => idx !== index));
                    }}
                  >
                    <Button icon={<UploadOutlined />} loading={uploadingPlugPhoto}>上传插头照片</Button>
                  </Upload>
                </div>
              </div>
            </SectionCard>

            <SectionCard id="items" title="产品明细" description="产品明细和履约数量只读；库存分配请回详情页执行。">
              <Table
                rowKey="id"
                pagination={false}
                columns={itemColumns}
                dataSource={demand?.items ?? []}
                scroll={{ x: 2300 }}
              />
            </SectionCard>

            <SectionCard id="delivery" title="收发通信息" description="维护收货人、通知人和发货人信息。">
              <div className="master-form-grid">
                <div className="full"><ProFormTextArea name="consigneeCompany" label="收货人公司(Consignee)" fieldProps={{ rows: 3 }} /></div>
                <div className="full"><ProFormTextArea name="consigneeOtherInfo" label="收货人其他信息" fieldProps={{ rows: 3 }} /></div>
                <div className="full"><ProFormTextArea name="notifyCompany" label="通知人公司(Notify)" fieldProps={{ rows: 3 }} /></div>
                <div className="full"><ProFormTextArea name="notifyOtherInfo" label="通知人其他信息" fieldProps={{ rows: 3 }} /></div>
                <div className="full"><ProFormTextArea name="shipperCompany" label="发货人公司(Shipper)" fieldProps={{ rows: 3 }} /></div>
                <ProFormText name="shipperOtherInfoCompanyName" label="发货人其他信息" readonly />
              </div>
            </SectionCard>

            {domesticTradeType === DomesticTradeType.DOMESTIC ? (
              <SectionCard id="domestic" title="内销收货信息" description="维护内销客户收货资料。">
                <div className="master-form-grid">
                  <div className="full">
                    <ProFormTextArea name="domesticCustomerCompany" label="客户公司" fieldProps={{ rows: 3 }} />
                  </div>
                  <div className="full">
                    <ProFormTextArea name="domesticCustomerDeliveryInfo" label="客户收货信息" fieldProps={{ rows: 3 }} />
                  </div>
                </div>
              </SectionCard>
            ) : null}

            <SectionCard id="shipping" title="发货要求" description="维护唛头、发票、提单和清关要求。">
              <div className="master-form-grid">
                <ProFormSelect name="usesDefaultShippingMark" label="是否公司常规唛头" options={YES_NO_OPTIONS} />
                <ProFormText name="shippingMarkNote" label="唛头补充信息" />
                <div className="full master-upload-field">
                  <label className="master-upload-label">唛头模板</label>
                  <Upload
                    maxCount={1}
                    fileList={shippingMarkTemplateFileList}
                    beforeUpload={uploadShippingMarkTemplate}
                    onRemove={() => {
                      setShippingMarkTemplate(null);
                      setShippingMarkTemplateFileList([]);
                    }}
                  >
                    <Button icon={<UploadOutlined />} loading={uploadingShippingMarkTemplate}>上传唛头模板</Button>
                  </Upload>
                </div>
                <ProFormSelect name="needsInvoice" label="客户是否需要开票" options={YES_NO_OPTIONS} />
                <ProFormSelect name="invoiceType" label="开票类型" options={INVOICE_TYPE_OPTIONS} />
                <ProFormText name="shippingDocumentsNote" label="随货文件" />
                <ProFormSelect name="blType" label="签单/出提单方式" options={BL_TYPE_OPTIONS} />
                <div className="full"><ProFormTextArea name="originalMailAddress" label="正本邮寄地址" fieldProps={{ rows: 3 }} /></div>
                <div className="full"><ProFormTextArea name="businessRectificationNote" label="业务整改要求" fieldProps={{ rows: 3 }} /></div>
                <div className="full"><ProFormTextArea name="customsDocumentNote" label="清关单据要求" fieldProps={{ rows: 3 }} /></div>
                <div className="full"><ProFormTextArea name="otherRequirementNote" label="其他要求及注意事项" fieldProps={{ rows: 3 }} /></div>
              </div>
            </SectionCard>
          </div>
        </div>

        <div className="master-form-footer">
          <div className="master-form-footer-tip">
            保存仅更新发货需求资料；产品明细数量、履约数量和库存锁定由流程动作维护。
          </div>
          <div className="master-form-footer-actions">
            <Button onClick={() => navigate(`/shipping-demands/${demandId}`)}>取消</Button>
            <Button
              type="primary"
              loading={updateMutation.isPending}
              onClick={() => {
                void handleClickSubmit();
              }}
            >
              保存
            </Button>
          </div>
        </div>
      </ProForm>
    </div>
  );
}
