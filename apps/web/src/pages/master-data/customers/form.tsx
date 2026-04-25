import { useRef, useState } from 'react';
import { Button, Result, Skeleton } from 'antd';
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
  const [activeAnchor, setActiveAnchor] = useState('basic');

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
          <Button key="retry" type="primary" onClick={() => detailQuery.refetch()}>重试</Button>,
          <Button key="back" onClick={() => navigate('/master-data/customers')}>返回列表</Button>,
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

  const anchors = [
    { key: 'basic', label: '基础信息' },
    { key: 'contact', label: '联系信息' },
    { key: 'billing', label: '开票需求' },
  ];

  return (
    <div className="master-page master-form-page">
      <div className="master-page-header">
        <div className="master-page-heading">
          <div className="master-page-title">{isEdit ? '编辑客户' : '新建客户'}</div>
          <div className="master-page-description">统一维护客户主体、联系信息与开票需求。</div>
        </div>
      </div>

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
                  <div className="master-section-description">配置客户编码、名称、归属国家与销售负责人。</div>
                </div>
              </div>
              <div className="master-section-body">
                <div className="master-form-grid">
                  <ProFormText
                    name="customerCode"
                    label="客户代码"
                    placeholder="请输入客户代码"
                    rules={[
                      { required: true, message: '请输入客户代码' },
                      { max: 50, message: '客户代码最多 50 个字符' },
                    ]}
                  />
                  <ProFormText
                    name="customerName"
                    label="客户名称"
                    placeholder="请输入客户名称"
                    rules={[
                      { required: true, message: '请输入客户名称' },
                      { max: 200, message: '客户名称最多 200 个字符' },
                    ]}
                  />
                  <ProFormSelect
                    name="countryId"
                    label="客户国家"
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
                </div>
              </div>
            </section>

            <section id="contact" className="master-section-card">
              <div className="master-section-header">
                <div className="master-section-heading">
                  <div className="master-section-title">联系信息</div>
                  <div className="master-section-description">维护客户联系人、电话、邮箱以及联系地址。</div>
                </div>
              </div>
              <div className="master-section-body">
                <div className="master-form-grid">
                  <ProFormText
                    name="contactPerson"
                    label="联系人"
                    placeholder="请输入联系人"
                    rules={[{ max: 100, message: '联系人最多 100 个字符' }]}
                  />
                  <ProFormText
                    name="contactPhone"
                    label="联系电话"
                    placeholder="请输入联系电话"
                    rules={[{ max: 50, message: '联系电话最多 50 个字符' }]}
                  />
                  <ProFormText
                    name="contactEmail"
                    label="联系邮箱"
                    placeholder="请输入联系邮箱"
                    rules={[
                      { type: 'email', message: '请输入有效的邮箱地址' },
                      { max: 100, message: '联系邮箱最多 100 个字符' },
                    ]}
                  />
                  <div className="full">
                    <ProFormTextArea
                      name="address"
                      label="地址"
                      placeholder="请输入客户地址"
                      fieldProps={{ rows: 3 }}
                      rules={[{ max: 500, message: '地址最多 500 个字符' }]}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section id="billing" className="master-section-card">
              <div className="master-section-header">
                <div className="master-section-heading">
                  <div className="master-section-title">开票需求</div>
                  <div className="master-section-description">补充客户的开票偏好和特殊说明。</div>
                </div>
              </div>
              <div className="master-section-body">
                <div className="master-form-grid">
                  <div className="full">
                    <ProFormTextArea
                      name="billingRequirements"
                      label="开票需求"
                      placeholder="请输入开票需求"
                      fieldProps={{ rows: 4 }}
                    />
                  </div>
                </div>
              </div>
            </section>

            <div className="master-form-footer">
              <div className="master-form-footer-tip">当前仅统一表单视觉和排版，不改动客户接口与字段提交逻辑。</div>
              <div className="master-form-footer-actions">
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
          </div>
        </div>
      </ProForm>
    </div>
  );
}
