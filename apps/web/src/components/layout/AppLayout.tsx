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
  '/master-data/companies': { label: '公司主体管理', parent: '/master-data', parentLabel: '基础数据' },
  '/master-data/companies/create': { label: '新建公司主体', parent: '/master-data/companies', parentLabel: '公司主体管理' },
  '/master-data/countries': { label: '国家/地区管理', parent: '/master-data', parentLabel: '基础数据' },
  '/master-data/countries/create': { label: '新建国家/地区', parent: '/master-data/countries', parentLabel: '国家/地区管理' },
  '/master-data/currencies': { label: '币种管理', parent: '/master-data', parentLabel: '基础数据' },
  '/master-data/currencies/create': { label: '新建币种', parent: '/master-data/currencies', parentLabel: '币种管理' },
  '/master-data/warehouses': { label: '仓库管理', parent: '/master-data', parentLabel: '基础数据' },
  '/master-data/warehouses/create': { label: '新建仓库', parent: '/master-data/warehouses', parentLabel: '仓库管理' },
  '/master-data/product-categories': { label: '产品分类管理', parent: '/master-data', parentLabel: '基础数据' },
  '/master-data/spus': { label: 'SPU 管理', parent: '/master-data/product', parentLabel: '产品管理' },
  '/master-data/skus': { label: 'SKU 管理', parent: '/master-data/product', parentLabel: '产品管理' },
  '/master-data/certificates': { label: '证书管理', parent: '/master-data/product', parentLabel: '产品管理' },
  '/master-data/spu-faqs': { label: 'FAQ 管理', parent: '/master-data/product', parentLabel: '产品管理' },
  '/master-data/product-documents': { label: '资料管理', parent: '/master-data/product', parentLabel: '产品管理' },
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
  const companyEditMatch = pathname.match(/^\/master-data\/companies\/([a-zA-Z0-9\-_]+)\/edit$/);
  if (companyEditMatch && companyEditMatch[1]) return [
    { title: '基础数据', path: '/master-data' },
    { title: '公司主体管理', path: '/master-data/companies' },
    { title: '编辑公司主体', path: pathname },
  ];
  const companyDetailMatch = pathname.match(/^\/master-data\/companies\/([a-zA-Z0-9\-_]+)$/);
  if (companyDetailMatch && companyDetailMatch[1]) return [
    { title: '基础数据', path: '/master-data' },
    { title: '公司主体管理', path: '/master-data/companies' },
    { title: '公司主体详情', path: pathname },
  ];
  const countryEditMatch = pathname.match(/^\/master-data\/countries\/([a-zA-Z0-9\-_]+)\/edit$/);
  if (countryEditMatch && countryEditMatch[1]) return [
    { title: '基础数据', path: '/master-data' },
    { title: '国家/地区管理', path: '/master-data/countries' },
    { title: '编辑国家/地区', path: pathname },
  ];
  const countryDetailMatch = pathname.match(/^\/master-data\/countries\/([a-zA-Z0-9\-_]+)$/);
  if (countryDetailMatch && countryDetailMatch[1]) return [
    { title: '基础数据', path: '/master-data' },
    { title: '国家/地区管理', path: '/master-data/countries' },
    { title: '国家/地区详情', path: pathname },
  ];
  const currencyEditMatch = pathname.match(/^\/master-data\/currencies\/([a-zA-Z0-9\-_]+)\/edit$/);
  if (currencyEditMatch && currencyEditMatch[1]) return [
    { title: '基础数据', path: '/master-data' },
    { title: '币种管理', path: '/master-data/currencies' },
    { title: '编辑币种', path: pathname },
  ];
  const currencyDetailMatch = pathname.match(/^\/master-data\/currencies\/([a-zA-Z0-9\-_]+)$/);
  if (currencyDetailMatch && currencyDetailMatch[1]) return [
    { title: '基础数据', path: '/master-data' },
    { title: '币种管理', path: '/master-data/currencies' },
    { title: '币种详情', path: pathname },
  ];
  const warehouseEditMatch = pathname.match(/^\/master-data\/warehouses\/([a-zA-Z0-9\-_]+)\/edit$/);
  if (warehouseEditMatch && warehouseEditMatch[1]) return [
    { title: '基础数据', path: '/master-data' },
    { title: '仓库管理', path: '/master-data/warehouses' },
    { title: '编辑仓库', path: pathname },
  ];
  const warehouseDetailMatch = pathname.match(/^\/master-data\/warehouses\/([a-zA-Z0-9\-_]+)$/);
  if (warehouseDetailMatch && warehouseDetailMatch[1]) return [
    { title: '基础数据', path: '/master-data' },
    { title: '仓库管理', path: '/master-data/warehouses' },
    { title: '仓库详情', path: pathname },
  ];
  const productCategoryEditMatch = pathname.match(/^\/master-data\/product-categories\/([a-zA-Z0-9\-_]+)\/edit$/);
  if (productCategoryEditMatch && productCategoryEditMatch[1]) return [
    { title: '基础数据', path: '/master-data' },
    { title: '产品分类管理', path: '/master-data/product-categories' },
    { title: '编辑产品分类', path: pathname },
  ];
  const productCategoryDetailMatch = pathname.match(/^\/master-data\/product-categories\/([a-zA-Z0-9\-_]+)$/);
  if (productCategoryDetailMatch && productCategoryDetailMatch[1]) return [
    { title: '基础数据', path: '/master-data' },
    { title: '产品分类管理', path: '/master-data/product-categories' },
    { title: '产品分类详情', path: pathname },
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
