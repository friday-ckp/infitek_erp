import { useState } from 'react';
import { Alert, Button, Form, Input, Typography } from 'antd';
import { ArrowRightOutlined, LockOutlined, SafetyCertificateOutlined, UserOutlined } from '@ant-design/icons';
import { Navigate, useNavigate } from 'react-router-dom';
import request from '../../api/request';
import { useAuthStore } from '../../store/auth.store';
import antdStatic from '../../utils/antdStatic';
import './login.css';

const { Title, Text } = Typography;

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
    <div className="layout-container">
      <section className="visual-section">
        <div className="glow-top" />
        <div className="glow-bottom" />
        <div className="circle-decorator" />

        <div className="brand-logo">
          <SafetyCertificateOutlined />
          <span>跨境电商管理系统</span>
        </div>

        <div className="visual-content">
          <div className="visual-text">
            <Title level={2}>企业级数据驱动<br />智能管理平台</Title>
            <Text>
              通过全方位的资源计划与数据分析，赋能企业高效运营，实现业务流程自动化与数据资产化。
            </Text>
          </div>

          <div className="visual-cards-container">
            <div className="floating-ui">
              <div className="skeleton-header" />
              <div className="skeleton-chart" />
              <div className="skeleton-row">
                <div className="skeleton-block" />
                <div className="skeleton-block" />
              </div>
            </div>

            <div className="floating-ui-2">
              <div className="skeleton-row skeleton-row--profile">
                <div className="skeleton-avatar" />
                <div className="skeleton-line" />
              </div>
              <div className="skeleton-line skeleton-line--w80" />
              <div className="skeleton-line skeleton-line--w60" />
              <div className="skeleton-line skeleton-line--w90" />
            </div>
          </div>
        </div>
      </section>

      <section className="form-section">
        <div className="watermark">
          <SafetyCertificateOutlined />
        </div>

        <div className="form-container">
          <div className="form-header">
            <Title level={3}>欢迎回来</Title>
            <Text>请输入您的企业账号以访问系统</Text>
          </div>

          {error && <Alert message={error} type="error" showIcon className="login-alert" />}

          <Form
            className="login-form"
            initialValues={{ username: 'admin', password: 'Admin@123' }}
            onFinish={handleFinish}
            size="large"
            layout="vertical"
          >
            <div className="input-group">
              <label htmlFor="account">企业账号 / 邮箱</label>
              <div className="input-wrapper">
                <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]} style={{ marginBottom: 0, width: '100%' }}>
                  <Input
                    id="account"
                    className="form-input"
                    placeholder="admin@crossborder.com"
                    prefix={<UserOutlined className="input-icon" />}
                  />
                </Form.Item>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="password">登录密码</label>
              <div className="input-wrapper">
                <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]} style={{ marginBottom: 0, width: '100%' }}>
                  <Input.Password
                    id="password"
                    className="form-input"
                    placeholder="••••••••"
                    prefix={<LockOutlined className="input-icon" />}
                  />
                </Form.Item>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="forgot-link">
                忘记密码？
              </button>
            </div>

            <Button htmlType="submit" type="primary" className="btn-submit" loading={loading}>
              <span>{loading ? '验证中...' : '登录系统'}</span>
              {!loading && <ArrowRightOutlined />}
            </Button>

            <div className="divider">或者</div>

            <button
              type="button"
              className="sso-btn"
              onClick={() => antdStatic.message?.info('该功能暂未开发')}
            >
              <SafetyCertificateOutlined />
              <span>通过企业 SSO 登录</span>
            </button>
          </Form>
        </div>
      </section>
    </div>
  );
}
