import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App as AntdApp, ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import React, { type ReactNode } from "react";
import LoginPage from "./pages/login/index";
import AppLayout from "./components/layout/AppLayout";
import { AntdInitializer } from "./components/AntdInitializer";
import UsersList from "./pages/settings/users/index";
import UserDetail from "./pages/settings/users/detail";
import UserForm from "./pages/settings/users/form";
import UnitsListPage from "./pages/master-data/units/index";
import UnitDetailPage from "./pages/master-data/units/detail";
import UnitFormPage from "./pages/master-data/units/form";
import WarehousesListPage from "./pages/master-data/warehouses/index";
import WarehouseDetailPage from "./pages/master-data/warehouses/detail";
import WarehouseFormPage from "./pages/master-data/warehouses/form";
import CurrenciesListPage from "./pages/master-data/currencies/index";
import CurrencyDetailPage from "./pages/master-data/currencies/detail";
import CurrencyFormPage from "./pages/master-data/currencies/form";
import CountriesListPage from "./pages/master-data/countries/index";
import CountryDetailPage from "./pages/master-data/countries/detail";
import CountryFormPage from "./pages/master-data/countries/form";
import CompaniesListPage from "./pages/master-data/companies/index";
import CompanyDetailPage from "./pages/master-data/companies/detail";
import CompanyFormPage from "./pages/master-data/companies/form";
import PortsListPage from "./pages/master-data/ports/index";
import PortDetailPage from "./pages/master-data/ports/detail";
import PortFormPage from "./pages/master-data/ports/form";
import LogisticsProvidersListPage from "./pages/master-data/logistics-providers/index";
import LogisticsProviderDetailPage from "./pages/master-data/logistics-providers/detail";
import LogisticsProviderFormPage from "./pages/master-data/logistics-providers/form";
import SuppliersListPage from "./pages/master-data/suppliers/index";
import SupplierDetailPage from "./pages/master-data/suppliers/detail";
import SupplierFormPage from "./pages/master-data/suppliers/form";
import CustomersListPage from "./pages/master-data/customers/index";
import CustomerDetailPage from "./pages/master-data/customers/detail";
import CustomerFormPage from "./pages/master-data/customers/form";
import ProductCategoriesPage from "./pages/master-data/product-categories/index";
import ProductCategoryFormPage from "./pages/master-data/product-categories/form";
import SpusListPage from "./pages/master-data/spus/index";
import SpuDetailPage from "./pages/master-data/spus/detail";
import SpuFormPage from "./pages/master-data/spus/form";
import SkusListPage from "./pages/master-data/skus/index";
import SkuDetailPage from "./pages/master-data/skus/detail";
import SkuFormPage from "./pages/master-data/skus/form";
import CertificatesListPage from "./pages/master-data/certificates/index";
import CertificateDetailPage from "./pages/master-data/certificates/detail";
import CertificateFormPage from "./pages/master-data/certificates/form";
import SpuFaqsListPage from "./pages/master-data/spu-faqs/index";
import SpuFaqFormPage from "./pages/master-data/spu-faqs/form";
import ProductDocumentsListPage from "./pages/master-data/product-documents/index";
import ProductDocumentDetailPage from "./pages/master-data/product-documents/detail";
import ProductDocumentFormPage from "./pages/master-data/product-documents/form";
import ContractTemplatesListPage from "./pages/master-data/contract-templates/index";
import ContractTemplateDetailPage from "./pages/master-data/contract-templates/detail";
import ContractTemplateFormPage from "./pages/master-data/contract-templates/form";
import SalesOrdersListPage from "./pages/sales-orders/index";
import SalesOrderFormPage from "./pages/sales-orders/form";
import SalesOrderDetailPage from "./pages/sales-orders/detail";
import ShippingDemandsListPage from "./pages/shipping-demands/index";
import ShippingDemandDetailPage from "./pages/shipping-demands/detail";
import ShippingDemandFormPage from "./pages/shipping-demands/form";
import LogisticsOrderFormPage from "./pages/logistics-orders/form";
import PurchaseOrderFormPage, {
  PurchaseOrdersPlaceholderPage,
} from "./pages/purchase-orders/form";
import InventoryPage from "./pages/inventory/index";
import InventoryTransactionsPage from "./pages/inventory/transactions";
import HomePage from "./pages/home/index";
import "./App.css";

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

class ErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("App error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, textAlign: "center" }}>
          应用出错，请刷新页面
        </div>
      );
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
              colorPrimary: "#2563EB",
              colorPrimaryHover: "#1D4ED8",
              colorBgLayout: "#F8FAFC",
              borderRadius: 8,
              borderRadiusLG: 12,
              colorBgContainer: "#FFFFFF",
              colorBorder: "#E2E8F0",
              colorTextBase: "#1E293B",
              colorTextSecondary: "#64748B",
              boxShadowTertiary:
                "0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04)",
            },
            components: {
              Button: {
                controlHeight: 34,
                fontWeight: 500,
              },
              Input: {
                controlHeight: 36,
              },
              Select: {
                controlHeight: 36,
              },
              Tabs: {
                itemColor: "#64748B",
                itemSelectedColor: "#2563EB",
                inkBarColor: "#2563EB",
              },
              Breadcrumb: {
                itemColor: "#94A3B8",
                lastItemColor: "#1E293B",
                linkColor: "#94A3B8",
                separatorColor: "#CBD5E1",
              },
              Table: {
                headerBg: "#F8FAFC",
                headerColor: "#64748B",
              },
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
                  <Route path="/" element={<HomePage />} />
                  <Route path="/settings/users" element={<UsersList />} />
                  <Route path="/settings/users/create" element={<UserForm />} />
                  <Route path="/settings/users/:id" element={<UserDetail />} />
                  <Route
                    path="/settings/users/:id/edit"
                    element={<UserForm />}
                  />
                  <Route
                    path="/master-data/units"
                    element={<UnitsListPage />}
                  />
                  <Route
                    path="/master-data/units/create"
                    element={<UnitFormPage />}
                  />
                  <Route
                    path="/master-data/units/:id"
                    element={<UnitDetailPage />}
                  />
                  <Route
                    path="/master-data/units/:id/edit"
                    element={<UnitFormPage />}
                  />
                  <Route
                    path="/master-data/warehouses"
                    element={<WarehousesListPage />}
                  />
                  <Route
                    path="/master-data/warehouses/create"
                    element={<WarehouseFormPage />}
                  />
                  <Route
                    path="/master-data/warehouses/:id"
                    element={<WarehouseDetailPage />}
                  />
                  <Route
                    path="/master-data/warehouses/:id/edit"
                    element={<WarehouseFormPage />}
                  />
                  <Route
                    path="/master-data/currencies"
                    element={<CurrenciesListPage />}
                  />
                  <Route
                    path="/master-data/currencies/create"
                    element={<CurrencyFormPage />}
                  />
                  <Route
                    path="/master-data/currencies/:id"
                    element={<CurrencyDetailPage />}
                  />
                  <Route
                    path="/master-data/currencies/:id/edit"
                    element={<CurrencyFormPage />}
                  />
                  <Route
                    path="/master-data/countries"
                    element={<CountriesListPage />}
                  />
                  <Route
                    path="/master-data/countries/create"
                    element={<CountryFormPage />}
                  />
                  <Route
                    path="/master-data/countries/:id"
                    element={<CountryDetailPage />}
                  />
                  <Route
                    path="/master-data/countries/:id/edit"
                    element={<CountryFormPage />}
                  />
                  <Route
                    path="/master-data/companies"
                    element={<CompaniesListPage />}
                  />
                  <Route
                    path="/master-data/companies/create"
                    element={<CompanyFormPage />}
                  />
                  <Route
                    path="/master-data/companies/:id"
                    element={<CompanyDetailPage />}
                  />
                  <Route
                    path="/master-data/companies/:id/edit"
                    element={<CompanyFormPage />}
                  />
                  <Route
                    path="/master-data/ports"
                    element={<PortsListPage />}
                  />
                  <Route
                    path="/master-data/ports/create"
                    element={<PortFormPage />}
                  />
                  <Route
                    path="/master-data/ports/:id"
                    element={<PortDetailPage />}
                  />
                  <Route
                    path="/master-data/ports/:id/edit"
                    element={<PortFormPage />}
                  />
                  <Route
                    path="/master-data/logistics-providers"
                    element={<LogisticsProvidersListPage />}
                  />
                  <Route
                    path="/master-data/logistics-providers/create"
                    element={<LogisticsProviderFormPage />}
                  />
                  <Route
                    path="/master-data/logistics-providers/:id"
                    element={<LogisticsProviderDetailPage />}
                  />
                  <Route
                    path="/master-data/logistics-providers/:id/edit"
                    element={<LogisticsProviderFormPage />}
                  />
                  <Route
                    path="/master-data/suppliers"
                    element={<SuppliersListPage />}
                  />
                  <Route
                    path="/master-data/suppliers/create"
                    element={<SupplierFormPage />}
                  />
                  <Route
                    path="/master-data/suppliers/:id"
                    element={<SupplierDetailPage />}
                  />
                  <Route
                    path="/master-data/suppliers/:id/edit"
                    element={<SupplierFormPage />}
                  />
                  <Route
                    path="/master-data/customers"
                    element={<CustomersListPage />}
                  />
                  <Route
                    path="/master-data/customers/create"
                    element={<CustomerFormPage />}
                  />
                  <Route
                    path="/master-data/customers/:id"
                    element={<CustomerDetailPage />}
                  />
                  <Route
                    path="/master-data/customers/:id/edit"
                    element={<CustomerFormPage />}
                  />
                  <Route
                    path="/master-data/product-categories"
                    element={<ProductCategoriesPage />}
                  />
                  <Route
                    path="/master-data/product-categories/create"
                    element={<ProductCategoryFormPage />}
                  />
                  <Route
                    path="/master-data/product-categories/:id/edit"
                    element={<ProductCategoryFormPage />}
                  />
                  <Route
                    path="/products/categories"
                    element={
                      <Navigate to="/master-data/product-categories" replace />
                    }
                  />
                  <Route path="/master-data/spus" element={<SpusListPage />} />
                  <Route
                    path="/master-data/spus/create"
                    element={<SpuFormPage />}
                  />
                  <Route
                    path="/master-data/spus/:id"
                    element={<SpuDetailPage />}
                  />
                  <Route
                    path="/master-data/spus/:id/edit"
                    element={<SpuFormPage />}
                  />
                  <Route path="/master-data/skus" element={<SkusListPage />} />
                  <Route
                    path="/master-data/skus/create"
                    element={<SkuFormPage />}
                  />
                  <Route
                    path="/master-data/skus/:id"
                    element={<SkuDetailPage />}
                  />
                  <Route
                    path="/master-data/skus/:id/edit"
                    element={<SkuFormPage />}
                  />
                  <Route
                    path="/master-data/certificates"
                    element={<CertificatesListPage />}
                  />
                  <Route
                    path="/master-data/certificates/create"
                    element={<CertificateFormPage />}
                  />
                  <Route
                    path="/master-data/certificates/:id"
                    element={<CertificateDetailPage />}
                  />
                  <Route
                    path="/master-data/certificates/:id/edit"
                    element={<CertificateFormPage />}
                  />
                  <Route
                    path="/master-data/spu-faqs"
                    element={<SpuFaqsListPage />}
                  />
                  <Route
                    path="/master-data/spu-faqs/create"
                    element={<SpuFaqFormPage />}
                  />
                  <Route
                    path="/master-data/spu-faqs/:id/edit"
                    element={<SpuFaqFormPage />}
                  />
                  <Route
                    path="/master-data/product-documents"
                    element={<ProductDocumentsListPage />}
                  />
                  <Route
                    path="/master-data/product-documents/create"
                    element={<ProductDocumentFormPage />}
                  />
                  <Route
                    path="/master-data/product-documents/:id"
                    element={<ProductDocumentDetailPage />}
                  />
                  <Route
                    path="/master-data/product-documents/:id/edit"
                    element={<ProductDocumentFormPage />}
                  />
                  <Route
                    path="/master-data/contract-templates"
                    element={<ContractTemplatesListPage />}
                  />
                  <Route
                    path="/master-data/contract-templates/create"
                    element={<ContractTemplateFormPage />}
                  />
                  <Route
                    path="/master-data/contract-templates/:id"
                    element={<ContractTemplateDetailPage />}
                  />
                  <Route
                    path="/master-data/contract-templates/:id/edit"
                    element={<ContractTemplateFormPage />}
                  />
                  <Route
                    path="/sales-orders"
                    element={<SalesOrdersListPage />}
                  />
                  <Route
                    path="/sales-orders/create"
                    element={<SalesOrderFormPage />}
                  />
                  <Route
                    path="/sales-orders/:id/edit"
                    element={<SalesOrderFormPage />}
                  />
                  <Route
                    path="/sales-orders/:id"
                    element={<SalesOrderDetailPage />}
                  />
                  <Route
                    path="/shipping-demands"
                    element={<ShippingDemandsListPage />}
                  />
                  <Route
                    path="/shipping-demands/:id/edit"
                    element={<ShippingDemandFormPage />}
                  />
                  <Route
                    path="/shipping-demands/:id"
                    element={<ShippingDemandDetailPage />}
                  />
                  <Route
                    path="/logistics-orders/create"
                    element={<LogisticsOrderFormPage />}
                  />
                  <Route
                    path="/purchase-orders"
                    element={<PurchaseOrdersPlaceholderPage />}
                  />
                  <Route
                    path="/purchase-orders/new"
                    element={<PurchaseOrderFormPage />}
                  />
                  <Route
                    path="/purchase-orders/create"
                    element={<PurchaseOrderFormPage />}
                  />
                  <Route
                    path="/inventory/transactions"
                    element={<InventoryTransactionsPage />}
                  />
                  <Route path="/inventory" element={<InventoryPage />} />
                  <Route path="/inventory/*" element={<InventoryPage />} />
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
