import { Layout, Breadcrumb } from 'antd';
import { Outlet, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import Sidebar from './Sidebar';

const { Content } = Layout;

// 路径 → 面包屑静态映射
const BREADCRUMB_MAP: Record<string, { label: string; parent?: string }> = {
  '/settings/users': { label: '用户管理' },
  '/settings/users/create': { label: '新建用户', parent: '/settings/users' },
};

// 动态路径匹配（如 /settings/users/:id 和 /settings/users/:id/edit）
function getBreadcrumbItems(pathname: string): { title: string; path: string }[] {
  // 精确匹配
  if (BREADCRUMB_MAP[pathname]) {
    const entry = BREADCRUMB_MAP[pathname];
    const items: { title: string; path: string }[] = [];
    if (entry.parent && BREADCRUMB_MAP[entry.parent]) {
      items.push({ title: BREADCRUMB_MAP[entry.parent].label, path: entry.parent });
    }
    items.push({ title: entry.label, path: pathname });
    return items;
  }

  // 匹配 /settings/users/:id/edit
  const editMatch = pathname.match(/^\/settings\/users\/([^/]+)\/edit$/);
  if (editMatch) {
    return [
      { title: '用户管理', path: '/settings/users' },
      { title: '编辑用户', path: pathname },
    ];
  }

  // 匹配 /settings/users/:id
  const detailMatch = pathname.match(/^\/settings\/users\/([^/]+)$/);
  if (detailMatch) {
    return [
      { title: '用户管理', path: '/settings/users' },
      { title: '用户详情', path: pathname },
    ];
  }

  return [];
}

export default function AppLayout() {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const breadcrumbItems = getBreadcrumbItems(location.pathname);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout style={{ background: '#F5F7FA' }}>
        {breadcrumbItems.length > 0 && (
          <div style={{ padding: '12px 24px 0', background: '#F5F7FA' }}>
            <Breadcrumb
              items={breadcrumbItems.map((item, idx) => ({
                title: item.title,
                onClick: idx < breadcrumbItems.length - 1 ? () => navigate(item.path) : undefined,
                style: idx < breadcrumbItems.length - 1 ? { cursor: 'pointer' } : { color: '#666' },
              }))}
            />
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
