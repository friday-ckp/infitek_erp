import { useMemo } from 'react';
import { Breadcrumb, Button, Form, Input, Result, Skeleton, message } from 'antd';
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

  const initialValues = useMemo(
    () => ({
      username: detailQuery.data?.username,
      name: detailQuery.data?.name,
      password: undefined,
      confirmPassword: undefined,
    }),
    [detailQuery.data?.username, detailQuery.data?.name],
  );

  return (
    <div className="master-page master-form-page">
      <Breadcrumb
        items={[
          {
            title: (
              <Button type="link" className="master-breadcrumb-link" onClick={() => navigate('/settings/users')}>
                系统设置
              </Button>
            ),
          },
          {
            title: (
              <Button type="link" className="master-breadcrumb-link" onClick={() => navigate('/settings/users')}>
                用户管理
              </Button>
            ),
          },
          { title: isEdit ? `编辑 ${detailQuery.data?.username || ''}` : '新建用户' },
        ]}
      />

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
        <div className="master-info-card">
          <div className="master-form-body">
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
          <div className="master-form-footer">
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
      </Form>
    </div>
  );
}
