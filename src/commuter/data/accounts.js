// MOCK commuter sign-up for the frontend demo. Accounts live only in this browser's localStorage and the
// password is stored as a SHA-256 hash. This is NOT real authentication or secure storage.
const KEY = 'antabayqc_commuter_accounts'
const SETTINGS_KEY = 'antabayqc_commuter_settings'

const read = () => {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export async function hashPassword(pw) {
  const bytes = new TextEncoder().encode(`antabayqc:${pw}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export const emailTaken = (email) => read().some((a) => a.email === email.trim().toLowerCase())

export async function registerCommuter({ name, email, phone, password }) {
  const record = { name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), hash: await hashPassword(password), createdAt: Date.now() }
  try {
    localStorage.setItem(KEY, JSON.stringify([...read(), record]))
    // Show the new commuter's name / email in the header and Settings.
    const prev = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...prev, profile: { ...prev.profile, name: record.name, email: record.email, phone: record.phone } }))
  } catch {
    /* storage unavailable: the session still works for this visit */
  }
  return record
}

/** Returns the matching account (by email) or null. */
export async function findCommuterAccount(identifier, password) {
  const id = identifier.trim().toLowerCase()
  const acct = read().find((a) => a.email === id)
  if (!acct) return null
  return acct.hash === (await hashPassword(password)) ? acct : null
}
