import { useRef } from 'react';
import { Button, Result, Skeleton } from 'antd';
import {
  ProCard,
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

interface CurrencyOption {
  label: string;
  value: string;
  currencyName: string;
}

async function fetchCurrencyOptions(): Promise<CurrencyOption[]> {
  try {
    const res = await request.get<any, { list: Array<{ code: string; name: string }> }>('/currencies');
    return (res.list || []).map((c) => ({
      label: `${c.name} (${c.code})`,
      value: c.code,
      currencyName: c.name,
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      navigate(`/master-data/companies/${data.id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateCompanyPayload) =>
      updateCompany(companyId as number, payload),
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
        extra={
          <Button type="primary" onClick={() => navigate('/master-data/companies')}>
            返回列表
          </Button>
        }
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
          <Button key="retry" type="primary" onClick={() => detailQuery.refetch()}>
            重试
          </Button>,
          <Button key="back" onClick={() => navigate('/master-data/companies')}>
            返回列表
          </Button>,
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

  return (
    <ProForm
      formRef={formRef}
      title={isEdit ? '编辑公司主体' : '新建公司主体'}
      loading={detailQuery.isLoading}
      submitter={{
        searchConfig: {
          submitText: isEdit ? '保存' : '创建',
        },
        render: (_, dom) => (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={() => navigate(isEdit ? `/master-data/companies/${companyId}` : '/master-data/companies')}>
              取消
            </Button>
            {dom[1]}
          </div>
        ),
      }}
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
          countryId: values.countryId != null ? values.countryId : undefined,
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
          await updateMutation.mutateAsync(payload);
        } else {
          await createMutation.mutateAsync(payload);
        }
        return true;
      }}
    >
      <ProCard title="基本信息" bordered style={{ marginBottom: 16 }}>
        <ProForm.Group>
          <ProFormText
            name="nameCn"
            label="公司中文名称"
            placeholder="请输入公司中文名称"
            width="md"
            rules={[
              { required: true, message: '请输入公司中文名称' },
              { max: 200, message: '公司名称最多 200 个字符' },
            ]}
          />
          <ProFormText
            name="nameEn"
            label="公司英文名称"
            placeholder="请输入公司英文名称（可选）"
            width="md"
            rules={[{ max: 200, message: '公司英文名称最多 200 个字符' }]}
          />
          <ProFormText
            name="abbreviation"
            label="公司简称"
            placeholder="请输入公司简称（可选）"
            width="sm"
            rules={[{ max: 50, message: '公司简称最多 50 个字符' }]}
          />
          <ProFormSelect
            name="countryId"
            label="国家/地区"
            placeholder="请搜索国家/地区"
            width="md"
            showSearch
            request={async (params) => {
              try {
                const res = await request.get<
                  any,
                  { list: Array<{ id: number; name: string; code: string }> }
                >('/countries', { params: { keyword: params.keyWords, pageSize: 20 } });
                const list = (res.list || []).map((c) => ({
                  label: `${c.name} (${c.code})`,
                  value: c.id,
                  name: c.name,
                }));
                if (!params.keyWords && detailQuery.data?.countryId) {
                  const alreadyIn = list.some((o) => o.value === detailQuery.data?.countryId);
                  if (!alreadyIn) {
                    list.unshift({
                      label: detailQuery.data.countryName || '',
                      value: detailQuery.data.countryId,
                      name: detailQuery.data.countryName || '',
                    });
                  }
                }
                return list;
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
            placeholder="请输入签订地点"
            width="md"
            rules={[{ max: 200, message: '签订地点最多 200 个字符' }]}
          />
        </ProForm.Group>
      </ProCard>

      <ProCard title="地址信息" bordered style={{ marginBottom: 16 }}>
        <ProForm.Group>
          <ProFormText
            name="addressCn"
            label="中文地址"
            placeholder="请输入中文地址"
            width="xl"
            rules={[{ max: 500, message: '中文地址最多 500 个字符' }]}
          />
          <ProFormText
            name="addressEn"
            label="英文地址"
            placeholder="Enter English address"
            width="xl"
            rules={[{ max: 500, message: '英文地址最多 500 个字符' }]}
          />
        </ProForm.Group>
      </ProCard>

      <ProCard title="联系信息" bordered style={{ marginBottom: 16 }}>
        <ProForm.Group>
          <ProFormText
            name="contactPerson"
            label="联系人"
            placeholder="请输入联系人姓名"
            width="md"
            rules={[{ max: 100, message: '联系人最多 100 个字符' }]}
          />
          <ProFormText
            name="contactPhone"
            label="联系电话"
            placeholder="请输入联系电话"
            width="md"
            rules={[{ max: 50, message: '联系电话最多 50 个字符' }]}
          />
          <ProFormSelect
            name="chiefAccountantId"
            label="总账会计"
            placeholder="请搜索用户名或姓名"
            width="md"
            showSearch
            request={async (params) => {
              try {
                const res = await request.get<
                  any,
                  { list: Array<{ id: string; name: string; username: string }> }
                >('/users', { params: { search: params.keyWords, pageSize: 20 } });
                const list = (res.list || []).map((u) => ({
                  label: `${u.name} (${u.username})`,
                  value: Number(u.id),
                  name: u.name,
                }));
                if (!params.keyWords && detailQuery.data?.chiefAccountantId) {
                  const alreadyIn = list.some(
                    (o) => o.value === detailQuery.data?.chiefAccountantId,
                  );
                  if (!alreadyIn) {
                    list.unshift({
                      label: detailQuery.data.chiefAccountantName || '',
                      value: detailQuery.data.chiefAccountantId,
                      name: detailQuery.data.chiefAccountantName || '',
                    });
                  }
                }
                return list;
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
      </ProCard>

      <ProCard title="银行信息" bordered style={{ marginBottom: 16 }}>
        <ProForm.Group>
          <ProFormText
            name="bankName"
            label="开户行"
            placeholder="请输入开户行名称"
            width="md"
            rules={[{ max: 200, message: '开户行名称最多 200 个字符' }]}
          />
          <ProFormText
            name="bankAccount"
            label="银行账号"
            placeholder="请输入银行账号"
            width="md"
            rules={[{ max: 100, message: '银行账号最多 100 个字符' }]}
          />
          <ProFormText
            name="swiftCode"
            label="SWIFT CODE"
            placeholder="请输入 SWIFT CODE"
            width="sm"
            rules={[{ max: 20, message: 'SWIFT CODE 最多 20 个字符' }]}
          />
          <ProFormSelect
            name="defaultCurrencyCode"
            label="默认币种"
            placeholder="请选择默认币种"
            width="sm"
            request={fetchCurrencyOptions}
            fieldProps={{
              onChange: (_: string, option: any) => {
                formRef.current?.setFieldsValue({
                  defaultCurrencyName: option?.currencyName ?? null,
                });
              },
            }}
          />
        </ProForm.Group>
      </ProCard>

      <ProCard title="合规信息" bordered>
        <ProForm.Group>
          <ProFormText
            name="taxId"
            label="纳税人识别号"
            placeholder="请输入纳税人识别号"
            width="md"
            rules={[{ max: 100, message: '纳税人识别号最多 100 个字符' }]}
          />
          <ProFormText
            name="customsCode"
            label="海关备案号"
            placeholder="请输入海关备案号"
            width="md"
            rules={[{ max: 100, message: '海关备案号最多 100 个字符' }]}
          />
          <ProFormText
            name="quarantineCode"
            label="检疫备案号"
            placeholder="请输入检疫备案号"
            width="md"
            rules={[{ max: 100, message: '检疫备案号最多 100 个字符' }]}
          />
        </ProForm.Group>
      </ProCard>
    </ProForm>
  );
}
