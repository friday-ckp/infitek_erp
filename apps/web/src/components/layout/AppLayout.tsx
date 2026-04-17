import { Layout, Breadcrumb } from 'antd';
import { Outlet, useNavigate, Navigate, useMatches } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import Sidebar from './Sidebar';

const { Content } = Layout;

interface RouteHandle {
  breadcrumb?: string;
}

export default function AppLayout() {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const matches = useMatches();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 从路由 handle 生成面包屑
  const breadcrumbItems = matches
    .filter((match) => (match.handle as RouteHandle)?.breadcrumb)
    .map((match) => ({
      title: (match.handle as RouteHandle).breadcrumb,
      onClick: () => navigate(match.pathname),
    }));

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout style={{ background: '#F5F7FA' }}>
        {breadcrumbItems.length > 0 && (
          <div
            style={{
              padding: '12px 24px 0',
              background: '#F5F7FA',
            }}
          >
            <Breadcrumb items={breadcrumbItems} />
          </div>
        )}
        <Content
          style={{
            padding: 24,
            background: '#F5F7FA',
            minHeight: 'calc(100vh - 56px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
