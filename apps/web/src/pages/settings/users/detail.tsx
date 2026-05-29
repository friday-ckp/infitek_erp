import { useState, type ReactNode } from 'react';
import { Button, Form, Input, Modal, Popconfirm, Result, Skeleton, Tag, message } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { ActivityTimeline } from '../../../components/ActivityTimeline';
import { getUserById, bindUserDingtalk, unbindUserDingtalk } from '../../../api/users.api';
import type { BindDingtalkRequest } from '../../../api/users.api';
import { useAuthStore } from '../../../store/auth.store';
import '../../master-data/master-page.css';

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

export default function UserDetailPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const [activeAnchor, setActiveAnchor] = useState('basic');
  const [bindModalOpen, setBindModalOpen] = useState(false);
  const [bindLoading, setBindLoading] = useState(false);
  const [unbindLoading, setUnbindLoading] = useState(false);
  const [form] = Form.useForm<BindDingtalkRequest>();
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser?.username === 'admin';

  const query = useQuery({
    queryKey: ['user-detail', id],
    queryFn: () => getUserById(id),
    enabled: Boolean(id),
  });

  if (!id) {
    return (
      <Result
        status="404"
        title="用户不存在"
        extra={<Button type="primary" onClick={() => navigate('/settings/users')}>返回列表</Button>}
      />
    );
  }

  if (query.isError && !query.data) {
    return (
      <Result
        status="error"
        title="用户详情加载失败"
        subTitle="请检查网络或稍后重试"
        extra={[
          <Button key="retry" type="primary" onClick={() => query.refetch()}>重试</Button>,
          <Button key="back" onClick={() => navigate('/settings/users')}>返回列表</Button>,
        ]}
      />
    );
  }

  const data = query.data;
  const statusText = data?.status === 'active' ? '活跃' : '停用';
  const statusClass = data?.status === 'active' ? 'master-pill-success' : 'master-pill-default';

  const anchors = [
    { key: 'basic', label: '基础信息' },
    { key: 'dingtalk', label: '钉钉绑定' },
    { key: 'audit', label: '审计信息' },
    { key: 'operation', label: '操作记录' },
  ];

  function getDingtalkErrorMessage(err: unknown): string {
    const code = (err as { code?: string })?.code;
    switch (code) {
      case 'DINGTALK_IDENTITY_ALREADY_BOUND':
        return '该钉钉账号已绑定其他 ERP 用户';
      case 'DINGTALK_BINDING_FORBIDDEN':
        return '无权执行此操作，仅管理员可绑定/解绑钉钉账号';
      case 'USER_NOT_FOUND':
        return '目标用户不存在';
      default:
        return '操作失败，请稍后重试';
    }
  }

  const handleBind = async (values: BindDingtalkRequest) => {
    setBindLoading(true);
    try {
      await bindUserDingtalk(id, values);
      message.success('该用户已可使用钉钉扫码登录');
      setBindModalOpen(false);
      form.resetFields();
      query.refetch();
    } catch (err) {
      message.error(getDingtalkErrorMessage(err));
    } finally {
      setBindLoading(false);
    }
  };

  const handleUnbind = async () => {
    setUnbindLoading(true);
    try {
      await unbindUserDingtalk(id);
      message.success('该用户需重新绑定后才能扫码登录');
      query.refetch();
    } catch (err) {
      message.error(getDingtalkErrorMessage(err));
    } finally {
      setUnbindLoading(false);
    }
  };

  return (
    <div className="master-page">
      <div className="master-summary-card">
        {query.isLoading && !data ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          <>
            <div className="master-summary-code">USER PROFILE</div>
            <div className="master-summary-header">
              <div className="master-summary-title-wrap">
                <div className="master-summary-title-row">
                  <div className="master-summary-title">{displayOrDash(data?.username)}</div>
                  <span className={`master-pill ${statusClass}`}>{statusText}</span>
                </div>
              </div>
              <div className="master-summary-actions">
                <Button onClick={() => navigate(`/settings/users/${id}/edit`)}>编辑</Button>
              </div>
            </div>
            <div className="master-summary-meta">
              <div className="master-summary-meta-item">
                <div className="master-summary-meta-label">姓名</div>
                <div className="master-summary-meta-value">{displayOrDash(data?.name)}</div>
              </div>
              <div className="master-summary-meta-item">
                <div className="master-summary-meta-label">创建人</div>
                <div className="master-summary-meta-value">{displayOrDash(data?.createdBy)}</div>
              </div>
              <div className="master-summary-meta-item">
                <div className="master-summary-meta-label">更新人</div>
                <div className="master-summary-meta-value">{displayOrDash(data?.updatedBy)}</div>
              </div>
              <div className="master-summary-meta-item">
                <div className="master-summary-meta-label">最近更新时间</div>
                <div className="master-summary-meta-value">
                  {data?.updatedAt ? dayjs(data.updatedAt).format('YYYY-MM-DD HH:mm') : '—'}
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
                <div className="master-section-description">展示当前用户的账号标识与基础维护信息。</div>
              </div>
            </div>
            <div className="master-section-body">
              {query.isLoading && !data ? (
                <Skeleton active paragraph={{ rows: 6 }} />
              ) : (
                <div className="master-meta-grid">
                  <MetaItem label="用户名" value={displayOrDash(data?.username)} />
                  <MetaItem label="姓名" value={displayOrDash(data?.name)} />
                  <MetaItem label="账号状态" value={<span className={`master-pill ${statusClass}`}>{statusText}</span>} />
                  <MetaItem
                    label="创建时间"
                    value={data?.createdAt ? dayjs(data.createdAt).format('YYYY-MM-DD HH:mm') : '—'}
                  />
                  <MetaItem
                    label="更新时间"
                    value={data?.updatedAt ? dayjs(data.updatedAt).format('YYYY-MM-DD HH:mm') : '—'}
                  />
                </div>
              )}
            </div>
          </section>

          <section id="dingtalk" className="master-section-card">
            <div className="master-section-header">
              <div className="master-section-heading">
                <div className="master-section-title">钉钉绑定</div>
                <div className="master-section-description">管理该用户的钉钉身份绑定关系，绑定后可使用钉钉扫码登录。</div>
              </div>
            </div>
            <div className="master-section-body">
              {query.isLoading && !data ? (
                <Skeleton active paragraph={{ rows: 3 }} />
              ) : (
                <div className="master-meta-grid">
                  <MetaItem
                    label="绑定状态"
                    value={
                      data?.dingtalkBindingStatus === 'BOUND'
                        ? <Tag color="success">已绑定</Tag>
                        : <Tag>未绑定</Tag>
                    }
                  />
                  <MetaItem
                    label="绑定时间"
                    value={data?.dingtalkBoundAt ? dayjs(data.dingtalkBoundAt).format('YYYY-MM-DD HH:mm') : '—'}
                  />
                  <MetaItem
                    label="钉钉昵称"
                    value={displayOrDash(data?.dingtalkNick)}
                  />
                  {isAdmin && (
                    <MetaItem
                      label="操作"
                      value={
                        data?.dingtalkBindingStatus === 'BOUND' ? (
                          <Popconfirm
                            title="解绑钉钉账号"
                            description="解绑后该用户将无法使用钉钉扫码登录，确定继续？"
                            onConfirm={handleUnbind}
                            okText="确定"
                            cancelText="取消"
                            okButtonProps={{ loading: unbindLoading }}
                          >
                            <Button danger size="small" loading={unbindLoading} disabled={unbindLoading}>解绑钉钉账号</Button>
                          </Popconfirm>
                        ) : (
                          <Button type="primary" size="small" onClick={() => setBindModalOpen(true)}>绑定钉钉账号</Button>
                        )
                      }
                    />
                  )}
                </div>
              )}
            </div>
          </section>

          <section id="audit" className="master-section-card">
            <div className="master-section-header">
              <div className="master-section-heading">
                <div className="master-section-title">审计信息</div>
                <div className="master-section-description">记录该账号的创建人与最近一次维护人。</div>
              </div>
            </div>
            <div className="master-section-body">
              {query.isLoading && !data ? (
                <Skeleton active paragraph={{ rows: 3 }} />
              ) : (
                <div className="master-meta-grid">
                  <MetaItem label="创建人" value={displayOrDash(data?.createdBy)} />
                  <MetaItem label="更新人" value={displayOrDash(data?.updatedBy)} />
                  <MetaItem
                    label="创建时间"
                    value={data?.createdAt ? dayjs(data.createdAt).format('YYYY-MM-DD HH:mm') : '—'}
                  />
                  <MetaItem
                    label="更新时间"
                    value={data?.updatedAt ? dayjs(data.updatedAt).format('YYYY-MM-DD HH:mm') : '—'}
                  />
                </div>
              )}
            </div>
          </section>

          <section id="operation" className="master-section-card">
            <div className="master-section-header">
              <div className="master-section-heading">
                <div className="master-section-title">操作记录</div>
                <div className="master-section-description">按时间倒序查看该用户的关键维护动作。</div>
              </div>
            </div>
            <div className="master-section-body">
              <ActivityTimeline resourceType="users" resourceId={id} />
            </div>
          </section>
        </div>
      </div>

      <Modal
        title="绑定钉钉账号"
        open={bindModalOpen}
        onCancel={() => { setBindModalOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={bindLoading}
        okText="确定"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleBind}>
          <Form.Item
            name="dingtalkUnionId"
            label="钉钉 UnionID"
            rules={[{ required: true, message: '请输入钉钉 UnionID' }]}
          >
            <Input placeholder="请输入钉钉 UnionID" />
          </Form.Item>
          <Form.Item name="dingtalkNick" label="钉钉昵称">
            <Input placeholder="请输入钉钉昵称（选填）" />
          </Form.Item>
          <Form.Item name="dingtalkUserId" label="钉钉 UserID">
            <Input placeholder="请输入钉钉 UserID（选填）" />
          </Form.Item>
          <Form.Item name="dingtalkOpenId" label="钉钉 OpenID">
            <Input placeholder="请输入钉钉 OpenID（选填）" />
          </Form.Item>
          <Form.Item name="dingtalkAvatar" label="头像 URL">
            <Input placeholder="请输入头像 URL（选填）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
