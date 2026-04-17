import { Layout, Menu, Tooltip } from 'antd';
import {
  ShoppingOutlined,
  DeploymentUnitOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  InboxOutlined,
  AccountBookOutlined,
  DatabaseOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { useLayoutStore } from '../../store/layout.store';

const { Sider } = Layout;

const menuItems = [
  {
    key: 'sales',
    icon: <ShoppingOutlined />,
    label: '销售管理',
    children: [{ key: '/sales-orders', label: '销售订单' }],
  },
  {
    key: 'commerce',
    icon: <DeploymentUnitOutlined />,
    label: '商务管理',
    children: [{ key: '/shipping-demands', label: '发货需求' }],
  },
  {
    key: 'purchase',
    icon: <ShoppingCartOutlined />,
    label: '采购管理',
    children: [{ key: '/purchase-orders', label: '采购订单' }],
  },
  {
    key: 'product',
    icon: <AppstoreOutlined />,
    label: '产品管理',
    children: [
      { key: '/products/categories', label: '产品分类' },
      { key: '/products/spus', label: 'SPU 管理' },
      { key: '/products/skus', label: 'SKU 管理' },
    ],
  },
  {
    key: 'inventory',
    icon: <InboxOutlined />,
    label: '库存管理',
    children: [{ key: '/inventory', label: '库存查询' }],
  },
  {
    key: 'finance',
    icon: <AccountBookOutlined />,
    label: '财务管理',
    children: [],
  },
  {
    key: 'master-data',
    icon: <DatabaseOutlined />,
    label: '基础数据',
    children: [
      { key: '/settings/users', label: '用户管理' },
      { key: '/master-data/warehouses', label: '仓库管理' },
      { key: '/master-data/currencies', label: '币种管理' },
      { key: '/master-data/countries', label: '国家/地区' },
      { key: '/master-data/suppliers', label: '供应商' },
      { key: '/master-data/customers', label: '客户' },
    ],
  },
];

// 用户名首字母头像
function getInitials(name: string) {
  return name ? name.slice(0, 2).toUpperCase() : 'U';
}

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, setSidebarCollapsed } = useLayoutStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key.startsWith('/')) navigate(key);
  };

  const selectedKeys = [location.pathname];
  const openKeys = menuItems
    .filter((item) => item.children?.some((child) => child.key === location.pathname))
    .map((item) => item.key);

  const displayName = user?.name || '用户';

  return (
    <Sider
      width={220}
      collapsedWidth={64}
      collapsed={sidebarCollapsed}
      style={{
        background: '#fff',
        borderRight: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        overflow: 'hidden',
      }}
    >
      {/* Logo 区域 */}
      <div
        style={{
          padding: sidebarCollapsed ? '20px 0' : '24px 20px',
          borderBottom: '1px solid #F3F4F6',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            background: '#4F46E5',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          I
        </div>
        {!sidebarCollapsed && (
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#111827', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
              星辰科技 ERP
            </div>
            <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, marginTop: 2 }}>
              INFITEK ENTERPRISE
            </div>
          </div>
        )}
      </div>

      {/* 导航菜单 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          defaultOpenKeys={sidebarCollapsed ? [] : openKeys}
          inlineCollapsed={sidebarCollapsed}
          items={menuItems.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
            children: item.children.length > 0 ? item.children : undefined,
          }))}
          onClick={handleMenuClick}
          style={{ border: 'none', fontSize: 14 }}
          theme="light"
        />
      </div>

      {/* 底部用户信息区 */}
      <div
        style={{
          marginTop: 'auto',
          borderTop: '1px solid #F3F4F6',
          padding: '14px 16px',
          flexShrink: 0,
        }}
      >
        {sidebarCollapsed ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <Tooltip title={displayName} placement="right">
              <div
                style={{
                  width: 34, height: 34, borderRadius: 8,
                  background: '#4F46E5', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800, cursor: 'pointer', flexShrink: 0,
                }}
              >
                {getInitials(displayName)}
              </div>
            </Tooltip>
            <Tooltip title="退出登录" placement="right">
              <LogoutOutlined
                onClick={handleLogout}
                style={{ color: '#9CA3AF', cursor: 'pointer', fontSize: 15 }}
              />
            </Tooltip>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34, height: 34, borderRadius: 8,
                background: '#4F46E5', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800, flexShrink: 0,
              }}
            >
              {getInitials(displayName)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName}
              </div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>管理员</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <Tooltip title="设置">
                <SettingOutlined style={{ color: '#9CA3AF', cursor: 'pointer', fontSize: 15 }} />
              </Tooltip>
              <Tooltip title="退出登录">
                <LogoutOutlined
                  onClick={handleLogout}
                  style={{ color: '#9CA3AF', cursor: 'pointer', fontSize: 15 }}
                />
              </Tooltip>
            </div>
          </div>
        )}

        {/* 折叠切换 */}
        <div
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{
            marginTop: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9CA3AF',
            cursor: 'pointer',
            fontSize: 13,
            padding: '4px 0',
          }}
        >
          {sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </div>
      </div>
    </Sider>
  );
}
