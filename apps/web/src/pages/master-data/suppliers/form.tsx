import { useRef, useState } from 'react';
import { Button, Result, Skeleton } from 'antd';
import {
  ProForm,
  ProFormDigit,
  ProFormList,
  ProFormRadio,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  type ProFormInstance,
} from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { getCompanies } from '../../../api/companies.api';
import { getCountries } from '../../../api/countries.api';
import {
  createSupplier,
  getSupplierById,
  updateSupplier,
  type CreateSupplierPayload,
  type UpdateSupplierPayload,
  type SuppliersListParams,
} from '../../../api/suppliers.api';
import '../master-page.css';

const SupplierStatus = {
  COOPERATING: '合作',
  ELIMINATED: '淘汰',
  TEMPORARY: '临拓',
} as const;

const SupplierInvoiceType = {
  NORMAL: '普票',
  VAT_13: '13%专票',
  VAT_7: '7%专票',
  VAT_1: '1%专票',
} as const;

const SupplierSettlementType = {
  MONTHLY: '月结',
  BEFORE_SHIPMENT: '发货前结算',
  HALF_MONTHLY: '半月结',
  INVOICE_BASED: '票结',
} as const;

const SupplierSettlementDateType = {
  ORDER_DATE: '采购下单日期',
  RECEIPT_DATE: '采购入库日期',
  INVOICE_DATE: '采购开票日期',
} as const;

type SupplierStatusValue = NonNullable<SuppliersListParams['status']>;
type SupplierSettlementTypeValue =
  typeof SupplierSettlementType[keyof typeof SupplierSettlementType];
type SupplierSettlementDateTypeValue =
  typeof SupplierSettlementDateType[keyof typeof SupplierSettlementDateType];

const statusOptions = [
  { label: '合作', value: SupplierStatus.COOPERATING },
  { label: '淘汰', value: SupplierStatus.ELIMINATED },
  { label: '临拓', value: SupplierStatus.TEMPORARY },
];

const invoiceTypeOptions = [
  { label: '普票', value: SupplierInvoiceType.NORMAL },
  { label: '13%专票', value: SupplierInvoiceType.VAT_13 },
  { label: '7%专票', value: SupplierInvoiceType.VAT_7 },
  { label: '1%专票', value: SupplierInvoiceType.VAT_1 },
];

const settlementTypeOptions = [
  { label: '月结', value: SupplierSettlementType.MONTHLY },
  { label: '发货前结算', value: SupplierSettlementType.BEFORE_SHIPMENT },
  { label: '半月结', value: SupplierSettlementType.HALF_MONTHLY },
  { label: '票结', value: SupplierSettlementType.INVOICE_BASED },
];

const settlementDateTypeOptions = [
  { label: '采购下单日期', value: SupplierSettlementDateType.ORDER_DATE },
  { label: '采购入库日期', value: SupplierSettlementDateType.RECEIPT_DATE },
  { label: '采购开票日期', value: SupplierSettlementDateType.INVOICE_DATE },
];

const annualRebateOptions = [
  { label: '是', value: 1 },
  { label: '否', value: 0 },
];

export default function SupplierFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const supplierId = id ? Number(id) : undefined;
  const isEdit = Boolean(id);
  const formRef = useRef<ProFormInstance>(undefined);
  const [activeAnchor, setActiveAnchor] = useState('basic');

  const detailQuery = useQuery({
    queryKey: ['supplier-detail', supplierId],
    queryFn: () => getSupplierById(supplierId as number),
    enabled: Boolean(isEdit && supplierId && Number.isInteger(supplierId) && supplierId > 0),
  });

  const companiesQuery = useQuery({
    queryKey: ['companies-options', 'suppliers-form'],
    queryFn: () => getCompanies({ pageSize: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  const countriesQuery = useQuery({
    queryKey: ['countries-options', 'suppliers-form'],
    queryFn: () => getCountries({ pageSize: 200 }),
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateSupplierPayload) => createSupplier(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      navigate(`/master-data/suppliers/${created.id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateSupplierPayload) => updateSupplier(supplierId as number, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-detail', supplierId] });
      navigate(`/master-data/suppliers/${supplierId}`);
    },
  });

  if (isEdit && (!supplierId || !Number.isInteger(supplierId) || supplierId <= 0)) {
    return (
      <Result
        status="404"
        title="供应商不存在"
        extra={<Button type="primary" onClick={() => navigate('/master-data/suppliers')}>返回列表</Button>}
      />
    );
  }

  if (isEdit && detailQuery.isLoading) {
    return <Skeleton active />;
  }

  if (isEdit && detailQuery.isError && !detailQuery.data) {
    return (
      <Result
        status="error"
        title="加载供应商信息失败"
        subTitle="请检查网络或稍后重试"
        extra={[
          <Button key="retry" type="primary" onClick={() => detailQuery.refetch()}>重试</Button>,
          <Button key="back" onClick={() => navigate('/master-data/suppliers')}>返回列表</Button>,
        ]}
      />
    );
  }

  const companyOptions = (companiesQuery.data?.list ?? []).map((company) => ({
    label: company.nameCn,
    value: company.id,
  }));
  const countryOptions = (countriesQuery.data?.list ?? []).map((country) => ({
    label: country.name,
    value: country.id,
  }));

  const companyOptionMap = new Map(companyOptions.map((option) => [option.value, option.label]));
  const countryOptionMap = new Map(countryOptions.map((option) => [option.value, option.label]));

  const initialValues = detailQuery.data
    ? {
        name: detailQuery.data.name,
        shortName: detailQuery.data.shortName ?? undefined,
        contactPerson: detailQuery.data.contactPerson ?? undefined,
        contactPhone: detailQuery.data.contactPhone ?? undefined,
        contactEmail: detailQuery.data.contactEmail ?? undefined,
        address: detailQuery.data.address ?? undefined,
        countryId: detailQuery.data.countryId ?? undefined,
        countryName: detailQuery.data.countryName ?? undefined,
        status: detailQuery.data.status,
        supplierLevel: detailQuery.data.supplierLevel ?? undefined,
        invoiceType: detailQuery.data.invoiceType ?? undefined,
        origin: detailQuery.data.origin ?? undefined,
        annualRebateEnabled: detailQuery.data.annualRebateEnabled ?? 0,
        supplierCode: detailQuery.data.supplierCode,
        contractFrameworkFile: detailQuery.data.contractFrameworkFile ?? undefined,
        contractTemplateName: detailQuery.data.contractTemplateName ?? undefined,
        annualRebateNote: detailQuery.data.annualRebateNote ?? undefined,
        contractTerms: detailQuery.data.contractTerms ?? undefined,
        paymentTerms:
          detailQuery.data.paymentTerms.length > 0
            ? detailQuery.data.paymentTerms.map((paymentTerm) => ({
                companyId: paymentTerm.companyId ?? undefined,
                companyName: paymentTerm.companyName ?? undefined,
                paymentTermName: paymentTerm.paymentTermName ?? undefined,
                settlementType: paymentTerm.settlementType ?? undefined,
                settlementDays: paymentTerm.settlementDays ?? undefined,
                monthlySettlementDate: paymentTerm.monthlySettlementDate ?? undefined,
                settlementDateType: paymentTerm.settlementDateType ?? undefined,
              }))
            : [{}],
      }
    : {
        status: SupplierStatus.COOPERATING as SupplierStatusValue,
        annualRebateEnabled: 0,
        paymentTerms: [{}],
      };

  const anchors = [
    { key: 'basic', label: '基础信息' },
    { key: 'business', label: '商务信息' },
    { key: 'payment', label: '账期信息' },
  ];

  return (
    <div className="master-page master-form-page">
      <div className="master-page-header">
        <div className="master-page-heading">
          <div className="master-page-title">{isEdit ? '编辑供应商' : '新建供应商'}</div>
          <div className="master-page-description">统一维护供应商主体、商务条件与账期规则。</div>
        </div>
      </div>

      <ProForm
        formRef={formRef}
        submitter={false}
        loading={detailQuery.isLoading}
        initialValues={initialValues}
        onFinish={async (values) => {
          const normalizedPaymentTerms = ((values.paymentTerms ?? []) as Array<Record<string, unknown>>).map(
            (item) => ({
              companyId: item.companyId as number | undefined,
              companyName:
                (item.companyId ? companyOptionMap.get(item.companyId as number) : undefined) ??
                (item.companyName as string | undefined),
              paymentTermName: item.paymentTermName as string | undefined,
              settlementType: item.settlementType as SupplierSettlementTypeValue | undefined,
              settlementDays: item.settlementDays as number | undefined,
              monthlySettlementDate: item.monthlySettlementDate as number | undefined,
              settlementDateType: item.settlementDateType as SupplierSettlementDateTypeValue | undefined,
            }),
          );

          const payload: CreateSupplierPayload = {
            name: values.name,
            shortName: values.shortName,
            contactPerson: values.contactPerson,
            contactPhone: values.contactPhone,
            contactEmail: values.contactEmail,
            address: values.address,
            countryId: values.countryId,
            countryName:
              (values.countryId ? countryOptionMap.get(values.countryId as number) : undefined) ??
              values.countryName,
            status: values.status,
            supplierLevel: values.supplierLevel,
            invoiceType: values.invoiceType,
            origin: values.origin,
            annualRebateEnabled: Number(values.annualRebateEnabled ?? 0),
            contractFrameworkFile: values.contractFrameworkFile,
            contractTemplateName: values.contractTemplateName,
            annualRebateNote: values.annualRebateNote,
            contractTerms: values.contractTerms,
            paymentTerms: normalizedPaymentTerms,
          };

          if (isEdit) {
            await updateMutation.mutateAsync(payload as UpdateSupplierPayload);
          } else {
            await createMutation.mutateAsync(payload);
          }
          return true;
        }}
      >
        <div className="master-form-layout">
          <div className="master-anchor-nav">
            {anchors.map((anchor) => (
              <a
                key={anchor.key}
                href={`#${anchor.key}`}
                className={`master-anchor-link${activeAnchor === anchor.key ? ' active' : ''}`}
                onClick={() => setActiveAnchor(anchor.key)}
              >
                {anchor.label}
              </a>
            ))}
          </div>

          <div className="master-form-main">
            <section id="basic" className="master-section-card">
              <div className="master-section-header">
                <div className="master-section-heading">
                  <div className="master-section-title">基础信息</div>
                  <div className="master-section-description">填写供应商主体标识、联系人与区域来源信息。</div>
                </div>
              </div>
              <div className="master-section-body">
                <div className="master-form-grid">
                  <ProFormText
                    name="name"
                    label="供应商名称"
                    placeholder="请输入供应商名称"
                    rules={[
                      { required: true, message: '请输入供应商名称' },
                      { max: 200, message: '供应商名称最多 200 个字符' },
                    ]}
                  />
                  <ProFormText
                    name="shortName"
                    label="供应商简称"
                    placeholder="请输入供应商简称"
                    rules={[{ max: 100, message: '供应商简称最多 100 个字符' }]}
                  />
                  <ProFormSelect
                    name="status"
                    label="合作状态"
                    options={statusOptions}
                    rules={[{ required: true, message: '请选择合作状态' }]}
                  />
                  <ProFormText
                    name="supplierCode"
                    label="供应商编码"
                    placeholder="系统保存后自动生成"
                    readonly
                  />
                  <ProFormText name="contactPerson" label="联系人" placeholder="请输入联系人" />
                  <ProFormText name="contactPhone" label="联系电话" placeholder="请输入联系电话" />
                  <ProFormText
                    name="contactEmail"
                    label="联系邮箱"
                    placeholder="请输入联系邮箱"
                    rules={[{ max: 100, message: '联系邮箱最多 100 个字符' }]}
                  />
                  <ProFormSelect
                    name="countryId"
                    label="国家地区"
                    showSearch
                    options={countryOptions}
                    placeholder="请选择国家地区"
                    fieldProps={{
                      optionFilterProp: 'label',
                      onChange: (value) => {
                        const option = countryOptions.find((item) => item.value === value);
                        formRef.current?.setFieldsValue({ countryName: option?.label ?? undefined });
                      },
                    }}
                  />
                  <ProFormText name="origin" label="货源地" placeholder="请输入货源地" />
                  <ProFormText name="supplierLevel" label="供应商等级" placeholder="请输入供应商等级" />
                  <div className="full">
                    <ProFormTextArea
                      name="address"
                      label="公司详细地址"
                      placeholder="请输入公司详细地址"
                      fieldProps={{ rows: 3 }}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section id="business" className="master-section-card">
              <div className="master-section-header">
                <div className="master-section-heading">
                  <div className="master-section-title">商务信息</div>
                  <div className="master-section-description">补充开票要求、返利说明与合同条款等合作条件。</div>
                </div>
              </div>
              <div className="master-section-body">
                <div className="master-form-grid">
                  <ProFormSelect
                    name="invoiceType"
                    label="开票类型"
                    options={invoiceTypeOptions}
                    placeholder="请选择开票类型"
                  />
                  <ProFormRadio.Group
                    name="annualRebateEnabled"
                    label="是否年度返点"
                    options={annualRebateOptions}
                    rules={[{ required: true, message: '请选择是否年度返点' }]}
                  />
                  <div className="full">
                    <ProFormText
                      name="contractFrameworkFile"
                      label="合同框架文件"
                      placeholder="请输入合同框架文件"
                      rules={[{ max: 500, message: '最多 500 个字符' }]}
                    />
                  </div>
                  <ProFormSelect
                    name="contractTemplateName"
                    label="合同范本"
                    placeholder="请选择合同范本"
                    options={[]}
                    disabled
                  />
                  <div className="full">
                    <ProFormTextArea
                      name="annualRebateNote"
                      label="年度返利说明"
                      placeholder="请输入年度返利说明"
                      fieldProps={{ rows: 3 }}
                    />
                  </div>
                  <div className="full">
                    <ProFormTextArea
                      name="contractTerms"
                      label="合同条款"
                      placeholder="请输入合同条款"
                      fieldProps={{ rows: 3 }}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section id="payment" className="master-section-card">
              <div className="master-section-header">
                <div className="master-section-heading">
                  <div className="master-section-title">账期信息</div>
                  <div className="master-section-description">支持按合作主体维护多条账期规则，延续统一白底分节样式。</div>
                </div>
              </div>
              <div className="master-section-body">
                <ProFormList
                  name="paymentTerms"
                  creatorButtonProps={{ creatorButtonText: '添加账期信息' }}
                  min={1}
                  copyIconProps={false}
                >
                  <div className="master-form-grid">
                    <ProFormSelect
                      name="companyId"
                      label="合作主体"
                      options={companyOptions}
                      showSearch
                      fieldProps={{
                        optionFilterProp: 'label',
                        onChange: (value) => {
                          const option = companyOptions.find((item) => item.value === value);
                          const rows = (formRef.current?.getFieldValue('paymentTerms') ?? []) as Array<Record<string, unknown>>;
                          const nextRows = rows.map((row) =>
                            row.companyId === value ? { ...row, companyName: option?.label } : row,
                          );
                          formRef.current?.setFieldsValue({ paymentTerms: nextRows });
                        },
                      }}
                    />
                    <ProFormText
                      name="paymentTermName"
                      label="账期名称"
                      placeholder="请输入账期名称"
                    />
                    <ProFormSelect
                      name="settlementType"
                      label="结算类型"
                      options={settlementTypeOptions}
                      placeholder="请选择结算类型"
                    />
                    <ProFormDigit
                      name="settlementDays"
                      label="结算N天付款"
                      min={0}
                      fieldProps={{ precision: 0 }}
                    />
                    <ProFormDigit
                      name="monthlySettlementDate"
                      label="每月结算日期"
                      min={1}
                      max={31}
                      fieldProps={{ precision: 0 }}
                    />
                    <ProFormSelect
                      name="settlementDateType"
                      label="结算日期类型"
                      options={settlementDateTypeOptions}
                      placeholder="请选择结算日期类型"
                    />
                  </div>
                </ProFormList>
                <div className="master-info-tip">
                  账期信息支持多条维护，列表页默认展示第一条记录中的账期与结算类型。
                </div>
              </div>
            </section>

            <div className="master-form-footer">
              <div className="master-form-footer-tip">本页仅调整表单布局与视觉层级，不变更供应商接口行为。</div>
              <div className="master-form-footer-actions">
                <Button onClick={() => navigate(isEdit ? `/master-data/suppliers/${id}` : '/master-data/suppliers')}>
                  取消
                </Button>
                <Button
                  type="primary"
                  loading={createMutation.isPending || updateMutation.isPending}
                  onClick={() => formRef.current?.submit?.()}
                >
                  保存
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ProForm>
    </div>
  );
}
