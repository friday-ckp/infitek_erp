import type { ReactNode } from 'react';
import { Breadcrumb, Button, Modal, Result, Skeleton, Table, Tabs, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TabsProps } from 'antd/es/tabs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteCertificate, getCertificateById, type CertificateSpu } from '../../../api/certificates.api';
import { getProductCategoryTree } from '../../../api/product-categories.api';
import { findCategoryName } from '../../../utils/category';
import '../master-page.css';
import './certificate-page.css';

function displayOrDash(value?: string | number | null): string {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

function MetaItem({ label, value, full = false }: { label: string; value: ReactNode; full?: boolean }) {
  return (
    <div className={`certificate-meta-item${full ? ' full' : ''}`}>
      <div className="certificate-meta-label">{label}</div>
      <div className={`certificate-meta-value${value === '—' ? ' empty' : ''}`}>{value}</div>
    </div>
  );
}

export default function CertificateDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id = '' } = useParams();
  const certId = Number(id);

  const query = useQuery({
    queryKey: ['certificate-detail', certId],
    queryFn: () => getCertificateById(certId),
    enabled: Number.isInteger(certId) && certId > 0,
  });

  const categoryTreeQuery = useQuery({
    queryKey: ['product-category-tree'],
    queryFn: getProductCategoryTree,
    staleTime: 5 * 60 * 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCertificate(certId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      message.success('证书已删除');
      navigate('/master-data/certificates');
    },
  });

  if (!Number.isInteger(certId) || certId <= 0) {
    return (
      <Result
        status="404"
        title="证书不存在"
        extra={<Button type="primary" onClick={() => navigate('/master-data/certificates')}>返回列表</Button>}
      />
    );
  }

  if (query.isError && !query.data) {
    return (
      <Result
        status="error"
        title="证书详情加载失败"
        subTitle="请检查网络或稍后重试"
        extra={[
          <Button key="retry" type="primary" onClick={() => query.refetch()}>重试</Button>,
          <Button key="back" onClick={() => navigate('/master-data/certificates')}>返回列表</Button>,
        ]}
      />
    );
  }

  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除证书「${query.data?.certificateName}」吗？删除后文件将从云存储永久删除，无法恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => deleteMutation.mutateAsync(),
    });
  };

  const data = query.data;
  const categoryName = data?.categoryId && categoryTreeQuery.data
    ? findCategoryName(categoryTreeQuery.data, data.categoryId)
    : '—';
  const validRange = data ? `${displayOrDash(data.validFrom)} ~ ${displayOrDash(data.validUntil)}` : '—';
  const statusClass = data?.status === 'valid' ? 'certificate-pill-success' : 'certificate-pill-error';
  const statusText = data?.status === 'valid' ? '有效' : '已过期';
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

  const spuColumns: ColumnsType<CertificateSpu> = [
    {
      title: 'SPU 编码',
      dataIndex: 'spuCode',
      width: 160,
      render: (_: unknown, row: CertificateSpu) => (
        <Button
          type="link"
          style={{ padding: 0 }}
          onClick={() => navigate(`/master-data/spus/${row.id}`)}
        >
          {row.spuCode}
        </Button>
      ),
    },
    { title: 'SPU 名称', dataIndex: 'name' },
  ];

  const tabItems: TabsProps['items'] = [
    {
      key: 'basic',
      label: '证书信息',
      children: (
        <div className="certificate-tab-body">
          <div className="certificate-meta-grid">
            <MetaItem label="证书编号" value={displayOrDash(data?.certificateNo)} />
            <MetaItem label="证书名称" value={displayOrDash(data?.certificateName)} />
            <MetaItem label="证书类型" value={displayOrDash(data?.certificateType)} />
            <MetaItem
              label="状态"
              value={<span className={`certificate-pill ${statusClass}`}>{statusText}</span>}
            />
            <MetaItem label="指令法规" value={displayOrDash(data?.directive)} />
            <MetaItem label="归属类型" value={displayOrDash(data?.attributionType)} />
            <MetaItem label="发证机构" value={displayOrDash(data?.issuingAuthority)} />
            <MetaItem label="发证日期" value={displayOrDash(data?.issueDate)} />
            <MetaItem label="有效期区间" value={validRange} />
            <MetaItem label="所属产品分类" value={categoryName} />
            <MetaItem label="证书说明" value={displayOrDash(data?.remarks)} full />
          </div>
        </div>
      ),
    },
    {
      key: 'spus',
      label: '关联 SPU',
      children: (
        <div className="certificate-tab-body">
          {data?.spus?.length ? (
            <div className="certificate-data-table">
              <Table
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={data.spus}
                columns={spuColumns}
              />
              <div className="certificate-data-table-footer">共 {data.spus.length} 条记录</div>
            </div>
          ) : (
            <div className="certificate-meta-value empty">—</div>
          )}
          <div className="certificate-info-tip">
            ℹ 关联数据来源于证书归属配置，详情页只读展示；如需修改请进入编辑页。
          </div>
        </div>
      ),
    },
    {
      key: 'audit',
      label: '附件与审计',
      children: (
        <div className="certificate-tab-body">
          <div className="certificate-meta-grid">
            <MetaItem
              label="证书文件"
              value={
                data?.fileUrl ? (
                  <Button type="link" style={{ padding: 0 }} onClick={() => window.open(data.fileUrl!, '_blank')}>
                    {data.fileName || '下载证书'}
                  </Button>
                ) : (
                  '—'
                )
              }
            />
            <MetaItem label="文件名" value={displayOrDash(data?.fileName)} />
            <MetaItem label="创建时间" value={data?.createdAt ? dayjs(data.createdAt).format('YYYY-MM-DD HH:mm') : '—'} />
            <MetaItem label="更新时间" value={data?.updatedAt ? dayjs(data.updatedAt).format('YYYY-MM-DD HH:mm') : '—'} />
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
        <div className="certificate-tab-body">
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
            <div className="certificate-meta-value empty">—</div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="certificate-page">
      <Breadcrumb
        items={[
          {
            title: (
              <Button
                type="link"
                className="certificate-breadcrumb-link"
                onClick={() => navigate('/master-data/certificates')}
              >
                主数据
              </Button>
            ),
          },
          {
            title: (
              <Button
                type="link"
                className="certificate-breadcrumb-link"
                onClick={() => navigate('/master-data/certificates')}
              >
                产品证书库
              </Button>
            ),
          },
          { title: data?.certificateNo || '详情' },
        ]}
      />

      <div className="certificate-summary-card">
        {query.isLoading && !data ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          <>
            <div className="certificate-summary-header">
              <div className="certificate-summary-title-wrap">
                <div className="certificate-summary-code">{data?.certificateNo || '—'}</div>
                <span className={`certificate-pill ${statusClass}`}>{statusText}</span>
              </div>
              <div className="certificate-summary-actions">
                <Button onClick={() => navigate(`/master-data/certificates/${id}/edit`)}>编辑</Button>
                <Button danger onClick={handleDelete} loading={deleteMutation.isPending}>删除</Button>
              </div>
            </div>
            <div className="certificate-summary-meta">
              <div className="certificate-summary-meta-item">
                <div className="certificate-summary-meta-label">证书名称</div>
                <div className="certificate-summary-meta-value">{displayOrDash(data?.certificateName)}</div>
              </div>
              <div className="certificate-summary-meta-item">
                <div className="certificate-summary-meta-label">证书类型</div>
                <div className="certificate-summary-meta-value">{displayOrDash(data?.certificateType)}</div>
              </div>
              <div className="certificate-summary-meta-item">
                <div className="certificate-summary-meta-label">有效期</div>
                <div className="certificate-summary-meta-value">{validRange}</div>
              </div>
              <div className="certificate-summary-meta-item">
                <div className="certificate-summary-meta-label">发证机构</div>
                <div className="certificate-summary-meta-value">{displayOrDash(data?.issuingAuthority)}</div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="certificate-info-card">
        {query.isLoading && !data ? (
          <div className="certificate-tab-body">
            <Skeleton active paragraph={{ rows: 8 }} />
          </div>
        ) : (
          <Tabs className="certificate-info-tabs" defaultActiveKey="basic" items={tabItems} />
        )}
      </div>
    </div>
  );
}
