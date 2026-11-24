import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { TriangleAlert, X } from 'lucide-react'
import Sidebar from '../../admin/layouts/Sidebar.jsx'
import { NAV_ITEMS } from './navItems.js'
import Topbar from './Topbar.jsx'
import BottomNav from '../components/BottomNav.jsx'
import SosModal from '../components/SosModal.jsx'
import ConfirmDialog from '../../admin/components/ConfirmDialog.jsx'
import { useConductor } from '../context/ConductorContext.jsx'
import { useToast } from '../../admin/context/ToastContext.jsx'
import useVehicleLocation from '../utils/useVehicleLocation.js'
import useBusFeed from '../utils/useBusFeed.js'
import useTrip from '../utils/useTrip.js'
import useConductorAlerts from '../utils/useConductorAlerts.js'
import { CameraPanel } from '../pages/CameraPage.jsx'
import { signOutFirebaseUser } from '../../firebase/auth.js'
import { useCommuter } from '../../commuter/context/CommuterContext.jsx'

export default function ConductorLayout() {
  const { profile, session, logout, sosReport, setSosReport, passengerCount, passengerEntries, passengerExits, resetPassengerTotals, addAlert } = useConductor()
  const { userProfile } = useCommuter()
  const { notify } = useToast()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const location = useVehicleLocation()
  // Start/End trip controls phone GPS and the live feed. The door cameras have their own buttons.
  const trip = useTrip({
    position: location.position,
    gpsAccuracy: location.gpsAccuracy,
    gpsStatus: location.gpsStatus,
    startGps: location.usePhoneGps,
    stopGps: location.stopPhoneGps,
    entries: passengerEntries,
    exits: passengerExits,
  })
  // Runs for the whole conductor session (not just one page) so the admin side keeps getting updates.
  const feed = useBusFeed({
    enabled: trip.active,
    uid: session?.uid || '',
    position: location.position,
    speed: location.speed,
    gpsAccuracy: location.gpsAccuracy,
    passengers: passengerCount,
    entries: passengerEntries,
    exits: passengerExits,
  })
  // Start trip: a clean slate (onboard, boarded and alighted back to 0) and a fresh live record.
  // End trip: stop sharing and delete the live record so no old data stays on the admin/commuter maps.
  const tripControls = {
    ...trip,
    startTrip: () => {
      resetPassengerTotals()
      trip.startTrip({ entries: 0, exits: 0 })
    },
    endTrip: async () => {
      trip.endTrip()
      try {
        const outcome = await feed.clearLive()
        if (outcome === 'queued') notify('Trip ended. The bus will be removed from the live map once the phone has signal.', 'info')
      } catch (error) {
        console.error('Could not remove the live record:', error)
        addAlert({
          category: 'system',
          tone: 'warning',
          title: 'Bus still shown on the live map',
          body: error.code === 'permission-denied'
            ? 'The server refused to remove it. Ask an admin to publish the latest Firestore rules.'
            : 'It could not be removed. Check the connection and end the trip again later.',
        })
      }
    },
  }
  useConductorAlerts({
    addAlert,
    passengerCount,
    capacity: feed.assignment.bus?.capacity,
    trip: tripControls,
    gpsStatus: location.gpsStatus,
    gpsMessage: location.gpsMessage,
    feed,
  })

  // Like Admin, the sidebar expands on hover/focus and while its profile menu is open.
  const [hovered, setHovered] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const expanded = hovered || profileOpen
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [sosOpen, setSosOpen] = useState(false)
  const profileName = session?.firebaseAuthenticated
    ? userProfile?.displayName || session.displayName || session.identifier
    : profile.fullName || 'Conductor'
  const profileEmail = session?.firebaseAuthenticated
    ? userProfile?.email || session.email || session.identifier
    : profile.email || ''

  const doLogout = async () => {
    try {
      // End the trip while still signed in, so the live record can be removed.
      // A trip never carries over to the next person who signs in on this phone.
      if (trip.active) await tripControls.endTrip()
      if (session?.firebaseAuthenticated) await signOutFirebaseUser()
      setConfirmLogout(false)
      logout()
      notify('You have been logged out.', 'info')
      navigate('/', { replace: true })
    } catch (error) {
      console.error('Firebase sign-out failed:', error)
      notify('Could not sign out. Please try again.', 'error')
    }
  }

  // Bottom-nav height is defined on the root so the nav and the page padding always agree
  // (slimmer bar on landscape phones). These variables used to live in index.css.
  return (
    <div className="mobile-ui min-h-dvh [--bottom-nav-item-h:3.75rem] [--bottom-nav-h:calc(var(--bottom-nav-item-h)_+_env(safe-area-inset-bottom,0px))] [@media(max-height:480px)]:[--bottom-nav-item-h:3rem]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand">
        Skip to content
      </a>
      {/* Desktop sidebar. display:none below lg removes it (and its off-canvas links) from the tab order;
          phones and tablets use the bottom navigation instead. */}
      <div className="hidden lg:block">
        <Sidebar
          expanded={expanded}
          onHoverChange={setHovered}
          mobileOpen={false}
          onCloseMobile={() => {}}
          onLogout={() => setConfirmLogout(true)}
          items={NAV_ITEMS}
          navLabel="Conductor navigation"
          profileName={profileName}
          profileEmail={profileEmail}
          profileRole="Conductor"
          profileOpen={profileOpen}
          onProfileToggle={setProfileOpen}
        />
      </div>
      <div className={`pt-[var(--topbar-h)] transition-[padding] duration-200 ease-out ${expanded ? 'lg:pl-64' : 'lg:pl-[76px]'}`}>
        <Topbar expanded={expanded} onSos={() => setSosOpen(true)} assignment={feed.assignment} route={feed.route} />
        {sosReport && (
          <div role="status" className="flex items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
            <TriangleAlert size={16} className="shrink-0" />
            <p className="min-w-0 flex-1">
              <span className="font-semibold">SOS · {sosReport.type}</span> · {sosReport.status}
            </p>
            <button type="button" onClick={() => setSosReport(null)} className="rounded p-1 hover:bg-amber-100" aria-label="Dismiss SOS banner">
              <X size={16} />
            </button>
          </div>
        )}
        {/* Bottom padding = bottom-nav height + breathing room, so the fixed nav never covers content. */}
        <main id="main" className="px-4 pt-4 pb-[calc(var(--bottom-nav-h)+1rem)] md:px-6 md:pt-6 lg:pb-6">
          <div key={pathname} className="route-page-enter font-sans">
            <Outlet context={{ ...location, feed, trip: tripControls, requestLogout: () => setConfirmLogout(true) }} />
          </div>
          {/* Always mounted so door cameras keep counting while other conductor pages are open. */}
          <CameraPanel feed={feed} visible={pathname.replace(/\/+$/, '') === '/conductor/camera'} />
        </main>
      </div>

      <BottomNav />

      <SosModal
        open={sosOpen}
        onClose={() => setSosOpen(false)}
        location={location.location}
        bus={feed.assignment.bus}
        route={feed.route}
        reporterName={profileName}
      />
      <ConfirmDialog
        open={confirmLogout}
        title="Log out?"
        message="You will be returned to the ANTABAY QC home page and will need to sign in again to use the conductor pages."
        confirmLabel="Log out"
        tone="primary"
        onConfirm={doLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  )
}
