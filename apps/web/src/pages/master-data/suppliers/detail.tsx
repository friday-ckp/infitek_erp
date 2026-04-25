import { useMemo, useState, type ReactNode } from 'react';
import { Button, Empty, Result, Skeleton, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
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
  { title: '每月结算日期', dataIndex: 'monthlySettlementDate', width: 120, render: (value) => displayOrDash(value) },
  { title: '结算日期类型', dataIndex: 'settlementDateType', width: 160, render: (value) => displayOrDash(value) },
];

function getStatusClass(status?: string) {
  if (!status) return 'master-pill-default';
  if (status === '合作') return 'master-pill-blue';
  if (status === '临拓') return 'master-pill-orange';
  if (status === '淘汰') return 'master-pill-red';
  return 'master-pill-default';
}

export default function SupplierDetailPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const supplierId = Number(id);
  const [activeAnchor, setActiveAnchor] = useState('basic');

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

  const anchors = [
    { key: 'basic', label: '基础信息' },
    { key: 'business', label: '商务信息' },
    { key: 'payment', label: '账期信息' },
    { key: 'audit', label: '审计信息' },
    { key: 'operation', label: '操作记录' },
  ];

  return (
    <div className="master-page">
      <div className="master-summary-card">
        {query.isLoading && !data ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          <>
            <div className="master-summary-code">{displayOrDash(data?.supplierCode)}</div>
            <div className="master-summary-header">
              <div className="master-summary-title-wrap">
                <div className="master-summary-title-row">
                  <div className="master-summary-title">{displayOrDash(data?.name)}</div>
                  <span className={`master-pill ${getStatusClass(data?.status)}`}>{displayOrDash(data?.status)}</span>
                </div>
              </div>
              <div className="master-summary-actions">
                <Button onClick={() => navigate(`/master-data/suppliers/${id}/edit`)}>编辑</Button>
              </div>
            </div>
            <div className="master-summary-meta">
              <div className="master-summary-meta-item">
                <div className="master-summary-meta-label">供应商简称</div>
                <div className="master-summary-meta-value">{displayOrDash(data?.shortName)}</div>
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
                  {displayOrDash(data?.paymentTerms?.[0]?.paymentTermName)}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="master-detail-layout">
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

        <div className="master-detail-main">
          <section id="basic" className="master-section-card">
            <div className="master-section-header">
              <div className="master-section-heading">
                <div className="master-section-title">基础信息</div>
                <div className="master-section-description">展示供应商主体、联系人与区域来源等核心信息。</div>
              </div>
            </div>
            <div className="master-section-body">
              {query.isLoading && !data ? (
                <Skeleton active paragraph={{ rows: 6 }} />
              ) : (
                <div className="master-meta-grid">
                  <MetaItem label="供应商名称" value={displayOrDash(data?.name)} />
                  <MetaItem label="供应商简称" value={displayOrDash(data?.shortName)} />
                  <MetaItem label="供应商编码" value={displayOrDash(data?.supplierCode)} />
                  <MetaItem label="联系人" value={displayOrDash(data?.contactPerson)} />
                  <MetaItem label="联系电话" value={displayOrDash(data?.contactPhone)} />
                  <MetaItem label="联系邮箱" value={displayOrDash(data?.contactEmail)} />
                  <MetaItem label="国家地区" value={displayOrDash(data?.countryName)} />
                  <MetaItem label="货源地" value={displayOrDash(data?.origin)} />
                  <MetaItem label="供应商等级" value={displayOrDash(data?.supplierLevel)} />
                  <MetaItem label="公司详细地址" value={displayOrDash(data?.address)} full />
                </div>
              )}
            </div>
          </section>

          <section id="business" className="master-section-card">
            <div className="master-section-header">
              <div className="master-section-heading">
                <div className="master-section-title">商务信息</div>
                <div className="master-section-description">统一管理合作状态、开票要求和返利、合同条款。</div>
              </div>
            </div>
            <div className="master-section-body">
              {query.isLoading && !data ? (
                <Skeleton active paragraph={{ rows: 5 }} />
              ) : (
                <div className="master-meta-grid">
                  <MetaItem
                    label="合作状态"
                    value={<span className={`master-pill ${getStatusClass(data?.status)}`}>{displayOrDash(data?.status)}</span>}
                  />
                  <MetaItem label="开票类型" value={displayOrDash(data?.invoiceType)} />
                  <MetaItem label="是否年度返点" value={data?.annualRebateEnabled ? '是' : '否'} />
                  <MetaItem label="合同范本" value={displayOrDash(data?.contractTemplateName)} />
                  <MetaItem label="合同框架文件" value={displayOrDash(data?.contractFrameworkFile)} full />
                  <MetaItem label="年度返利说明" value={displayOrDash(data?.annualRebateNote)} full />
                  <MetaItem label="合同条款" value={displayOrDash(data?.contractTerms)} full />
                </div>
              )}
            </div>
          </section>

          <section id="payment" className="master-section-card">
            <div className="master-section-header">
              <div className="master-section-heading">
                <div className="master-section-title">账期信息</div>
                <div className="master-section-description">按合作主体查看当前供应商的账期与结算方式。</div>
              </div>
            </div>
            <div className="master-section-body master-section-table">
              {query.isLoading && !data ? (
                <div className="master-info-body">
                  <Skeleton active paragraph={{ rows: 4 }} />
                </div>
              ) : (
                <div className="master-table-shell">
                  <Table<SupplierPaymentTerm>
                    rowKey={(record, index) => `${record.id ?? 'new'}-${index}`}
                    columns={paymentTermColumns}
                    dataSource={data?.paymentTerms ?? []}
                    pagination={false}
                    locale={{ emptyText: <Empty description="暂无账期信息" /> }}
                    scroll={{ x: 900 }}
                  />
                </div>
              )}
            </div>
          </section>

          <section id="audit" className="master-section-card">
            <div className="master-section-header">
              <div className="master-section-heading">
                <div className="master-section-title">审计信息</div>
                <div className="master-section-description">记录当前供应商资料的创建与最近维护情况。</div>
              </div>
            </div>
            <div className="master-section-body">
              {query.isLoading && !data ? (
                <Skeleton active paragraph={{ rows: 3 }} />
              ) : (
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
              )}
            </div>
          </section>

          <section id="operation" className="master-section-card">
            <div className="master-section-header">
              <div className="master-section-heading">
                <div className="master-section-title">操作记录</div>
                <div className="master-section-description">展示供应商档案的关键维护轨迹与操作时间。</div>
              </div>
            </div>
            <div className="master-section-body">
              {query.isLoading && !data ? (
                <Skeleton active paragraph={{ rows: 3 }} />
              ) : operationRecords.length ? (
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
          </section>
        </div>
      </div>
    </div>
  );
}
