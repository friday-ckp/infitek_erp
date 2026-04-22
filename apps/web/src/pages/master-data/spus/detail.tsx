import { useState } from 'react';
import { Breadcrumb, Button, Input, Modal, Result, Space, Tabs, Tag, message } from 'antd';
import { ProDescriptions, ProTable } from '@ant-design/pro-components';
import type { ProDescriptionsItemProps, ProColumns } from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteSpu, getSpuById, type Spu } from '../../../api/spus.api';
import { getProductCategoryTree } from '../../../api/product-categories.api';
import { findCategoryName } from '../../../utils/category';
import { getSkus, type Sku } from '../../../api/skus.api';
import SpuFaqTab from './components/SpuFaqTab';

export default function SpuDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id = '' } = useParams();
  const spuId = Number(id);

  const query = useQuery({
    queryKey: ['spu-detail', spuId],
    queryFn: () => getSpuById(spuId),
    enabled: Number.isInteger(spuId) && spuId > 0,
  });

  const categoryTreeQuery = useQuery({
    queryKey: ['product-categories', 'tree'],
    queryFn: getProductCategoryTree,
    staleTime: 5 * 60 * 1000,
  });

  const [skuKeyword, setSkuKeyword] = useState('');
  const [skuPage, setSkuPage] = useState(1);
  const [skuPageSize, setSkuPageSize] = useState(10);

  const skusQuery = useQuery({
    queryKey: ['skus', { spuId, keyword: skuKeyword, page: skuPage, pageSize: skuPageSize }],
    queryFn: () => getSkus({ spuId, keyword: skuKeyword || undefined, page: skuPage, pageSize: skuPageSize }),
    enabled: Number.isInteger(spuId) && spuId > 0,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteSpu(spuId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spus'] });
      message.success('SPU 已删除');
      navigate('/master-data/spus');
    },
  });

  if (!Number.isInteger(spuId) || spuId <= 0) {
    return (
      <Result
        status="404"
        title="SPU 不存在"
        extra={<Button type="primary" onClick={() => navigate('/master-data/spus')}>返回列表</Button>}
      />
    );
  }

  if (query.isError && !query.data) {
    return (
      <Result
        status="error"
        title="SPU 详情加载失败"
        subTitle="请检查网络或稍后重试"
        extra={[
          <Button key="retry" type="primary" onClick={() => query.refetch()}>重试</Button>,
          <Button key="back" onClick={() => navigate('/master-data/spus')}>返回列表</Button>,
        ]}
      />
    );
  }

  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除 SPU「${query.data?.name}」吗？此操作不可撤销。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => deleteMutation.mutateAsync(),
    });
  };

  const categoryName = query.data && categoryTreeQuery.data
    ? findCategoryName(categoryTreeQuery.data, query.data.categoryId)
    : '-';

  const basicColumns: ProDescriptionsItemProps<Spu>[] = [
    { title: 'SPU 编码', dataIndex: 'spuCode', span: 1 },
    { title: 'SPU 名称', dataIndex: 'name', span: 1 },
    { title: '所属分类', key: 'category', span: 1, render: () => categoryName },
    { title: '单位', dataIndex: 'unit', span: 1, renderText: (v) => v || '-' },
    { title: '一级分类编号', dataIndex: 'categoryLevel1Code', span: 1, renderText: (v) => v || '-' },
    { title: '二级分类编号', dataIndex: 'categoryLevel2Code', span: 1, renderText: (v) => v || '-' },
    { title: '三级分类编号', dataIndex: 'categoryLevel3Code', span: 1, renderText: (v) => v || '-' },
    { title: '创建时间', dataIndex: 'createdAt', span: 1, renderText: (v) => dayjs(v).format('YYYY-MM-DD') },
    { title: '更新时间', dataIndex: 'updatedAt', span: 1, renderText: (v) => dayjs(v).format('YYYY-MM-DD') },
  ];

  const supplierColumns: ProDescriptionsItemProps<Spu>[] = [
    { title: '供应商', dataIndex: 'supplierName', span: 1, renderText: (v) => v || '-' },
    { title: '厂家型号', dataIndex: 'manufacturerModel', span: 1, renderText: (v) => v || '-' },
    { title: '客户质保期（月）', dataIndex: 'customerWarrantyMonths', span: 1, renderText: (v) => v ?? '-' },
    { title: '采购质保期（月）', dataIndex: 'purchaseWarrantyMonths', span: 1, renderText: (v) => v ?? '-' },
    { title: '供应商质保说明', dataIndex: 'supplierWarrantyNote', span: 2, renderText: (v) => v || '-' },
  ];

  const invoiceColumns: ProDescriptionsItemProps<Spu>[] = [
    { title: '开票品名', dataIndex: 'invoiceName', span: 1, renderText: (v) => v || '-' },
    { title: '开票单位', dataIndex: 'invoiceUnit', span: 1, renderText: (v) => v || '-' },
    { title: '开票型号', dataIndex: 'invoiceModel', span: 1, renderText: (v) => v || '-' },
  ];

  const skuColumns: ProColumns<Sku>[] = [
    {
      title: 'SKU 编码',
      dataIndex: 'skuCode',
      width: 120,
      render: (_, record) => (
        <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/master-data/skus/${record.id}`)}>
          {record.skuCode}
        </Button>
      ),
    },
    { title: '规格描述', dataIndex: 'specification', ellipsis: true },
    { title: 'HS 码', dataIndex: 'hsCode', width: 120 },
    { title: '净重(KG)', dataIndex: 'weightKg', width: 90 },
    { title: '体积(CBM)', dataIndex: 'volumeCbm', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (_, record) =>
        record.status === 'active' ? <Tag color="success">启用</Tag> : <Tag>停用</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_, record) => (
        <Space size={12}>
          <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/master-data/skus/${record.id}`)}>
            查看
          </Button>
          <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/master-data/skus/${record.id}/edit`)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  const otherColumns: ProDescriptionsItemProps<Spu>[] = [
    { title: '禁止经营国家', dataIndex: 'forbiddenCountries', span: 2, renderText: (v) => v || '-' },
    { title: '公司主体 ID', dataIndex: 'companyId', span: 1, renderText: (v) => v ?? '-' },
  ];

  const tabItems = [
    {
      key: 'info',
      label: '基本信息',
      children: (
        <>
          <ProDescriptions<Spu>
            title="基础信息"
            loading={query.isLoading}
            column={2}
            dataSource={query.data}
            columns={basicColumns}
          />

          <ProDescriptions<Spu>
            title="供应商信息"
            loading={query.isLoading}
            column={2}
            dataSource={query.data}
            columns={supplierColumns}
          />

          <ProDescriptions<Spu>
            title="开票信息"
            loading={query.isLoading}
            column={2}
            dataSource={query.data}
            columns={invoiceColumns}
          />

          <ProDescriptions<Spu>
            title="其他"
            loading={query.isLoading}
            column={2}
            dataSource={query.data}
            columns={otherColumns}
          />
        </>
      ),
    },
    {
      key: 'faq',
      label: 'FAQ',
      children: <SpuFaqTab spuId={spuId} />,
    },
    {
      key: 'sku',
      label: 'SKU 变体',
      children: (
        <ProTable<Sku>
          headerTitle="SKU 变体"
          search={false}
          options={false}
          rowKey="id"
          loading={skusQuery.isFetching}
          columns={skuColumns}
          dataSource={skusQuery.data?.list ?? []}
          scroll={{ x: 800 }}
          pagination={{
            current: skuPage,
            pageSize: skuPageSize,
            total: skusQuery.data?.total ?? 0,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p, ps) => {
              if (ps !== skuPageSize) { setSkuPage(1); } else { setSkuPage(p); }
              setSkuPageSize(ps);
            },
          }}
          toolBarRender={() => [
            <Input
              key="search"
              placeholder="搜索 SKU 编码/规格..."
              style={{ width: 200 }}
              value={skuKeyword}
              onChange={(e) => { setSkuKeyword(e.target.value); setSkuPage(1); }}
              allowClear
            />,
            <Button
              key="create"
              type="primary"
              onClick={() => navigate(`/master-data/skus/create?spuId=${spuId}`)}
            >
              + 新建 SKU
            </Button>,
          ]}
        />
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Breadcrumb
        items={[
          {
            title: (
              <Button type="link" style={{ padding: 0 }} onClick={() => navigate('/master-data/spus')}>
                SPU 管理
              </Button>
            ),
          },
          { title: '详情' },
        ]}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button onClick={() => navigate(`/master-data/spus/${id}/edit`)}>编辑</Button>
        <Button danger onClick={handleDelete} loading={deleteMutation.isPending}>删除</Button>
      </div>

      <Tabs defaultActiveKey="info" items={tabItems} />
    </Space>
  );
}
