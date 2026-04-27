import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

const SECTION_BUSINESS = '业务模块';
const SECTION_SYSTEM = '系统功能';

const menuItems = [
  {
    section: SECTION_BUSINESS,
    key: 'dashboard',
    label: '数据看板',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
        <rect x="9" y="1.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
        <rect x="1.5" y="9" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
        <rect x="9" y="9" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
      </svg>
    ),
    children: [{ key: '/', label: '总览' }],
  },
  {
    section: SECTION_BUSINESS,
    key: 'sales',
    label: '销售管理',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 2h7l3 3v9H3V2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
        <path d="M10 2v3h3" stroke="currentColor" strokeWidth="1.3"/>
        <line x1="5" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="5" y1="9.5" x2="9" y2="9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
    children: [{ key: '/sales-orders', label: '销售订单' }],
  },
  {
    section: SECTION_BUSINESS,
    key: 'commerce',
    label: '商务管理',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M1 10l2-5h10l2 5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
        <path d="M1 10c0 1.657 1.343 2 3 2s3-.343 3-2" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M7 10c0 1.657 1.343 2 3 2s3-.343 3-2" stroke="currentColor" strokeWidth="1.3"/>
      </svg>
    ),
    children: [{ key: '/shipping-demands', label: '发货需求' }],
  },
  {
    section: SECTION_BUSINESS,
    key: 'purchase',
    label: '采购管理',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 5h12l-1.5 8H3.5L2 5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
        <path d="M5.5 5V4a2.5 2.5 0 015 0v1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
    children: [{ key: '/purchase-orders', label: '采购订单' }],
  },
  {
    section: SECTION_BUSINESS,
    key: 'product',
    label: '产品管理',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1.5l6 3v6l-6 3-6-3v-6l6-3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
        <path d="M8 1.5v13" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
        <path d="M2 4.5l6 3 6-3" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
      </svg>
    ),
    children: [
      { key: '/master-data/product-categories', label: '产品分类' },
      { key: '/master-data/spus', label: 'SPU 管理' },
      { key: '/master-data/skus', label: 'SKU 管理' },
      { key: '/master-data/certificates', label: '证书管理' },
      { key: '/master-data/spu-faqs', label: 'FAQ 管理' },
      { key: '/master-data/product-documents', label: '资料管理' },
    ],
  },
  {
    section: SECTION_BUSINESS,
    key: 'inventory',
    label: '库存管理',
    defaultPath: '/inventory',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1.5" y="7" width="13" height="7.5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M1 7l7-5.5 7 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
        <rect x="5.5" y="10" width="5" height="4.5" rx=".5" stroke="currentColor" strokeWidth="1.1"/>
      </svg>
    ),
    children: [{ key: '/inventory', label: '库存查询' }],
  },
  {
    section: SECTION_SYSTEM,
    key: 'finance',
    label: '财务管理',
    disabled: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M8 4v8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        <path d="M5.5 6C5.5 5 6.5 4.5 8 4.5s2.5.8 2.5 1.8c0 2.4-5 1.8-5 4.2 0 1.1 1.1 1.8 2.5 1.8s2.5-.6 2.5-1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
    children: [],
  },
  {
    section: SECTION_SYSTEM,
    key: 'master-data',
    label: '基础数据',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M8 1.5v1.3M8 13.2v1.3M1.5 8h1.3M13.2 8h1.3M3.4 3.4l.9.9M11.7 11.7l.9.9M3.4 12.6l.9-.9M11.7 4.3l.9-.9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
    children: [
      { key: '/master-data/units', label: '单位管理' },
      { key: '/master-data/companies', label: '公司主体' },
      { key: '/settings/users', label: '用户管理' },
      { key: '/master-data/warehouses', label: '仓库管理' },
      { key: '/master-data/currencies', label: '币种管理' },
      { key: '/master-data/countries', label: '国家/地区' },
      { key: '/master-data/ports', label: '港口信息' },
      { key: '/master-data/logistics-providers', label: '物流供应商管理' },
      { key: '/master-data/contract-templates', label: '合同条款范本' },
      { key: '/master-data/suppliers', label: '采购供应商管理' },
      { key: '/master-data/customers', label: '客户管理' },
    ],
  },
];

const ChevronIcon = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
    <path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M6 2.5H3a1 1 0 00-1 1v9a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M10.5 11l3-3-3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="13.5" y1="8" x2="6" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

function getInitials(name: string) {
  return name ? name.slice(0, 2).toUpperCase() : 'U';
}

function isChildRouteActive(currentPath: string, childPath: string): boolean {
  return currentPath === childPath || currentPath.startsWith(`${childPath}/`);
}

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const defaultOpen = menuItems
    .filter((item) => item.children.some((c) => isChildRouteActive(location.pathname, c.key)))
    .map((item) => item.key);
  const [openKeys, setOpenKeys] = useState<string[]>(defaultOpen);
  const [hoveredFooterBtn, setHoveredFooterBtn] = useState<string | null>(null);

  const handleLogout = () => { logout(); navigate('/login'); };
  const displayName = user?.name || '用户';

  const toggleGroup = (key: string) => {
    setOpenKeys((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  // Group menu items by section
  const businessItems = menuItems.filter(i => i.section === SECTION_BUSINESS);
  const systemItems = menuItems.filter(i => i.section === SECTION_SYSTEM);

  const renderMenuGroup = (item: typeof menuItems[0]) => {
    const isOpen = openKeys.includes(item.key) || Boolean(item.defaultPath);
    const hasActiveChild = item.children.some((c) => isChildRouteActive(location.pathname, c.key));

    if (item.disabled) {
      return (
        <div key={item.key} style={{ opacity: 0.5, pointerEvents: 'none' }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            padding: '8px 10px', borderRadius: 8,
            fontSize: 13.5, fontWeight: 500, color: '#6B7280',
            gap: 9,
          }}>
            <span style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C4C4C4', flexShrink: 0 }}>
              {item.icon}
            </span>
            <span style={{ flex: 1 }}>{item.label}</span>
            <span style={{
              fontSize: 9.5, fontWeight: 600,
              padding: '2px 7px', borderRadius: 9,
              background: '#F5F3FF', color: '#A78BFA',
              border: '1px solid #DDD6FE',
            }}>即将上线</span>
          </div>
        </div>
      );
    }

    return (
      <div key={item.key} style={{ marginBottom: 1 }}>
        <ParentItem
          item={item}
          isOpen={isOpen}
          hasActiveChild={hasActiveChild}
          onToggle={() => {
            if (item.defaultPath) {
              navigate(item.defaultPath);
              setOpenKeys((prev) => (prev.includes(item.key) ? prev : [...prev, item.key]));
              return;
            }
            if (item.children.length > 0) toggleGroup(item.key);
          }}
        />
        {/* 子菜单动画容器 */}
        <div
          aria-hidden={!isOpen}
          style={{
            display: isOpen ? 'block' : 'none',
            overflow: 'hidden',
            maxHeight: isOpen ? 500 : 0,
            transition: 'max-height 0.25s cubic-bezier(.4,0,.2,1)',
          }}
        >
          <div style={{ padding: '3px 0 6px 0' }}>
            {item.children.map((child) => {
              const isActive = isChildRouteActive(location.pathname, child.key);
              return (
                <ChildItem
                  key={child.key}
                  label={child.label}
                  path={child.key}
                  isActive={isActive}
                  onClick={() => navigate(child.key)}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      width: 220, minWidth: 220,
      background: '#fff',
      borderRight: '1px solid #E2E8F0',
      display: 'flex', flexDirection: 'column',
      height: '100vh', overflowY: 'auto', flexShrink: 0,
    }}
      className="sidebar-scroll"
    >
      <style>{`
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 2px; }
      `}</style>

      {/* Logo */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }}>星辰科技 ERP</div>
          <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700, letterSpacing: '0.5px', marginTop: 1 }}>INFITEK ENTERPRISE</div>
        </div>
      </div>

      {/* 导航 */}
      <nav style={{ flex: 1, padding: '4px 0' }}>
        {/* 业务模块 */}
        <SectionLabel label={SECTION_BUSINESS} />
        {businessItems.map(renderMenuGroup)}

        {/* 分隔线 */}
        <div style={{ height: 1, background: '#F1F5F9', margin: '8px 8px' }} />

        {/* 系统功能 */}
        <SectionLabel label={SECTION_SYSTEM} />
        {systemItems.map(renderMenuGroup)}
      </nav>

      {/* 底部用户区 */}
      <div style={{
        borderTop: '1px solid #F1F5F9',
        padding: '12px 14px',
        display: 'flex', alignItems: 'center', gap: 9,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: '#2563EB',
          color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800, flexShrink: 0,
        }}>
          {getInitials(displayName)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName}
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>管理员</div>
        </div>
        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
          <button
            title="退出登录"
            onClick={handleLogout}
            style={{
              width: 26, height: 26, borderRadius: 7,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: hoveredFooterBtn === 'logout' ? '#2563EB' : '#94A3B8',
              background: hoveredFooterBtn === 'logout' ? '#EFF6FF' : 'transparent',
              border: 'none', cursor: 'pointer',
              transition: 'background 0.12s, color 0.12s',
            }}
            onMouseEnter={() => setHoveredFooterBtn('logout')}
            onMouseLeave={() => setHoveredFooterBtn(null)}
          >
            <LogoutIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{
      display: 'none',
    }}>
      {label}
    </div>
  );
}

function ParentItem({
  item, isOpen, hasActiveChild, onToggle,
}: {
  item: typeof menuItems[0];
  isOpen: boolean;
  hasActiveChild: boolean;
  onToggle: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center',
        padding: '7px 16px', borderRadius: 0,
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: hasActiveChild ? 600 : 500,
        color: hasActiveChild ? '#1E293B' : hovered ? '#1E293B' : '#64748B',
        background: 'transparent',
        gap: 9,
        transition: 'background 0.15s, color 0.15s',
        userSelect: 'none',
      }}
    >
      <span style={{
        width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: hasActiveChild ? '#2563EB' : hovered ? '#475569' : '#94A3B8',
        flexShrink: 0,
        transition: 'color 0.15s',
      }}>
        {item.icon}
      </span>
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.children.length > 0 && (
        <span style={{
          color: hasActiveChild ? '#CBD5E1' : '#CBD5E1',
          flexShrink: 0,
          display: 'flex', alignItems: 'center',
          transform: isOpen ? 'rotate(90deg)' : 'none',
          transition: 'transform 0.22s cubic-bezier(.4,0,.2,1)',
        }}>
          <ChevronIcon />
        </span>
      )}
    </div>
  );
}

function ChildItem({
  label,
  path,
  isActive,
  onClick,
}: {
  label: string;
  path: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      data-menu-path={path}
      data-testid={`sidebar-menu-${path.replace(/^\//, '').replace(/\//g, '-') || 'home'}`}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center',
        padding: '5px 10px 5px 40px',
        fontSize: 13,
        color: isActive ? '#2563EB' : hovered ? '#1E293B' : '#64748B',
        cursor: 'pointer',
        borderRadius: 999,
        margin: '1px 8px',
        fontWeight: isActive ? 600 : 400,
        background: isActive ? '#EEF2FF' : hovered ? '#F1F5F9' : 'transparent',
        transition: 'background 0.12s, color 0.12s',
        userSelect: 'none',
      }}
    >
      {label}
    </div>
  );
}
