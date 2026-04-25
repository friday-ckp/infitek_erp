import { useMemo, useState } from 'react';
import { Button, Image, Modal, Result, Skeleton, Table, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteSku, getSkuById, type PackagingRow, type Sku } from '../../../api/skus.api';
import { getSpuById } from '../../../api/spus.api';
import { getProductCategoryTree, type ProductCategoryNode } from '../../../api/product-categories.api';
import { getCertificates, type Certificate } from '../../../api/certificates.api';
import {
  AnchorNav,
  MetaItem,
  OperationTimeline,
  SectionCard,
  SummaryMetaItem,
  displayOrDash,
} from '../components/page-scaffold';
import '../master-page.css';

function findCategoryNode(nodes: ProductCategoryNode[], id: number): ProductCategoryNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children?.length) {
      const found = findCategoryNode(node.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

function parsePackagingList(sku: Sku): PackagingRow[] {
  if (sku.packagingList) {
    try {
      return JSON.parse(sku.packagingList);
    } catch {
      // noop
    }
  }
  return [
    {
      packagingType: sku.packagingType ?? undefined,
      packagingQty: sku.packagingQty ?? undefined,
      weightKg: sku.weightKg ?? undefined,
      grossWeightKg: sku.grossWeightKg ?? undefined,
      lengthCm: sku.lengthCm ?? undefined,
      widthCm: sku.widthCm ?? undefined,
      heightCm: sku.heightCm ?? undefined,
      volumeCbm: sku.volumeCbm ?? undefined,
    },
  ];
}

const STATUS_MAP: Record<string, { className: string; text: string }> = {
  上架: { className: 'master-pill-success', text: '上架' },
  下架可售: { className: 'master-pill-orange', text: '下架可售' },
  下架不可售: { className: 'master-pill-default', text: '下架不可售' },
  临拓: { className: 'master-pill-blue', text: '临拓' },
};

export default function SkuDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id = '' } = useParams();
  const skuId = Number(id);
  const [activeAnchor, setActiveAnchor] = useState('basic');

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

  const sku = query.data;
  const statusInfo = STATUS_MAP[sku?.status ?? ''] ?? { className: 'master-pill-default', text: sku?.status ?? '—' };
  const packagingRows = sku ? parsePackagingList(sku) : [];
  const categoryTree = categoryTreeQuery.data ?? [];
  const level3Node = sku?.categoryLevel3Id ? findCategoryNode(categoryTree, sku.categoryLevel3Id) : undefined;

  const imageUrls: string[] = (() => {
    if (sku?.productImageUrls) {
      try {
        return JSON.parse(sku.productImageUrls);
      } catch {
        // noop
      }
    }
    if (sku?.productImageUrl) return [sku.productImageUrl];
    return [];
  })();

  const categoryPath = spuQuery.data
    ? [spuQuery.data.categoryLevel1Code, spuQuery.data.categoryLevel2Code, spuQuery.data.categoryLevel3Code]
        .filter(Boolean)
        .join(' / ') || '—'
    : '—';

  const matchedCertificates = useMemo(() => {
    if (!sku || !certificatesQuery.data) return [];
    return certificatesQuery.data.list.filter(
      (cert) =>
        cert.spus.some((item) => item.id === sku.spuId) ||
        (sku.categoryLevel3Id && cert.categoryId === sku.categoryLevel3Id) ||
        cert.attributionType === '通用归属',
    );
  }, [sku, certificatesQuery.data]);

  const operationRecords = [
    ...(sku?.updatedAt
      ? [
          {
            key: 'updated',
            operator: displayOrDash(sku.updatedBy),
            action: '更新记录',
            time: dayjs(sku.updatedAt).format('YYYY-MM-DD HH:mm'),
          },
        ]
      : []),
    ...(sku?.createdAt
      ? [
          {
            key: 'created',
            operator: displayOrDash(sku.createdBy),
            action: '创建记录',
            time: dayjs(sku.createdAt).format('YYYY-MM-DD HH:mm'),
          },
        ]
      : []),
  ];

  const anchors = [
    { key: 'basic', label: '基本信息' },
    { key: 'spec', label: '规格参数' },
    { key: 'images', label: '产品图片' },
    { key: 'packaging', label: '包装信息' },
    { key: 'customs', label: '报关信息' },
    { key: 'owner', label: '负责人信息' },
    { key: 'certs', label: '证书资料' },
    { key: 'operation', label: '操作记录' },
  ];

  const certColumns: ColumnsType<Certificate> = [
    { title: '证书编号', dataIndex: 'certificateNo', width: 160 },
    { title: '证书名称', dataIndex: 'certificateName' },
    { title: '证书类型', dataIndex: 'certificateType', width: 140 },
    {
      title: '有效期区间',
      width: 220,
      render: (_: unknown, record: Certificate) => {
        const from = record.validFrom ? dayjs(record.validFrom).format('YYYY-MM-DD') : '—';
        const until = record.validUntil ? dayjs(record.validUntil).format('YYYY-MM-DD') : '—';
        return `${from} ~ ${until}`;
      },
    },
    {
      title: '状态',
      width: 100,
      render: (_: unknown, record: Certificate) => (record.status === 'valid' ? '有效' : '过期'),
    },
    {
      title: '归属类型',
      dataIndex: 'attributionType',
      width: 120,
      render: (value: string | null) => displayOrDash(value),
    },
  ];

  const packagingColumns: ColumnsType<PackagingRow & { key: number }> = [
    { title: '包装类型', dataIndex: 'packagingType', render: (value) => displayOrDash(value) },
    { title: '数量', dataIndex: 'packagingQty', render: (value) => (value ?? '—') },
    { title: '净重(KG)', dataIndex: 'weightKg', render: (value) => (value ?? '—') },
    { title: '毛重(KG)', dataIndex: 'grossWeightKg', render: (value) => (value ?? '—') },
    { title: '长(CM)', dataIndex: 'lengthCm', render: (value) => (value ?? '—') },
    { title: '宽(CM)', dataIndex: 'widthCm', render: (value) => (value ?? '—') },
    { title: '高(CM)', dataIndex: 'heightCm', render: (value) => (value ?? '—') },
    { title: '体积(CBM)', dataIndex: 'volumeCbm', render: (value) => (value ?? '—') },
  ];

  return (
    <div className="master-page">
      <div className="master-summary-card">
        {query.isLoading && !sku ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          <>
            <div className="master-summary-code">{displayOrDash(sku?.skuCode)}</div>
            <div className="master-summary-header">
              <div className="master-summary-title-wrap">
                <div className="master-summary-title-row">
                  <div className="master-summary-title">{displayOrDash(sku?.skuCode)}</div>
                  <span className={`master-pill ${statusInfo.className}`}>{statusInfo.text}</span>
                </div>
              </div>
              <div className="master-summary-actions">
                <Button onClick={() => navigate(`/master-data/skus/${id}/edit`)}>编辑</Button>
                <Button danger onClick={handleDelete} loading={deleteMutation.isPending}>删除</Button>
              </div>
            </div>
            <div className="master-summary-meta">
              <SummaryMetaItem label="所属 SPU" value={displayOrDash(spuQuery.data?.name)} />
              <SummaryMetaItem label="分类路径" value={categoryPath} />
              <SummaryMetaItem label="产品型号" value={displayOrDash(sku?.productModel)} />
              <SummaryMetaItem label="规格描述" value={displayOrDash(sku?.specification)} />
            </div>
          </>
        )}
      </div>

      <div className="master-detail-layout">
        <AnchorNav anchors={anchors} activeKey={activeAnchor} onChange={setActiveAnchor} />

        <div className="master-detail-main">
          <SectionCard
            id="basic"
            title="基本信息"
            description="展示 SKU 标识、SPU 归属、分类路径与产品命名信息。"
          >
            {query.isLoading && !sku ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : (
              <div className="master-meta-grid">
                <MetaItem label="SKU 编码" value={displayOrDash(sku?.skuCode)} />
                <MetaItem label="状态" value={statusInfo.text} />
                <MetaItem label="所属 SPU" value={displayOrDash(spuQuery.data?.name)} />
                <MetaItem label="分类路径" value={categoryPath} />
                <MetaItem label="产品型号" value={displayOrDash(sku?.productModel)} />
                <MetaItem label="中文名称" value={displayOrDash(sku?.nameCn)} />
                <MetaItem label="英文名称" value={displayOrDash(sku?.nameEn)} />
                <MetaItem label="规格描述" value={displayOrDash(sku?.specification)} full />
              </div>
            )}
          </SectionCard>

          <SectionCard
            id="spec"
            title="规格参数"
            description="统一承载产品属性、电参数、用途及经营限制信息。"
          >
            {query.isLoading && !sku ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : (
              <div className="master-meta-grid">
                <MetaItem label="产品类型" value={displayOrDash(sku?.productType)} />
                <MetaItem label="工作原理" value={displayOrDash(sku?.principle)} />
                <MetaItem label="材质" value={displayOrDash(sku?.material)} />
                <MetaItem label="是否含插头" value={sku?.hasPlug === null || sku?.hasPlug === undefined ? '—' : sku.hasPlug ? '是' : '否'} />
                <MetaItem label="客户质保期（月）" value={sku?.customerWarrantyMonths ?? '—'} />
                <MetaItem label="特殊属性" value={displayOrDash(sku?.specialAttributes)} />
                <MetaItem label="特殊属性说明" value={displayOrDash(sku?.specialAttributesNote)} full />
                <MetaItem label="核心参数" value={displayOrDash(sku?.coreParams)} full />
                <MetaItem label="电参数" value={displayOrDash(sku?.electricalParams)} full />
                <MetaItem label="产品用途" value={displayOrDash(sku?.productUsage)} full />
                <MetaItem label="禁止经营国家" value={displayOrDash(sku?.forbiddenCountries)} full />
              </div>
            )}
          </SectionCard>

          <SectionCard
            id="images"
            title="产品图片"
            description="保留图片预览能力，并与统一详情视觉保持一致。"
          >
            {query.isLoading && !sku ? (
              <Skeleton active paragraph={{ rows: 3 }} />
            ) : imageUrls.length > 0 ? (
              <Image.PreviewGroup>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {imageUrls.map((url, index) => (
                    <Image key={`${url}-${index}`} width={120} src={url} />
                  ))}
                </div>
              </Image.PreviewGroup>
            ) : (
              <div className="master-meta-value empty">—</div>
            )}
          </SectionCard>

          <SectionCard
            id="packaging"
            title="包装信息"
            description="包装数据展示方式统一为表格区块，便于快速扫描。"
            bodyClassName="master-section-table"
          >
            {query.isLoading && !sku ? (
              <div className="master-info-body">
                <Skeleton active paragraph={{ rows: 4 }} />
              </div>
            ) : packagingRows.length ? (
              <>
                <div className="master-table-shell">
                  <Table
                    rowKey="key"
                    size="small"
                    pagination={false}
                    columns={packagingColumns}
                    dataSource={packagingRows.map((row, index) => ({ ...row, key: index }))}
                  />
                </div>
                <div className="master-info-tip" style={{ margin: '12px 20px 20px' }}>
                  包装体积字段为业务维护值，非详情页实时计算。
                </div>
              </>
            ) : (
              <div className="master-info-body">
                <div className="master-meta-value empty">—</div>
              </div>
            )}
          </SectionCard>

          <SectionCard
            id="customs"
            title="报关信息"
            description="集中查看 HS 码、品名、申报价值与监管字段。"
          >
            {query.isLoading && !sku ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : (
              <div className="master-meta-grid">
                <MetaItem label="HS 码" value={displayOrDash(sku?.hsCode)} />
                <MetaItem label="报关中文品名" value={displayOrDash(sku?.customsNameCn)} />
                <MetaItem label="报关英文品名" value={displayOrDash(sku?.customsNameEn)} />
                <MetaItem label="申报价值参考（USD）" value={sku?.declaredValueRef ?? '—'} />
                <MetaItem label="是否需要检验" value={sku?.isInspectionRequired === null || sku?.isInspectionRequired === undefined ? '—' : sku.isInspectionRequired ? '是' : '否'} />
                <MetaItem label="退税率（%）" value={sku?.taxRefundRate ?? '—'} />
                <MetaItem label="报关信息是否维护" value={sku?.customsInfoMaintained === null || sku?.customsInfoMaintained === undefined ? '—' : sku.customsInfoMaintained ? '是' : '否'} />
                <MetaItem label="监管条件" value={displayOrDash(sku?.regulatoryConditions)} full />
                <MetaItem label="申报要素" value={displayOrDash(sku?.declarationElements)} full />
              </div>
            )}
          </SectionCard>

          <SectionCard
            id="owner"
            title="负责人信息"
            description="负责人来源于三级分类配置，详情页仅做引用展示。"
          >
            {query.isLoading && !sku ? (
              <Skeleton active paragraph={{ rows: 2 }} />
            ) : (
              <>
                <div className="master-meta-grid">
                  <MetaItem label="采购负责人" value={displayOrDash(level3Node?.purchaseOwner)} />
                  <MetaItem label="产品负责人" value={displayOrDash(level3Node?.productOwner)} />
                </div>
                <div className="master-info-tip">负责人信息来源于产品三级分类配置，如需修改请前往产品分类管理。</div>
              </>
            )}
          </SectionCard>

          <SectionCard
            id="certs"
            title="证书资料"
            description="自动汇总与当前 SKU/SPU 或分类关联的证书信息。"
            bodyClassName="master-section-table"
          >
            {query.isLoading && !sku ? (
              <div className="master-info-body">
                <Skeleton active paragraph={{ rows: 4 }} />
              </div>
            ) : matchedCertificates.length ? (
              <div className="master-table-shell">
                <Table
                  rowKey="id"
                  size="small"
                  pagination={false}
                  columns={certColumns}
                  dataSource={matchedCertificates}
                />
              </div>
            ) : (
              <div className="master-info-body">
                <div className="master-meta-value empty">—</div>
              </div>
            )}
          </SectionCard>

          <SectionCard
            id="operation"
            title="操作记录"
            description="按时间展示 SKU 主数据的创建与维护轨迹。"
          >
            {query.isLoading && !sku ? (
              <Skeleton active paragraph={{ rows: 3 }} />
            ) : (
              <OperationTimeline records={operationRecords} />
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
