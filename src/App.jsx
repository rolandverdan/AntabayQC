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
import ExportData from './admin/pages/ExportData.jsx'
import CommuterLayout from './commuter/layouts/CommuterLayout.jsx'
import LandingPage from './commuter/pages/LandingPage.jsx'
import CommuterHome from './commuter/pages/Home.jsx'
import BusRoutes from './commuter/pages/BusRoutes.jsx'
import Timetable from './commuter/pages/Timetable.jsx'
import LiveTracking from './commuter/pages/LiveTracking.jsx'
import MyTrip from './commuter/pages/MyTrip.jsx'
import LostItem from './commuter/pages/LostItem.jsx'
import LostItemReports from './commuter/pages/LostItemReports.jsx'
import Report from './commuter/pages/Report.jsx'
import Feedback from './commuter/pages/Feedback.jsx'
import Notification from './commuter/pages/Notification.jsx'
import CommuterSettings from './commuter/pages/Settings.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AdminDataProvider>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />

              <Route path="/commuter" element={<CommuterLayout />}>
                <Route index element={<Navigate to="home" replace />} />
                <Route path="home" element={<CommuterHome />} />
                <Route path="route-and-schedule" element={<BusRoutes />} />
                <Route path="timetable" element={<Timetable />} />
                <Route path="live-tracking" element={<LiveTracking />} />
                <Route path="my-trip" element={<MyTrip />} />
                <Route path="lost-item" element={<LostItem />} />
                <Route path="lost-item-reports" element={<LostItemReports />} />
                <Route path="report" element={<Report />} />
                <Route path="feedback" element={<Feedback />} />
                <Route path="notification" element={<Notification />} />
                <Route path="settings" element={<CommuterSettings />} />
              </Route>

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
                <Route path="export" element={<ExportData />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </AdminDataProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
