const BASE = import.meta.env.VITE_API_BASE || '/api'

let authToken = null

export function setToken(token) {
  authToken = token
  if (token) {
    localStorage.setItem('digiproof_token', token)
  } else {
    localStorage.removeItem('digiproof_token')
  }
}

export function loadToken() {
  authToken = localStorage.getItem('digiproof_token')
  return authToken
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (authToken) headers.Authorization = `Bearer ${authToken}`

  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (response.status === 204) return null

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const message = data?.detail || `Request failed (${response.status})`
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message))
  }
  return data
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: () => request('/auth/me'),

  listProducts: () => request('/products'),
  createProduct: (payload) => request('/products', { method: 'POST', body: payload }),

  listWarranties: () => request('/warranties'),
  getWarranty: (id) => request(`/warranties/${id}`),
  issueWarranty: (payload) => request('/warranties', { method: 'POST', body: payload }),
  transferWarranty: (id, payload) =>
    request(`/warranties/${id}/transfer`, { method: 'POST', body: payload }),
  verifyBySerial: (serial) => request(`/warranties/verify/${encodeURIComponent(serial)}`),
}
