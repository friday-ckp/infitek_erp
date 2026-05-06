import { useEffect, useState } from 'react';
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
    children: [
      { key: '/shipping-demands', label: '发货需求' },
      { key: '/logistics-orders', label: '物流单' },
    ],
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
    children: [
      { key: '/inventory', label: '库存查询', exact: true },
      { key: '/receipt-orders', label: '收货入库' },
      { key: '/inventory/transactions', label: '库存变动流水' },
    ],
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

const sidebarPalette = {
  shell: '#FBFDFF',
  shellSoft: '#F6F9FF',
  surface: '#FFFFFF',
  surfaceAlt: '#EDF2F8',
  border: '#E1EAF5',
  divider: '#E6EDF6',
  textStrong: '#0F172A',
  textMain: '#334155',
  textMuted: '#475569',
  textSoft: '#94A3B8',
  icon: '#64748B',
  iconHover: '#334155',
  primary: '#2563EB',
  primarySoft: '#EEF4FF',
  primaryBorder: '#DCE8FF',
  submenuLine: '#D7E3F3',
};

function isChildRouteActive(
  currentPath: string,
  childPath: string,
  exact?: boolean,
): boolean {
  if (exact) return currentPath === childPath;
  return currentPath === childPath || currentPath.startsWith(`${childPath}/`);
}

function isExactChild(child: unknown): boolean {
  return (
    typeof child === 'object' &&
    child !== null &&
    'exact' in child &&
    child.exact === true
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const defaultOpen = menuItems
    .filter((item) => item.children.some((c) => isChildRouteActive(location.pathname, c.key, isExactChild(c))))
    .map((item) => item.key);
  const [openKeys, setOpenKeys] = useState<string[]>(defaultOpen);
  const [hoveredFooterBtn, setHoveredFooterBtn] = useState<string | null>(null);

  useEffect(() => {
    if (defaultOpen.length === 0) return;
    setOpenKeys((prev) => {
      const merged = new Set(prev);
      let changed = false;
      defaultOpen.forEach((key) => {
        if (!merged.has(key)) {
          merged.add(key);
          changed = true;
        }
      });
      return changed ? Array.from(merged) : prev;
    });
  }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };
  const displayName = user?.name || '用户';

  const toggleGroup = (key: string) => {
    setOpenKeys((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  // Group menu items by section
  const businessItems = menuItems.filter(i => i.section === SECTION_BUSINESS);
  const systemItems = menuItems.filter(i => i.section === SECTION_SYSTEM);

  const renderMenuGroup = (item: typeof menuItems[0]) => {
    const hasActiveChild = item.children.some((c) => isChildRouteActive(location.pathname, c.key));
    const isOpen = openKeys.includes(item.key);

    if (item.disabled) {
      return (
        <div key={item.key} style={{ opacity: 0.5, pointerEvents: 'none', marginBottom: 6 }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            padding: '11px 12px 11px 14px', borderRadius: 14,
            fontSize: 13.5, fontWeight: 500, color: '#6B7280',
            gap: 10,
            background: 'rgba(255,255,255,0.88)',
            border: `1px solid ${sidebarPalette.divider}`,
          }}>
            <span style={{
              width: 20,
              height: 20,
              borderRadius: 7,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94A3B8',
              background: sidebarPalette.surfaceAlt,
              flexShrink: 0,
            }}>
              {item.icon}
            </span>
            <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{item.label}</span>
            <span style={{
              fontSize: 9, fontWeight: 700,
              lineHeight: 1,
              padding: '3px 6px', borderRadius: 999,
              background: '#F5F3FF', color: '#A78BFA',
              border: '1px solid #DDD6FE',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}>即将上线</span>
          </div>
        </div>
      );
    }

    return (
      <div key={item.key}>
        <ParentItem
          item={item}
          isOpen={isOpen}
          hasActiveChild={hasActiveChild}
          onToggle={() => {
            if (item.defaultPath) {
              if (!hasActiveChild) {
                navigate(item.defaultPath);
              }
              toggleGroup(item.key);
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
          <div style={{
            position: 'relative',
            margin: '2px 0 8px',
            padding: '2px 0 2px 16px',
          }}>
            <div style={{
              position: 'absolute',
              left: 18,
              top: 6,
              bottom: 6,
              width: 1,
              background: `linear-gradient(180deg, ${sidebarPalette.submenuLine} 0%, rgba(215, 227, 243, 0.12) 100%)`,
            }} />
            {item.children.map((child) => {
              const isActive = isChildRouteActive(
                location.pathname,
                child.key,
                isExactChild(child),
              );
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
      background: `linear-gradient(180deg, ${sidebarPalette.shell} 0%, ${sidebarPalette.shellSoft} 100%)`,
      borderRight: `1px solid ${sidebarPalette.border}`,
      display: 'flex', flexDirection: 'column',
      height: '100vh', overflowY: 'auto', flexShrink: 0,
      boxShadow: '0 0 0 1px rgba(255,255,255,0.96) inset',
    }}
      className="sidebar-scroll"
    >
      <style>{`
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: ${sidebarPalette.border}; border-radius: 999px; }
      `}</style>

      {/* Logo */}
      <div style={{
        padding: '11px 16px 5px',
        borderBottom: `1px solid ${sidebarPalette.divider}`,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'radial-gradient(circle at top right, rgba(37, 99, 235, 0.12), transparent 42%), linear-gradient(180deg, #FFFFFF 0%, #F9FBFF 100%)',
      }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: sidebarPalette.textStrong, letterSpacing: '-0.5px' }}>跨境电商 ERP</div>
          <div style={{ fontSize: 10, color: sidebarPalette.textSoft, fontWeight: 700, letterSpacing: '0.08em', marginTop: 1 }}>CROSS-BORDER E-COMMERCE</div>
        </div>
      </div>

      {/* 导航 */}
      <nav style={{
        flex: 1,
        padding: '14px 12px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        <div style={{
          borderRadius: 18,
          background: 'rgba(255,255,255,0.88)',
          border: `1px solid ${sidebarPalette.divider}`,
          padding: '12px 10px 10px',
          boxShadow: '0 12px 26px rgba(148, 163, 184, 0.08)',
        }}>
          <SectionLabel label={SECTION_BUSINESS} />
          {businessItems.map(renderMenuGroup)}
        </div>

        <div style={{
          borderRadius: 18,
          background: 'rgba(255,255,255,0.88)',
          border: `1px solid ${sidebarPalette.divider}`,
          padding: '12px 10px 10px',
          boxShadow: '0 12px 26px rgba(148, 163, 184, 0.08)',
        }}>
          <SectionLabel label={SECTION_SYSTEM} />
          {systemItems.map(renderMenuGroup)}
        </div>
      </nav>

      {/* 底部用户区 */}
      <div style={{
        padding: '0 12px 16px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '11px 12px',
          borderRadius: 16,
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FBFF 100%)',
          border: `1px solid ${sidebarPalette.border}`,
          boxShadow: '0 14px 28px rgba(148, 163, 184, 0.10)',
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 12,
            background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
            color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, flexShrink: 0,
          }}>
            {getInitials(displayName)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: sidebarPalette.textStrong, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </div>
            <div style={{ fontSize: 11, color: sidebarPalette.textSoft, marginTop: 2 }}>管理员</div>
          </div>
          <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
            <button
              title="退出登录"
              onClick={handleLogout}
              style={{
                minWidth: 34, height: 28, borderRadius: 999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: hoveredFooterBtn === 'logout' ? sidebarPalette.primary : sidebarPalette.textSoft,
                background: hoveredFooterBtn === 'logout' ? sidebarPalette.primarySoft : '#EFF5FF',
                border: 'none', cursor: 'pointer',
                transition: 'background 0.12s, color 0.12s',
                padding: '0 9px',
              }}
              onMouseEnter={() => setHoveredFooterBtn('logout')}
              onMouseLeave={() => setHoveredFooterBtn(null)}
            >
              <LogoutIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{
      padding: '2px 8px 10px',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.08em',
      color: sidebarPalette.textSoft,
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
        position: 'relative',
        display: 'flex', alignItems: 'center',
        padding: '11px 12px 11px 14px',
        borderRadius: 14,
        cursor: 'pointer',
        fontSize: 13.5,
        fontWeight: hasActiveChild ? 700 : 600,
        color: hasActiveChild ? sidebarPalette.textStrong : hovered ? sidebarPalette.textMain : sidebarPalette.textMuted,
        background: hasActiveChild
          ? 'linear-gradient(180deg, #EEF4FF 0%, #F7FAFF 100%)'
          : hovered
            ? '#F8FBFF'
            : 'transparent',
        gap: 10,
        transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
        userSelect: 'none',
        marginBottom: 6,
        boxShadow: hasActiveChild
          ? `inset 0 0 0 1px ${sidebarPalette.primaryBorder}, inset 3px 0 0 ${sidebarPalette.primary}`
          : 'none',
      }}
    >
      <span style={{
        width: 20,
        height: 20,
        borderRadius: 7,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: hasActiveChild ? sidebarPalette.primary : hovered ? sidebarPalette.iconHover : sidebarPalette.icon,
        background: hasActiveChild ? sidebarPalette.surface : sidebarPalette.surfaceAlt,
        flexShrink: 0,
        transition: 'color 0.15s',
        boxShadow: hasActiveChild ? '0 6px 14px rgba(37, 99, 235, 0.14)' : 'none',
      }}>
        {item.icon}
      </span>
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.children.length > 0 && (
        <span style={{
          color: sidebarPalette.textSoft,
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
        position: 'relative',
        display: 'flex', alignItems: 'center',
        padding: '8px 12px 8px 18px',
        fontSize: 13,
        color: isActive ? sidebarPalette.primary : hovered ? sidebarPalette.textMain : sidebarPalette.textMuted,
        cursor: 'pointer',
        borderRadius: 12,
        margin: '4px 0 4px 12px',
        fontWeight: isActive ? 700 : 500,
        background: isActive ? '#F3F7FF' : hovered ? '#F8FBFF' : 'transparent',
        border: isActive ? `1px solid ${sidebarPalette.primaryBorder}` : '1px solid transparent',
        transition: 'background 0.12s, color 0.12s',
        userSelect: 'none',
      }}
    >
      <span style={{
        position: 'absolute',
        left: 6,
        top: '50%',
        width: 6,
        height: 6,
        borderRadius: 999,
        background: isActive ? sidebarPalette.primary : '#CBD5E1',
        transform: 'translateY(-50%)',
        boxShadow: isActive ? '0 0 0 4px rgba(37, 99, 235, 0.08)' : 'none',
      }} />
      <span>{label}</span>
    </div>
  );
}
