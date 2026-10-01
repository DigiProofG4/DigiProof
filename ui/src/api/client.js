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

// Uploaded photos come back as /uploads/...; they are served by the API, so in the
// browser they sit behind the same /api prefix. External https:// links pass through.
export function imageSrc(url) {
  if (!url) return null
  return url.startsWith('/') ? `${BASE}${url}` : url
}

async function upload(path, file) {
  const body = new FormData()
  body.append('file', file)
  // No Content-Type header: the browser adds the multipart boundary itself.
  const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {}
  const response = await fetch(`${BASE}${path}`, { method: 'POST', headers, body })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const message = data?.detail || `Upload failed (${response.status})`
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message))
  }
  return data
}

export const api = {
  health: () => request('/health'),
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: () => request('/auth/me'),
  updateMe: (payload) => request('/auth/me', { method: 'PATCH', body: payload }),
  changePassword: (payload) => request('/auth/me/password', { method: 'POST', body: payload }),
  myTransactions: () => request('/auth/me/transactions'),

  listProducts: () => request('/products'),
  createProduct: (payload) => request('/products', { method: 'POST', body: payload }),
  getProduct: (id) => request(`/products/${id}`),
  uploadProductImage: (id, file) => upload(`/products/${id}/image`, file),
  linkProductImage: (id, imageUrl) =>
    request(`/products/${id}/image`, { method: 'PUT', body: { image_url: imageUrl } }),
  removeProductImage: (id) => request(`/products/${id}/image`, { method: 'DELETE' }),

  listWarranties: () => request('/warranties'),
  getWarranty: (id) => request(`/warranties/${id}`),
  issueWarranty: (payload) => request('/warranties', { method: 'POST', body: payload }),
  transferWarranty: (id, payload) =>
    request(`/warranties/${id}/transfer`, { method: 'POST', body: payload }),
  verifyBySerial: (serial) => request(`/warranties/verify/${encodeURIComponent(serial)}`),
}
