import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

const menuItems = [
  {
    key: 'sales',
    label: '销售管理',
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
        <path d="M3 2h7l3 3v9H3V2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
        <path d="M10 2v3h3" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
        <line x1="5" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="5" y1="9.5" x2="11" y2="9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="5" y1="12" x2="8.5" y2="12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
    children: [{ key: '/sales-orders', label: '销售订单' }],
  },
  {
    key: 'commerce',
    label: '商务管理',
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
        <path d="M1 10l2-5h10l2 5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
        <path d="M1 10c0 1.657 1.343 2 3 2s3-.343 3-2" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M7 10c0 1.657 1.343 2 3 2s3-.343 3-2" stroke="currentColor" strokeWidth="1.3"/>
      </svg>
    ),
    children: [{ key: '/shipping-demands', label: '发货需求' }],
  },
  {
    key: 'purchase',
    label: '采购管理',
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
        <path d="M2 5h12l-1.5 8H3.5L2 5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
        <path d="M5.5 5V4a2.5 2.5 0 015 0v1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
    children: [{ key: '/purchase-orders', label: '采购订单' }],
  },
  {
    key: 'product',
    label: '产品管理',
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
        <path d="M8 1.5l6 3v6l-6 3-6-3v-6l6-3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
        <path d="M8 1.5v13" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
        <path d="M2 4.5l6 3 6-3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    children: [
      { key: '/products/categories', label: '产品分类' },
      { key: '/products/spus', label: 'SPU 管理' },
      { key: '/products/skus', label: 'SKU 管理' },
    ],
  },
  {
    key: 'inventory',
    label: '库存管理',
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
        <rect x="1.5" y="7" width="13" height="7.5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M1 7l7-5.5 7 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
        <rect x="5.5" y="10" width="5" height="4.5" rx=".5" stroke="currentColor" strokeWidth="1.1"/>
      </svg>
    ),
    children: [{ key: '/inventory', label: '库存查询' }],
  },
  {
    key: 'finance',
    label: '财务管理',
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M8 4v8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        <path d="M5.5 6C5.5 5 6.5 4.5 8 4.5s2.5.8 2.5 1.8c0 2.4-5 1.8-5 4.2 0 1.1 1.1 1.8 2.5 1.8s2.5-.6 2.5-1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
    children: [],
  },
  {
    key: 'master-data',
    label: '基础数据',
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
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
      { key: '/master-data/suppliers', label: '供应商' },
      { key: '/master-data/customers', label: '客户' },
    ],
  },
];

function getInitials(name: string) {
  return name ? name.slice(0, 2).toUpperCase() : 'U';
}

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  // 初始化展开状态：当前路径所在的父菜单默认展开
  const defaultOpen = menuItems
    .filter((item) => item.children.some((c) => c.key === location.pathname))
    .map((item) => item.key);
  const [openKeys, setOpenKeys] = useState<string[]>(defaultOpen);

  const handleLogout = () => { logout(); navigate('/login'); };
  const displayName = user?.name || '用户';

  const toggleGroup = (key: string) => {
    setOpenKeys((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  return (
    <div style={{
      width: 220, minWidth: 220,
      background: '#fff',
      borderRight: '1px solid #E5E7EB',
      display: 'flex', flexDirection: 'column',
      height: '100vh', overflowY: 'auto', flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>星辰科技 ERP</div>
        <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, marginTop: 2 }}>INFITEK ENTERPRISE</div>
      </div>

      {/* 导航 */}
      <div style={{ flex: 1 }}>
        {menuItems.map((item) => {
          const isOpen = openKeys.includes(item.key);
          const hasActiveChild = item.children.some((c) => c.key === location.pathname);

          return (
            <div key={item.key} style={{ padding: '4px 0' }}>
              {/* 一级菜单 */}
              <div
                onClick={() => item.children.length > 0 && toggleGroup(item.key)}
                style={{
                  display: 'flex', alignItems: 'center',
                  padding: '10px 20px',
                  color: isOpen || hasActiveChild ? '#111827' : '#6B7280',
                  cursor: 'pointer',
                  fontSize: 14, gap: 10, fontWeight: 600,
                  transition: 'all .15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#F9FAFB'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
              >
                <span style={{
                  width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: isOpen || hasActiveChild ? 1 : 0.6,
                  color: isOpen || hasActiveChild ? '#4F46E5' : 'currentColor',
                }}>
                  {item.icon}
                </span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.children.length > 0 && (
                  <span style={{
                    fontSize: 10, color: '#9CA3AF',
                    transform: isOpen ? 'rotate(90deg)' : 'none',
                    transition: 'transform .2s',
                    display: 'inline-block',
                  }}>▶</span>
                )}
              </div>

              {/* 二级菜单 */}
              {isOpen && item.children.map((child) => {
                const isActive = location.pathname === child.key;
                return (
                  <div
                    key={child.key}
                    onClick={() => navigate(child.key)}
                    style={{
                      fontSize: 13,
                      padding: '7px 20px 7px 48px',
                      color: isActive ? '#4F46E5' : '#6B7280',
                      cursor: 'pointer',
                      fontWeight: isActive ? 700 : 400,
                      background: isActive ? '#EEF2FF' : 'transparent',
                      position: 'relative',
                      transition: 'all .15s',
                    }}
                    onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLDivElement).style.color = '#111827'; }}
                    onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLDivElement).style.color = '#6B7280'; }}
                  >
                    {isActive && (
                      <span style={{
                        position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)',
                        width: 4, height: 4, borderRadius: '50%', background: '#4F46E5',
                      }} />
                    )}
                    {child.label}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* 底部用户信息 */}
      <div style={{
        marginTop: 'auto',
        borderTop: '1px solid #F3F4F6',
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 8,
          background: '#4F46E5', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 800, flexShrink: 0,
        }}>
          {getInitials(displayName)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName}
          </div>
          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>管理员</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {/* 设置图标 */}
          <span title="设置" style={{ color: '#9CA3AF', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLSpanElement).style.color = '#4F46E5'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLSpanElement).style.color = '#9CA3AF'; }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M8 2v1.1M8 12.9V14M2 8h1.1M12.9 8H14M3.6 3.6l.8.8M11.6 11.6l.8.8M3.6 12.4l.8-.8M11.6 4.4l.8-.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </span>
          {/* 退出图标 */}
          <span title="退出登录" onClick={handleLogout} style={{ color: '#9CA3AF', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLSpanElement).style.color = '#4F46E5'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLSpanElement).style.color = '#9CA3AF'; }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M6 2.5H3a1 1 0 00-1 1v9a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <path d="M10.5 11l3-3-3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="13.5" y1="8" x2="6" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}
