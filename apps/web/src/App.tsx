import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, message } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import React, { type ReactNode } from 'react';
import LoginPage from './pages/login/index';
import AppLayout from './components/layout/AppLayout';
import UsersList from './pages/settings/users/index';
import UserDetail from './pages/settings/users/detail';
import UserForm from './pages/settings/users/form';
import UnitsListPage from './pages/master-data/units/index';
import UnitDetailPage from './pages/master-data/units/detail';
import UnitFormPage from './pages/master-data/units/form';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

queryClient.setDefaultOptions({
  queries: {
    retry: 1,
    staleTime: 30_000,
  },
  mutations: {
    onError: (error: any) => {
      const msg = error?.response?.data?.message || '操作失败，请重试';
      message.error(msg);
    },
  },
});

class ErrorBoundary extends React.Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('App error:', error);
  }

  render() {
    if (this.state.hasError) {
      return <div style={{ padding: 20, textAlign: 'center' }}>应用出错，请刷新页面</div>;
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
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
                <Route path="/master-data/units" element={<UnitsListPage />} />
                <Route path="/master-data/units/create" element={<UnitFormPage />} />
                <Route path="/master-data/units/:id" element={<UnitDetailPage />} />
                <Route path="/master-data/units/:id/edit" element={<UnitFormPage />} />
              </Route>

              {/* 兜底重定向 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ConfigProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
