import { useMemo, useState } from 'react';
import { Button, Form, Input, Result, Skeleton, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { createUser, getUserById, updateUser } from '../../../api/users.api';
import '../../master-data/master-page.css';

export default function UserFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const [form] = Form.useForm();
  const [activeAnchor, setActiveAnchor] = useState('basic');

  const detailQuery = useQuery({
    queryKey: ['user-detail', id],
    queryFn: () => getUserById(id as string),
    enabled: Boolean(isEdit && id),
  });

  const createMutation = useMutation({
    mutationFn: (payload: { username: string; name: string; password: string }) => createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      message.success('用户已创建');
      navigate('/settings/users');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { name: string; password?: string }) => updateUser(id as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-detail', id] });
      message.success('用户已更新');
      navigate('/settings/users');
    },
  });

  const initialValues = useMemo(
    () => ({
      username: detailQuery.data?.username,
      name: detailQuery.data?.name,
      password: undefined,
      confirmPassword: undefined,
    }),
    [detailQuery.data?.username, detailQuery.data?.name],
  );

  const anchors = [
    { key: 'basic', label: '基础信息' },
    { key: 'security', label: '登录安全' },
  ];

  if (isEdit && !id) {
    return (
      <Result
        status="404"
        title="用户不存在"
        extra={<Button type="primary" onClick={() => navigate('/settings/users')}>返回列表</Button>}
      />
    );
  }

  if (isEdit && detailQuery.isLoading) {
    return <Skeleton active />;
  }

  if (isEdit && detailQuery.isError && !detailQuery.data) {
    return (
      <Result
        status="error"
        title="用户详情加载失败"
        subTitle="请检查网络或稍后重试"
        extra={[
          <Button key="retry" type="primary" onClick={() => detailQuery.refetch()}>重试</Button>,
          <Button key="back" onClick={() => navigate('/settings/users')}>返回列表</Button>,
        ]}
      />
    );
  }

  return (
    <div className="master-page master-form-page">
      <div className="master-page-header">
        <div className="master-page-heading">
          <div className="master-page-title">{isEdit ? '编辑用户' : '新建用户'}</div>
          <div className="master-page-description">统一维护账号名称、展示姓名与登录密码。</div>
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={async (values: { username: string; name: string; password?: string; confirmPassword?: string }) => {
          if (isEdit) {
            await updateMutation.mutateAsync({
              name: values.name,
              password: values.password || undefined,
            });
            return;
          }
          await createMutation.mutateAsync({
            username: values.username,
            name: values.name,
            password: values.password as string,
          });
        }}
      >
        <div className="master-form-layout">
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

          <div className="master-form-main">
            <section id="basic" className="master-section-card">
              <div className="master-section-header">
                <div className="master-section-heading">
                  <div className="master-section-title">基础信息</div>
                  <div className="master-section-description">设置账号标识和用户姓名，保持信息清晰可读。</div>
                </div>
              </div>
              <div className="master-section-body">
                <div className="master-form-grid">
                  <Form.Item
                    label="用户名"
                    name="username"
                    rules={[{ required: true, message: '请输入用户名' }]}
                  >
                    <Input placeholder="请输入用户名" disabled={isEdit} />
                  </Form.Item>

                  <Form.Item
                    label="姓名"
                    name="name"
                    rules={[{ required: true, message: '请输入姓名' }]}
                  >
                    <Input placeholder="请输入姓名" />
                  </Form.Item>
                </div>
              </div>
            </section>

            <section id="security" className="master-section-card">
              <div className="master-section-header">
                <div className="master-section-heading">
                  <div className="master-section-title">登录安全</div>
                  <div className="master-section-description">新建时设置初始密码，编辑时按需重置密码。</div>
                </div>
              </div>
              <div className="master-section-body">
                <div className="master-form-grid">
                  <Form.Item
                    label="密码"
                    name="password"
                    rules={[
                      { required: !isEdit, message: '请输入密码' },
                      { min: 6, message: '密码长度至少 6 位' },
                    ]}
                  >
                    <Input.Password placeholder={isEdit ? '不修改密码请留空' : '请输入密码'} />
                  </Form.Item>

                  <Form.Item
                    label="确认密码"
                    name="confirmPassword"
                    dependencies={['password']}
                    rules={[
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          const password = getFieldValue('password');
                          if (!password || !value || password === value) return Promise.resolve();
                          return Promise.reject(new Error('两次输入的密码不一致'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password placeholder="请再次输入密码" />
                  </Form.Item>
                </div>
              </div>
            </section>

            <div className="master-form-footer">
              <div className="master-form-footer-tip">
                保存后仅更新展示层与账号信息，不影响现有接口调用逻辑。
              </div>
              <div className="master-form-footer-actions">
                <Button onClick={() => navigate('/settings/users')}>取消</Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={createMutation.isPending || updateMutation.isPending}
                >
                  {isEdit ? '保存' : '创建'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
}
