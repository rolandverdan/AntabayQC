const SETTINGS_KEY = 'antabayqc_commuter_settings'

export function saveCommuterProfile({ name, email, phone }) {
  try {
    const previous = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
    const settings = {
      ...previous,
      profile: {
        ...previous.profile,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        ...(phone === undefined ? {} : { phone: phone.trim() }),
      },
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    window.dispatchEvent(new CustomEvent('antabayqc:commuter-settings-updated', { detail: { profile: settings.profile } }))
    return true
  } catch (error) {
    console.error('Could not save commuter profile in browser storage:', error)
    return false
  }
}
