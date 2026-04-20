import { Layout, Breadcrumb } from 'antd';
import { Outlet, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { BellOutlined } from '@ant-design/icons';
import DOMPurify from 'dompurify';
import { useAuthStore } from '../../store/auth.store';
import Sidebar from './Sidebar';

const { Content } = Layout;

const BREADCRUMB_MAP: Record<string, { label: string; parent?: string; parentLabel?: string }> = {
  '/settings/users': { label: '用户管理', parent: '/master-data', parentLabel: '基础数据' },
  '/settings/users/create': { label: '新建用户', parent: '/settings/users', parentLabel: '用户管理' },
  '/master-data/units': { label: '单位管理', parent: '/master-data', parentLabel: '基础数据' },
  '/master-data/units/create': { label: '新建单位', parent: '/master-data/units', parentLabel: '单位管理' },
};

function isValidToken(token: string | null): boolean {
  if (!token || typeof token !== 'string' || token.trim() === '') return false;
  if (token.length < 10 || token.length > 2048) return false;
  return /^[A-Za-z0-9\-_.~+/]+=*$/.test(token);
}

function getBreadcrumbItems(pathname: string): { title: string; path: string }[] {
  if (!pathname || typeof pathname !== 'string') return [];
  if (BREADCRUMB_MAP[pathname]) {
    const entry = BREADCRUMB_MAP[pathname];
    const items: { title: string; path: string }[] = [];
    if (entry.parent && entry.parentLabel) {
      items.push({ title: entry.parentLabel, path: entry.parent });
    }
    items.push({ title: entry.label, path: pathname });
    return items;
  }
  const editMatch = pathname.match(/^\/settings\/users\/([a-zA-Z0-9\-_]+)\/edit$/);
  if (editMatch && editMatch[1]) return [
    { title: '基础数据', path: '/master-data' },
    { title: '用户管理', path: '/settings/users' },
    { title: '编辑用户', path: pathname },
  ];
  const detailMatch = pathname.match(/^\/settings\/users\/([a-zA-Z0-9\-_]+)$/);
  if (detailMatch && detailMatch[1]) return [
    { title: '基础数据', path: '/master-data' },
    { title: '用户管理', path: '/settings/users' },
    { title: '用户详情', path: pathname },
  ];
  const unitEditMatch = pathname.match(/^\/master-data\/units\/([a-zA-Z0-9\-_]+)\/edit$/);
  if (unitEditMatch && unitEditMatch[1]) return [
    { title: '基础数据', path: '/master-data' },
    { title: '单位管理', path: '/master-data/units' },
    { title: '编辑单位', path: pathname },
  ];
  const unitDetailMatch = pathname.match(/^\/master-data\/units\/([a-zA-Z0-9\-_]+)$/);
  if (unitDetailMatch && unitDetailMatch[1]) return [
    { title: '基础数据', path: '/master-data' },
    { title: '单位管理', path: '/master-data/units' },
    { title: '单位详情', path: pathname },
  ];
  return [];
}

function getInitials(name: string) {
  return name ? name.slice(0, 2).toUpperCase() : 'U';
}

function sanitizeText(text: string): string {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
}

export default function AppLayout() {
  const { token, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isValidToken(token)) return <Navigate to="/login" replace />;

  const breadcrumbItems = getBreadcrumbItems(location.pathname);
  const displayName = sanitizeText(user?.name || '用户');

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
            items={breadcrumbItems.map((item, idx) => {
              const isLast = idx === breadcrumbItems.length - 1;
              const isValidPath = /^\/[a-zA-Z0-9\-_/]*$/.test(item.path);
              return {
                title: isLast
                  ? <span style={{ color: '#111827', fontWeight: 600 }}>{item.title}</span>
                  : <span style={{ color: '#6B7280', cursor: 'pointer' }} onClick={() => isValidPath && navigate(item.path)}>{item.title}</span>,
              };
            })}
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
