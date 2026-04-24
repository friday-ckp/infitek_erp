import { useState, type ReactNode } from 'react';
import { Breadcrumb, Button, Input, Modal, Result, Skeleton, Space, Table, Tabs, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TabsProps } from 'antd/es/tabs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteSpu, getSpuById } from '../../../api/spus.api';
import { getProductCategoryTree } from '../../../api/product-categories.api';
import { findCategoryName } from '../../../utils/category';
import { getSkus, type Sku } from '../../../api/skus.api';
import SpuFaqTab from './components/SpuFaqTab';
import '../master-page.css';
import './spu-page.css';

function displayOrDash(value?: string | number | null): string {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

function MetaItem({ label, value, full = false }: { label: string; value: ReactNode; full?: boolean }) {
  return (
    <div className={`spu-meta-item${full ? ' full' : ''}`}>
      <div className="spu-meta-label">{label}</div>
      <div className={`spu-meta-value${value === '—' ? ' empty' : ''}`}>{value}</div>
    </div>
  );
}

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

  const data = query.data;
  const categoryName = data && categoryTreeQuery.data
    ? (findCategoryName(categoryTreeQuery.data, data.categoryId) || '—')
    : '—';
  const summaryStatusClass = data?.categoryId ? 'spu-pill-blue' : 'spu-pill-gray';
  const summaryStatusText = data?.categoryId ? '已分类' : '待分类';
  const operationRecords = [
    ...(data?.updatedAt
      ? [
          {
            key: 'updated',
            operator: displayOrDash(data.updatedBy),
            action: '更新记录',
            time: dayjs(data.updatedAt).format('YYYY-MM-DD HH:mm'),
          },
        ]
      : []),
    ...(data?.createdAt
      ? [
          {
            key: 'created',
            operator: displayOrDash(data.createdBy),
            action: '创建记录',
            time: dayjs(data.createdAt).format('YYYY-MM-DD HH:mm'),
          },
        ]
      : []),
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
      fixed: 'right' as const,
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

  const tabItems: TabsProps['items'] = [
    {
      key: 'basic',
      label: '基础信息',
      children: (
        <div className="spu-tab-body">
          <div className="spu-meta-grid">
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
        </div>
      ),
    },
    {
      key: 'supplier',
      label: '供应与开票',
      children: (
        <div className="spu-tab-body">
          <div className="spu-meta-grid">
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
        </div>
      ),
    },
    {
      key: 'sku',
      label: 'SKU 变体',
      children: (
        <div className="spu-tab-body">
          <div className="spu-table-toolbar">
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
            <Button
              type="dashed"
              onClick={() => navigate(`/master-data/skus/create?spuId=${spuId}`)}
            >
              + 新建 SKU
            </Button>
          </div>
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
          <div className="spu-info-tip">
            ℹ SKU 变体数据维护于 SKU 模块，当前标签页仅提供关联查看与快捷跳转。
          </div>
        </div>
      ),
    },
    {
      key: 'faq',
      label: 'FAQ',
      children: (
        <div className="spu-tab-body">
          <SpuFaqTab spuId={spuId} />
          <div className="spu-info-tip">
            ℹ FAQ 内容来源于 FAQ 维护模块，详情页用于快速查看关联问答数据。
          </div>
        </div>
      ),
    },
    {
      key: 'operation',
      label: '操作记录',
      children: (
        <div className="spu-tab-body">
          {operationRecords.length ? (
            <div className="master-status-timeline">
              {operationRecords.map((record, index) => (
                <div className="master-tl-item" key={record.key}>
                  <div className={`master-tl-dot${index === operationRecords.length - 1 ? ' gray' : ''}`} />
                  <div className="master-tl-content">
                    <div className="master-tl-operator">操作人：{record.operator}</div>
                    <div className="master-tl-action">操作记录：{record.action}</div>
                    <div className="master-tl-time">操作时间：{record.time}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="spu-meta-value empty">—</div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="spu-page">
      <Breadcrumb
        items={[
          {
            title: (
              <Button type="link" className="spu-breadcrumb-link" onClick={() => navigate('/master-data/spus')}>
                主数据
              </Button>
            ),
          },
          {
            title: (
              <Button type="link" className="spu-breadcrumb-link" onClick={() => navigate('/master-data/spus')}>
                SPU 管理
              </Button>
            ),
          },
          { title: data?.spuCode || '详情' },
        ]}
      />

      <div className="spu-summary-card">
        {query.isLoading && !data ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          <>
            <div className="spu-summary-header">
              <div className="spu-summary-title-wrap">
                <div className="spu-summary-code">{data?.spuCode || '—'}</div>
                <span className={`spu-pill ${summaryStatusClass}`}>{summaryStatusText}</span>
              </div>
              <div className="spu-summary-actions">
                <Button onClick={() => navigate(`/master-data/spus/${id}/edit`)}>编辑</Button>
                <Button danger onClick={handleDelete} loading={deleteMutation.isPending}>删除</Button>
              </div>
            </div>
            <div className="spu-summary-meta">
              <div className="spu-summary-meta-item">
                <div className="spu-summary-meta-label">SPU 名称</div>
                <div className="spu-summary-meta-value">{displayOrDash(data?.name)}</div>
              </div>
              <div className="spu-summary-meta-item">
                <div className="spu-summary-meta-label">所属分类</div>
                <div className="spu-summary-meta-value">{categoryName}</div>
              </div>
              <div className="spu-summary-meta-item">
                <div className="spu-summary-meta-label">单位</div>
                <div className="spu-summary-meta-value">{displayOrDash(data?.unit)}</div>
              </div>
              <div className="spu-summary-meta-item">
                <div className="spu-summary-meta-label">供应商</div>
                <div className="spu-summary-meta-value">{displayOrDash(data?.supplierName)}</div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="spu-info-card">
        {query.isLoading && !data ? (
          <div className="spu-tab-body">
            <Skeleton active paragraph={{ rows: 8 }} />
          </div>
        ) : (
          <Tabs className="spu-info-tabs" defaultActiveKey="basic" items={tabItems} />
        )}
      </div>
    </div>
  );
}
