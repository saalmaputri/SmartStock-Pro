import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute'
import DashboardLayout from '../layouts/DashboardLayout'
import AuditLogs from '../pages/AuditLogs'
import Categories from '../pages/Categories'
import Dashboard from '../pages/Dashboard'
import ErrorLogs from '../pages/ErrorLogs'
import Login from '../pages/Login'
import Monitoring from '../pages/Monitoring'
import Products from '../pages/Products'
import Reports from '../pages/Reports'
import Settings from '../pages/Settings'
import Suppliers from '../pages/Suppliers'
import Transactions from '../pages/Transactions'
import Transfers from '../pages/Transfers'
import Warehouses from '../pages/Warehouses'
import WarehouseMap from '../pages/WarehouseMap'
import ChangeLog from '../pages/ChangeLog'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route element={<ProtectedRoute roles={['Admin', 'Manajer Gudang', 'Staf Gudang', 'Viewer']} />}>
            <Route path="products" element={<Products />} />
            <Route path="warehouse-map" element={<WarehouseMap />} />
            <Route path="change-log" element={<ChangeLog />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route element={<ProtectedRoute roles={['Admin', 'Manajer Gudang', 'Staf Gudang']} />}>
            <Route path="transactions" element={<Transactions />} />
            <Route path="transfers" element={<Transfers />} />
          </Route>
          <Route element={<ProtectedRoute roles={['Admin', 'Manajer Gudang']} />}>
            <Route path="categories" element={<Categories />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="monitoring" element={<Monitoring />} />
          </Route>
          <Route element={<ProtectedRoute roles={['Admin']} />}>
            <Route path="error-logs" element={<ErrorLogs />} />
          </Route>
          <Route element={<ProtectedRoute roles={['Admin', 'Manajer Gudang']} />}>
            <Route path="warehouses" element={<Warehouses />} />
          </Route>
          <Route element={<ProtectedRoute roles={['Admin', 'Manajer Gudang', 'Viewer']} />}>
            <Route path="reports" element={<Reports />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
