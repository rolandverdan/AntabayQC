import { Component, lazy, Suspense } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { ToastProvider } from './admin/context/ToastContext.jsx'
import { AdminDataProvider } from './admin/context/AdminDataContext.jsx'
import { AuthProvider } from './admin/context/AuthContext.jsx'
import { ConductorProvider } from './conductor/context/ConductorContext.jsx'
import { CommuterProvider } from './commuter/context/CommuterContext.jsx'

import Login from './pages/Login.jsx'

// Admin (desktop-first)
import ProtectedRoute from './admin/routes/ProtectedRoute.jsx'
import AdminLayout from './admin/layouts/AdminLayout.jsx'
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

// Conductor (mobile-first)
import ConductorRoute from './conductor/routes/ConductorRoute.jsx'
import ConductorLayout from './conductor/layouts/ConductorLayout.jsx'
import ConductorMap from './conductor/pages/MapPage.jsx'
import ConductorCamera from './conductor/pages/CameraPage.jsx'
import ConductorSettings from './conductor/pages/SettingsPage.jsx'
import ConductorAccount from './conductor/pages/AccountPage.jsx'

// Commuter (mobile-first)
import CommuterRoute from './commuter/routes/CommuterRoute.jsx'
import CommuterLayout from './commuter/layouts/CommuterLayout.jsx'
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
import HelpSupport from './commuter/pages/HelpSupport.jsx'
import TermsConditions from './commuter/pages/TermsConditions.jsx'

const PrivacyPolicy = lazy(() => import('./commuter/pages/CommuterLegalInfo.jsx'))

class PrivacyPolicyLoadBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Privacy Policy could not be loaded.</p>
          <p className="mt-1">Check whether your browser is blocking this page, then try again.</p>
          <Link to="/commuter/settings" className="mt-3 inline-flex min-h-10 items-center font-semibold underline">
            Return to Settings
          </Link>
        </div>
      )
    }

    return this.props.children
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AdminDataProvider>
          <AuthProvider>
            <ConductorProvider>
              <CommuterProvider>
                <Routes>
                  {/* One login for every role; the account decides which side opens. */}
                  <Route path="/" element={<Login />} />
                  <Route path="/login" element={<Navigate to="/" replace />} />
                  <Route path="/login/*" element={<Navigate to="/" replace />} />
                  <Route path="/admin/login" element={<Navigate to="/" replace />} />
                  <Route path="/conductor/login" element={<Navigate to="/" replace />} />
                  <Route path="/commuter/login" element={<Navigate to="/" replace />} />

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

                  <Route
                    path="/conductor"
                    element={
                      <ConductorRoute>
                        <ConductorLayout />
                      </ConductorRoute>
                    }
                  >
                    <Route index element={<Navigate to="dashboard" replace />} />
                    {/* The conductor's main screen is the live trip map. */}
                    <Route path="dashboard" element={<Navigate to="/conductor/map" replace />} />
                    <Route path="map" element={<ConductorMap />} />
                    <Route path="camera" element={<ConductorCamera />} />
                    <Route path="settings" element={<ConductorSettings />} />
                    <Route path="account" element={<ConductorAccount />} />
                  </Route>

                  <Route
                    path="/commuter"
                    element={
                      <CommuterRoute>
                        <CommuterLayout />
                      </CommuterRoute>
                    }
                  >
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
                    <Route path="help-support" element={<HelpSupport />} />
                    <Route path="terms-and-conditions" element={<TermsConditions />} />
                    <Route
                      path="settings/privacy-policy"
                      element={(
                        <PrivacyPolicyLoadBoundary>
                          <Suspense fallback={<p role="status" className="text-sm text-slate-500">Loading Privacy Policy…</p>}>
                            <PrivacyPolicy />
                          </Suspense>
                        </PrivacyPolicyLoadBoundary>
                      )}
                    />
                  </Route>

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </CommuterProvider>
            </ConductorProvider>
          </AuthProvider>
        </AdminDataProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
