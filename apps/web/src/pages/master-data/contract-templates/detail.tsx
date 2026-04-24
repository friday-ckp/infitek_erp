import type { ReactNode } from 'react';
import { Breadcrumb, Button, Popconfirm, Result, Skeleton, Tabs, message } from 'antd';
import type { TabsProps } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import {
  approveContractTemplate,
  CONTRACT_TEMPLATE_STATUS_LABELS,
  getContractTemplateById,
  rejectContractTemplate,
  submitContractTemplate,
  voidContractTemplate,
  type ContractTemplate,
} from '../../../api/contract-templates.api';
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

function statusPillClass(status: ContractTemplate['status']) {
  switch (status) {
    case 'pending_submit':
      return 'master-pill-default';
    case 'in_review':
      return 'master-pill-orange';
    case 'approved':
      return 'master-pill-success';
    case 'rejected':
    case 'voided':
      return 'master-pill-red';
    default:
      return 'master-pill-default';
  }
}

export default function ContractTemplateDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id = '' } = useParams();
  const templateId = Number(id);

  const query = useQuery({
    queryKey: ['contract-template-detail', templateId],
    queryFn: () => getContractTemplateById(templateId),
    enabled: Number.isInteger(templateId) && templateId > 0,
  });

  const refreshAfterAction = async () => {
    await queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
    await queryClient.invalidateQueries({ queryKey: ['contract-template-detail', templateId] });
  };

  const submitMutation = useMutation({
    mutationFn: () => submitContractTemplate(templateId),
    onSuccess: async () => {
      message.success('已提交审核');
      await refreshAfterAction();
    },
  });

  const approveMutation = useMutation({
    mutationFn: () => approveContractTemplate(templateId),
    onSuccess: async () => {
      message.success('审核已通过');
      await refreshAfterAction();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectContractTemplate(templateId),
    onSuccess: async () => {
      message.success('模板已驳回');
      await refreshAfterAction();
    },
  });

  const voidMutation = useMutation({
    mutationFn: () => voidContractTemplate(templateId),
    onSuccess: async () => {
      message.success('模板已作废');
      await refreshAfterAction();
    },
  });

  if (!Number.isInteger(templateId) || templateId <= 0) {
    return (
      <Result
        status="404"
        title="合同条款范本不存在"
        extra={
          <Button type="primary" onClick={() => navigate('/master-data/contract-templates')}>
            返回列表
          </Button>
        }
      />
    );
  }

  if (query.isError && !query.data) {
    return (
      <Result
        status="error"
        title="合同条款范本详情加载失败"
        subTitle="请检查网络或稍后重试"
        extra={[
          <Button key="retry" type="primary" onClick={() => query.refetch()}>
            重试
          </Button>,
          <Button key="back" onClick={() => navigate('/master-data/contract-templates')}>
            返回列表
          </Button>,
        ]}
      />
    );
  }

  const data = query.data;

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

  const tabItems: TabsProps['items'] = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <div className="master-info-body">
          <div className="master-meta-grid">
            <MetaItem label="合同模板名称" value={displayOrDash(data?.name)} />
            <MetaItem label="是否默认模板" value={data?.isDefault ? '是' : '否'} />
            <MetaItem label="是否为法务审核模板" value={data?.requiresLegalReview ? '是' : '否'} />
            <MetaItem label="模板说明" value={displayOrDash(data?.description)} full />
            <MetaItem label="合同条款" value={displayOrDash(data?.content)} full />
          </div>
          {data?.usageCount ? (
            <div className="master-info-tip">
              当前模板已被 {data.usageCount} 张已确认采购订单引用，编辑后引用方会展示最新条款内容。
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: 'file',
      label: '模板文件与审计',
      children: (
        <div className="master-info-body">
          <div className="master-meta-grid">
            <MetaItem
              label="模板文件"
              value={
                data?.templateFileUrl ? (
                  <Button
                    type="link"
                    style={{ padding: 0 }}
                    onClick={() => window.open(data.templateFileUrl!, '_blank')}
                  >
                    {data.templateFileName || '下载文件'}
                  </Button>
                ) : (
                  '—'
                )
              }
            />
            <MetaItem label="文件名" value={displayOrDash(data?.templateFileName)} />
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

  const actionLoading =
    submitMutation.isPending ||
    approveMutation.isPending ||
    rejectMutation.isPending ||
    voidMutation.isPending;

  const canEdit = data && data.status !== 'voided';
  const canSubmit = data && (data.status === 'pending_submit' || data.status === 'rejected');
  const canApprove = data && data.status === 'in_review';
  const canReject = data && data.status === 'in_review';
  const canVoid = data && ['pending_submit', 'in_review', 'rejected', 'approved'].includes(data.status);

  return (
    <div className="master-page">
      <Breadcrumb
        items={[
          {
            title: (
              <Button
                type="link"
                className="master-breadcrumb-link"
                onClick={() => navigate('/master-data/contract-templates')}
              >
                基础数据
              </Button>
            ),
          },
          {
            title: (
              <Button
                type="link"
                className="master-breadcrumb-link"
                onClick={() => navigate('/master-data/contract-templates')}
              >
                合同条款范本
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
                <span className={`master-pill ${data ? statusPillClass(data.status) : 'master-pill-default'}`}>
                  {data ? CONTRACT_TEMPLATE_STATUS_LABELS[data.status] : '—'}
                </span>
              </div>
              <div className="master-summary-actions">
                {canEdit ? (
                  <Button onClick={() => navigate(`/master-data/contract-templates/${id}/edit`)}>
                    编辑
                  </Button>
                ) : null}
                {canSubmit ? (
                  <Popconfirm
                    title="确认提交审核？"
                    okText="提交"
                    cancelText="取消"
                    onConfirm={() => submitMutation.mutateAsync()}
                  >
                    <Button loading={actionLoading}>提交审核</Button>
                  </Popconfirm>
                ) : null}
                {canApprove ? (
                  <Popconfirm
                    title="确认审核通过？"
                    okText="通过"
                    cancelText="取消"
                    onConfirm={() => approveMutation.mutateAsync()}
                  >
                    <Button type="primary" loading={actionLoading}>
                      审核通过
                    </Button>
                  </Popconfirm>
                ) : null}
                {canReject ? (
                  <Popconfirm
                    title="确认驳回该模板？"
                    okText="驳回"
                    cancelText="取消"
                    onConfirm={() => rejectMutation.mutateAsync()}
                  >
                    <Button danger loading={actionLoading}>
                      驳回
                    </Button>
                  </Popconfirm>
                ) : null}
                {canVoid ? (
                  <Popconfirm
                    title="确认作废该模板？"
                    okText="作废"
                    cancelText="取消"
                    onConfirm={() => voidMutation.mutateAsync()}
                  >
                    <Button loading={actionLoading}>作废</Button>
                  </Popconfirm>
                ) : null}
              </div>
            </div>
            <div className="master-summary-meta">
              <div className="master-summary-meta-item">
                <div className="master-summary-meta-label">默认模板</div>
                <div className="master-summary-meta-value">{data?.isDefault ? '是' : '否'}</div>
              </div>
              <div className="master-summary-meta-item">
                <div className="master-summary-meta-label">法务审核模板</div>
                <div className="master-summary-meta-value">{data?.requiresLegalReview ? '是' : '否'}</div>
              </div>
              <div className="master-summary-meta-item">
                <div className="master-summary-meta-label">引用数量</div>
                <div className="master-summary-meta-value">{data?.usageCount ?? 0}</div>
              </div>
              <div className="master-summary-meta-item">
                <div className="master-summary-meta-label">模板文件</div>
                <div className="master-summary-meta-value">{displayOrDash(data?.templateFileName)}</div>
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
