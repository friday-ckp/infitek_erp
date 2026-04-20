import { useState } from 'react';
import { Form, Input, Button, Typography, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Navigate } from 'react-router-dom';
import request from '../../api/request';
import { useAuthStore } from '../../store/auth.store';
import './login.css';

const { Title, Text } = Typography;

const modules = [
  { label: '销售', icon: '📈' },
  { label: '采购', icon: '🛒' },
  { label: '仓储', icon: '📦' },
  { label: '财务', icon: '💰' },
  { label: '物流', icon: '🚚' },
  { label: '产品', icon: '🏷️' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { token, login } = useAuthStore();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (token) return <Navigate to="/" replace />;

  const handleFinish = async (values: { username: string; password: string }) => {
    setError('');
    setLoading(true);
    try {
      const data = await request.post('/auth/login', values) as any;
      login(data.accessToken, { username: values.username, name: data.user?.name || values.username });
      navigate('/');
    } catch (err: any) {
      setError(err?.message || '用户名或密码错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp-root">
      {/* Background */}
      <div className="lp-bg-gradient" />
      <div className="lp-bg-grid" />
      <div className="lp-orb lp-orb-1" />
      <div className="lp-orb lp-orb-2" />
      <div className="lp-orb lp-orb-3" />

      {/* Right-side orbiting art */}
      <div className="lp-chip-wrap">
        <div className="lp-chip-ring lp-chip-ring-1" />
        <div className="lp-chip-ring lp-chip-ring-2" />
        <div className="lp-chip-center">⚡</div>
        {modules.map((m, i) => (
          <div key={m.label} className={`lp-chip lp-chip-${i + 1}`}>
            <span className="lp-chip-icon">{m.icon}</span>
            <span className="lp-chip-label">{m.label}</span>
          </div>
        ))}
      </div>

      {/* Right tagline */}
      <div className="lp-tagline">
        <div className="lp-tagline-title">一体化企业资源管理</div>
        <div className="lp-tagline-sub">覆盖销售、供应链、产品、用户管理全流程，<br />助力企业高效运营。</div>
        <div className="lp-tagline-dots">
          <div className="lp-tagline-dot active" />
          <div className="lp-tagline-dot" />
          <div className="lp-tagline-dot" />
        </div>
      </div>

      {/* Login card — centered left of the art */}
      <div className="lp-card">
        <div className="lp-logo">
          <div className="lp-logo-icon">I</div>
          <span className="lp-logo-name">Infitek ERP</span>
        </div>

        <Title level={2} className="lp-title">Welcome Back</Title>
        <Text className="lp-subtitle">登录您的企业管理平台</Text>

        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

        <Form
          className="lp-form"
          initialValues={{ username: 'admin', password: 'Admin@123' }}
          onFinish={handleFinish}
          size="large"
          layout="vertical"
        >
          <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Button type="primary" htmlType="submit" loading={loading} className="lp-submit">
              登录
            </Button>
          </Form.Item>
        </Form>

        <div className="lp-footer">© 2026 Infitek. All rights reserved.</div>
      </div>
    </div>
  );
}
