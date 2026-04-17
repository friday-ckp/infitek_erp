import { Layout, Menu, Avatar, Button, Tooltip } from 'antd';
import {
  ShoppingOutlined,
  DeploymentUnitOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  InboxOutlined,
  AccountBookOutlined,
  DatabaseOutlined,
  LogoutOutlined,
  UserOutlined,
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
    if (key.startsWith('/')) {
      navigate(key);
    }
  };

  // 根据当前路径确定选中的菜单项
  const selectedKeys = [location.pathname];
  // 根据当前路径确定展开的父菜单
  const openKeys = menuItems
    .filter((item) => item.children?.some((child) => child.key === location.pathname))
    .map((item) => item.key);

  return (
    <Sider
      width={220}
      collapsedWidth={64}
      collapsed={sidebarCollapsed}
      style={{
        background: '#fff',
        borderRight: '1px solid #E8E8E8',
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
          height: 56,
          display: 'flex',
          alignItems: 'center',
          padding: sidebarCollapsed ? '0 20px' : '0 20px',
          borderBottom: '1px solid #E8E8E8',
          gap: 10,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            background: '#4C6FFF',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          I
        </div>
        {!sidebarCollapsed && (
          <span style={{ fontWeight: 700, fontSize: 15, color: '#1F1F1F', whiteSpace: 'nowrap' }}>
            Infitek ERP
          </span>
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
        />
      </div>

      {/* 底部用户信息区 */}
      <div
        style={{
          borderTop: '1px solid #E8E8E8',
          padding: sidebarCollapsed ? '12px 16px' : '12px 16px',
          flexShrink: 0,
        }}
      >
        {sidebarCollapsed ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Tooltip title={user?.name || '用户'} placement="right">
              <Avatar size={32} icon={<UserOutlined />} style={{ background: '#4C6FFF', cursor: 'pointer' }} />
            </Tooltip>
            <Tooltip title="退出登录" placement="right">
              <Button
                type="text"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                size="small"
                style={{ color: '#666' }}
              />
            </Tooltip>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar size={32} icon={<UserOutlined />} style={{ background: '#4C6FFF', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1F1F1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || '用户'}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>管理员</div>
            </div>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              size="small"
              danger
              style={{ flexShrink: 0 }}
            >
              退出
            </Button>
          </div>
        )}

        {/* 折叠切换按钮 */}
        <div style={{ marginTop: 8, textAlign: 'center' }}>
          <Button
            type="text"
            icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            size="small"
            style={{ color: '#666', width: '100%' }}
          />
        </div>
      </div>
    </Sider>
  );
}
