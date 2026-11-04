import { useAuth } from '../../admin/context/AuthContext.jsx'
import { useConductor } from '../../conductor/context/ConductorContext.jsx'
import { useCommuter } from '../../commuter/context/CommuterContext.jsx'
import { signOutFirebaseUser } from '../../firebase/auth.js'

// Only one role can be signed in at a time in this demo. Signing in as one role signs the other two out,
// so one role cannot reach another role's pages through normal navigation.
export default function useRoleSwitch() {
  const admin = useAuth()
  const conductor = useConductor()
  const commuter = useCommuter()
  return async (keep, { preserveFirebaseAuth = false } = {}) => {
    const hasFirebaseSession = admin.user?.firebaseAuthenticated
      || conductor.session?.firebaseAuthenticated
      || commuter.session?.firebaseAuthenticated
    if (hasFirebaseSession && !preserveFirebaseAuth) await signOutFirebaseUser()
    if (keep !== 'admin' && admin.user) admin.logout()
    if (keep !== 'conductor' && conductor.session) conductor.logout()
    if (keep !== 'commuter' && commuter.session) commuter.clearSession()
  }
}
