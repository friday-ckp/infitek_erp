import { useRef } from 'react';
import { Button, Result, Skeleton, Tabs } from 'antd';
import type { TabsProps } from 'antd';
import {
  ProForm,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  type ProFormInstance,
} from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createCustomer,
  getCustomerById,
  updateCustomer,
  type CreateCustomerPayload,
  type UpdateCustomerPayload,
} from '../../../api/customers.api';
import request from '../../../api/request';
import '../master-page.css';

export default function CustomerFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const customerId = id ? Number(id) : undefined;
  const isEdit = Boolean(id);
  const formRef = useRef<ProFormInstance>(undefined);

  const detailQuery = useQuery({
    queryKey: ['customer-detail', customerId],
    queryFn: () => getCustomerById(customerId as number),
    enabled: Boolean(isEdit && customerId && Number.isInteger(customerId) && customerId > 0),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateCustomerPayload) => createCustomer(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      navigate(`/master-data/customers/${created.id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateCustomerPayload) => updateCustomer(customerId as number, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer-detail', customerId] });
      navigate(`/master-data/customers/${customerId}`);
    },
  });

  if (isEdit && (!customerId || !Number.isInteger(customerId) || customerId <= 0)) {
    return (
      <Result
        status="404"
        title="客户不存在"
        extra={<Button type="primary" onClick={() => navigate('/master-data/customers')}>返回列表</Button>}
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
        title="加载客户信息失败"
        subTitle="请检查网络或稍后重试"
        extra={[
          <Button key="retry" type="primary" onClick={() => detailQuery.refetch()}>
            重试
          </Button>,
          <Button key="back" onClick={() => navigate('/master-data/customers')}>
            返回列表
          </Button>,
        ]}
      />
    );
  }

  const initialValues = detailQuery.data
    ? {
        customerCode: detailQuery.data.customerCode,
        customerName: detailQuery.data.customerName,
        countryId: detailQuery.data.countryId,
        countryName: detailQuery.data.countryName,
        salespersonId: detailQuery.data.salespersonId,
        salespersonName: detailQuery.data.salespersonName,
        contactPerson: detailQuery.data.contactPerson ?? undefined,
        contactPhone: detailQuery.data.contactPhone ?? undefined,
        contactEmail: detailQuery.data.contactEmail ?? undefined,
        billingRequirements: detailQuery.data.billingRequirements ?? undefined,
        address: detailQuery.data.address ?? undefined,
      }
    : {};

  const basicTab = (
    <>
      <ProForm.Group>
        <ProFormText
          name="customerCode"
          label="客户代码"
          width="sm"
          placeholder="请输入客户代码"
          rules={[
            { required: true, message: '请输入客户代码' },
            { max: 50, message: '客户代码最多 50 个字符' },
          ]}
        />
        <ProFormText
          name="customerName"
          label="客户名称"
          width="lg"
          placeholder="请输入客户名称"
          rules={[
            { required: true, message: '请输入客户名称' },
            { max: 200, message: '客户名称最多 200 个字符' },
          ]}
        />
      </ProForm.Group>
      <ProForm.Group>
        <ProFormSelect
          name="countryId"
          label="客户国家"
          width="md"
          placeholder="请搜索国家/地区"
          showSearch
          rules={[{ required: true, message: '请选择客户国家' }]}
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
                    label: detailQuery.data.countryName,
                    value: detailQuery.data.countryId,
                    name: detailQuery.data.countryName,
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
        <ProFormSelect
          name="salespersonId"
          label="销售员"
          width="md"
          placeholder="请搜索销售员"
          showSearch
          rules={[{ required: true, message: '请选择销售员' }]}
          request={async (params) => {
            try {
              const res = await request.get<any, { list: Array<{ id: number; name: string; username: string }> }>('/users', {
                params: { search: params.keyWords, pageSize: 20 },
              });
              const options = (res.list || []).map((item) => ({
                label: `${item.name} (${item.username})`,
                value: Number(item.id),
                name: item.name,
              }));
              if (!params.keyWords && detailQuery.data?.salespersonId) {
                const exists = options.some((item) => item.value === detailQuery.data?.salespersonId);
                if (!exists) {
                  options.unshift({
                    label: detailQuery.data.salespersonName,
                    value: detailQuery.data.salespersonId,
                    name: detailQuery.data.salespersonName,
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
                salespersonName: option?.name ?? null,
              });
            },
          }}
        />
      </ProForm.Group>
    </>
  );

  const contactTab = (
    <>
      <ProForm.Group>
        <ProFormText
          name="contactPerson"
          label="联系人"
          width="md"
          placeholder="请输入联系人"
          rules={[{ max: 100, message: '联系人最多 100 个字符' }]}
        />
        <ProFormText
          name="contactPhone"
          label="联系电话"
          width="md"
          placeholder="请输入联系电话"
          rules={[{ max: 50, message: '联系电话最多 50 个字符' }]}
        />
        <ProFormText
          name="contactEmail"
          label="联系邮箱"
          width="md"
          placeholder="请输入联系邮箱"
          rules={[
            { type: 'email', message: '请输入有效的邮箱地址' },
            { max: 100, message: '联系邮箱最多 100 个字符' },
          ]}
        />
      </ProForm.Group>
      <ProForm.Group>
        <ProFormTextArea
          name="address"
          label="地址"
          width="xl"
          placeholder="请输入客户地址"
          fieldProps={{ rows: 3 }}
          rules={[{ max: 500, message: '地址最多 500 个字符' }]}
        />
      </ProForm.Group>
    </>
  );

  const billingTab = (
    <ProForm.Group>
      <ProFormTextArea
        name="billingRequirements"
        label="开票需求"
        width="xl"
        placeholder="请输入开票需求"
        fieldProps={{ rows: 4 }}
      />
    </ProForm.Group>
  );

  const tabItems: TabsProps['items'] = [
    { key: 'basic', label: '基本信息', children: <div className="master-form-body">{basicTab}</div> },
    { key: 'contact', label: '联系信息', children: <div className="master-form-body">{contactTab}</div> },
    { key: 'billing', label: '开票需求', children: <div className="master-form-body">{billingTab}</div> },
  ];

  return (
    <div className="master-page master-form-page">
      <ProForm
        formRef={formRef}
        submitter={false}
        loading={detailQuery.isLoading}
        initialValues={initialValues}
        onFinish={async (values) => {
          const payload: CreateCustomerPayload = {
            customerCode: values.customerCode,
            customerName: values.customerName,
            countryId: Number(values.countryId),
            countryName: values.countryName || undefined,
            salespersonId: Number(values.salespersonId),
            salespersonName: values.salespersonName || undefined,
            contactPerson: values.contactPerson || undefined,
            contactPhone: values.contactPhone || undefined,
            contactEmail: values.contactEmail || undefined,
            billingRequirements: values.billingRequirements || undefined,
            address: values.address || undefined,
          };

          if (isEdit) {
            await updateMutation.mutateAsync(payload as UpdateCustomerPayload);
          } else {
            await createMutation.mutateAsync(payload);
          }
          return true;
        }}
      >
        <div className="master-info-card">
          <Tabs className="master-info-tabs" defaultActiveKey="basic" items={tabItems} />
          <div className="master-form-footer">
            <Button onClick={() => navigate(isEdit ? `/master-data/customers/${customerId}` : '/master-data/customers')}>
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
