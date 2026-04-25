import { useRef, useState } from 'react';
import { Button, Result, Skeleton } from 'antd';
import { ProForm, ProFormSelect, ProFormSwitch, ProFormText, type ProFormInstance } from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import type { CurrencyStatus } from '@infitek/shared';
import { createCurrency, getCurrencyById, updateCurrency, type CreateCurrencyPayload, type UpdateCurrencyPayload } from '../../../api/currencies.api';
import { AnchorNav, SectionCard } from '../components/page-scaffold';
import '../master-page.css';

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
  const formRef = useRef<ProFormInstance>(undefined);
  const [activeAnchor, setActiveAnchor] = useState('basic');

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
        extra={<Button type="primary" onClick={() => navigate('/master-data/currencies')}>返回列表</Button>}
      />
    );
  }

  if (isEdit && detailQuery.isLoading) return <Skeleton active />;

  if (isEdit && detailQuery.isError && !detailQuery.data) {
    return (
      <Result
        status="error"
        title="币种详情加载失败"
        subTitle="请检查网络或稍后重试"
        extra={[
          <Button key="retry" type="primary" onClick={() => detailQuery.refetch()}>重试</Button>,
          <Button key="back" onClick={() => navigate('/master-data/currencies')}>返回列表</Button>,
        ]}
      />
    );
  }

  const anchors = [
    { key: 'basic', label: '基础信息' },
    { key: 'status', label: '状态设置' },
  ];

  return (
    <div className="master-page master-form-page">
      <div className="master-page-header">
        <div className="master-page-heading">
          <div className="master-page-title">{isEdit ? '编辑币种' : '新建币种'}</div>
          <div className="master-page-description">统一维护币种编码、名称、符号和本位币设置。</div>
        </div>
      </div>

      <ProForm<{ code: string; name: string; status?: CurrencyStatus; symbol?: string; isBaseCurrency?: boolean }>
        formRef={formRef}
        submitter={false}
        loading={detailQuery.isLoading}
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
          const payload = {
            code: values.code,
            name: values.name,
            status: values.status,
            symbol: values.symbol || undefined,
            isBaseCurrency: values.isBaseCurrency ? 1 : 0,
          };
          if (isEdit) {
            await updateMutation.mutateAsync(payload as UpdateCurrencyPayload);
          } else {
            await createMutation.mutateAsync(payload as CreateCurrencyPayload);
          }
          return true;
        }}
      >
        <div className="master-form-layout">
          <AnchorNav anchors={anchors} activeKey={activeAnchor} onChange={setActiveAnchor} />
          <div className="master-form-main">
            <SectionCard id="basic" title="基础信息" description="填写币种代码、名称与符号。">
              <div className="master-form-grid">
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
                  placeholder="如：$、¥、€"
                  rules={[{ max: 10, message: '币种符号最多 10 个字符' }]}
                />
                <ProFormSwitch
                  name="isBaseCurrency"
                  label="是否本位币"
                  tooltip="同一时间只能有一种本位币，开启后将自动取消其他币种的本位币状态"
                  fieldProps={{ checkedChildren: '是', unCheckedChildren: '否' }}
                />
              </div>
            </SectionCard>

            <SectionCard id="status" title="状态设置" description="编辑时支持维护币种启停状态。">
              <div className="master-form-grid">
                {isEdit ? (
                  <ProFormSelect
                    name="status"
                    label="状态"
                    options={statusOptions}
                    rules={[{ required: true, message: '请选择状态' }]}
                  />
                ) : (
                  <div className="master-info-tip" style={{ marginTop: 0 }}>新建后默认为启用状态，如需变更可在编辑页维护。</div>
                )}
              </div>
            </SectionCard>

            <div className="master-form-footer">
              <div className="master-form-footer-tip">本页仅统一样式与布局，不改动币种接口和本位币业务处理方式。</div>
              <div className="master-form-footer-actions">
                <Button onClick={() => navigate('/master-data/currencies')}>取消</Button>
                <Button
                  type="primary"
                  loading={createMutation.isPending || updateMutation.isPending}
                  onClick={() => formRef.current?.submit?.()}
                >
                  {isEdit ? '保存' : '创建'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ProForm>
    </div>
  );
}
