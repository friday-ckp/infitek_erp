import { useState } from 'react';
import { Button, Modal, Result, Skeleton, Table, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { ActivityTimeline } from '../../../components/ActivityTimeline';
import { deleteCertificate, getCertificateById, type CertificateSpu } from '../../../api/certificates.api';
import { getProductCategoryTree } from '../../../api/product-categories.api';
import { findCategoryName } from '../../../utils/category';
import {
  AnchorNav,
  MetaItem,
  SectionCard,
  SummaryMetaItem,
  displayOrDash,
} from '../components/page-scaffold';
import '../master-page.css';

export default function CertificateDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id = '' } = useParams();
  const certId = Number(id);
  const [activeAnchor, setActiveAnchor] = useState('basic');

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
  const statusClass = data?.status === 'valid' ? 'master-pill-success' : 'master-pill-red';
  const statusText = data?.status === 'valid' ? '有效' : '已过期';
  const anchors = [
    { key: 'basic', label: '证书信息' },
    { key: 'spus', label: '关联 SPU' },
    { key: 'audit', label: '附件与审计' },
    { key: 'operation', label: '操作记录' },
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

  return (
    <div className="master-page">
      <div className="master-summary-card">
        {query.isLoading && !data ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          <>
            <div className="master-summary-code">{displayOrDash(data?.certificateNo)}</div>
            <div className="master-summary-header">
              <div className="master-summary-title-wrap">
                <div className="master-summary-title-row">
                  <div className="master-summary-title">{displayOrDash(data?.certificateName)}</div>
                  <span className={`master-pill ${statusClass}`}>{statusText}</span>
                </div>
              </div>
              <div className="master-summary-actions">
                <Button onClick={() => navigate(`/master-data/certificates/${id}/edit`)}>编辑</Button>
                <Button danger onClick={handleDelete} loading={deleteMutation.isPending}>删除</Button>
              </div>
            </div>
            <div className="master-summary-meta">
              <SummaryMetaItem label="证书类型" value={displayOrDash(data?.certificateType)} />
              <SummaryMetaItem label="有效期" value={validRange} />
              <SummaryMetaItem label="发证机构" value={displayOrDash(data?.issuingAuthority)} />
              <SummaryMetaItem label="归属类型" value={displayOrDash(data?.attributionType)} />
            </div>
          </>
        )}
      </div>

      <div className="master-detail-layout">
        <AnchorNav anchors={anchors} activeKey={activeAnchor} onChange={setActiveAnchor} />

        <div className="master-detail-main">
          <SectionCard
            id="basic"
            title="证书信息"
            description="统一展示证书主体、有效期、归属类型和说明字段。"
          >
            {query.isLoading && !data ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : (
              <div className="master-meta-grid">
                <MetaItem label="证书编号" value={displayOrDash(data?.certificateNo)} />
                <MetaItem label="证书名称" value={displayOrDash(data?.certificateName)} />
                <MetaItem label="证书类型" value={displayOrDash(data?.certificateType)} />
                <MetaItem label="状态" value={<span className={`master-pill ${statusClass}`}>{statusText}</span>} />
                <MetaItem label="指令法规" value={displayOrDash(data?.directive)} />
                <MetaItem label="归属类型" value={displayOrDash(data?.attributionType)} />
                <MetaItem label="发证机构" value={displayOrDash(data?.issuingAuthority)} />
                <MetaItem label="发证日期" value={displayOrDash(data?.issueDate)} />
                <MetaItem label="有效期区间" value={validRange} />
                <MetaItem label="所属产品分类" value={categoryName} />
                <MetaItem label="证书说明" value={displayOrDash(data?.remarks)} full />
              </div>
            )}
          </SectionCard>

          <SectionCard
            id="spus"
            title="关联 SPU"
            description="保留原有 SPU 关联查看能力，仅统一表格容器与说明样式。"
            bodyClassName="master-section-table"
          >
            {query.isLoading && !data ? (
              <div className="master-info-body">
                <Skeleton active paragraph={{ rows: 4 }} />
              </div>
            ) : data?.spus?.length ? (
              <>
                <div className="master-table-shell">
                  <Table
                    rowKey="id"
                    size="small"
                    pagination={false}
                    dataSource={data.spus}
                    columns={spuColumns}
                  />
                </div>
                <div className="master-info-tip" style={{ margin: '12px 20px 20px' }}>
                  关联数据来源于证书归属配置，详情页只读展示；如需修改请进入编辑页。
                </div>
              </>
            ) : (
              <div className="master-info-body">
                <div className="master-meta-value empty">—</div>
              </div>
            )}
          </SectionCard>

          <SectionCard
            id="audit"
            title="附件与审计"
            description="查看当前证书附件、创建更新信息与下载入口。"
          >
            {query.isLoading && !data ? (
              <Skeleton active paragraph={{ rows: 3 }} />
            ) : (
              <div className="master-meta-grid">
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
            )}
          </SectionCard>

          <SectionCard
            id="operation"
            title="操作记录"
            description="按时间展示证书资料的创建与更新轨迹。"
          >
            <ActivityTimeline resourceType="certificates" resourceId={certId} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
