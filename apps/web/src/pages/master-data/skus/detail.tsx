import { Breadcrumb, Button, Modal, Result, Space, Tag, message } from 'antd';
import { ProDescriptions } from '@ant-design/pro-components';
import type { ProDescriptionsItemProps } from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteSku, getSkuById, type Sku } from '../../../api/skus.api';
import { getSpuById } from '../../../api/spus.api';

export default function SkuDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id = '' } = useParams();
  const skuId = Number(id);

  const query = useQuery({
    queryKey: ['sku-detail', skuId],
    queryFn: () => getSkuById(skuId),
    enabled: Number.isInteger(skuId) && skuId > 0,
  });

  const spuQuery = useQuery({
    queryKey: ['spu-detail', query.data?.spuId],
    queryFn: () => getSpuById(query.data!.spuId),
    enabled: Boolean(query.data?.spuId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteSku(skuId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skus'] });
      message.success('SKU 已删除');
      navigate('/master-data/skus');
    },
  });

  if (!Number.isInteger(skuId) || skuId <= 0) {
    return (
      <Result
        status="404"
        title="SKU 不存在"
        extra={<Button type="primary" onClick={() => navigate('/master-data/skus')}>返回列表</Button>}
      />
    );
  }

  if (query.isError && !query.data) {
    return (
      <Result
        status="error"
        title="SKU 详情加载失败"
        subTitle="请检查网络或稍后重试"
        extra={[
          <Button key="retry" type="primary" onClick={() => query.refetch()}>重试</Button>,
          <Button key="back" onClick={() => navigate('/master-data/skus')}>返回列表</Button>,
        ]}
      />
    );
  }

  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除 SKU「${query.data?.skuCode}」吗？此操作不可撤销。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => deleteMutation.mutateAsync(),
    });
  };

  const categoryPath = spuQuery.data
    ? [spuQuery.data.categoryLevel1Code, spuQuery.data.categoryLevel2Code, spuQuery.data.categoryLevel3Code]
        .filter(Boolean)
        .join(' / ') || '-'
    : '-';

  const basicColumns: ProDescriptionsItemProps<Sku>[] = [
    { title: 'SKU 编码', dataIndex: 'skuCode', span: 1 },
    {
      title: '状态',
      dataIndex: 'status',
      span: 1,
      render: (_, record) =>
        record.status === 'active' ? <Tag color="success">启用</Tag> : <Tag>停用</Tag>,
    },
    { title: '所属 SPU', key: 'spuName', span: 1, render: () => spuQuery.data?.name ?? '-' },
    { title: '分类路径', key: 'categoryPath', span: 1, render: () => categoryPath },
    { title: '中文名称', dataIndex: 'nameCn', span: 1, renderText: (v) => v || '-' },
    { title: '英文名称', dataIndex: 'nameEn', span: 1, renderText: (v) => v || '-' },
    { title: '规格描述', dataIndex: 'specification', span: 2 },
    { title: '创建时间', dataIndex: 'createdAt', span: 1, renderText: (v) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: '更新时间', dataIndex: 'updatedAt', span: 1, renderText: (v) => dayjs(v).format('YYYY-MM-DD HH:mm') },
  ];

  const specColumns: ProDescriptionsItemProps<Sku>[] = [
    { title: '产品类型', dataIndex: 'productType', span: 1, renderText: (v) => v || '-' },
    { title: '工作原理', dataIndex: 'principle', span: 1, renderText: (v) => v || '-' },
    { title: '材质', dataIndex: 'material', span: 1, renderText: (v) => v || '-' },
    {
      title: '是否含插头',
      dataIndex: 'hasPlug',
      span: 1,
      renderText: (v) => (v === null || v === undefined ? '-' : v ? '是' : '否'),
    },
    { title: '客户质保期（月）', dataIndex: 'customerWarrantyMonths', span: 1, renderText: (v) => v ?? '-' },
    { title: '特殊属性', dataIndex: 'specialAttributes', span: 1, renderText: (v) => v || '-' },
    { title: '特殊属性说明', dataIndex: 'specialAttributesNote', span: 2, renderText: (v) => v || '-' },
    { title: '核心参数', dataIndex: 'coreParams', span: 2, renderText: (v) => v || '-' },
    { title: '电气参数', dataIndex: 'electricalParams', span: 2, renderText: (v) => v || '-' },
    { title: '产品用途', dataIndex: 'productUsage', span: 2, renderText: (v) => v || '-' },
    { title: '禁止经营国家', dataIndex: 'forbiddenCountries', span: 2, renderText: (v) => v || '-' },
  ];

  const dimensionColumns: ProDescriptionsItemProps<Sku>[] = [
    { title: '净重（KG）', dataIndex: 'weightKg', span: 1 },
    { title: '毛重（KG）', dataIndex: 'grossWeightKg', span: 1, renderText: (v) => v ?? '-' },
    { title: '长（CM）', dataIndex: 'lengthCm', span: 1, renderText: (v) => v ?? '-' },
    { title: '宽（CM）', dataIndex: 'widthCm', span: 1, renderText: (v) => v ?? '-' },
    { title: '高（CM）', dataIndex: 'heightCm', span: 1, renderText: (v) => v ?? '-' },
    { title: '体积（CBM）', dataIndex: 'volumeCbm', span: 1 },
  ];

  const packagingColumns: ProDescriptionsItemProps<Sku>[] = [
    { title: '包装类型', dataIndex: 'packagingType', span: 1, renderText: (v) => v || '-' },
    { title: '包装数量', dataIndex: 'packagingQty', span: 1, renderText: (v) => v ?? '-' },
    { title: '包装说明', dataIndex: 'packagingInfo', span: 2, renderText: (v) => v || '-' },
  ];

  const customsColumns: ProDescriptionsItemProps<Sku>[] = [
    { title: 'HS 码', dataIndex: 'hsCode', span: 1 },
    { title: '报关中文品名', dataIndex: 'customsNameCn', span: 1 },
    { title: '报关英文品名', dataIndex: 'customsNameEn', span: 1 },
    { title: '申报价值参考（USD）', dataIndex: 'declaredValueRef', span: 1, renderText: (v) => v ?? '-' },
    {
      title: '是否需要检验',
      dataIndex: 'isInspectionRequired',
      span: 1,
      renderText: (v) => (v === null || v === undefined ? '-' : v ? '是' : '否'),
    },
    { title: '退税率（%）', dataIndex: 'taxRefundRate', span: 1, renderText: (v) => v ?? '-' },
    {
      title: '报关信息是否维护',
      dataIndex: 'customsInfoMaintained',
      span: 1,
      renderText: (v) => (v === null || v === undefined ? '-' : v ? '是' : '否'),
    },
    { title: '监管条件', dataIndex: 'regulatoryConditions', span: 2, renderText: (v) => v || '-' },
    { title: '申报要素', dataIndex: 'declarationElements', span: 2, renderText: (v) => v || '-' },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Breadcrumb
        items={[
          {
            title: (
              <Button type="link" style={{ padding: 0 }} onClick={() => navigate('/master-data/skus')}>
                SKU 管理
              </Button>
            ),
          },
          { title: '详情' },
        ]}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button onClick={() => navigate(`/master-data/skus/${id}/edit`)}>编辑</Button>
        <Button danger onClick={handleDelete} loading={deleteMutation.isPending}>删除</Button>
      </div>

      <ProDescriptions<Sku>
        title="基本信息"
        loading={query.isLoading}
        column={2}
        dataSource={query.data}
        columns={basicColumns}
      />

      <ProDescriptions<Sku>
        title="规格参数"
        loading={query.isLoading}
        column={2}
        dataSource={query.data}
        columns={specColumns}
      />

      <ProDescriptions<Sku>
        title="重量体积"
        loading={query.isLoading}
        column={2}
        dataSource={query.data}
        columns={dimensionColumns}
      />

      <ProDescriptions<Sku>
        title="包装信息"
        loading={query.isLoading}
        column={2}
        dataSource={query.data}
        columns={packagingColumns}
      />

      <ProDescriptions<Sku>
        title="报关信息"
        loading={query.isLoading}
        column={2}
        dataSource={query.data}
        columns={customsColumns}
      />
    </Space>
  );
}
