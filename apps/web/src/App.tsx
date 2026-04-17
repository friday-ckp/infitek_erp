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
            colorPrimary: '#4F46E5',
            colorBgLayout: '#F9FAFB',
            borderRadius: 8,
            colorBgContainer: '#FFFFFF',
            colorBorder: '#E5E7EB',
            colorTextBase: '#111827',
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
              <Route path="/settings/users" element={<UsersList />} />
              <Route path="/settings/users/create" element={<UserForm />} />
              <Route path="/settings/users/:id" element={<UserDetail />} />
              <Route path="/settings/users/:id/edit" element={<UserForm />} />
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
