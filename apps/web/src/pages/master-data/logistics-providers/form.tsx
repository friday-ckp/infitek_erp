import { useRef } from 'react';
import { Breadcrumb, Button, Rate, Result, Skeleton } from 'antd';
import {
  ProForm,
  ProFormItem,
  ProFormSelect,
  ProFormText,
  type ProFormInstance,
} from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import request from '../../../api/request';
import {
  LOGISTICS_PROVIDER_STATUS_OPTIONS,
  createLogisticsProvider,
  getLogisticsProviderById,
  updateLogisticsProvider,
  type CreateLogisticsProviderPayload,
  type UpdateLogisticsProviderPayload,
} from '../../../api/logistics-providers.api';
import '../master-page.css';

export default function LogisticsProviderFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const providerId = id ? Number(id) : undefined;
  const isEdit = Boolean(id);
  const formRef = useRef<ProFormInstance>(undefined);

  const detailQuery = useQuery({
    queryKey: ['logistics-provider-detail', providerId],
    queryFn: () => getLogisticsProviderById(providerId as number),
    enabled: Boolean(isEdit && providerId && Number.isInteger(providerId) && providerId > 0),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateLogisticsProviderPayload) => createLogisticsProvider(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['logistics-providers'] });
      navigate(`/master-data/logistics-providers/${created.id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateLogisticsProviderPayload) => updateLogisticsProvider(providerId as number, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-providers'] });
      queryClient.invalidateQueries({ queryKey: ['logistics-provider-detail', providerId] });
      navigate(`/master-data/logistics-providers/${providerId}`);
    },
  });

  if (isEdit && (!providerId || !Number.isInteger(providerId) || providerId <= 0)) {
    return (
      <Result
        status="404"
        title="物流供应商不存在"
        extra={<Button type="primary" onClick={() => navigate('/master-data/logistics-providers')}>返回列表</Button>}
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
        title="物流供应商详情加载失败"
        subTitle="请检查网络或稍后重试"
        extra={[
          <Button key="retry" type="primary" onClick={() => detailQuery.refetch()}>重试</Button>,
          <Button key="back" onClick={() => navigate('/master-data/logistics-providers')}>返回列表</Button>,
        ]}
      />
    );
  }

  return (
    <div className="master-page master-form-page">
      <Breadcrumb
        items={[
          {
            title: (
              <Button type="link" className="master-breadcrumb-link" onClick={() => navigate('/master-data/logistics-providers')}>
                基础数据
              </Button>
            ),
          },
          {
            title: (
              <Button type="link" className="master-breadcrumb-link" onClick={() => navigate('/master-data/logistics-providers')}>
                物流供应商管理
              </Button>
            ),
          },
          { title: isEdit ? `编辑 ${detailQuery.data?.name || ''}` : '新建物流供应商' },
        ]}
      />

      <ProForm<{
        name: string;
        providerCode?: string;
        shortName?: string;
        contactPerson?: string;
        contactPhone?: string;
        contactEmail?: string;
        address?: string;
        status?: string;
        providerLevel?: number;
        countryId?: number;
        countryName?: string;
        defaultCompanyId: number;
        defaultCompanyName?: string;
      }>
        formRef={formRef}
        submitter={false}
        initialValues={
          detailQuery.data
            ? {
                name: detailQuery.data.name,
                providerCode: detailQuery.data.providerCode ?? undefined,
                shortName: detailQuery.data.shortName ?? undefined,
                contactPerson: detailQuery.data.contactPerson ?? undefined,
                contactPhone: detailQuery.data.contactPhone ?? undefined,
                contactEmail: detailQuery.data.contactEmail ?? undefined,
                address: detailQuery.data.address ?? undefined,
                status: detailQuery.data.status,
                providerLevel: detailQuery.data.providerLevel ?? undefined,
                countryId: detailQuery.data.countryId ?? undefined,
                countryName: detailQuery.data.countryName ?? undefined,
                defaultCompanyId: detailQuery.data.defaultCompanyId ?? undefined,
                defaultCompanyName: detailQuery.data.defaultCompanyName ?? undefined,
              }
            : { status: '合作' }
        }
        onFinish={async (values) => {
          const payload = {
            name: values.name,
            shortName: values.shortName || undefined,
            contactPerson: values.contactPerson || undefined,
            contactPhone: values.contactPhone || undefined,
            contactEmail: values.contactEmail || undefined,
            address: values.address || undefined,
            status: values.status as any,
            providerLevel: values.providerLevel ?? undefined,
            countryId: values.countryId ? Number(values.countryId) : undefined,
            countryName: values.countryName || undefined,
            defaultCompanyId: Number(values.defaultCompanyId),
            defaultCompanyName: values.defaultCompanyName || undefined,
          };

          if (isEdit) {
            await updateMutation.mutateAsync(payload);
          } else {
            await createMutation.mutateAsync(payload);
          }
          return true;
        }}
      >
        <div className="master-info-card">
          <div className="master-form-body">
            <ProForm.Group>
              <ProFormText
                name="name"
                label="供应商名称"
                width="md"
                placeholder="请输入物流供应商名称"
                rules={[
                  { required: true, message: '请输入供应商名称' },
                  { max: 200, message: '供应商名称最多 200 个字符' },
                ]}
              />
              <ProFormText
                name="providerCode"
                label="供应商编码"
                width="sm"
                placeholder="创建后自动生成，如 YCWL0001"
                disabled
              />
              <ProFormText
                name="shortName"
                label="供应商简称"
                width="sm"
                placeholder="请输入供应商简称"
                rules={[
                  { required: true, message: '请输入供应商简称' },
                  { max: 100, message: '供应商简称最多 100 个字符' },
                ]}
              />
            </ProForm.Group>

            <ProForm.Group>
              <ProFormText
                name="contactPerson"
                label="联系人"
                width="sm"
                placeholder="请输入联系人"
                rules={[
                  { required: true, message: '请输入联系人' },
                  { max: 100, message: '联系人最多 100 个字符' },
                ]}
              />
              <ProFormText
                name="contactPhone"
                label="联系电话"
                width="sm"
                placeholder="请输入联系电话"
                rules={[
                  { required: true, message: '请输入联系电话' },
                  { max: 50, message: '联系电话最多 50 个字符' },
                ]}
              />
              <ProFormText
                name="contactEmail"
                label="联系邮箱"
                width="md"
                placeholder="请输入联系邮箱"
                rules={[
                  { required: true, message: '请输入联系邮箱' },
                  { type: 'email', message: '请输入正确的邮箱地址' },
                ]}
              />
            </ProForm.Group>

            <ProForm.Group>
              <ProFormSelect
                name="status"
                label="合作状态"
                width="sm"
                options={LOGISTICS_PROVIDER_STATUS_OPTIONS}
              />
              <div style={{ minWidth: 240 }}>
                <ProFormItem
                  name="providerLevel"
                  label="供应商等级"
                >
                  <Rate count={5} />
                </ProFormItem>
              </div>
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
                  onChange: (_value, option: any) => {
                    formRef.current?.setFieldsValue({ countryName: option?.name ?? null });
                  },
                }}
              />
              <ProFormSelect
                name="defaultCompanyId"
                label="默认合作主体"
                width="md"
                placeholder="请搜索公司主体"
                showSearch
                rules={[{ required: true, message: '请选择默认合作主体' }]}
                request={async (params) => {
                  try {
                    const res = await request.get<any, { list: Array<{ id: number; nameCn: string }> }>('/companies', {
                      params: { keyword: params.keyWords, pageSize: 20 },
                    });
                    const options = (res.list || []).map((item) => ({
                      label: item.nameCn,
                      value: Number(item.id),
                      name: item.nameCn,
                    }));
                    if (!params.keyWords && detailQuery.data?.defaultCompanyId) {
                      const exists = options.some((item) => item.value === detailQuery.data?.defaultCompanyId);
                      if (!exists) {
                        options.unshift({
                          label: detailQuery.data.defaultCompanyName || '',
                          value: detailQuery.data.defaultCompanyId,
                          name: detailQuery.data.defaultCompanyName || '',
                        });
                      }
                    }
                    return options;
                  } catch {
                    return [];
                  }
                }}
                fieldProps={{
                  onChange: (_value, option: any) => {
                    formRef.current?.setFieldsValue({ defaultCompanyName: option?.name ?? null });
                  },
                }}
              />
            </ProForm.Group>

            <ProFormText
              name="address"
              label="公司详细地址"
              width="xl"
              placeholder="请输入公司详细地址"
              rules={[
                { required: true, message: '请输入公司详细地址' },
                { max: 500, message: '地址最多 500 个字符' },
              ]}
            />
          </div>
          <div className="master-form-footer">
            <Button onClick={() => navigate('/master-data/logistics-providers')}>取消</Button>
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
