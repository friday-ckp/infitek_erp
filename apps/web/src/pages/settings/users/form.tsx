import { useState, useEffect } from 'react';
import { Button, Form, Input, message, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { createUser, updateUser, getUserById } from '../../../api/users.api';
import type { User } from '../../../api/users.api';

export default function UserForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = !!id;

  useEffect(() => {
    if (id) {
      setLoading(true);
      getUserById(id)
        .then((data) => {
          setUser(data);
          form.setFieldsValue({ username: data.username, name: data.name });
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [id, form]);

  const handleFinish = async (values: { username: string; name: string; password?: string; confirmPassword?: string }) => {
    setSubmitting(true);
    try {
      if (isEdit && user) {
        const updateData: { name: string; password?: string } = { name: values.name };
        if (values.password) updateData.password = values.password;
        await updateUser(user.id, updateData);
        message.success('用户已更新');
      } else {
        await createUser({ username: values.username, name: values.name, password: values.password! });
        message.success('用户已创建');
      }
      navigate('/settings/users');
    } catch {
      // 错误由拦截器统一处理
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/settings/users')} />
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{isEdit ? '编辑用户' : '新建用户'}</h2>
      </div>

      <div style={{ background: '#fff', borderRadius: 8, padding: 24, maxWidth: 600 }}>
        <Form form={form} layout="vertical" onFinish={handleFinish}>
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
                  const pwd = getFieldValue('password');
                  if (!pwd || !value || pwd === value) return Promise.resolve();
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入密码" />
          </Form.Item>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={() => navigate('/settings/users')}>取消</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {isEdit ? '更新' : '创建'}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
