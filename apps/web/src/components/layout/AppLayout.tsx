import { Layout, Breadcrumb } from 'antd';
import { Outlet, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { BellOutlined } from '@ant-design/icons';
import DOMPurify from 'dompurify';
import { useAuthStore } from '../../store/auth.store';
import Sidebar from './Sidebar';

const { Content } = Layout;

type BreadcrumbItem = { title: string; path?: string };
type BreadcrumbRoute = { pattern: RegExp; items: BreadcrumbItem[] };

const BASIC_DATA_SECTION_PATH = '/master-data/units';
const PRODUCT_SECTION_PATH = '/master-data/product-categories';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildBreadcrumbItems(
  sectionLabel: string,
  sectionPath: string,
  listLabel: string,
  listPath: string,
  currentLabel?: string,
): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    { title: sectionLabel, path: sectionPath },
    { title: listLabel, path: listPath },
  ];

  if (currentLabel) {
    items.push({ title: currentLabel });
  }

  return items;
}

function createCrudBreadcrumbRoutes(options: {
  basePath: string;
  sectionLabel: string;
  sectionPath: string;
  listLabel: string;
  createLabel?: string;
  detailLabel?: string;
  editLabel?: string;
}): BreadcrumbRoute[] {
  const {
    basePath,
    sectionLabel,
    sectionPath,
    listLabel,
    createLabel,
    detailLabel,
    editLabel,
  } = options;
  const basePattern = escapeRegex(basePath);
  const routes: BreadcrumbRoute[] = [
    {
      pattern: new RegExp(`^${basePattern}$`),
      items: buildBreadcrumbItems(sectionLabel, sectionPath, listLabel, basePath),
    },
  ];

  if (createLabel) {
    routes.push({
      pattern: new RegExp(`^${basePattern}/create$`),
      items: buildBreadcrumbItems(sectionLabel, sectionPath, listLabel, basePath, createLabel),
    });
  }

  if (detailLabel) {
    routes.push({
      pattern: new RegExp(`^${basePattern}/[a-zA-Z0-9\\-_]+$`),
      items: buildBreadcrumbItems(sectionLabel, sectionPath, listLabel, basePath, detailLabel),
    });
  }

  if (editLabel) {
    routes.push({
      pattern: new RegExp(`^${basePattern}/[a-zA-Z0-9\\-_]+/edit$`),
      items: buildBreadcrumbItems(sectionLabel, sectionPath, listLabel, basePath, editLabel),
    });
  }

  return routes;
}

const BREADCRUMB_ROUTES: BreadcrumbRoute[] = [
  ...createCrudBreadcrumbRoutes({
    basePath: '/settings/users',
    sectionLabel: '基础数据',
    sectionPath: BASIC_DATA_SECTION_PATH,
    listLabel: '用户管理',
    createLabel: '新建用户',
    detailLabel: '用户详情',
    editLabel: '编辑用户',
  }),
  ...createCrudBreadcrumbRoutes({
    basePath: '/master-data/units',
    sectionLabel: '基础数据',
    sectionPath: BASIC_DATA_SECTION_PATH,
    listLabel: '单位管理',
    createLabel: '新建单位',
    detailLabel: '单位详情',
    editLabel: '编辑单位',
  }),
  ...createCrudBreadcrumbRoutes({
    basePath: '/master-data/companies',
    sectionLabel: '基础数据',
    sectionPath: BASIC_DATA_SECTION_PATH,
    listLabel: '公司主体管理',
    createLabel: '新建公司主体',
    detailLabel: '公司主体详情',
    editLabel: '编辑公司主体',
  }),
  ...createCrudBreadcrumbRoutes({
    basePath: '/master-data/customers',
    sectionLabel: '基础数据',
    sectionPath: BASIC_DATA_SECTION_PATH,
    listLabel: '客户主数据管理',
    createLabel: '新建客户',
    detailLabel: '客户详情',
    editLabel: '编辑客户',
  }),
  ...createCrudBreadcrumbRoutes({
    basePath: '/master-data/countries',
    sectionLabel: '基础数据',
    sectionPath: BASIC_DATA_SECTION_PATH,
    listLabel: '国家/地区管理',
    createLabel: '新建国家/地区',
    detailLabel: '国家/地区详情',
    editLabel: '编辑国家/地区',
  }),
  ...createCrudBreadcrumbRoutes({
    basePath: '/master-data/currencies',
    sectionLabel: '基础数据',
    sectionPath: BASIC_DATA_SECTION_PATH,
    listLabel: '币种管理',
    createLabel: '新建币种',
    detailLabel: '币种详情',
    editLabel: '编辑币种',
  }),
  ...createCrudBreadcrumbRoutes({
    basePath: '/master-data/contract-templates',
    sectionLabel: '基础数据',
    sectionPath: BASIC_DATA_SECTION_PATH,
    listLabel: '合同条款范本',
    createLabel: '新建条款范本',
    detailLabel: '条款范本详情',
    editLabel: '编辑条款范本',
  }),
  ...createCrudBreadcrumbRoutes({
    basePath: '/master-data/warehouses',
    sectionLabel: '基础数据',
    sectionPath: BASIC_DATA_SECTION_PATH,
    listLabel: '仓库管理',
    createLabel: '新建仓库',
    detailLabel: '仓库详情',
    editLabel: '编辑仓库',
  }),
  ...createCrudBreadcrumbRoutes({
    basePath: '/master-data/product-categories',
    sectionLabel: '产品管理',
    sectionPath: PRODUCT_SECTION_PATH,
    listLabel: '产品分类管理',
    createLabel: '新建产品分类',
    detailLabel: '产品分类详情',
    editLabel: '编辑产品分类',
  }),
  ...createCrudBreadcrumbRoutes({
    basePath: '/master-data/spus',
    sectionLabel: '产品管理',
    sectionPath: PRODUCT_SECTION_PATH,
    listLabel: 'SPU 管理',
    createLabel: '新建 SPU',
    detailLabel: 'SPU 详情',
    editLabel: '编辑 SPU',
  }),
  ...createCrudBreadcrumbRoutes({
    basePath: '/master-data/skus',
    sectionLabel: '产品管理',
    sectionPath: PRODUCT_SECTION_PATH,
    listLabel: 'SKU 管理',
    createLabel: '新建 SKU',
    detailLabel: 'SKU 详情',
    editLabel: '编辑 SKU',
  }),
  ...createCrudBreadcrumbRoutes({
    basePath: '/master-data/certificates',
    sectionLabel: '产品管理',
    sectionPath: PRODUCT_SECTION_PATH,
    listLabel: '证书管理',
    createLabel: '新建证书',
    detailLabel: '证书详情',
    editLabel: '编辑证书',
  }),
  ...createCrudBreadcrumbRoutes({
    basePath: '/master-data/spu-faqs',
    sectionLabel: '产品管理',
    sectionPath: PRODUCT_SECTION_PATH,
    listLabel: 'FAQ 管理',
    createLabel: '新建 FAQ',
    editLabel: '编辑 FAQ',
  }),
  ...createCrudBreadcrumbRoutes({
    basePath: '/master-data/product-documents',
    sectionLabel: '产品管理',
    sectionPath: PRODUCT_SECTION_PATH,
    listLabel: '资料管理',
    createLabel: '新建资料',
    detailLabel: '资料详情',
    editLabel: '编辑资料',
  }),
];

function isValidToken(token: string | null): boolean {
  if (!token || typeof token !== 'string' || token.trim() === '') return false;
  if (token.length < 10 || token.length > 2048) return false;
  return /^[A-Za-z0-9\-_.~+/]+=*$/.test(token);
}

function getBreadcrumbItems(pathname: string): BreadcrumbItem[] {
  if (!pathname || typeof pathname !== 'string') return [];

  const matchedRoute = BREADCRUMB_ROUTES.find((route) => route.pattern.test(pathname));

  if (matchedRoute) {
    return matchedRoute.items;
  }

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
              const isValidPath = typeof item.path === 'string' && /^\/[a-zA-Z0-9\-_/]*$/.test(item.path);
              return {
                title: isLast
                  ? <span style={{ color: '#111827', fontWeight: 600 }}>{item.title}</span>
                  : <span style={{ color: '#6B7280', cursor: isValidPath ? 'pointer' : 'default' }} onClick={() => isValidPath && navigate(item.path!)}>{item.title}</span>,
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
