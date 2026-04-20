import { Button, Result, Skeleton } from 'antd';
import { ProCard, ProForm, ProFormSelect, ProFormText } from '@ant-design/pro-components';
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
}

async function fetchCurrencyOptions(): Promise<CurrencyOption[]> {
  try {
    const res = await request.get<any, { list: Array<{ code: string; name: string }> }>('/currencies');
    return (res.list || []).map((c) => ({ label: `${c.name} (${c.code})`, value: c.code }));
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
        name: detailQuery.data.name,
        signingLocation: detailQuery.data.signingLocation ?? undefined,
        bankName: detailQuery.data.bankName ?? undefined,
        bankAccount: detailQuery.data.bankAccount ?? undefined,
        swiftCode: detailQuery.data.swiftCode ?? undefined,
        defaultCurrencyCode: detailQuery.data.defaultCurrencyCode ?? undefined,
        taxId: detailQuery.data.taxId ?? undefined,
        customsCode: detailQuery.data.customsCode ?? undefined,
        quarantineCode: detailQuery.data.quarantineCode ?? undefined,
      }
    : {};

  return (
    <ProForm
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
          name: values.name,
          signingLocation: values.signingLocation || undefined,
          bankName: values.bankName || undefined,
          bankAccount: values.bankAccount || undefined,
          swiftCode: values.swiftCode || undefined,
          defaultCurrencyCode: values.defaultCurrencyCode || undefined,
          taxId: values.taxId || undefined,
          customsCode: values.customsCode || undefined,
          quarantineCode: values.quarantineCode || undefined,
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
            name="name"
            label="公司名称"
            placeholder="请输入公司名称"
            width="md"
            rules={[
              { required: true, message: '请输入公司名称' },
              { max: 200, message: '公司名称最多 200 个字符' },
            ]}
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
