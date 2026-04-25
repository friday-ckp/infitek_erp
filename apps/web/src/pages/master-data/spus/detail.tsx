import { useState } from 'react';
import { Button, Input, Modal, Result, Skeleton, Space, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { ActivityTimeline } from '../../../components/ActivityTimeline';
import { deleteSpu, getSpuById } from '../../../api/spus.api';
import { getProductCategoryTree } from '../../../api/product-categories.api';
import { findCategoryName } from '../../../utils/category';
import { getSkus, type Sku } from '../../../api/skus.api';
import {
  AnchorNav,
  MetaItem,
  SectionCard,
  SummaryMetaItem,
  displayOrDash,
} from '../components/page-scaffold';
import SpuFaqTab from './components/SpuFaqTab';
import '../master-page.css';

export default function SpuDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id = '' } = useParams();
  const spuId = Number(id);
  const [activeAnchor, setActiveAnchor] = useState('basic');

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

  const data = query.data;
  const categoryName = data && categoryTreeQuery.data
    ? (findCategoryName(categoryTreeQuery.data, data.categoryId) || '—')
    : '—';
  const summaryStatusClass = data?.categoryId ? 'master-pill-blue' : 'master-pill-default';
  const summaryStatusText = data?.categoryId ? '已分类' : '待分类';
  const anchors = [
    { key: 'basic', label: '基础信息' },
    { key: 'supplier', label: '供应与开票' },
    { key: 'sku', label: 'SKU 变体' },
    { key: 'faq', label: 'FAQ' },
    { key: 'operation', label: '操作记录' },
  ];

  const skuColumns: ColumnsType<Sku> = [
    {
      title: 'SKU 编码',
      dataIndex: 'skuCode',
      width: 160,
      render: (_: unknown, record: Sku) => (
        <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/master-data/skus/${record.id}`)}>
          {record.skuCode}
        </Button>
      ),
    },
    { title: '规格描述', dataIndex: 'specification', ellipsis: true },
    { title: 'HS 码', dataIndex: 'hsCode', width: 140 },
    { title: '净重(KG)', dataIndex: 'weightKg', width: 110 },
    { title: '体积(CBM)', dataIndex: 'volumeCbm', width: 120 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (_: unknown, record: Sku) =>
        record.status === 'active' ? <Tag color="success">启用</Tag> : <Tag>停用</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      fixed: 'right',
      render: (_: unknown, record: Sku) => (
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

  return (
    <div className="master-page">
      <div className="master-summary-card">
        {query.isLoading && !data ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          <>
            <div className="master-summary-code">{displayOrDash(data?.spuCode)}</div>
            <div className="master-summary-header">
              <div className="master-summary-title-wrap">
                <div className="master-summary-title-row">
                  <div className="master-summary-title">{displayOrDash(data?.name)}</div>
                  <span className={`master-pill ${summaryStatusClass}`}>{summaryStatusText}</span>
                </div>
              </div>
              <div className="master-summary-actions">
                <Button onClick={() => navigate(`/master-data/spus/${id}/edit`)}>编辑</Button>
                <Button danger onClick={handleDelete} loading={deleteMutation.isPending}>删除</Button>
              </div>
            </div>
            <div className="master-summary-meta">
              <SummaryMetaItem label="所属分类" value={categoryName} />
              <SummaryMetaItem label="单位" value={displayOrDash(data?.unit)} />
              <SummaryMetaItem label="供应商" value={displayOrDash(data?.supplierName)} />
              <SummaryMetaItem label="开票品名" value={displayOrDash(data?.invoiceName)} />
            </div>
          </>
        )}
      </div>

      <div className="master-detail-layout">
        <AnchorNav anchors={anchors} activeKey={activeAnchor} onChange={setActiveAnchor} />

        <div className="master-detail-main">
          <SectionCard
            id="basic"
            title="基础信息"
            description="展示 SPU 主体标识、分类归属与基础编码信息。"
          >
            {query.isLoading && !data ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : (
              <div className="master-meta-grid">
                <MetaItem label="SPU 编码" value={displayOrDash(data?.spuCode)} />
                <MetaItem label="SPU 名称" value={displayOrDash(data?.name)} />
                <MetaItem label="所属分类" value={categoryName} />
                <MetaItem label="单位" value={displayOrDash(data?.unit)} />
                <MetaItem label="一级分类编号" value={displayOrDash(data?.categoryLevel1Code)} />
                <MetaItem label="二级分类编号" value={displayOrDash(data?.categoryLevel2Code)} />
                <MetaItem label="三级分类编号" value={displayOrDash(data?.categoryLevel3Code)} />
                <MetaItem label="创建时间" value={data?.createdAt ? dayjs(data.createdAt).format('YYYY-MM-DD HH:mm') : '—'} />
                <MetaItem label="更新时间" value={data?.updatedAt ? dayjs(data.updatedAt).format('YYYY-MM-DD HH:mm') : '—'} />
              </div>
            )}
          </SectionCard>

          <SectionCard
            id="supplier"
            title="供应与开票"
            description="统一查看供应、质保、开票与经营限制信息。"
          >
            {query.isLoading && !data ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : (
              <div className="master-meta-grid">
                <MetaItem label="供应商" value={displayOrDash(data?.supplierName)} />
                <MetaItem label="厂家型号" value={displayOrDash(data?.manufacturerModel)} />
                <MetaItem label="客户质保期(月)" value={displayOrDash(data?.customerWarrantyMonths)} />
                <MetaItem label="采购质保期(月)" value={displayOrDash(data?.purchaseWarrantyMonths)} />
                <MetaItem label="开票品名" value={displayOrDash(data?.invoiceName)} />
                <MetaItem label="开票单位" value={displayOrDash(data?.invoiceUnit)} />
                <MetaItem label="开票型号" value={displayOrDash(data?.invoiceModel)} />
                <MetaItem label="公司主体 ID" value={displayOrDash(data?.companyId)} />
                <MetaItem label="禁止经营国家" value={displayOrDash(data?.forbiddenCountries)} full />
                <MetaItem label="供应商质保说明" value={displayOrDash(data?.supplierWarrantyNote)} full />
              </div>
            )}
          </SectionCard>

          <SectionCard
            id="sku"
            title="SKU 变体"
            description="保留原有 SKU 关联查看与跳转能力，仅统一界面结构。"
            bodyClassName="master-section-table"
            extra={(
              <Button type="dashed" onClick={() => navigate(`/master-data/skus/create?spuId=${spuId}`)}>
                + 新建 SKU
              </Button>
            )}
          >
            <div style={{ padding: '16px 20px 0' }}>
              <Input
                placeholder="搜索 SKU 编码/规格..."
                style={{ width: 260 }}
                value={skuKeyword}
                onChange={(e) => {
                  setSkuKeyword(e.target.value);
                  setSkuPage(1);
                }}
                allowClear
              />
            </div>
            <div className="master-table-shell" style={{ marginTop: 16 }}>
              <Table<Sku>
                rowKey="id"
                size="small"
                loading={skusQuery.isFetching}
                columns={skuColumns}
                dataSource={skusQuery.data?.list ?? []}
                scroll={{ x: 980 }}
                pagination={{
                  current: skuPage,
                  pageSize: skuPageSize,
                  total: skusQuery.data?.total ?? 0,
                  showSizeChanger: true,
                  pageSizeOptions: [10, 20, 50],
                  showTotal: (total) => `共 ${total} 条`,
                  onChange: (page, pageSize) => {
                    if (pageSize !== skuPageSize) {
                      setSkuPage(1);
                    } else {
                      setSkuPage(page);
                    }
                    setSkuPageSize(pageSize);
                  },
                }}
              />
            </div>
            <div className="master-info-tip" style={{ margin: '12px 20px 20px' }}>
              SKU 变体数据维护于 SKU 模块，当前区域仅提供关联查看与快捷跳转。
            </div>
          </SectionCard>

          <SectionCard
            id="faq"
            title="FAQ"
            description="展示与当前 SPU 关联的常见问题与答案。"
            bodyClassName="master-section-table"
          >
            <div style={{ padding: '16px 20px 20px' }}>
              <SpuFaqTab spuId={spuId} />
              <div className="master-info-tip">FAQ 内容来源于 FAQ 维护模块，详情页用于快速查看关联问答数据。</div>
            </div>
          </SectionCard>

          <SectionCard
            id="operation"
            title="操作记录"
            description="按时间展示 SPU 主数据的创建与更新轨迹。"
          >
            <ActivityTimeline resourceType="spus" resourceId={spuId} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
