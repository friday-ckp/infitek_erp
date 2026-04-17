import { useState, useEffect } from 'react';
import { Button, message, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { createUser, updateUser, getUserById } from '../../../api/users.api';

interface User {
  id: string;
  username: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

interface FormData {
  username: string;
  name: string;
  password: string;
  confirmPassword: string;
}

export default function UserForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<FormData>({
    username: '',
    name: '',
    password: '',
    confirmPassword: '',
  });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!id;

  useEffect(() => {
    if (id) {
      fetchUser(id);
    }
  }, [id]);

  const fetchUser = async (userId: string) => {
    setLoading(true);
    try {
      const response = await getUserById(userId);
      if (response.success) {
        const userData = response.data;
        setUser(userData);
        setForm({
          username: userData.username,
          name: userData.name,
          password: '',
          confirmPassword: '',
        });
      }
    } catch (error) {
      message.error('获取用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.username.trim()) {
      newErrors.username = '用户名不能为空';
    }
    if (!form.name.trim()) {
      newErrors.name = '姓名不能为空';
    }

    if (!isEdit) {
      if (!form.password) {
        newErrors.password = '密码不能为空';
      } else if (form.password.length < 6) {
        newErrors.password = '密码长度至少 6 位';
      }
    } else if (form.password) {
      if (form.password.length < 6) {
        newErrors.password = '密码长度至少 6 位';
      }
    }

    if (form.password && form.password !== form.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && user) {
        const updateData: any = { name: form.name };
        if (form.password) {
          updateData.password = form.password;
        }
        const response = await updateUser(user.id, updateData);
        if (response.success) {
          message.success('用户已更新');
          navigate('/settings/users');
        }
      } else {
        const response = await createUser({
          username: form.username,
          name: form.name,
          password: form.password,
        });
        if (response.success) {
          message.success('用户已创建');
          navigate('/settings/users');
        }
      }
    } catch (error) {
      message.error(isEdit ? '更新用户失败' : '创建用户失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/settings/users')}
        />
        <h1 style={{ margin: 0 }}>{isEdit ? '编辑用户' : '新建用户'}</h1>
      </div>

      <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', maxWidth: '600px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            用户名 <span style={{ color: '#ff4d4f' }}>*</span>
          </label>
          <input
            type="text"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            disabled={isEdit}
            placeholder="请输入用户名"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: errors.username ? '1px solid #ff4d4f' : '1px solid #d9d9d9',
              opacity: isEdit ? 0.6 : 1,
            }}
          />
          {errors.username && <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>{errors.username}</div>}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            姓名 <span style={{ color: '#ff4d4f' }}>*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="请输入姓名"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: errors.name ? '1px solid #ff4d4f' : '1px solid #d9d9d9',
            }}
          />
          {errors.name && <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>{errors.name}</div>}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            密码 {!isEdit && <span style={{ color: '#ff4d4f' }}>*</span>}
          </label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder={isEdit ? '不修改密码请留空' : '请输入密码'}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: errors.password ? '1px solid #ff4d4f' : '1px solid #d9d9d9',
            }}
          />
          {errors.password && <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>{errors.password}</div>}
        </div>

        {form.password && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              确认密码 <span style={{ color: '#ff4d4f' }}>*</span>
            </label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="请再次输入密码"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '4px',
                border: errors.confirmPassword ? '1px solid #ff4d4f' : '1px solid #d9d9d9',
              }}
            />
            {errors.confirmPassword && <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>{errors.confirmPassword}</div>}
          </div>
        )}

        <div style={{ marginTop: '24px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button onClick={() => navigate('/settings/users')}>取消</Button>
          <Button type="primary" loading={submitting} onClick={handleSubmit}>
            {isEdit ? '更新' : '创建'}
          </Button>
        </div>
      </div>
    </div>
  );
}
