import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntdApp, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import React, { type ReactNode } from 'react';
import LoginPage from './pages/login/index';
import AppLayout from './components/layout/AppLayout';
import { AntdInitializer } from './components/AntdInitializer';
import UsersList from './pages/settings/users/index';
import UserDetail from './pages/settings/users/detail';
import UserForm from './pages/settings/users/form';
import UnitsListPage from './pages/master-data/units/index';
import UnitDetailPage from './pages/master-data/units/detail';
import UnitFormPage from './pages/master-data/units/form';
import WarehousesListPage from './pages/master-data/warehouses/index';
import WarehouseDetailPage from './pages/master-data/warehouses/detail';
import WarehouseFormPage from './pages/master-data/warehouses/form';
import CurrenciesListPage from './pages/master-data/currencies/index';
import CurrencyDetailPage from './pages/master-data/currencies/detail';
import CurrencyFormPage from './pages/master-data/currencies/form';
import CountriesListPage from './pages/master-data/countries/index';
import CountryDetailPage from './pages/master-data/countries/detail';
import CountryFormPage from './pages/master-data/countries/form';
import CompaniesListPage from './pages/master-data/companies/index';
import CompanyDetailPage from './pages/master-data/companies/detail';
import CompanyFormPage from './pages/master-data/companies/form';
import ProductCategoriesPage from './pages/master-data/product-categories/index';
import ProductCategoryFormPage from './pages/master-data/product-categories/form';
import SpusListPage from './pages/master-data/spus/index';
import SpuDetailPage from './pages/master-data/spus/detail';
import SpuFormPage from './pages/master-data/spus/form';
import SkusListPage from './pages/master-data/skus/index';
import SkuDetailPage from './pages/master-data/skus/detail';
import SkuFormPage from './pages/master-data/skus/form';
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
          <AntdApp>
            <AntdInitializer />
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
                <Route path="/master-data/warehouses" element={<WarehousesListPage />} />
                <Route path="/master-data/warehouses/create" element={<WarehouseFormPage />} />
                <Route path="/master-data/warehouses/:id" element={<WarehouseDetailPage />} />
                <Route path="/master-data/warehouses/:id/edit" element={<WarehouseFormPage />} />
                <Route path="/master-data/currencies" element={<CurrenciesListPage />} />
                <Route path="/master-data/currencies/create" element={<CurrencyFormPage />} />
                <Route path="/master-data/currencies/:id" element={<CurrencyDetailPage />} />
                <Route path="/master-data/currencies/:id/edit" element={<CurrencyFormPage />} />
                <Route path="/master-data/countries" element={<CountriesListPage />} />
                <Route path="/master-data/countries/create" element={<CountryFormPage />} />
                <Route path="/master-data/countries/:id" element={<CountryDetailPage />} />
                <Route path="/master-data/countries/:id/edit" element={<CountryFormPage />} />
                <Route path="/master-data/companies" element={<CompaniesListPage />} />
                <Route path="/master-data/companies/create" element={<CompanyFormPage />} />
                <Route path="/master-data/companies/:id" element={<CompanyDetailPage />} />
                <Route path="/master-data/companies/:id/edit" element={<CompanyFormPage />} />
                <Route path="/master-data/product-categories" element={<ProductCategoriesPage />} />
                <Route path="/master-data/product-categories/create" element={<ProductCategoryFormPage />} />
                <Route path="/master-data/product-categories/:id/edit" element={<ProductCategoryFormPage />} />
                <Route path="/products/categories" element={<Navigate to="/master-data/product-categories" replace />} />
                <Route path="/master-data/spus" element={<SpusListPage />} />
                <Route path="/master-data/spus/create" element={<SpuFormPage />} />
                <Route path="/master-data/spus/:id" element={<SpuDetailPage />} />
                <Route path="/master-data/spus/:id/edit" element={<SpuFormPage />} />
                <Route path="/master-data/skus" element={<SkusListPage />} />
                <Route path="/master-data/skus/create" element={<SkuFormPage />} />
                <Route path="/master-data/skus/:id" element={<SkuDetailPage />} />
                <Route path="/master-data/skus/:id/edit" element={<SkuFormPage />} />
              </Route>

              {/* 兜底重定向 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          </AntdApp>
        </ConfigProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
