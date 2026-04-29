import { UploadOutlined } from '@ant-design/icons';
import {
  ProFormDependency,
  ProForm,
  ProFormDatePicker,
  ProFormDigit,
  ProFormList,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  type ProFormInstance,
} from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App,
  Button,
  Divider,
  Image,
  Result,
  Skeleton,
  Upload,
  message,
  type UploadFile,
} from 'antd';
import {
  BlType,
  CustomsDeclarationMethod,
  DomesticTradeType,
  InvoiceType,
  OrderNature,
  PaymentTerm,
  PrimaryIndustry,
  ProductLineType,
  ReceiptStatus,
  SalesOrderSource,
  SalesOrderStatus,
  SalesOrderType,
  SecondaryIndustry,
  TradeTerm,
  TransportationMethod,
  YesNo,
  PlugType,
} from '@infitek/shared';
import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createSalesOrder,
  getSalesOrderById,
  getSalesOrderOptions,
  updateSalesOrder,
  uploadSalesOrderFile,
  type CreateSalesOrderPayload,
  type SalesOrder,
} from '../../api/sales-orders.api';
import request from '../../api/request';
import { AnchorNav, SectionCard } from '../master-data/components/page-scaffold';
import '../master-data/master-page.css';

const YES_NO_OPTIONS = [
  { label: '是', value: YesNo.YES },
  { label: '否', value: YesNo.NO },
];

const DOMESTIC_TRADE_OPTIONS = [
  { label: '内销', value: DomesticTradeType.DOMESTIC },
  { label: '外销', value: DomesticTradeType.FOREIGN },
];

const ORDER_TYPE_OPTIONS = [
  { label: '销售订单', value: SalesOrderType.SALES },
  { label: '售后订单', value: SalesOrderType.AFTER_SALES },
  { label: '样品销售', value: SalesOrderType.SAMPLE },
];

const ORDER_SOURCE_OPTIONS = [
  { label: '手工录单', value: SalesOrderSource.MANUAL },
  { label: '第三方获取', value: SalesOrderSource.THIRD_PARTY },
];

const STATUS_LABELS: Record<SalesOrderStatus, string> = {
  [SalesOrderStatus.PENDING_SUBMIT]: '待提交',
  [SalesOrderStatus.IN_REVIEW]: '审核中',
  [SalesOrderStatus.APPROVED]: '审核通过',
  [SalesOrderStatus.REJECTED]: '已驳回',
  [SalesOrderStatus.PREPARING]: '备货中',
  [SalesOrderStatus.PREPARED]: '备货完成',
  [SalesOrderStatus.PARTIALLY_SHIPPED]: '部分发货',
  [SalesOrderStatus.SHIPPED]: '已发货',
  [SalesOrderStatus.VOIDED]: '已作废',
};

const PAYMENT_TERM_OPTIONS = [
  { label: '100% TT IN ADVANCE', value: PaymentTerm.TT_IN_ADVANCE_100 },
  {
    label: '30% DEPOSIT+70% BALANCE PAYMENT BEFORE DELIVERY',
    value: PaymentTerm.DEPOSIT_30_BALANCE_70_BEFORE_DELIVERY,
  },
  {
    label: '40% DEPOSIT+60% BALANCE PAYMENT BEFORE DELIVERY',
    value: PaymentTerm.DEPOSIT_40_BALANCE_60_BEFORE_DELIVERY,
  },
  {
    label: '50% DEPOSIT+50% BALANCE PAYMENT BEFORE DELIVERY',
    value: PaymentTerm.DEPOSIT_50_BALANCE_50_BEFORE_DELIVERY,
  },
  {
    label: '60% DEPOSIT+40% BALANCE PAYMENT BEFORE DELIVERY',
    value: PaymentTerm.DEPOSIT_60_BALANCE_40_BEFORE_DELIVERY,
  },
  {
    label: '70% DEPOSIT+30% BALANCE PAYMENT BEFORE DELIVERY',
    value: PaymentTerm.DEPOSIT_70_BALANCE_30_BEFORE_DELIVERY,
  },
  {
    label: '100% payment before delivery',
    value: PaymentTerm.PAYMENT_100_BEFORE_DELIVERY,
  },
  {
    label: '40% DEPOSIT+60% BALANCE PAYMENT AGAINST BL COPY WITHIN ** DAYS',
    value: PaymentTerm.DEPOSIT_40_BALANCE_60_AGAINST_BL_COPY,
  },
  {
    label: '50% DEPOSIT+50% BALANCE PAYMENT AGAINST BL COPY WITHIN ** DAYS',
    value: PaymentTerm.DEPOSIT_50_BALANCE_50_AGAINST_BL_COPY,
  },
  {
    label: '70% DEPOSIT+30% BALANCE PAYMENT AGAINST BL COPY WITHIN ** DAYS',
    value: PaymentTerm.DEPOSIT_70_BALANCE_30_AGAINST_BL_COPY,
  },
  { label: 'LC AT SIGHT', value: PaymentTerm.LC_AT_SIGHT },
  { label: 'CAD', value: PaymentTerm.CAD },
  { label: 'DP AT SIGHT', value: PaymentTerm.DP_AT_SIGHT },
  { label: 'DA 30 DAYS', value: PaymentTerm.DA_30_DAYS },
  { label: 'OA 30 DAYS', value: PaymentTerm.OA_30_DAYS },
];

const TRADE_TERM_OPTIONS = Object.values(TradeTerm).map((value) => ({ label: value, value }));
const TRANSPORTATION_OPTIONS = [
  { label: '海运', value: TransportationMethod.SEA },
  { label: '空运', value: TransportationMethod.AIR },
  { label: '公路', value: TransportationMethod.ROAD },
  { label: '铁路', value: TransportationMethod.RAIL },
  { label: '快递', value: TransportationMethod.EXPRESS },
  { label: '其他', value: TransportationMethod.OTHER },
];
const PRIMARY_INDUSTRY_OPTIONS = [
  { label: '教育(教学、科研）', value: PrimaryIndustry.EDUCATION },
  { label: '政府', value: PrimaryIndustry.GOVERNMENT },
  { label: '医疗', value: PrimaryIndustry.MEDICAL },
  { label: '企业', value: PrimaryIndustry.ENTERPRISE },
];
const SECONDARY_INDUSTRY_OPTIONS = [
  { label: '农学院', value: SecondaryIndustry.AGRICULTURE_COLLEGE },
  { label: '食品', value: SecondaryIndustry.FOOD },
  { label: '动物科学学院', value: SecondaryIndustry.ANIMAL_SCIENCE },
  { label: '药学院', value: SecondaryIndustry.PHARMACY },
  { label: '医学院', value: SecondaryIndustry.MEDICAL_COLLEGE },
  { label: '公共卫生学院', value: SecondaryIndustry.PUBLIC_HEALTH },
  { label: '生命科学', value: SecondaryIndustry.LIFE_SCIENCE },
  { label: '环境', value: SecondaryIndustry.ENVIRONMENT },
];
const ORDER_NATURE_OPTIONS = [
  { label: '投标订单', value: OrderNature.BIDDING },
  { label: '零售订单', value: OrderNature.RETAIL },
  { label: '备库存订单', value: OrderNature.STOCK_PREPARE },
];
const RECEIPT_STATUS_OPTIONS = [
  { label: '未收款', value: ReceiptStatus.UNPAID },
  { label: '部分收款', value: ReceiptStatus.PARTIALLY_PAID },
  { label: '已收款', value: ReceiptStatus.PAID },
];
const PRODUCT_LINE_TYPE_OPTIONS = [
  { label: '主品', value: ProductLineType.MAIN },
  { label: '选配', value: ProductLineType.OPTIONAL },
  { label: '标配', value: ProductLineType.STANDARD },
  { label: '赠品', value: ProductLineType.GIFT },
];
const PLUG_TYPE_OPTIONS = [
  { label: '欧标', value: PlugType.EU },
  { label: '英标', value: PlugType.UK },
  { label: '美标', value: PlugType.US },
  { label: '中标', value: PlugType.CN },
  { label: '其他', value: PlugType.OTHER },
  { label: '无', value: PlugType.NONE },
];
const CUSTOMS_METHOD_OPTIONS = [
  { label: '公司自行报关', value: CustomsDeclarationMethod.SELF },
  { label: '阿里一达通报关', value: CustomsDeclarationMethod.ALI_ONE_TOUCH },
];
const INVOICE_TYPE_OPTIONS = [
  { label: '增值税专用发票', value: InvoiceType.VAT_SPECIAL },
  { label: '增值税普通发票', value: InvoiceType.VAT_NORMAL },
];
const BL_TYPE_OPTIONS = [
  { label: '电放', value: BlType.TELEX_RELEASE },
  { label: '正本', value: BlType.ORIGINAL },
];

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const next = Number(value);
  return Number.isNaN(next) ? undefined : next;
}

function dateValue(value?: string | null) {
  return value ? dayjs(value) : undefined;
}

function salesOrderToFormValues(order: SalesOrder) {
  return {
    ...order,
    crmSignedAt: dateValue(order.crmSignedAt),
    requiredDeliveryAt: dateValue(order.requiredDeliveryAt),
    contractAmount: Number(order.contractAmount ?? 0),
    receivedAmount: Number(order.receivedAmount ?? 0),
    outstandingAmount: Number(order.outstandingAmount ?? 0),
    exchangeRate: order.exchangeRate == null ? undefined : Number(order.exchangeRate),
    items: (order.items ?? []).map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice ?? 0),
      amount: Number(item.amount ?? 0),
      totalVolumeCbm: Number(item.totalVolumeCbm ?? 0),
      totalWeightKg: Number(item.totalWeightKg ?? 0),
      unitWeightKg: Number(item.unitWeightKg ?? 0),
      unitVolumeCbm: Number(item.unitVolumeCbm ?? 0),
    })),
    expenses: (order.expenses ?? []).map((expense) => ({
      ...expense,
      amount: Number(expense.amount ?? 0),
    })),
  };
}

function canEditSalesOrder(order?: SalesOrder | null) {
  if (!order) return false;
  const hasActiveDemand = (order.shippingDemands ?? []).some((demand) => demand.status !== 'voided');
  return (
    order.status === SalesOrderStatus.PENDING_SUBMIT ||
    order.status === SalesOrderStatus.REJECTED ||
    (order.status === SalesOrderStatus.APPROVED && !hasActiveDemand)
  );
}

export default function SalesOrderFormPage() {
  const { modal, message: appMessage } = App.useApp();
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const queryClient = useQueryClient();
  const formRef = useRef<ProFormInstance>(undefined);
  const salesOrderId = Number(id);
  const isEdit = Number.isInteger(salesOrderId) && salesOrderId > 0;
  const [activeAnchor, setActiveAnchor] = useState('basic');
  const [contractFileList, setContractFileList] = useState<UploadFile[]>([]);
  const [contractFiles, setContractFiles] = useState<Array<{ key: string; name: string }>>([]);
  const [plugPhotoFileList, setPlugPhotoFileList] = useState<UploadFile[]>([]);
  const [plugPhotoKeys, setPlugPhotoKeys] = useState<string[]>([]);
  const [shippingMarkTemplateFileList, setShippingMarkTemplateFileList] = useState<UploadFile[]>(
    [],
  );
  const [shippingMarkTemplate, setShippingMarkTemplate] = useState<{
    key: string;
    name: string;
  } | null>(null);
  const [uploadingContract, setUploadingContract] = useState(false);
  const [uploadingPlugPhoto, setUploadingPlugPhoto] = useState(false);
  const [uploadingShippingMarkTemplate, setUploadingShippingMarkTemplate] = useState(false);
  const [domesticTradeType, setDomesticTradeType] = useState<DomesticTradeType>(
    DomesticTradeType.FOREIGN,
  );

  const optionsQuery = useQuery({
    queryKey: ['sales-order-options'],
    queryFn: getSalesOrderOptions,
  });

  const detailQuery = useQuery({
    queryKey: ['sales-order-detail', salesOrderId],
    queryFn: () => getSalesOrderById(salesOrderId),
    enabled: isEdit,
  });
  const hasHistoricalDemand = isEdit && (detailQuery.data?.shippingDemands?.length ?? 0) > 0;

  const createMutation = useMutation({
    mutationFn: (payload: CreateSalesOrderPayload) => createSalesOrder(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      appMessage.success('销售订单创建成功');
      navigate(`/sales-orders/${created.id}`);
    },
  });
  const updateMutation = useMutation({
    mutationFn: (payload: CreateSalesOrderPayload) => updateSalesOrder(salesOrderId, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales-order-detail', salesOrderId] });
      appMessage.success('销售订单保存成功');
      navigate(`/sales-orders/${updated.id}`);
    },
  });

  const anchors = [
    { key: 'basic', label: '基础信息' },
    { key: 'order', label: '订单信息' },
    { key: 'items', label: '产品明细' },
    { key: 'expense', label: '加项费用' },
    { key: 'delivery', label: '收发通信息' },
    ...(domesticTradeType === DomesticTradeType.DOMESTIC
      ? [{ key: 'domestic', label: '内销收货信息' }]
      : []),
    { key: 'shipping', label: '发货要求' },
  ];

  const orderStatusOptions = useMemo(
    () =>
      Object.entries(STATUS_LABELS).map(([value, label]) => ({
        value: value as SalesOrderStatus,
        label,
      })),
    [],
  );

  const initialValues = {
    orderType: SalesOrderType.SALES,
    orderSource: SalesOrderSource.MANUAL,
    domesticTradeType: DomesticTradeType.FOREIGN,
    receiptStatus: ReceiptStatus.UNPAID,
    status: optionsQuery.data?.initialStatus ?? SalesOrderStatus.PENDING_SUBMIT,
    receivedAmount: 0,
    outstandingAmount: 0,
    items: [{}],
    expenses: [],
  };

  const formInitialValues = useMemo(
    () => (isEdit && detailQuery.data ? salesOrderToFormValues(detailQuery.data) : initialValues),
    [detailQuery.data, isEdit, optionsQuery.data?.initialStatus],
  );

  useEffect(() => {
    if (!isEdit || !detailQuery.data) return;
    const order = detailQuery.data;
    setDomesticTradeType(order.domesticTradeType);
    setContractFiles(
      (order.contractFileKeys ?? []).map((key, index) => ({
        key,
        name: order.contractFileNames?.[index] ?? key.split('/').pop() ?? key,
      })),
    );
    setContractFileList(
      (order.contractFileKeys ?? []).map((key, index) => ({
        uid: `existing-contract-${key}`,
        name: order.contractFileNames?.[index] ?? key.split('/').pop() ?? key,
        status: 'done',
        url: order.contractFileUrls?.[index],
      })),
    );
    setPlugPhotoKeys(order.plugPhotoKeys ?? []);
    setPlugPhotoFileList(
      (order.plugPhotoKeys ?? []).map((key, index) => ({
        uid: `existing-plug-${key}`,
        name: key.split('/').pop() ?? `插头照片${index + 1}`,
        status: 'done',
        url: order.plugPhotoUrls?.[index],
      })),
    );
    setShippingMarkTemplate(
      order.shippingMarkTemplateKey
        ? {
            key: order.shippingMarkTemplateKey,
            name: order.shippingMarkTemplateKey.split('/').pop() ?? order.shippingMarkTemplateKey,
          }
        : null,
    );
    setShippingMarkTemplateFileList(
      order.shippingMarkTemplateKey
        ? [
            {
              uid: `existing-shipping-mark-${order.shippingMarkTemplateKey}`,
              name: order.shippingMarkTemplateKey.split('/').pop() ?? order.shippingMarkTemplateKey,
              status: 'done',
              url: order.shippingMarkTemplateUrl ?? undefined,
            },
          ]
        : [],
    );
  }, [detailQuery.data, isEdit]);

  const requestUsers = async (search?: string) => {
    const result = await request.get<any, { list: Array<{ id: string; name: string; username: string }> }>(
      '/users',
      { params: { search, pageSize: 20 } },
    );
    return result.list.map((item) => ({
      label: `${item.name} (${item.username})`,
      value: Number(item.id),
      name: item.name,
    }));
  };

  const requestCustomers = async (search?: string) => {
    const result = await request.get<any, { list: Array<{ id: number; customerName: string; customerCode: string; contactPerson?: string | null }> }>(
      '/customers',
      { params: { keyword: search, pageSize: 20 } },
    );
    return result.list.map((item) => ({
      label: `${item.customerName} (${item.customerCode})`,
      value: item.id,
      customerCode: item.customerCode,
      customerName: item.customerName,
      contactPerson: item.contactPerson ?? '',
    }));
  };

  const requestCurrencies = async (search?: string) => {
    const result = await request.get<any, { list: Array<{ id: number; code: string; name: string; symbol?: string | null }> }>(
      '/currencies',
      { params: { keyword: search, pageSize: 20 } },
    );
    return result.list.map((item) => ({
      label: `${item.code} - ${item.name}`,
      value: item.id,
      code: item.code,
      name: item.name,
      symbol: item.symbol ?? '',
    }));
  };

  const requestCountries = async (search?: string) => {
    const result = await request.get<any, { list: Array<{ id: number; name: string; code: string }> }>(
      '/countries',
      { params: { keyword: search, pageSize: 20 } },
    );
    return result.list.map((item) => ({
      label: `${item.name} (${item.code})`,
      value: item.id,
      name: item.name,
    }));
  };

  const requestCompanies = async (search?: string) => {
    const result = await request.get<any, { list: Array<{ id: number; nameCn: string }> }>(
      '/companies',
      { params: { keyword: search, pageSize: 20 } },
    );
    return result.list.map((item) => ({
      label: item.nameCn,
      value: item.id,
      name: item.nameCn,
    }));
  };

  const requestPorts = async (search?: string) => {
    const result = await request.get<any, { list: Array<{ id: number; nameCn: string; portCode: string }> }>(
      '/ports',
      { params: { keyword: search, pageSize: 20 } },
    );
    return result.list.map((item) => ({
      label: `${item.nameCn} (${item.portCode})`,
      value: item.id,
      name: item.nameCn,
    }));
  };

  const requestSalesOrders = async (search?: string) => {
    const result = await request.get<any, { list: Array<{ id: number; erpSalesOrderCode: string; externalOrderCode: string; orderType: SalesOrderType }> }>(
      '/sales-orders',
      {
        params: { keyword: search, orderType: SalesOrderType.SALES, pageSize: 20 },
      },
    );
    return result.list
      .filter((item) => item.orderType === SalesOrderType.SALES)
      .map((item) => ({
        label: `${item.erpSalesOrderCode} / ${item.externalOrderCode}`,
        value: item.id,
        code: item.erpSalesOrderCode,
      }));
  };

  const requestSkus = async (search?: string) => {
    const result = await request.get<any, { list: Array<any> }>('/skus', {
      params: { keyword: search, pageSize: 20 },
    });
    return result.list.map((item) => ({
      label: `${item.skuCode} - ${item.nameCn ?? item.specification}`,
      value: item.id,
      raw: item,
    }));
  };

  const uploadContract = async (file: File) => {
    setUploadingContract(true);
    try {
      const result = await uploadSalesOrderFile(file, 'documents');
      setContractFiles((prev) => [...prev, { key: result.key, name: file.name }]);
      setContractFileList((prev) => [
        ...prev,
        { uid: `${Date.now()}-${file.name}`, name: file.name, status: 'done' },
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
      const result = await uploadSalesOrderFile(file, 'general');
      setPlugPhotoKeys((prev) => [...prev, result.key]);
      setPlugPhotoFileList((prev) => [
        ...prev,
        { uid: `${Date.now()}-${file.name}`, name: file.name, status: 'done' },
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
      const result = await uploadSalesOrderFile(file, 'documents');
      setShippingMarkTemplate({ key: result.key, name: file.name });
      setShippingMarkTemplateFileList([
        { uid: `${Date.now()}-${file.name}`, name: file.name, status: 'done' },
      ]);
      message.success(`${file.name} 上传成功`);
    } catch {
      message.error(`${file.name} 上传失败`);
    } finally {
      setUploadingShippingMarkTemplate(false);
    }
    return false;
  };

  const buildPayload = (values: Record<string, any>): CreateSalesOrderPayload => {
    const items = (values.items ?? []).map((item: Record<string, any>) => ({
      id: toNumber(item.id),
      skuId: Number(item.skuId),
      productNameCn: item.productNameCn || undefined,
      productNameEn: item.productNameEn || undefined,
      lineType: item.lineType || undefined,
      spuId: toNumber(item.spuId),
      spuName: item.spuName || undefined,
      electricalParams: item.electricalParams || undefined,
      hasPlug: item.hasPlug || undefined,
      plugType: item.plugType || undefined,
      unitPrice: Number(item.unitPrice ?? 0),
      currencyId: toNumber(item.currencyId),
      quantity: Number(item.quantity ?? 0),
      purchaserId: toNumber(item.purchaserId),
      needsPurchase: item.needsPurchase || undefined,
      purchaseQuantity: Number(item.purchaseQuantity ?? 0),
      useStockQuantity: Number(item.useStockQuantity ?? 0),
      preparedQuantity: Number(item.preparedQuantity ?? 0),
      shippedQuantity: Number(item.shippedQuantity ?? 0),
      amount: Number(item.amount ?? 0),
      unitId: toNumber(item.unitId),
      unitName: item.unitName || undefined,
      material: item.material || undefined,
      imageUrl: item.imageUrl || undefined,
      totalVolumeCbm: Number(item.totalVolumeCbm ?? 0),
      totalWeightKg: Number(item.totalWeightKg ?? 0),
      unitWeightKg: Number(item.unitWeightKg ?? 0),
      unitVolumeCbm: Number(item.unitVolumeCbm ?? 0),
      skuSpecification: item.skuSpecification || undefined,
    }));

    const expenses = (values.expenses ?? []).map((expense: Record<string, any>) => ({
      expenseName: expense.expenseName,
      amount: Number(expense.amount ?? 0),
    }));

    return {
      domesticTradeType: values.domesticTradeType,
      externalOrderCode: values.externalOrderCode,
      orderSource: values.orderSource,
      orderType: values.orderType,
      customerId: Number(values.customerId),
      afterSalesSourceOrderId: toNumber(values.afterSalesSourceOrderId),
      afterSalesProductSummary: values.afterSalesProductSummary || undefined,
      destinationCountryId: toNumber(values.destinationCountryId),
      paymentTerm: values.paymentTerm || undefined,
      shipmentOriginCountryId: toNumber(values.shipmentOriginCountryId),
      signingCompanyId: toNumber(values.signingCompanyId),
      salespersonId: toNumber(values.salespersonId),
      otherIndustryNote: values.otherIndustryNote || undefined,
      currencyId: toNumber(values.currencyId),
      tradeTerm: values.tradeTerm || undefined,
      destinationPortId: toNumber(values.destinationPortId),
      bankAccount: values.bankAccount || undefined,
      extraViewerId: toNumber(values.extraViewerId),
      primaryIndustry: values.primaryIndustry || undefined,
      exchangeRate: toNumber(values.exchangeRate),
      transportationMethod: values.transportationMethod || undefined,
      crmSignedAt: values.crmSignedAt ? dayjs(values.crmSignedAt).format('YYYY-MM-DD') : undefined,
      contractAmount: Number(values.contractAmount ?? 0),
      orderNature: values.orderNature || undefined,
      secondaryIndustry: values.secondaryIndustry || undefined,
      receiptStatus: values.receiptStatus || undefined,
      status: SalesOrderStatus.PENDING_SUBMIT,
      contractFileKeys: contractFiles.map((item) => item.key),
      contractFileNames: contractFiles.map((item) => item.name),
      receivedAmount: Number(values.receivedAmount ?? 0),
      merchandiserId: toNumber(values.merchandiserId),
      merchandiserAbbr: values.merchandiserAbbr || undefined,
      requiredDeliveryAt: values.requiredDeliveryAt
        ? dayjs(values.requiredDeliveryAt).format('YYYY-MM-DD')
        : undefined,
      isSharedOrder: values.isSharedOrder || undefined,
      isSinosure: values.isSinosure || undefined,
      isPalletized: values.isPalletized || undefined,
      requiresCustomsCertificate: values.requiresCustomsCertificate || undefined,
      isSplitInAdvance: values.isSplitInAdvance || undefined,
      usesMarketingFund: values.usesMarketingFund || undefined,
      requiresExportCustoms: values.requiresExportCustoms || undefined,
      requiresWarrantyCard: values.requiresWarrantyCard || undefined,
      requiresMaternityHandover: values.requiresMaternityHandover || undefined,
      customsDeclarationMethod: values.customsDeclarationMethod || undefined,
      plugPhotoKeys,
      isInsured: values.isInsured || undefined,
      isAliTradeAssurance: values.isAliTradeAssurance || undefined,
      aliTradeAssuranceOrderCode: values.aliTradeAssuranceOrderCode || undefined,
      forwarderQuoteNote: values.forwarderQuoteNote || undefined,
      consigneeCompany: values.consigneeCompany || undefined,
      consigneeOtherInfo: values.consigneeOtherInfo || undefined,
      notifyCompany: values.notifyCompany || undefined,
      notifyOtherInfo: values.notifyOtherInfo || undefined,
      shipperCompany: values.shipperCompany || undefined,
      shipperOtherInfoCompanyId: toNumber(values.shipperOtherInfoCompanyId),
      domesticCustomerCompany: values.domesticCustomerCompany || undefined,
      domesticCustomerDeliveryInfo: values.domesticCustomerDeliveryInfo || undefined,
      usesDefaultShippingMark: values.usesDefaultShippingMark || undefined,
      shippingMarkNote: values.shippingMarkNote || undefined,
      shippingMarkTemplateKey: shippingMarkTemplate?.key || undefined,
      needsInvoice: values.needsInvoice || undefined,
      invoiceType: values.invoiceType || undefined,
      shippingDocumentsNote: values.shippingDocumentsNote || undefined,
      blType: values.blType || undefined,
      originalMailAddress: values.originalMailAddress || undefined,
      businessRectificationNote: values.businessRectificationNote || undefined,
      customsDocumentNote: values.customsDocumentNote || undefined,
      otherRequirementNote: values.otherRequirementNote || undefined,
      items,
      expenses,
    };
  };

  const handleSubmit = async (values: Record<string, any>) => {
    const payload = buildPayload(values);
    if (isEdit) {
      await updateMutation.mutateAsync(payload);
    } else {
      await createMutation.mutateAsync(payload);
    }
    return true;
  };

  const handleFinishFailed = (errorFields: Array<{ name: (string | number)[]; errors?: string[] }>) => {
    if (errorFields.length > 0) {
      formRef.current?.scrollToField?.(errorFields[0].name);
      message.error(errorFields[0]?.errors?.[0] || '请先完善必填信息');
    }
  };

  const openSubmitConfirm = (values: Record<string, any>) => {
    modal.confirm({
      title: isEdit ? '确认保存销售订单？' : '确认提交销售订单？',
      content: isEdit ? '保存后将更新销售订单基础资料和明细。' : '提交后将创建订单并进入待审核流转。',
      okText: isEdit ? '确认保存' : '确认提交',
      cancelText: '取消',
      onOk: async () => {
        await handleSubmit(values);
      },
    });
  };

  const handleClickSubmit = async () => {
    try {
      const values = await formRef.current?.validateFields();
      if (!values) {
        message.error('表单尚未初始化，请刷新后重试');
        return;
      }
      openSubmitConfirm(values as Record<string, any>);
    } catch (error) {
      const errorFields = (error as { errorFields?: Array<{ name: (string | number)[]; errors?: string[] }> })?.errorFields;
      handleFinishFailed(errorFields ?? []);
    }
  };

  if ((optionsQuery.isLoading && !optionsQuery.data) || (isEdit && detailQuery.isLoading && !detailQuery.data)) {
    return <Skeleton active />;
  }

  if (optionsQuery.isError || (isEdit && detailQuery.isError && !detailQuery.data)) {
    return (
      <Result
        status="error"
        title={isEdit ? '加载销售订单失败' : '加载销售订单配置失败'}
        extra={
          <Button type="primary" onClick={() => (isEdit ? detailQuery.refetch() : optionsQuery.refetch())}>
            重试
          </Button>
        }
      />
    );
  }

  if (isEdit && !canEditSalesOrder(detailQuery.data)) {
    return (
      <Result
        status="warning"
        title="当前销售订单不允许编辑"
        subTitle="只有待提交、已驳回，或审核通过且没有未作废发货需求的销售订单可以编辑。"
        extra={
          <Button type="primary" onClick={() => navigate(`/sales-orders/${salesOrderId}`)}>
            返回详情
          </Button>
        }
      />
    );
  }

  return (
    <div className="master-page master-form-page">
      <div className="master-page-header">
        <div className="master-page-heading">
          <div className="master-page-title">{isEdit ? '编辑销售订单' : '新建销售订单'}</div>
          <div className="master-page-description">
            {isEdit
              ? '维护销售订单基础信息、产品明细、加项费用和发货要求。'
              : '录入基础信息、订单信息、产品明细、加项费用和发货要求，提交后进入待审核流转。'}
          </div>
        </div>
      </div>

      <ProForm
        formRef={formRef}
        submitter={false}
        initialValues={formInitialValues}
        onValuesChange={(_, allValues) => {
          setDomesticTradeType(
            allValues.domesticTradeType === DomesticTradeType.DOMESTIC
              ? DomesticTradeType.DOMESTIC
              : DomesticTradeType.FOREIGN,
          );
          const contractAmount = Number(allValues.contractAmount ?? 0);
          const receivedAmount = Number(allValues.receivedAmount ?? 0);
          formRef.current?.setFieldValue('outstandingAmount', Number((contractAmount - receivedAmount).toFixed(2)));

          const items = (allValues.items ?? []).map((item: Record<string, any>) => {
            const quantity = Number(item.quantity ?? 0);
            const unitPrice = Number(item.unitPrice ?? 0);
            const unitVolumeCbm = Number(item.unitVolumeCbm ?? 0);
            const unitWeightKg = Number(item.unitWeightKg ?? 0);
            return {
              ...item,
              amount: Number((quantity * unitPrice).toFixed(2)),
              totalVolumeCbm: Number((unitVolumeCbm * quantity).toFixed(4)),
              totalWeightKg: Number((unitWeightKg * quantity).toFixed(4)),
            };
          });
          formRef.current?.setFieldValue('items', items);
        }}
        onFinish={async (values) => {
          openSubmitConfirm(values);
          return false;
        }}
        onFinishFailed={({ errorFields }) => {
          handleFinishFailed(errorFields);
        }}
      >
        <div className="master-form-layout">
          <AnchorNav anchors={anchors} activeKey={activeAnchor} onChange={setActiveAnchor} />

          <div className="master-form-main">
            <SectionCard id="basic" title="基础信息" description="维护销售订单主表关键信息。">
              <div className="master-form-grid">
                <ProFormText name="erpSalesOrderCode" label="ERP销售订单号" readonly placeholder="系统保存后自动生成" />
                <ProFormSelect
                  name="orderSource"
                  label="订单来源"
                  options={ORDER_SOURCE_OPTIONS}
                  rules={[{ required: true, message: '请选择订单来源' }]}
                />
                <ProFormSelect
                  name="domesticTradeType"
                  label="内外销"
                  options={DOMESTIC_TRADE_OPTIONS}
                  rules={[{ required: true, message: '请选择内外销' }]}
                />
                <ProFormText
                  name="externalOrderCode"
                  label="订单号"
                  placeholder="请输入第三方订单号"
                  rules={[{ required: true, message: '请输入订单号' }]}
                />
                <ProFormSelect
                  name="orderType"
                  label="订单类型"
                  options={ORDER_TYPE_OPTIONS}
                  rules={[{ required: true, message: '请选择订单类型' }]}
                />
                <ProFormSelect
                  name="customerId"
                  label="客户"
                  showSearch
                  request={async (params) => requestCustomers(params.keyWords)}
                  rules={[{ required: true, message: '请选择客户' }]}
                  fieldProps={{
                    onChange: (_value, option) => {
                      formRef.current?.setFieldsValue({
                        customerCode: option?.customerCode ?? '',
                        customerName: option?.customerName ?? '',
                        customerContactPerson: option?.contactPerson ?? '',
                      });
                    },
                  }}
                />
                <ProFormText name="customerCode" label="客户代码" readonly />
                <ProFormText name="customerName" label="客户名称" readonly />
                <ProFormText name="customerContactPerson" label="联系人" readonly />
                <ProFormSelect
                  name="afterSalesSourceOrderId"
                  label="售后原订单号"
                  showSearch
                  request={async (params) => requestSalesOrders(params.keyWords)}
                />
                <div className="full">
                  <ProFormTextArea name="afterSalesProductSummary" label="所有售后产品品名及对应总价" fieldProps={{ rows: 3 }} />
                </div>
                <ProFormSelect
                  name="destinationCountryId"
                  label="运抵国"
                  showSearch
                  request={async (params) => requestCountries(params.keyWords)}
                />
                <ProFormSelect name="paymentTerm" label="付款方式" options={PAYMENT_TERM_OPTIONS} />
                <ProFormSelect
                  name="shipmentOriginCountryId"
                  label="起运地"
                  showSearch
                  request={async (params) => requestCountries(params.keyWords)}
                />
                <ProFormSelect
                  name="signingCompanyId"
                  label="签约公司"
                  showSearch
                  request={async (params) => requestCompanies(params.keyWords)}
                />
                <ProFormSelect
                  name="salespersonId"
                  label="销售员"
                  showSearch
                  request={async (params) => requestUsers(params.keyWords)}
                />
                <ProFormText name="otherIndustryNote" label="其他行业说明" />
                <ProFormSelect
                  name="currencyId"
                  label="外销币种"
                  showSearch
                  request={async (params) => requestCurrencies(params.keyWords)}
                />
                <ProFormSelect name="tradeTerm" label="贸易术语" options={TRADE_TERM_OPTIONS} />
                <ProFormSelect
                  name="destinationPortId"
                  label="目的地"
                  showSearch
                  request={async (params) => requestPorts(params.keyWords)}
                />
                <ProFormText name="bankAccount" label="银行账号" />
                <ProFormSelect
                  name="extraViewerId"
                  label="额外查看人"
                  showSearch
                  request={async (params) => requestUsers(params.keyWords)}
                />
                <ProFormSelect name="primaryIndustry" label="一级行业" options={PRIMARY_INDUSTRY_OPTIONS} />
                <ProFormDigit name="exchangeRate" label="汇率" min={0} fieldProps={{ precision: 6 }} />
                <ProFormSelect name="transportationMethod" label="运输方式" options={TRANSPORTATION_OPTIONS} />
                <ProFormDatePicker name="crmSignedAt" label="CRM签约日期" />
                <ProFormDigit name="contractAmount" label="合同金额" min={0} fieldProps={{ precision: 2 }} />
                <ProFormSelect name="orderNature" label="订单性质" options={ORDER_NATURE_OPTIONS} />
                <ProFormSelect name="secondaryIndustry" label="二级行业" options={SECONDARY_INDUSTRY_OPTIONS} />
                <ProFormSelect name="receiptStatus" label="收款状态" options={RECEIPT_STATUS_OPTIONS} />
                <ProFormSelect
                  name="status"
                  label="订单状态"
                  options={orderStatusOptions.filter(
                    (option) =>
                      option.value ===
                      (isEdit ? detailQuery.data?.status ?? SalesOrderStatus.PENDING_SUBMIT : SalesOrderStatus.PENDING_SUBMIT),
                  )}
                  readonly
                  disabled
                />
                <div className="full master-upload-field">
                  <label className="ant-form-item-required master-upload-label">PI&SC合同文件</label>
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
                <ProFormDigit name="receivedAmount" label="已收款金额" min={0} fieldProps={{ precision: 2 }} />
                <ProFormSelect
                  name="merchandiserId"
                  label="商务跟单"
                  showSearch
                  request={async (params) => requestUsers(params.keyWords)}
                />
                <ProFormDigit name="outstandingAmount" label="待收款金额" readonly fieldProps={{ precision: 2 }} />
                <ProFormText name="merchandiserAbbr" label="商务跟单英文简写" fieldProps={{ style: { textTransform: 'uppercase' } }} />
              </div>
            </SectionCard>

            <SectionCard id="order" title="订单信息" description="配置交付、报关与订单附加属性。">
              <div className="master-form-grid">
                <ProFormDatePicker name="requiredDeliveryAt" label="要求到货日期" />
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
                <ProFormSelect name="isInsured" label="是否投保" options={YES_NO_OPTIONS} />
                <ProFormSelect name="isAliTradeAssurance" label="是否阿里信保订单" options={YES_NO_OPTIONS} />
                <ProFormText name="aliTradeAssuranceOrderCode" label="阿里信保订单号" />
                <div className="full">
                  <ProFormTextArea name="forwarderQuoteNote" label="询价货代及费用" fieldProps={{ rows: 3 }} />
                </div>
              </div>
            </SectionCard>

            <SectionCard id="items" title="产品明细" description="维护 SKU 行项、数量、单价与库存准备字段。">
              <ProFormList
                name="items"
                creatorButtonProps={
                  hasHistoricalDemand ? false : { creatorButtonText: '添加产品明细' }
                }
                copyIconProps={false}
                itemRender={({ listDom, action }, { index }) => (
                  <div className="master-section-card sales-order-item-card" style={{ marginBottom: 16 }}>
                    <div className="master-section-header">
                      <div className="master-section-title">产品明细 #{index + 1}</div>
                      {hasHistoricalDemand ? null : action}
                    </div>
                    <div className="master-section-body sales-order-item-card-body">{listDom}</div>
                  </div>
                )}
              >
                {(_meta, index) => (
                  <>
                    <div className="sales-order-item-row-grid">
                      <ProFormSelect
                        name="skuId"
                        label="SKU"
                        showSearch
                        request={async (params) => requestSkus(params.keyWords)}
                        rules={[{ required: true, message: '请选择 SKU' }]}
                        fieldProps={{
                          onChange: (_value, option) => {
                            const rowPath = ['items', index];
                            const normalizedOption = Array.isArray(option) ? option[0] : option;
                            const raw = normalizedOption?.raw;
                            if (!raw) return;
                            const packagingRows = raw.packagingList ? JSON.parse(raw.packagingList) : [];
                            const firstPackaging = packagingRows[0] ?? {};
                            const unitWeightKg = Number(firstPackaging.grossWeightKg ?? raw.grossWeightKg ?? 0);
                            const unitVolumeCbm = Number(firstPackaging.volumeCbm ?? raw.volumeCbm ?? 0);
                            const quantity = Number(formRef.current?.getFieldValue([...rowPath, 'quantity']) ?? 0);
                            formRef.current?.setFieldsValue({
                              items: {
                                [index]: {
                                  productNameCn: raw.nameCn ?? '',
                                  productNameEn: raw.nameEn ?? '',
                                  spuId: raw.spuId ?? undefined,
                                  spuName: raw.spuId ? `SPU#${raw.spuId}` : '',
                                  electricalParams: raw.electricalParams ?? '',
                                  hasPlug: raw.hasPlug === true ? YesNo.YES : raw.hasPlug === false ? YesNo.NO : undefined,
                                  unitId: raw.unitId ?? undefined,
                                  unitName: raw.unitId ? `UNIT#${raw.unitId}` : '',
                                  material: raw.material ?? '',
                                  imageUrl: raw.productImageUrl ?? '',
                                  unitWeightKg,
                                  unitVolumeCbm,
                                  skuSpecification: raw.specification ?? '',
                                  totalVolumeCbm: Number((unitVolumeCbm * quantity).toFixed(4)),
                                  totalWeightKg: Number((unitWeightKg * quantity).toFixed(4)),
                                },
                              },
                            });
                          },
                        }}
                      />
                      <ProFormText name="productNameCn" label="产品中文名" readonly />
                      <ProFormText name="productNameEn" label="产品英文名" readonly />
                      <ProFormSelect name="lineType" label="类型" options={PRODUCT_LINE_TYPE_OPTIONS} />
                      <ProFormText name="spuName" label="SPU" readonly />
                      <ProFormText name="electricalParams" label="电参数" readonly />
                      <ProFormSelect name="hasPlug" label="有无插头" options={YES_NO_OPTIONS} />
                      <ProFormSelect name="plugType" label="插头类型" options={PLUG_TYPE_OPTIONS} />
                      <ProFormDigit
                        name="unitPrice"
                        label="销售单价"
                        min={0}
                        fieldProps={{ precision: 2 }}
                        rules={[{ required: true, message: '请输入销售单价' }]}
                      />
                      <ProFormSelect
                        name="currencyId"
                        label="币种"
                        showSearch
                        request={async (params) => requestCurrencies(params.keyWords)}
                      />
                      <ProFormDigit
                        name="quantity"
                        label="签约数量"
                        min={1}
                        precision={0}
                        rules={[
                          { required: true, message: '请输入签约数量' },
                          {
                            validator: async (_rule: unknown, value: unknown) => {
                              if (value === undefined || value === null || value === '') return;
                              if (Number(value) < 1) {
                                throw new Error('签约数量必须大于等于 1');
                              }
                            },
                          },
                        ]}
                      />
                      <ProFormSelect
                        name="purchaserId"
                        label="采购人员"
                        showSearch
                        request={async (params) => requestUsers(params.keyWords)}
                      />
                      <ProFormSelect name="needsPurchase" label="是否需要采购" options={YES_NO_OPTIONS} />
                      <ProFormDigit name="purchaseQuantity" label="需采购数量" min={0} precision={0} />
                      <ProFormDigit name="useStockQuantity" label="使用现有库存数量" min={0} precision={0} />
                      <ProFormDigit name="preparedQuantity" label="已备货数量" min={0} precision={0} />
                      <ProFormDigit name="shippedQuantity" label="已发货数量" min={0} precision={0} />
                      <ProFormDigit name="amount" label="总金额" readonly fieldProps={{ precision: 2 }} />
                      <ProFormText name="unitName" label="单位" readonly />
                      <ProFormText name="material" label="产品材质" readonly />
                      <div className="sales-order-item-image-field">
                        <ProFormText name="imageUrl" label="图片地址" readonly />
                        {formRef.current?.getFieldValue(['items', index, 'imageUrl']) ? (
                          <div style={{ marginTop: 8 }}>
                            <Image
                              width={96}
                              src={formRef.current?.getFieldValue(['items', index, 'imageUrl'])}
                            />
                          </div>
                        ) : null}
                      </div>
                      <ProFormDigit name="totalVolumeCbm" label="总体积(m³)" readonly fieldProps={{ precision: 4 }} />
                      <ProFormDigit name="totalWeightKg" label="总重量(kg)" readonly fieldProps={{ precision: 4 }} />
                      <ProFormDigit name="unitWeightKg" label="单品重量(kg)" readonly fieldProps={{ precision: 4 }} />
                      <ProFormDigit name="unitVolumeCbm" label="单品体积(m³)" readonly fieldProps={{ precision: 4 }} />
                    </div>
                    <Divider style={{ margin: '12px 0 0' }} />
                  </>
                )}
              </ProFormList>
            </SectionCard>

            <SectionCard id="expense" title="加项费用" description="维护额外费用明细。">
              <ProFormList
                name="expenses"
                creatorButtonProps={{ creatorButtonText: '添加费用明细' }}
                copyIconProps={false}
              >
                <div className="master-form-grid">
                  <ProFormText name="expenseName" label="费用名称" rules={[{ required: true, message: '请输入费用名称' }]} />
                  <ProFormDigit name="amount" label="金额" min={0} fieldProps={{ precision: 2 }} />
                </div>
              </ProFormList>
            </SectionCard>

            <SectionCard id="delivery" title="收发通信息" description="维护收货人、通知人和发货人信息。">
              <div className="master-form-grid">
                <div className="full"><ProFormTextArea name="consigneeCompany" label="收货人公司(Consignee)" fieldProps={{ rows: 3 }} /></div>
                <div className="full"><ProFormTextArea name="consigneeOtherInfo" label="收货人其他信息" fieldProps={{ rows: 3 }} /></div>
                <div className="full"><ProFormTextArea name="notifyCompany" label="通知人公司(Notify)" fieldProps={{ rows: 3 }} /></div>
                <div className="full"><ProFormTextArea name="notifyOtherInfo" label="通知人其他信息" fieldProps={{ rows: 3 }} /></div>
                <div className="full"><ProFormTextArea name="shipperCompany" label="发货人公司(Shipper)" fieldProps={{ rows: 3 }} /></div>
                <ProFormSelect
                  name="shipperOtherInfoCompanyId"
                  label="发货人其他信息"
                  showSearch
                  request={async (params) => requestCompanies(params.keyWords)}
                />
              </div>
            </SectionCard>

            <ProFormDependency name={['domesticTradeType']}>
              {({ domesticTradeType: currentDomesticTradeType }) =>
                currentDomesticTradeType === DomesticTradeType.DOMESTIC ? (
                  <SectionCard
                    id="domestic"
                    title="内销收货信息"
                    description="仅内销订单填写客户公司与收货信息。"
                  >
                    <div className="master-form-grid">
                      <div className="full">
                        <ProFormTextArea
                          name="domesticCustomerCompany"
                          label="客户公司"
                          fieldProps={{ rows: 3 }}
                        />
                      </div>
                      <div className="full">
                        <ProFormTextArea
                          name="domesticCustomerDeliveryInfo"
                          label="客户收货信息"
                          fieldProps={{ rows: 3 }}
                        />
                      </div>
                    </div>
                  </SectionCard>
                ) : null
              }
            </ProFormDependency>

            <SectionCard id="shipping" title="发货要求" description="配置唛头、发票、提单与清关要求。">
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
                    <Button
                      icon={<UploadOutlined />}
                      loading={uploadingShippingMarkTemplate}
                    >
                      上传唛头模板
                    </Button>
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
            {isEdit
              ? '保存仅更新销售订单资料；如需推进流程，请回到详情页执行状态动作。'
              : '保存后订单会进入状态流转。当前实现只做状态动作，不做真实审批。'}
          </div>
          <div className="master-form-footer-actions">
            <Button onClick={() => navigate(isEdit ? `/sales-orders/${salesOrderId}` : '/')}>取消</Button>
            <Button
              type="primary"
              loading={createMutation.isPending || updateMutation.isPending}
              onClick={() => {
                void handleClickSubmit();
              }}
            >
              {isEdit ? '保存' : '提交'}
            </Button>
          </div>
        </div>
      </ProForm>
    </div>
  );
}
