import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import LoginPage from './pages/LoginPage'
import UsersPage from './pages/UsersPage'
import UserDetailPage from './pages/UserDetailPage'
import UserFormPage from './pages/UserFormPage'
import './App.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('token'))

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#4C6FFF', borderRadius: 10 } }}>
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={isAuthenticated ? <Navigate to="/settings/users" /> : <LoginPage onLogin={() => setIsAuthenticated(true)} />}
            />
            <Route path="/settings/users" element={isAuthenticated ? <UsersPage /> : <Navigate to="/login" />} />
            <Route path="/settings/users/create" element={isAuthenticated ? <UserFormPage /> : <Navigate to="/login" />} />
            <Route path="/settings/users/:id" element={isAuthenticated ? <UserDetailPage /> : <Navigate to="/login" />} />
            <Route path="/settings/users/:id/edit" element={isAuthenticated ? <UserFormPage /> : <Navigate to="/login" />} />
            <Route path="/" element={<Navigate to="/settings/users" />} />
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  )
}

export default App
