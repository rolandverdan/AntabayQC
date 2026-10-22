import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ToastProvider } from './admin/context/ToastContext.jsx'
import { AdminDataProvider } from './admin/context/AdminDataContext.jsx'
import { AuthProvider } from './admin/context/AuthContext.jsx'
import ProtectedRoute from './admin/routes/ProtectedRoute.jsx'
import AdminLayout from './admin/layouts/AdminLayout.jsx'
import Login from './admin/pages/Login.jsx'
import Dashboard from './admin/pages/Dashboard.jsx'
import CreateAccount from './admin/pages/CreateAccount.jsx'
import CreateBuses from './admin/pages/CreateBuses.jsx'
import CreateBusStops from './admin/pages/CreateBusStops.jsx'
import CreateRoutes from './admin/pages/CreateRoutes.jsx'
import LiveMap from './admin/pages/LiveMap.jsx'
import Logs from './admin/pages/Logs.jsx'
import ReportLogs from './admin/pages/ReportLogs.jsx'
import EmergencyLogs from './admin/pages/EmergencyLogs.jsx'
import Settings from './admin/pages/Settings.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AdminDataProvider>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/login" element={<Login />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="accounts" element={<CreateAccount />} />
                <Route path="buses" element={<CreateBuses />} />
                <Route path="bus-stops" element={<CreateBusStops />} />
                <Route path="routes" element={<CreateRoutes />} />
                <Route path="map" element={<LiveMap />} />
                <Route path="logs" element={<Logs />} />
                <Route path="report-logs" element={<ReportLogs />} />
                <Route path="emergency-logs" element={<EmergencyLogs />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
            </Routes>
          </AuthProvider>
        </AdminDataProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
