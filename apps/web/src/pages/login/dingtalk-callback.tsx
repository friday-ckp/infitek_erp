import { useEffect, useMemo, useRef } from 'react';
import { Alert, Button, Result, Space, Spin, Typography } from 'antd';
import { CheckCircleFilled, ReloadOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  exchangeDingtalkTicket,
  getDingtalkAuthErrorMessage,
  isDingtalkUnboundError,
  type AuthApiError,
} from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';
import {
  clearStoredPostLoginRedirect,
  resolvePostLoginRedirect,
  storePostLoginRedirect,
} from '../../utils/auth-redirect';
import './login.css';

const { Title, Text } = Typography;

function buildCallbackErrorState(errorCode: string | null | undefined) {
  const isMissingTicket = !errorCode;
  const description = isMissingTicket
    ? '登录信息无效或已过期，请重新发起钉钉扫码登录。'
    : getDingtalkAuthErrorMessage(errorCode);

  return {
    title: isDingtalkUnboundError(errorCode) ? '钉钉账号未绑定' : '登录未完成',
    description,
    showAdminHint: isDingtalkUnboundError(errorCode),
  };
}

export default function DingtalkCallbackPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [searchParams] = useSearchParams();
  const redirectTarget = useMemo(
    () => resolvePostLoginRedirect(searchParams, { useStored: true }),
    [searchParams],
  );
  const ticket = searchParams.get('ticket');
  const errorCode = searchParams.get('error');
  const handledSuccessRef = useRef(false);

  const exchangeQuery = useQuery({
    queryKey: ['auth', 'dingtalk-exchange', ticket],
    queryFn: async () => {
      if (!ticket) {
        throw new Error('missing-ticket');
      }

      return exchangeDingtalkTicket(ticket);
    },
    enabled: Boolean(ticket) && !errorCode,
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (!exchangeQuery.isSuccess || handledSuccessRef.current) {
      return;
    }

    handledSuccessRef.current = true;
    const user = exchangeQuery.data.user;
    login(exchangeQuery.data.accessToken, {
      username: user.username,
      name: user.name || user.username,
    });
    clearStoredPostLoginRedirect();
    window.setTimeout(() => {
      navigate(redirectTarget, { replace: true });
    }, 600);
  }, [exchangeQuery.data, exchangeQuery.isSuccess, login, navigate, redirectTarget]);

  const callbackError = useMemo(() => {
    if (errorCode) {
      return buildCallbackErrorState(errorCode);
    }

    if (!ticket) {
      return buildCallbackErrorState(null);
    }

    if (!exchangeQuery.isError) {
      return null;
    }

    const apiError = exchangeQuery.error as AuthApiError | null;
    return buildCallbackErrorState(apiError?.code);
  }, [errorCode, exchangeQuery.error, exchangeQuery.isError, ticket]);

  const handleRetry = () => {
    storePostLoginRedirect(redirectTarget);
    window.location.assign('/api/auth/dingtalk/login');
  };

  const renderContent = () => {
    if (exchangeQuery.isSuccess) {
      return (
        <Result
          status="success"
          icon={<CheckCircleFilled />}
          title="登录成功，正在进入系统"
          subTitle="系统正在同步您的登录状态并跳转到目标页面。"
          extra={
            <Button type="primary" onClick={() => navigate(redirectTarget, { replace: true })}>
              立即进入
            </Button>
          }
        />
      );
    }

    if (!callbackError) {
      return (
        <div className="login-callback-loading" aria-live="polite">
          <Spin size="large" />
          <Title level={4}>正在完成钉钉登录</Title>
          <Text>请稍候，系统正在验证授权结果并同步您的账号信息。</Text>
        </div>
      );
    }

    return (
      <div className="login-callback-result" aria-live="assertive">
        <Result
          status="error"
          title={callbackError.title}
          subTitle={callbackError.description}
          extra={
            <Space wrap>
              <Button type="primary" icon={<ReloadOutlined />} onClick={handleRetry}>
                重新扫码登录
              </Button>
              <Button>
                <Link to="/login">返回账号密码登录</Link>
              </Button>
            </Space>
          }
        />
        <Alert
          className="login-alert"
          type="error"
          showIcon
          message={callbackError.description}
          description={
            callbackError.showAdminHint
              ? '请联系管理员完成钉钉绑定后，再重新发起扫码登录。'
              : '如问题持续存在，请返回登录页使用账号密码登录，或联系管理员协助处理。'
          }
        />
      </div>
    );
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
            <Title level={2}>企业级单点登录<br />安全回调处理中</Title>
            <Text>
              通过钉钉完成身份认证后，系统会在此页安全换取 ERP JWT，并恢复您原本要访问的页面。
            </Text>
          </div>
        </div>
      </section>

      <section className="form-section">
        <div className="watermark">
          <SafetyCertificateOutlined />
        </div>

        <div className="form-container">
          <div className="form-header">
            <Title level={3}>正在接收钉钉授权</Title>
            <Text>JWT 不会通过 URL 暴露，系统会在后台完成一次性 ticket 交换。</Text>
          </div>
          {renderContent()}
        </div>
      </section>
    </div>
  );
}
