import { useState } from 'react';
import { Form, Input, Button, Typography, Alert } from 'antd';
import { UserOutlined, LockOutlined, BarChartOutlined, TeamOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate, Navigate } from 'react-router-dom';
import request from '../../api/request';
import { useAuthStore } from '../../store/auth.store';

const { Title, Text } = Typography;

const features = [
  { icon: <BarChartOutlined />, title: '销售管理', desc: '订单跟踪、发货需求一站式管理' },
  { icon: <TeamOutlined />, title: '用户权限', desc: '精细化角色权限，安全可控' },
  { icon: <SafetyOutlined />, title: '数据安全', desc: 'JWT 认证，企业级数据保护' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { token, login } = useAuthStore();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (token) {
    return <Navigate to="/" replace />;
  }

  const handleFinish = async (values: { username: string; password: string }) => {
    setError('');
    setLoading(true);
    try {
      // request 拦截器会提取 response.data.data，所以这里直接得到 { accessToken, user }
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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F9FAFB' }}>
      {/* 左侧品牌区 */}
      <div
        style={{
          flex: 1,
          background: 'linear-gradient(135deg, #4C6FFF 0%, #3451D1 60%, #1B2A4A 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 56px',
          color: '#fff',
          minWidth: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
          <div
            style={{
              width: 44,
              height: 44,
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 700,
              color: '#fff',
            }}
          >
            I
          </div>
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>Infitek ERP</span>
        </div>

        <Title level={2} style={{ color: '#fff', margin: '0 0 16px', fontSize: 32, fontWeight: 700, lineHeight: 1.3 }}>
          企业资源管理<br />一体化平台
        </Title>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 1.7, display: 'block', marginBottom: 48 }}>
          覆盖销售、供应链、产品、用户管理全流程，<br />助力企业高效运营。
        </Text>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {features.map((f, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 10,
                padding: '14px 16px',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                {f.icon}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{f.title}</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 右侧登录区 */}
      <div
        style={{
          width: 480,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 48px',
          background: '#fff',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ width: '100%', maxWidth: 360 }}>
          <div style={{ marginBottom: 36 }}>
            <Title level={3} style={{ margin: '0 0 8px', color: '#111827', fontWeight: 700 }}>
              欢迎回来
            </Title>
            <Text style={{ color: '#6B7280', fontSize: 14 }}>请输入您的账号信息登录</Text>
          </div>

          {error && (
            <Alert message={error} type="error" showIcon style={{ marginBottom: 20, borderRadius: 8 }} />
          )}

          <Form
            initialValues={{ username: 'admin', password: 'Admin@123' }}
            onFinish={handleFinish}
            size="large"
            layout="vertical"
          >
            <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}>
              <Input
                prefix={<UserOutlined style={{ color: '#9CA3AF' }} />}
                placeholder="请输入用户名"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
            <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password
                prefix={<LockOutlined style={{ color: '#9CA3AF' }} />}
                placeholder="请输入密码"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
            <Form.Item style={{ marginTop: 8 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{
                  borderRadius: 8,
                  height: 44,
                  fontWeight: 600,
                  fontSize: 15,
                }}
              >
                登录
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: 24, color: '#9CA3AF', fontSize: 12 }}>
            © 2026 Infitek. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
