import { useRef } from 'react';
import { Breadcrumb, Button, Result, Skeleton, Tabs } from 'antd';
import type { TabsProps } from 'antd';
import {
  ProForm,
  ProFormSelect,
  ProFormText,
  type ProFormInstance,
} from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createCompany,
  getCompanyById,
  updateCompany,
  type CreateCompanyPayload,
  type UpdateCompanyPayload,
} from '../../../api/companies.api';
import request from '../../../api/request';
import '../master-page.css';

interface CurrencyOption {
  label: string;
  value: string;
  currencyName: string;
}

async function fetchCurrencyOptions(): Promise<CurrencyOption[]> {
  try {
    const res = await request.get<any, { list: Array<{ code: string; name: string }> }>('/currencies');
    return (res.list || []).map((item) => ({
      label: `${item.name} (${item.code})`,
      value: item.code,
      currencyName: item.name,
    }));
  } catch {
    return [];
  }
}

export default function CompanyFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const companyId = id ? Number(id) : undefined;
  const isEdit = Boolean(id);
  const formRef = useRef<ProFormInstance>(undefined);

  const detailQuery = useQuery({
    queryKey: ['company-detail', companyId],
    queryFn: () => getCompanyById(companyId as number),
    enabled: Boolean(isEdit && companyId && Number.isInteger(companyId) && companyId > 0),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateCompanyPayload) => createCompany(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      navigate(`/master-data/companies/${created.id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateCompanyPayload) => updateCompany(companyId as number, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company-detail', companyId] });
      navigate(`/master-data/companies/${companyId}`);
    },
  });

  if (isEdit && (!companyId || !Number.isInteger(companyId) || companyId <= 0)) {
    return (
      <Result
        status="404"
        title="公司主体不存在"
        extra={<Button type="primary" onClick={() => navigate('/master-data/companies')}>返回列表</Button>}
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
        title="加载公司主体信息失败"
        subTitle="请检查网络或稍后重试"
        extra={[
          <Button key="retry" type="primary" onClick={() => detailQuery.refetch()}>重试</Button>,
          <Button key="back" onClick={() => navigate('/master-data/companies')}>返回列表</Button>,
        ]}
      />
    );
  }

  const initialValues = detailQuery.data
    ? {
        nameCn: detailQuery.data.nameCn,
        signingLocation: detailQuery.data.signingLocation ?? undefined,
        bankName: detailQuery.data.bankName ?? undefined,
        bankAccount: detailQuery.data.bankAccount ?? undefined,
        swiftCode: detailQuery.data.swiftCode ?? undefined,
        defaultCurrencyCode: detailQuery.data.defaultCurrencyCode ?? undefined,
        taxId: detailQuery.data.taxId ?? undefined,
        customsCode: detailQuery.data.customsCode ?? undefined,
        quarantineCode: detailQuery.data.quarantineCode ?? undefined,
        nameEn: detailQuery.data.nameEn ?? undefined,
        abbreviation: detailQuery.data.abbreviation ?? undefined,
        countryId: detailQuery.data.countryId ?? undefined,
        countryName: detailQuery.data.countryName ?? undefined,
        addressCn: detailQuery.data.addressCn ?? undefined,
        addressEn: detailQuery.data.addressEn ?? undefined,
        contactPerson: detailQuery.data.contactPerson ?? undefined,
        contactPhone: detailQuery.data.contactPhone ?? undefined,
        defaultCurrencyName: detailQuery.data.defaultCurrencyName ?? undefined,
        chiefAccountantId: detailQuery.data.chiefAccountantId ?? undefined,
        chiefAccountantName: detailQuery.data.chiefAccountantName ?? undefined,
      }
    : {};

  const basicTab = (
    <>
      <ProForm.Group>
        <ProFormText
          name="nameCn"
          label="公司中文名称"
          width="md"
          placeholder="请输入公司中文名称"
          rules={[
            { required: true, message: '请输入公司中文名称' },
            { max: 200, message: '公司名称最多 200 个字符' },
          ]}
        />
        <ProFormText
          name="nameEn"
          label="公司英文名称"
          width="md"
          placeholder="请输入公司英文名称（可选）"
          rules={[{ max: 200, message: '公司英文名称最多 200 个字符' }]}
        />
        <ProFormText
          name="abbreviation"
          label="公司简称"
          width="sm"
          placeholder="请输入公司简称（可选）"
          rules={[{ max: 50, message: '公司简称最多 50 个字符' }]}
        />
      </ProForm.Group>
      <ProForm.Group>
        <ProFormSelect
          name="countryId"
          label="国家/地区"
          width="md"
          placeholder="请搜索国家/地区"
          showSearch
          request={async (params) => {
            try {
              const res = await request.get<any, { list: Array<{ id: number; name: string; code: string }> }>('/countries', {
                params: { keyword: params.keyWords, pageSize: 20 },
              });
              const options = (res.list || []).map((item) => ({
                label: `${item.name} (${item.code})`,
                value: Number(item.id),
                name: item.name,
              }));
              if (!params.keyWords && detailQuery.data?.countryId) {
                const exists = options.some((item) => item.value === detailQuery.data?.countryId);
                if (!exists) {
                  options.unshift({
                    label: detailQuery.data.countryName || '',
                    value: detailQuery.data.countryId,
                    name: detailQuery.data.countryName || '',
                  });
                }
              }
              return options;
            } catch {
              return [];
            }
          }}
          fieldProps={{
            onChange: (_: number | undefined, option: any) => {
              formRef.current?.setFieldsValue({
                countryName: option?.name ?? null,
              });
            },
          }}
        />
        <ProFormText
          name="signingLocation"
          label="签订地点"
          width="md"
          placeholder="请输入签订地点"
          rules={[{ max: 200, message: '签订地点最多 200 个字符' }]}
        />
      </ProForm.Group>
    </>
  );

  const addressTab = (
    <ProForm.Group>
      <ProFormText
        name="addressCn"
        label="中文地址"
        width="xl"
        placeholder="请输入中文地址"
        rules={[{ max: 500, message: '中文地址最多 500 个字符' }]}
      />
      <ProFormText
        name="addressEn"
        label="英文地址"
        width="xl"
        placeholder="请输入英文地址"
        rules={[{ max: 500, message: '英文地址最多 500 个字符' }]}
      />
    </ProForm.Group>
  );

  const contactTab = (
    <ProForm.Group>
      <ProFormText
        name="contactPerson"
        label="联系人"
        width="md"
        placeholder="请输入联系人姓名"
        rules={[{ max: 100, message: '联系人最多 100 个字符' }]}
      />
      <ProFormText
        name="contactPhone"
        label="联系电话"
        width="md"
        placeholder="请输入联系电话"
        rules={[{ max: 50, message: '联系电话最多 50 个字符' }]}
      />
      <ProFormSelect
        name="chiefAccountantId"
        label="总账会计"
        width="md"
        placeholder="请搜索用户名或姓名"
        showSearch
        request={async (params) => {
          try {
            const res = await request.get<any, { list: Array<{ id: string; name: string; username: string }> }>('/users', {
              params: { search: params.keyWords, pageSize: 20 },
            });
            const options = (res.list || []).map((item) => ({
              label: `${item.name} (${item.username})`,
              value: Number(item.id),
              name: item.name,
            }));
            if (!params.keyWords && detailQuery.data?.chiefAccountantId) {
              const exists = options.some((item) => item.value === detailQuery.data?.chiefAccountantId);
              if (!exists) {
                options.unshift({
                  label: detailQuery.data.chiefAccountantName || '',
                  value: detailQuery.data.chiefAccountantId,
                  name: detailQuery.data.chiefAccountantName || '',
                });
              }
            }
            return options;
          } catch {
            return [];
          }
        }}
        fieldProps={{
          onChange: (_: number | undefined, option: any) => {
            formRef.current?.setFieldsValue({
              chiefAccountantName: option?.name ?? null,
            });
          },
        }}
      />
    </ProForm.Group>
  );

  const bankTab = (
    <ProForm.Group>
      <ProFormText
        name="bankName"
        label="开户行"
        width="md"
        placeholder="请输入开户行名称"
        rules={[{ max: 200, message: '开户行名称最多 200 个字符' }]}
      />
      <ProFormText
        name="bankAccount"
        label="银行账号"
        width="md"
        placeholder="请输入银行账号"
        rules={[{ max: 100, message: '银行账号最多 100 个字符' }]}
      />
      <ProFormText
        name="swiftCode"
        label="SWIFT CODE"
        width="sm"
        placeholder="请输入 SWIFT CODE"
        rules={[{ max: 20, message: 'SWIFT CODE 最多 20 个字符' }]}
      />
      <ProFormSelect
        name="defaultCurrencyCode"
        label="默认币种"
        width="sm"
        placeholder="请选择默认币种"
        request={fetchCurrencyOptions}
        fieldProps={{
          onChange: (_: string | undefined, option: any) => {
            formRef.current?.setFieldsValue({
              defaultCurrencyName: option?.currencyName ?? null,
            });
          },
        }}
      />
    </ProForm.Group>
  );

  const complianceTab = (
    <ProForm.Group>
      <ProFormText
        name="taxId"
        label="纳税人识别号"
        width="md"
        placeholder="请输入纳税人识别号"
        rules={[{ max: 100, message: '纳税人识别号最多 100 个字符' }]}
      />
      <ProFormText
        name="customsCode"
        label="海关备案号"
        width="md"
        placeholder="请输入海关备案号"
        rules={[{ max: 100, message: '海关备案号最多 100 个字符' }]}
      />
      <ProFormText
        name="quarantineCode"
        label="检疫备案号"
        width="md"
        placeholder="请输入检疫备案号"
        rules={[{ max: 100, message: '检疫备案号最多 100 个字符' }]}
      />
    </ProForm.Group>
  );

  const tabItems: TabsProps['items'] = [
    { key: 'basic', label: '基本信息', children: <div className="master-form-body">{basicTab}</div> },
    { key: 'address', label: '地址信息', children: <div className="master-form-body">{addressTab}</div> },
    { key: 'contact', label: '联系信息', children: <div className="master-form-body">{contactTab}</div> },
    { key: 'bank', label: '银行信息', children: <div className="master-form-body">{bankTab}</div> },
    { key: 'compliance', label: '合规信息', children: <div className="master-form-body">{complianceTab}</div> },
  ];

  return (
    <div className="master-page master-form-page">
      <Breadcrumb
        items={[
          {
            title: (
              <Button type="link" className="master-breadcrumb-link" onClick={() => navigate('/master-data/companies')}>
                主数据
              </Button>
            ),
          },
          {
            title: (
              <Button type="link" className="master-breadcrumb-link" onClick={() => navigate('/master-data/companies')}>
                公司主体管理
              </Button>
            ),
          },
          { title: isEdit ? `编辑 ${detailQuery.data?.nameCn || ''}` : '新建公司主体' },
        ]}
      />

      <ProForm
        formRef={formRef}
        submitter={false}
        loading={detailQuery.isLoading}
        initialValues={initialValues}
        onFinish={async (values) => {
          const payload: CreateCompanyPayload = {
            nameCn: values.nameCn,
            signingLocation: values.signingLocation || undefined,
            bankName: values.bankName || undefined,
            bankAccount: values.bankAccount || undefined,
            swiftCode: values.swiftCode || undefined,
            defaultCurrencyCode: values.defaultCurrencyCode || undefined,
            taxId: values.taxId || undefined,
            customsCode: values.customsCode || undefined,
            quarantineCode: values.quarantineCode || undefined,
            nameEn: values.nameEn || undefined,
            abbreviation: values.abbreviation || undefined,
            countryId: values.countryId != null ? Number(values.countryId) : undefined,
            countryName: values.countryName || undefined,
            addressCn: values.addressCn || undefined,
            addressEn: values.addressEn || undefined,
            contactPerson: values.contactPerson || undefined,
            contactPhone: values.contactPhone || undefined,
            defaultCurrencyName: values.defaultCurrencyName || undefined,
            chiefAccountantId: values.chiefAccountantId != null ? values.chiefAccountantId : undefined,
            chiefAccountantName: values.chiefAccountantName || undefined,
          };

          if (isEdit) {
            await updateMutation.mutateAsync(payload as UpdateCompanyPayload);
          } else {
            await createMutation.mutateAsync(payload);
          }
          return true;
        }}
      >
        <div className="master-info-card">
          <Tabs className="master-info-tabs" defaultActiveKey="basic" items={tabItems} />
          <div className="master-form-footer">
            <Button onClick={() => navigate(isEdit ? `/master-data/companies/${companyId}` : '/master-data/companies')}>
              取消
            </Button>
            <Button
              type="primary"
              loading={createMutation.isPending || updateMutation.isPending}
              onClick={() => formRef.current?.submit?.()}
            >
              {isEdit ? '保存' : '创建'}
            </Button>
          </div>
        </div>
      </ProForm>
    </div>
  );
}
