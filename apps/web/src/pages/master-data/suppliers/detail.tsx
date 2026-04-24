import { useMemo, type ReactNode } from 'react';
import { Breadcrumb, Button, Empty, Result, Skeleton, Table, Tabs } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TabsProps } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { getSupplierById, type SupplierPaymentTerm } from '../../../api/suppliers.api';
import '../master-page.css';

function displayOrDash(value?: string | number | null): string {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

function MetaItem({ label, value, full = false }: { label: string; value: ReactNode; full?: boolean }) {
  return (
    <div className={`master-meta-item${full ? ' full' : ''}`}>
      <div className="master-meta-label">{label}</div>
      <div className={`master-meta-value${value === '—' ? ' empty' : ''}`}>{value}</div>
    </div>
  );
}

const paymentTermColumns: ColumnsType<SupplierPaymentTerm> = [
  { title: '合作主体', dataIndex: 'companyName', width: 180, render: (value) => displayOrDash(value) },
  { title: '账期名称', dataIndex: 'paymentTermName', width: 140, render: (value) => displayOrDash(value) },
  { title: '结算类型', dataIndex: 'settlementType', width: 140, render: (value) => displayOrDash(value) },
  { title: '结算N天付款', dataIndex: 'settlementDays', width: 130, render: (value) => displayOrDash(value) },
  {
    title: '每月结算日期',
    dataIndex: 'monthlySettlementDate',
    width: 120,
    render: (value) => displayOrDash(value),
  },
  {
    title: '结算日期类型',
    dataIndex: 'settlementDateType',
    width: 160,
    render: (value) => displayOrDash(value),
  },
];

export default function SupplierDetailPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const supplierId = Number(id);

  const query = useQuery({
    queryKey: ['supplier-detail', supplierId],
    queryFn: () => getSupplierById(supplierId),
    enabled: Number.isInteger(supplierId) && supplierId > 0,
  });

  if (!Number.isInteger(supplierId) || supplierId <= 0) {
    return (
      <Result
        status="404"
        title="供应商不存在"
        extra={<Button type="primary" onClick={() => navigate('/master-data/suppliers')}>返回列表</Button>}
      />
    );
  }

  if (query.isError && !query.data) {
    return (
      <Result
        status="error"
        title="供应商详情加载失败"
        subTitle="请检查网络或稍后重试"
        extra={[
          <Button key="retry" type="primary" onClick={() => query.refetch()}>重试</Button>,
          <Button key="back" onClick={() => navigate('/master-data/suppliers')}>返回列表</Button>,
        ]}
      />
    );
  }

  const data = query.data;

  const operationRecords = useMemo(
    () => [
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
    ],
    [data],
  );

  const tabItems: TabsProps['items'] = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <div className="master-info-body">
          <div className="master-meta-grid">
            <MetaItem label="供应商名称" value={displayOrDash(data?.name)} />
            <MetaItem label="供应商简称" value={displayOrDash(data?.shortName)} />
            <MetaItem label="供应商编码" value={displayOrDash(data?.supplierCode)} />
            <MetaItem label="联系人" value={displayOrDash(data?.contactPerson)} />
            <MetaItem label="联系电话" value={displayOrDash(data?.contactPhone)} />
            <MetaItem label="联系邮箱" value={displayOrDash(data?.contactEmail)} />
            <MetaItem label="公司详细地址" value={displayOrDash(data?.address)} full />
            <MetaItem label="国家地区" value={displayOrDash(data?.countryName)} />
            <MetaItem label="货源地" value={displayOrDash(data?.origin)} />
            <MetaItem label="供应商等级" value={displayOrDash(data?.supplierLevel)} />
          </div>
        </div>
      ),
    },
    {
      key: 'business',
      label: '商务条件',
      children: (
        <div className="master-info-body">
          <div className="master-meta-grid">
            <MetaItem label="合作状态" value={displayOrDash(data?.status)} />
            <MetaItem label="开票类型" value={displayOrDash(data?.invoiceType)} />
            <MetaItem label="是否年度返点" value={data?.annualRebateEnabled ? '是' : '否'} />
            <MetaItem label="年度返利说明" value={displayOrDash(data?.annualRebateNote)} full />
            <MetaItem label="合同框架文件" value={displayOrDash(data?.contractFrameworkFile)} full />
            <MetaItem label="合同范本" value={displayOrDash(data?.contractTemplateName)} />
            <MetaItem label="合同条款" value={displayOrDash(data?.contractTerms)} full />
          </div>
        </div>
      ),
    },
    {
      key: 'paymentTerms',
      label: '账期信息',
      children: (
        <div className="master-info-body">
          <Table<SupplierPaymentTerm>
            rowKey={(record, index) => `${record.id ?? 'new'}-${index}`}
            columns={paymentTermColumns}
            dataSource={data?.paymentTerms ?? []}
            pagination={false}
            locale={{
              emptyText: <Empty description="暂无账期信息" />,
            }}
            scroll={{ x: 900 }}
          />
        </div>
      ),
    },
    {
      key: 'orders',
      label: '关联采购订单',
      children: (
        <div className="master-info-body">
          <div className="master-info-tip">采购订单列表将在 Epic 6 落地后提供。</div>
        </div>
      ),
    },
    {
      key: 'audit',
      label: '审计信息',
      children: (
        <div className="master-info-body">
          <div className="master-meta-grid">
            <MetaItem
              label="创建时间"
              value={data?.createdAt ? dayjs(data.createdAt).format('YYYY-MM-DD HH:mm') : '—'}
            />
            <MetaItem
              label="更新时间"
              value={data?.updatedAt ? dayjs(data.updatedAt).format('YYYY-MM-DD HH:mm') : '—'}
            />
            <MetaItem label="创建人" value={displayOrDash(data?.createdBy)} />
            <MetaItem label="更新人" value={displayOrDash(data?.updatedBy)} />
          </div>
        </div>
      ),
    },
    {
      key: 'operation',
      label: '操作记录',
      children: (
        <div className="master-info-body">
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
            <div className="master-meta-value empty">—</div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="master-page">
      <Breadcrumb
        items={[
          {
            title: (
              <Button type="link" className="master-breadcrumb-link" onClick={() => navigate('/master-data/suppliers')}>
                主数据
              </Button>
            ),
          },
          {
            title: (
              <Button type="link" className="master-breadcrumb-link" onClick={() => navigate('/master-data/suppliers')}>
                供应商档案管理
              </Button>
            ),
          },
          { title: data?.name || '详情' },
        ]}
      />

      <div className="master-summary-card">
        {query.isLoading && !data ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          <>
            <div className="master-summary-header">
              <div className="master-summary-title-wrap">
                <div className="master-summary-title">{displayOrDash(data?.name)}</div>
                <span className="master-pill master-pill-blue">{displayOrDash(data?.status)}</span>
              </div>
              <div className="master-summary-actions">
                <Button onClick={() => navigate(`/master-data/suppliers/${id}/edit`)}>编辑</Button>
              </div>
            </div>
            <div className="master-summary-meta">
              <div className="master-summary-meta-item">
                <div className="master-summary-meta-label">供应商编码</div>
                <div className="master-summary-meta-value">{displayOrDash(data?.supplierCode)}</div>
              </div>
              <div className="master-summary-meta-item">
                <div className="master-summary-meta-label">联系人</div>
                <div className="master-summary-meta-value">{displayOrDash(data?.contactPerson)}</div>
              </div>
              <div className="master-summary-meta-item">
                <div className="master-summary-meta-label">联系电话</div>
                <div className="master-summary-meta-value">{displayOrDash(data?.contactPhone)}</div>
              </div>
              <div className="master-summary-meta-item">
                <div className="master-summary-meta-label">账期名称</div>
                <div className="master-summary-meta-value">
                  {displayOrDash(data?.paymentTerms[0]?.paymentTermName)}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="master-info-card">
        {query.isLoading && !data ? (
          <div className="master-info-body">
            <Skeleton active paragraph={{ rows: 8 }} />
          </div>
        ) : (
          <Tabs className="master-info-tabs" defaultActiveKey="basic" items={tabItems} />
        )}
      </div>
    </div>
  );
}
