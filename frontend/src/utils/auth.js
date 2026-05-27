const TOKEN_KEY = 'smartstock_token'
const ROLE_KEY = 'smartstock_role'
const NAME_KEY = 'smartstock_name'
const EMAIL_KEY = 'smartstock_email'
const EXPIRES_KEY = 'smartstock_expires_at'
const SESSION_MS = 8 * 60 * 60 * 1000

export function setAuth({ token, role, name, email }) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(ROLE_KEY, role || 'Viewer')
  localStorage.setItem(NAME_KEY, name || 'User Demo')
  localStorage.setItem(EMAIL_KEY, email || '')
  localStorage.setItem(EXPIRES_KEY, String(Date.now() + SESSION_MS))
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ROLE_KEY)
  localStorage.removeItem(NAME_KEY)
  localStorage.removeItem(EMAIL_KEY)
  localStorage.removeItem(EXPIRES_KEY)
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getUser() {
  return {
    token: getToken(),
    role: localStorage.getItem(ROLE_KEY),
    name: localStorage.getItem(NAME_KEY),
    email: localStorage.getItem(EMAIL_KEY),
    expiresAt: Number(localStorage.getItem(EXPIRES_KEY) || 0)
  }
}

export function isAuthenticated() {
  const token = getToken()
  const expiresAt = Number(localStorage.getItem(EXPIRES_KEY) || 0)
  if (!token) return false
  if (expiresAt && Date.now() > expiresAt) {
    clearAuth()
    return false
  }
  return true
}

export function normalizeRole(role) {
  if (!role) return 'Viewer'
  const value = role.toLowerCase()
  if (value.includes('admin')) return 'Admin'
  if (value.includes('manajer') || value.includes('manager')) return 'Manajer Gudang'
  if (value.includes('staf') || value.includes('staff')) return 'Staf Gudang'
  return 'Viewer'
}
