import { useRef, useState } from 'react';
import { Button, Result, Skeleton, TreeSelect, message } from 'antd';
import {
  ProForm,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  type ProFormInstance,
} from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { createSpu, getSpuById, updateSpu, type CreateSpuPayload, type UpdateSpuPayload } from '../../../api/spus.api';
import { getProductCategoryTree, type ProductCategoryNode } from '../../../api/product-categories.api';
import { getCompanies } from '../../../api/companies.api';
import { AnchorNav, SectionCard } from '../components/page-scaffold';
import '../master-page.css';

interface TreeSelectNode {
  title: string;
  value: number;
  disabled: boolean;
  children: TreeSelectNode[];
}

function buildTreeData(nodes: ProductCategoryNode[]): TreeSelectNode[] {
  return nodes.map((node) => ({
    title: node.name,
    value: node.id,
    disabled: node.level < 3,
    children: buildTreeData(node.children),
  }));
}

export default function SpuFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const spuId = id ? Number(id) : undefined;
  const isEdit = Boolean(id);
  const formRef = useRef<ProFormInstance>(undefined);
  const [activeAnchor, setActiveAnchor] = useState('basic');

  const detailQuery = useQuery({
    queryKey: ['spu-detail', spuId],
    queryFn: () => getSpuById(spuId as number),
    enabled: Boolean(isEdit && spuId && Number.isInteger(spuId) && spuId > 0),
  });

  const categoryTreeQuery = useQuery({
    queryKey: ['product-categories', 'tree'],
    queryFn: getProductCategoryTree,
    staleTime: 5 * 60 * 1000,
  });

  const companiesQuery = useQuery({
    queryKey: ['companies-options'],
    queryFn: () => getCompanies({ pageSize: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateSpuPayload) => createSpu(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['spus'] });
      message.success('SPU 创建成功', 3);
      navigate(`/master-data/spus/${data.id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateSpuPayload) => updateSpu(spuId as number, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spus'] });
      queryClient.invalidateQueries({ queryKey: ['spu-detail', spuId] });
      message.success('SPU 更新成功', 3);
      navigate(`/master-data/spus/${spuId}`);
    },
  });

  if (isEdit && (!spuId || !Number.isInteger(spuId) || spuId <= 0)) {
    return (
      <Result
        status="404"
        title="SPU 不存在"
        extra={<Button type="primary" onClick={() => navigate('/master-data/spus')}>返回列表</Button>}
      />
    );
  }

  if (isEdit && detailQuery.isLoading) return <Skeleton active />;

  if (isEdit && detailQuery.isError && !detailQuery.data) {
    return (
      <Result
        status="error"
        title="加载 SPU 信息失败"
        extra={[
          <Button key="retry" type="primary" onClick={() => detailQuery.refetch()}>重试</Button>,
          <Button key="back" onClick={() => navigate('/master-data/spus')}>返回列表</Button>,
        ]}
      />
    );
  }

  const initialValues = detailQuery.data
    ? {
        name: detailQuery.data.name,
        categoryId: detailQuery.data.categoryId,
        unit: detailQuery.data.unit ?? undefined,
        manufacturerModel: detailQuery.data.manufacturerModel ?? undefined,
        customerWarrantyMonths: detailQuery.data.customerWarrantyMonths ?? undefined,
        purchaseWarrantyMonths: detailQuery.data.purchaseWarrantyMonths ?? undefined,
        supplierWarrantyNote: detailQuery.data.supplierWarrantyNote ?? undefined,
        forbiddenCountries: detailQuery.data.forbiddenCountries ?? undefined,
        invoiceName: detailQuery.data.invoiceName ?? undefined,
        invoiceUnit: detailQuery.data.invoiceUnit ?? undefined,
        invoiceModel: detailQuery.data.invoiceModel ?? undefined,
        supplierName: detailQuery.data.supplierName ?? undefined,
        companyId: detailQuery.data.companyId ?? undefined,
      }
    : {};

  const treeData = categoryTreeQuery.data ? buildTreeData(categoryTreeQuery.data) : [];
  const companyOptions = (companiesQuery.data?.list ?? []).map((company) => ({
    label: company.nameCn,
    value: company.id,
  }));

  const anchors = [
    { key: 'basic', label: '基础信息' },
    { key: 'supplier', label: '供应信息' },
    { key: 'invoice', label: '开票与经营' },
  ];

  return (
    <div className="master-page master-form-page">
      <div className="master-page-header">
        <div className="master-page-heading">
          <div className="master-page-title">{isEdit ? '编辑 SPU' : '新建 SPU'}</div>
          <div className="master-page-description">按照统一页面骨架维护 SPU 基础、供应与开票信息。</div>
        </div>
      </div>

      <ProForm
        formRef={formRef}
        loading={detailQuery.isLoading}
        submitter={false}
        initialValues={initialValues}
        onFinish={async (values) => {
          const payload: CreateSpuPayload = {
            name: values.name,
            categoryId: Number(values.categoryId),
            unit: values.unit || undefined,
            manufacturerModel: values.manufacturerModel || undefined,
            customerWarrantyMonths: values.customerWarrantyMonths ?? undefined,
            purchaseWarrantyMonths: values.purchaseWarrantyMonths ?? undefined,
            supplierWarrantyNote: values.supplierWarrantyNote || undefined,
            forbiddenCountries: values.forbiddenCountries || undefined,
            invoiceName: values.invoiceName || undefined,
            invoiceUnit: values.invoiceUnit || undefined,
            invoiceModel: values.invoiceModel || undefined,
            supplierName: values.supplierName || undefined,
            companyId: values.companyId ?? undefined,
          };

          if (isEdit) {
            await updateMutation.mutateAsync(payload as UpdateSpuPayload);
          } else {
            await createMutation.mutateAsync(payload);
          }
          return true;
        }}
      >
        <div className="master-form-layout">
          <AnchorNav anchors={anchors} activeKey={activeAnchor} onChange={setActiveAnchor} />

          <div className="master-form-main">
            <SectionCard
              id="basic"
              title="基础信息"
              description="配置 SPU 名称、三级分类以及基础计量单位。"
            >
              <div className="master-form-grid">
                <ProFormText
                  name="name"
                  label="SPU 名称"
                  placeholder="请输入 SPU 名称"
                  rules={[
                    { required: true, message: '请输入 SPU 名称' },
                    { max: 200, message: 'SPU 名称最多 200 个字符' },
                  ]}
                />
                <ProForm.Item
                  name="categoryId"
                  label="所属分类"
                  rules={[{ required: true, message: '请选择所属分类' }]}
                >
                  <TreeSelect
                    style={{ width: '100%' }}
                    placeholder="请选择三级分类"
                    treeData={treeData}
                    loading={categoryTreeQuery.isLoading}
                    showSearch
                    treeNodeFilterProp="title"
                    allowClear
                  />
                </ProForm.Item>
                <ProFormText
                  name="unit"
                  label="单位"
                  placeholder="请输入单位（可选）"
                  rules={[{ max: 50, message: '单位最多 50 个字符' }]}
                />
              </div>
            </SectionCard>

            <SectionCard
              id="supplier"
              title="供应信息"
              description="集中维护供应商主体、厂家型号与质保说明。"
            >
              <div className="master-form-grid">
                <ProFormText
                  name="supplierName"
                  label="供应商"
                  placeholder="请输入供应商名称"
                  rules={[{ max: 200, message: '供应商名称最多 200 个字符' }]}
                />
                <ProFormText
                  name="manufacturerModel"
                  label="厂家型号"
                  placeholder="请输入厂家型号"
                  rules={[{ max: 200, message: '厂家型号最多 200 个字符' }]}
                />
                <ProFormDigit
                  name="customerWarrantyMonths"
                  label="客户质保期（月）"
                  placeholder="请输入月数"
                  min={0}
                  fieldProps={{ precision: 0 }}
                />
                <ProFormDigit
                  name="purchaseWarrantyMonths"
                  label="采购质保期（月）"
                  placeholder="请输入月数"
                  min={0}
                  fieldProps={{ precision: 0 }}
                />
                <div className="full">
                  <ProFormTextArea
                    name="supplierWarrantyNote"
                    label="供应商质保说明"
                    placeholder="请输入供应商质保说明"
                    fieldProps={{ rows: 4 }}
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              id="invoice"
              title="开票与经营"
              description="统一填写开票字段、公司主体及经营限制说明。"
            >
              <div className="master-form-grid">
                <ProFormText
                  name="invoiceName"
                  label="开票品名"
                  placeholder="请输入开票品名"
                  rules={[{ max: 200, message: '开票品名最多 200 个字符' }]}
                />
                <ProFormText
                  name="invoiceUnit"
                  label="开票单位"
                  placeholder="请输入开票单位"
                  rules={[{ max: 50, message: '开票单位最多 50 个字符' }]}
                />
                <ProFormText
                  name="invoiceModel"
                  label="开票型号"
                  placeholder="请输入开票型号"
                  rules={[{ max: 200, message: '开票型号最多 200 个字符' }]}
                />
                <ProFormSelect
                  name="companyId"
                  label="公司主体"
                  placeholder="请选择公司主体"
                  options={companyOptions}
                  showSearch
                  fieldProps={{ optionFilterProp: 'label' }}
                />
                <div className="full">
                  <ProFormText
                    name="forbiddenCountries"
                    label="禁止经营国家"
                    placeholder="多个国家用逗号分隔"
                    rules={[{ max: 500, message: '最多 500 个字符' }]}
                  />
                </div>
              </div>
            </SectionCard>

            <div className="master-form-footer">
              <div className="master-form-footer-tip">当前改动仅统一界面布局与视觉规范，不调整 SPU 提交字段和接口行为。</div>
              <div className="master-form-footer-actions">
                <Button onClick={() => navigate(isEdit ? `/master-data/spus/${spuId}` : '/master-data/spus')}>
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
