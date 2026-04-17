import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import LoginPage from './pages/login/index';
import AppLayout from './components/layout/AppLayout';
import UsersList from './pages/settings/users/index';
import UserDetail from './pages/settings/users/detail';
import UserForm from './pages/settings/users/form';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={zhCN}
        theme={{
          token: {
            colorPrimary: '#4C6FFF',
            colorBgLayout: '#F5F7FA',
            borderRadius: 8,
            colorBgContainer: '#FFFFFF',
            colorBorder: '#E8E8E8',
            colorTextBase: '#1F1F1F',
          },
        }}
      >
        <BrowserRouter>
          <Routes>
            {/* 公开路由 */}
            <Route path="/login" element={<LoginPage />} />

            {/* 受保护路由：包裹在 AppLayout 内 */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/settings/users" replace />} />
              <Route
                path="/settings/users"
                element={<UsersList />}
                handle={{ breadcrumb: '用户管理' }}
              />
              <Route
                path="/settings/users/create"
                element={<UserForm />}
                handle={{ breadcrumb: '新建用户' }}
              />
              <Route
                path="/settings/users/:id"
                element={<UserDetail />}
                handle={{ breadcrumb: '用户详情' }}
              />
              <Route
                path="/settings/users/:id/edit"
                element={<UserForm />}
                handle={{ breadcrumb: '编辑用户' }}
              />
            </Route>

            {/* 兜底重定向 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
