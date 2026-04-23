import { useMemo } from 'react';
import { Breadcrumb, Button, Image, Modal, Result, Space, Table, Tabs, Tag, message } from 'antd';
import { ProDescriptions, ProTable } from '@ant-design/pro-components';
import type { ProDescriptionsItemProps, ProColumns } from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteSku, getSkuById, type Sku, type PackagingRow } from '../../../api/skus.api';
import { getSpuById } from '../../../api/spus.api';
import { getProductCategoryTree, type ProductCategoryNode } from '../../../api/product-categories.api';
import { getCertificates, type Certificate } from '../../../api/certificates.api';

const STATUS_MAP: Record<string, { color: string; text: string }> = {
  '上架': { color: 'success', text: '上架' },
  '下架可售': { color: 'warning', text: '下架可售' },
  '下架不可售': { color: 'default', text: '下架不可售' },
  '临拓': { color: 'processing', text: '临拓' },
};

function findCategoryNode(nodes: ProductCategoryNode[], id: number): ProductCategoryNode | undefined {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children?.length) {
      const found = findCategoryNode(n.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

function parsePackagingList(sku: Sku): PackagingRow[] {
  if (sku.packagingList) {
    try { return JSON.parse(sku.packagingList); } catch { /* fall through */ }
  }
  return [{
    packagingType: sku.packagingType ?? undefined,
    packagingQty: sku.packagingQty ?? undefined,
    weightKg: sku.weightKg ?? undefined,
    grossWeightKg: sku.grossWeightKg ?? undefined,
    lengthCm: sku.lengthCm ?? undefined,
    widthCm: sku.widthCm ?? undefined,
    heightCm: sku.heightCm ?? undefined,
    volumeCbm: sku.volumeCbm ?? undefined,
  }];
}
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

  const categoryTreeQuery = useQuery({
    queryKey: ['product-category-tree'],
    queryFn: getProductCategoryTree,
    staleTime: 5 * 60 * 1000,
  });

  const certificatesQuery = useQuery({
    queryKey: ['certificates-for-sku', skuId],
    queryFn: () => getCertificates({ pageSize: 500 }),
    enabled: Boolean(query.data),
    staleTime: 5 * 60 * 1000,
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
      <Result status="404" title="SKU 不存在" extra={<Button type="primary" onClick={() => navigate('/master-data/skus')}>返回列表</Button>} />
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

  const sku = query.data;
  const tree = categoryTreeQuery.data ?? [];

  const categoryPath = spuQuery.data
    ? [spuQuery.data.categoryLevel1Code, spuQuery.data.categoryLevel2Code, spuQuery.data.categoryLevel3Code]
        .filter(Boolean).join(' / ') || '-'
    : '-';

  const statusInfo = STATUS_MAP[sku?.status ?? ''] ?? { color: 'default', text: sku?.status ?? '-' };

  const packagingRows = sku ? parsePackagingList(sku) : [];

  const imageUrls: string[] = (() => {
    if (sku?.productImageUrls) {
      try { return JSON.parse(sku.productImageUrls); } catch { /* ignore */ }
    }
    if (sku?.productImageUrl) return [sku.productImageUrl];
    return [];
  })();
  const basicColumns: ProDescriptionsItemProps<Sku>[] = [
    { title: 'SKU 编码', dataIndex: 'skuCode', span: 1 },
    { title: '状态', dataIndex: 'status', span: 1, render: () => <Tag color={statusInfo.color}>{statusInfo.text}</Tag> },
    { title: '所属 SPU', key: 'spuName', span: 1, render: () => spuQuery.data?.name ?? '-' },
    { title: '分类路径', key: 'categoryPath', span: 1, render: () => categoryPath },
    { title: '产品型号', dataIndex: 'productModel', span: 1, renderText: (v) => v || '-' },
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
    { title: '是否含插头', dataIndex: 'hasPlug', span: 1, renderText: (v) => (v === null || v === undefined ? '-' : v ? '是' : '否') },
    { title: '客户质保期（月）', dataIndex: 'customerWarrantyMonths', span: 1, renderText: (v) => v ?? '-' },
    { title: '特殊属性', dataIndex: 'specialAttributes', span: 1, renderText: (v) => v || '-' },
    { title: '特殊属性说明', dataIndex: 'specialAttributesNote', span: 2, renderText: (v) => v || '-' },
    { title: '核心参数', dataIndex: 'coreParams', span: 2, renderText: (v) => v || '-' },
    { title: '电参数', dataIndex: 'electricalParams', span: 2, renderText: (v) => v || '-' },
    { title: '产品用途', dataIndex: 'productUsage', span: 2, renderText: (v) => v || '-' },
    { title: '禁止经营国家', dataIndex: 'forbiddenCountries', span: 2, renderText: (v) => v || '-' },
  ];

  const customsColumns: ProDescriptionsItemProps<Sku>[] = [
    { title: 'HS 码', dataIndex: 'hsCode', span: 1 },
    { title: '报关中文品名', dataIndex: 'customsNameCn', span: 1 },
    { title: '报关英文品名', dataIndex: 'customsNameEn', span: 1 },
    { title: '申报价值参考（USD）', dataIndex: 'declaredValueRef', span: 1, renderText: (v) => v ?? '-' },
    { title: '是否需要检验', dataIndex: 'isInspectionRequired', span: 1, renderText: (v) => (v === null || v === undefined ? '-' : v ? '是' : '否') },
    { title: '退税率（%）', dataIndex: 'taxRefundRate', span: 1, renderText: (v) => v ?? '-' },
    { title: '报关信息是否维护', dataIndex: 'customsInfoMaintained', span: 1, renderText: (v) => (v === null || v === undefined ? '-' : v ? '是' : '否') },
    { title: '监管条件', dataIndex: 'regulatoryConditions', span: 2, renderText: (v) => v || '-' },
    { title: '申报要素', dataIndex: 'declarationElements', span: 2, renderText: (v) => v || '-' },
  ];

  // Tab 2: 负责人信息
  const level3Node = sku?.categoryLevel3Id ? findCategoryNode(tree, sku.categoryLevel3Id) : undefined;

  // Tab 3: 证书资料
  const matchedCertificates = useMemo(() => {
    if (!sku || !certificatesQuery.data) return [];
    return certificatesQuery.data.list.filter((cert) =>
      cert.spus.some((s) => s.id === sku.spuId) ||
      (sku.categoryLevel3Id && cert.categoryId === sku.categoryLevel3Id) ||
      cert.attributionType === '通用归属'
    );
  }, [sku, certificatesQuery.data]);

  const certColumns: ProColumns<Certificate>[] = [
    { title: '证书编号', dataIndex: 'certificateNo', width: 140 },
    { title: '证书名称', dataIndex: 'certificateName', width: 200, ellipsis: true },
    { title: '证书类型', dataIndex: 'certificateType', width: 100 },
    { title: '有效期起', dataIndex: 'validFrom', width: 110, render: (_, r) => r.validFrom ? dayjs(r.validFrom).format('YYYY-MM-DD') : '-' },
    { title: '有效期止', dataIndex: 'validUntil', width: 110, render: (_, r) => r.validUntil ? dayjs(r.validUntil).format('YYYY-MM-DD') : '-' },
    { title: '状态', dataIndex: 'status', width: 80, render: (_, r) => r.status === 'valid' ? <Tag color="success">有效</Tag> : <Tag color="error">过期</Tag> },
    { title: '归属类型', dataIndex: 'attributionType', width: 100, renderText: (v) => v || '-' },
  ];
  const basicTab = (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <ProDescriptions<Sku> title="基本信息" loading={query.isLoading} column={2} dataSource={sku} columns={basicColumns} />
      <ProDescriptions<Sku> title="规格参数" loading={query.isLoading} column={2} dataSource={sku} columns={specColumns} />

      {imageUrls.length > 0 && (
        <div>
          <h4>产品图片</h4>
          <Image.PreviewGroup>
            {imageUrls.map((url, i) => (
              <Image key={i} width={120} src={url} style={{ marginRight: 8 }} />
            ))}
          </Image.PreviewGroup>
        </div>
      )}

      <div>
        <h4>包装信息</h4>
        <Table
          dataSource={packagingRows.map((r, i) => ({ ...r, _key: i }))}
          rowKey="_key"
          pagination={false}
          size="small"
          columns={[
            { title: '包装类型', dataIndex: 'packagingType', render: (v) => v || '-' },
            { title: '数量', dataIndex: 'packagingQty', render: (v) => v ?? '-' },
            { title: '净重(KG)', dataIndex: 'weightKg', render: (v) => v ?? '-' },
            { title: '毛重(KG)', dataIndex: 'grossWeightKg', render: (v) => v ?? '-' },
            { title: '长(CM)', dataIndex: 'lengthCm', render: (v) => v ?? '-' },
            { title: '宽(CM)', dataIndex: 'widthCm', render: (v) => v ?? '-' },
            { title: '高(CM)', dataIndex: 'heightCm', render: (v) => v ?? '-' },
            { title: '体积(CBM)', dataIndex: 'volumeCbm', render: (v) => v ?? '-' },
          ]}
        />
      </div>

      <ProDescriptions<Sku> title="报关信息" loading={query.isLoading} column={2} dataSource={sku} columns={customsColumns} />
    </Space>
  );

  const ownerTab = (
    <ProDescriptions column={2} title="负责人信息" loading={categoryTreeQuery.isLoading}>
      <ProDescriptions.Item label="采购负责人">{level3Node?.purchaseOwner || '-'}</ProDescriptions.Item>
      <ProDescriptions.Item label="产品负责人">{level3Node?.productOwner || '-'}</ProDescriptions.Item>
    </ProDescriptions>
  );

  const certsTab = (
    <ProTable<Certificate>
      columns={certColumns}
      dataSource={matchedCertificates}
      loading={certificatesQuery.isLoading}
      rowKey="id"
      search={false}
      toolBarRender={false}
      pagination={{ pageSize: 10 }}
    />
  );

  const tabItems = [
    { key: 'basic', label: '基本信息', children: basicTab },
    { key: 'owner', label: '负责人信息', children: ownerTab },
    { key: 'certs', label: '证书资料', children: certsTab },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Breadcrumb
        items={[
          { title: <Button type="link" style={{ padding: 0 }} onClick={() => navigate('/master-data/skus')}>SKU 管理</Button> },
          { title: '详情' },
        ]}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button onClick={() => navigate(`/master-data/skus/${id}/edit`)}>编辑</Button>
        <Button danger onClick={handleDelete} loading={deleteMutation.isPending}>删除</Button>
      </div>
      <Tabs defaultActiveKey="basic" items={tabItems} />
    </Space>
  );
}
