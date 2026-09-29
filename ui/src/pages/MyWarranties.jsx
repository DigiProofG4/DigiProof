import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../auth/AuthContext.jsx'
import ProductImage from '../components/ProductImage.jsx'
import { formatDate } from '../utils/dates.js'
import { STATE_LABELS, displayState, startOfToday, timeLeft } from '../utils/warranty.js'

const FILTERS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'expiring', label: 'Expiring Soon' },
  { value: 'expired', label: 'Expired' },
  { value: 'pending', label: 'Pending' },
]

const ICONS = {
  total: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M12 2 21 7v10l-9 5-9-5V7l9-5Z" />
      <path d="M3 7l9 5 9-5M12 12v10" />
    </svg>
  ),
  active: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M12 2 20 5v6c0 5.5-3.4 9.4-8 11-4.6-1.6-8-5.5-8-11V5l8-3Z" />
    </svg>
  ),
  expiring: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  expired: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </svg>
  ),
}

export default function MyWarranties() {
  const { user } = useAuth()
  const soonDays = user?.expiring_soon_days ?? 90
  const dateFormat = user?.date_format ?? 'long'
  const [warranties, setWarranties] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api
      .listWarranties()
      .then(setWarranties)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const today = startOfToday()
  const rows = useMemo(
    () => warranties.map((warranty) => ({ warranty, state: displayState(warranty, today, soonDays) })),
    // today only changes at midnight; recomputing per list or setting change is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [warranties, soonDays],
  )

  const counts = {
    total: rows.length,
    active: rows.filter((row) => row.state === 'active').length,
    expiring: rows.filter((row) => row.state === 'expiring').length,
    expired: rows.filter((row) => row.state === 'expired').length,
  }

  const needle = query.trim().toLowerCase()
  const visible = rows.filter(({ warranty, state }) => {
    if (filter !== 'all' && state !== filter) return false
    if (!needle) return true
    const { name, serial_number } = warranty.product
    return name.toLowerCase().includes(needle) || serial_number.toLowerCase().includes(needle)
  })

  if (loading) return <p className="muted">Loading…</p>

  return (
    <div className="owner">
      <header className="owner-head">
        <p className="owner-eyebrow">Owner Dashboard</p>
        <h1>Welcome back!</h1>
        <p className="owner-lead">Here are your digital warranties.</p>
      </header>

      <section className="owner-stats">
        <StatCard tone="blue" icon={ICONS.total} value={counts.total} label="Total Warranties" />
        <StatCard tone="green" icon={ICONS.active} value={counts.active} label="Active" />
        <StatCard tone="amber" icon={ICONS.expiring} value={counts.expiring} label="Expiring Soon" />
        <StatCard tone="red" icon={ICONS.expired} value={counts.expired} label="Expired" />
      </section>

      <section className="owner-tools">
        <label className="owner-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.8-3.8" />
          </svg>
          <input
            type="search"
            placeholder="Search product or serial number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search product or serial number"
          />
        </label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by status">
          {FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </section>

      {error && <p className="error">{error}</p>}

      {warranties.length === 0 ? (
        <div className="owner-empty">
          Nothing here yet. A warranty shows up once a retailer records your purchase.
        </div>
      ) : visible.length === 0 ? (
        <div className="owner-empty">No warranties match your search.</div>
      ) : (
        <ul className="owner-list">
          {visible.map(({ warranty, state }) => (
            <li key={warranty.id}>
              <Link to={`/warranties/${warranty.id}`} className="owner-row">
                <ProductImage product={warranty.product} size={96} className="owner-photo" />
                <div className="owner-main">
                  <strong>{warranty.product.name}</strong>
                  <span className="owner-serial">{warranty.product.serial_number}</span>
                  <span className="owner-tags">
                    {warranty.product.brand && <span>{warranty.product.brand}</span>}
                    {warranty.issued_by && <span>{warranty.issued_by.business_name}</span>}
                  </span>
                </div>
                <div className="owner-cover">
                  <span className={`owner-state ${state}`}>{STATE_LABELS[state]}</span>
                  <span className="owner-expiry">
                    {state === 'expired' ? 'Expired' : 'Expires'} {formatDate(warranty.expires_on, dateFormat)}
                  </span>
                  <span className="owner-left">{timeLeft(warranty.expires_on, today)}</span>
                </div>
                <svg className="owner-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="owner-secure">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="10" width="16" height="12" rx="3" fill="#2f74f0" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="#2f74f0" strokeWidth="2.4" />
          <circle cx="12" cy="16" r="1.6" fill="#fff" />
        </svg>
        <div>
          <strong>Your warranties are securely stored on-chain.</strong>
          <span>Transparent. Tamper-proof. Always yours.</span>
        </div>
      </div>

    </div>
  )
}

function StatCard({ tone, icon, value, label }) {
  return (
    <div className={`owner-stat ${tone}`}>
      <div>
        <span className="owner-stat-value">{value}</span>
        <span className="owner-stat-label">{label}</span>
      </div>
      <span className="owner-stat-icon">{icon}</span>
    </div>
  )
}
