import { Layout, Breadcrumb } from 'antd';
import { Outlet, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { BellOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../store/auth.store';
import Sidebar from './Sidebar';

const { Content } = Layout;

const BREADCRUMB_MAP: Record<string, { label: string; parent?: string; parentLabel?: string }> = {
  '/settings/users': { label: '用户管理', parent: '/master-data', parentLabel: '基础数据' },
  '/settings/users/create': { label: '新建用户', parent: '/settings/users', parentLabel: '用户管理' },
};

function getBreadcrumbItems(pathname: string): { title: string; path: string }[] {
  if (BREADCRUMB_MAP[pathname]) {
    const entry = BREADCRUMB_MAP[pathname];
    const items: { title: string; path: string }[] = [];
    if (entry.parent && entry.parentLabel) {
      items.push({ title: entry.parentLabel, path: entry.parent });
    }
    items.push({ title: entry.label, path: pathname });
    return items;
  }
  const editMatch = pathname.match(/^\/settings\/users\/([^/]+)\/edit$/);
  if (editMatch) return [
    { title: '基础数据', path: '/master-data' },
    { title: '用户管理', path: '/settings/users' },
    { title: '编辑用户', path: pathname },
  ];
  const detailMatch = pathname.match(/^\/settings\/users\/([^/]+)$/);
  if (detailMatch) return [
    { title: '基础数据', path: '/master-data' },
    { title: '用户管理', path: '/settings/users' },
    { title: '用户详情', path: pathname },
  ];
  return [];
}

function getInitials(name: string) {
  return name ? name.slice(0, 2).toUpperCase() : 'U';
}

export default function AppLayout() {
  const { token, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  if (!token) return <Navigate to="/login" replace />;

  const breadcrumbItems = getBreadcrumbItems(location.pathname);
  const displayName = user?.name || '用户';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F9FAFB' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <div style={{
          background: '#fff',
          borderBottom: '1px solid #E5E7EB',
          padding: '0 28px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}>
          {/* 面包屑 */}
          <Breadcrumb
            separator={<span style={{ color: '#D1D5DB' }}>›</span>}
            items={breadcrumbItems.map((item, idx) => ({
              title: idx < breadcrumbItems.length - 1
                ? <span style={{ color: '#6B7280', cursor: 'pointer' }} onClick={() => navigate(item.path)}>{item.title}</span>
                : <span style={{ color: '#111827', fontWeight: 600 }}>{item.title}</span>,
            }))}
          />

          {/* 右侧操作区 */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative', cursor: 'pointer', color: '#6B7280', display: 'flex', alignItems: 'center' }}>
              <BellOutlined style={{ fontSize: 18 }} />
            </div>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: '#4F46E5', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}>
              {getInitials(displayName)}
            </div>
          </div>
        </div>

        {/* 内容区 */}
        <Content style={{ flex: 1, overflow: 'auto', padding: '24px 28px', background: '#F9FAFB' }}>
          <Outlet />
        </Content>
      </div>
    </div>
  );
}
