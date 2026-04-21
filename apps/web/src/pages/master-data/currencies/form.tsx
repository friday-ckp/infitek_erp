import { Button, Card, Result, Skeleton, Space } from 'antd';
import { ProForm, ProFormSelect, ProFormSwitch, ProFormText } from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import type { CurrencyStatus } from '@infitek/shared';
import {
  createCurrency,
  getCurrencyById,
  updateCurrency,
  type CreateCurrencyPayload,
  type UpdateCurrencyPayload,
} from '../../../api/currencies.api';

const statusOptions: Array<{ label: string; value: CurrencyStatus }> = [
  { label: '启用', value: 'active' as CurrencyStatus },
  { label: '禁用', value: 'inactive' as CurrencyStatus },
];

export default function CurrencyFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const currencyId = id ? Number(id) : undefined;
  const isEdit = Boolean(id);

  const detailQuery = useQuery({
    queryKey: ['currency-detail', currencyId],
    queryFn: () => getCurrencyById(currencyId as number),
    enabled: Boolean(isEdit && currencyId && Number.isInteger(currencyId) && currencyId > 0),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateCurrencyPayload) => createCurrency(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      navigate('/master-data/currencies');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateCurrencyPayload) => updateCurrency(currencyId as number, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      queryClient.invalidateQueries({ queryKey: ['currency-detail', currencyId] });
      navigate('/master-data/currencies');
    },
  });

  if (isEdit && (!currencyId || !Number.isInteger(currencyId) || currencyId <= 0)) {
    return (
      <Result
        status="404"
        title="币种不存在"
        extra={
          <Button type="primary" onClick={() => navigate('/master-data/currencies')}>
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
        title="币种详情加载失败"
        subTitle="请检查网络或稍后重试"
        extra={[
          <Button key="retry" type="primary" onClick={() => detailQuery.refetch()}>
            重试
          </Button>,
          <Button key="back" onClick={() => navigate('/master-data/currencies')}>
            返回列表
          </Button>,
        ]}
      />
    );
  }

  return (
    <Card title={isEdit ? '编辑币种' : '新建币种'}>
      <ProForm<{
        code: string;
        name: string;
        status?: CurrencyStatus;
        symbol?: string;
        isBaseCurrency?: boolean;
      }>
        grid
        rowProps={{ gutter: [16, 0] }}
        colProps={{ span: 12 }}
        loading={detailQuery.isLoading}
        submitter={{
          render: (_, dom) => (
            <Space>
              <Button onClick={() => navigate('/master-data/currencies')}>取消</Button>
              {dom[1]}
            </Space>
          ),
          searchConfig: {
            submitText: isEdit ? '保存' : '创建',
          },
        }}
        initialValues={
          detailQuery.data
            ? {
                code: detailQuery.data.code,
                name: detailQuery.data.name,
                status: detailQuery.data.status,
                symbol: detailQuery.data.symbol ?? undefined,
                isBaseCurrency: Boolean(detailQuery.data.isBaseCurrency),
              }
            : {}
        }
        onFinish={async (values) => {
          if (isEdit) {
            await updateMutation.mutateAsync({
              code: values.code,
              name: values.name,
              status: values.status,
              symbol: values.symbol || undefined,
              isBaseCurrency: values.isBaseCurrency ? 1 : 0,
            });
          } else {
            await createMutation.mutateAsync({
              code: values.code,
              name: values.name,
              symbol: values.symbol || undefined,
              isBaseCurrency: values.isBaseCurrency ? 1 : 0,
            });
          }
          return true;
        }}
      >
        <ProFormText
          name="code"
          label="币种代码"
          placeholder="如：USD、EUR、CNY"
          rules={[
            { required: true, message: '请输入币种代码' },
            { max: 10, message: '币种代码最多 10 个字符' },
          ]}
        />
        <ProFormText
          name="name"
          label="币种名称"
          placeholder="如：美元、欧元、人民币"
          rules={[
            { required: true, message: '请输入币种名称' },
            { max: 50, message: '币种名称最多 50 个字符' },
          ]}
        />
        <ProFormText
          name="symbol"
          label="币种符号"
          placeholder="如：$、¥、€（可选，最多 10 个字符）"
          rules={[{ max: 10, message: '币种符号最多 10 个字符' }]}
        />
        <ProFormSwitch
          name="isBaseCurrency"
          label="是否本位币"
          tooltip="同一时间只能有一种本位币，开启后将自动取消其他币种的本位币状态"
          fieldProps={{
            checkedChildren: '是',
            unCheckedChildren: '否',
          }}
        />
        {isEdit ? (
          <ProFormSelect
            name="status"
            label="状态"
            options={statusOptions}
            rules={[{ required: true, message: '请选择状态' }]}
          />
        ) : null}
      </ProForm>
    </Card>
  );
}
