import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { formatDate } from '../utils/dates.js'
import { STATE_LABELS, displayState, startOfToday } from '../utils/warranty.js'

const PERIODS = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
  { value: 0, label: 'All time' },
]

const RECENT_LIMIT = 5

// YYYY-MM-DD in local time, for formatDate (toISOString would give the UTC day).
function localDay(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function Icon({ children }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

const ICONS = {
  issue: (
    <Icon>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5M9 13h4M9 17h2M17 15v6M14 18h6" />
    </Icon>
  ),
  document: (
    <Icon>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </Icon>
  ),
  box: (
    <Icon>
      <path d="M12 2 21 7v10l-9 5-9-5V7l9-5Z" />
      <path d="M3 7l9 5 9-5M12 12v10" />
    </Icon>
  ),
  calendar: (
    <Icon>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4M9 15h6" />
    </Icon>
  ),
  chevron: (
    <Icon>
      <path d="m9 6 6 6-6 6" />
    </Icon>
  ),
  arrow: (
    <Icon>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Icon>
  ),
}

function StoreIllustration() {
  return (
    <svg viewBox="0 0 220 160" className="rh-art" aria-hidden="true">
      <circle cx="110" cy="80" r="76" fill="#dfe9fb" />
      <circle cx="196" cy="26" r="9" fill="#dfe9fb" />
      {/* shop */}
      <rect x="36" y="62" width="112" height="78" rx="6" fill="#ffffff" />
      <path d="M30 40h124l-6 26H36Z" fill="#4f8df7" />
      <path d="M46 40h16l-4 26H42ZM78 40h16l-2 26H76ZM110 40h16l2 26h-16ZM142 40h12l-4 26h-10Z" fill="#9cc0fb" />
      <path d="M36 66a9 9 0 0 0 18 0 9 9 0 0 0 18 0 9 9 0 0 0 18 0 9 9 0 0 0 18 0 9 9 0 0 0 18 0 9 9 0 0 0 18 0 9 9 0 0 0 4 0" fill="#4f8df7" />
      <rect x="50" y="88" width="26" height="52" rx="3" fill="#4f8df7" />
      <rect x="88" y="88" width="44" height="30" rx="3" fill="#cfe0fc" />
      {/* certificate */}
      <rect x="120" y="70" width="80" height="74" rx="8" fill="#ffffff" stroke="#e2e9f5" />
      <path d="M160 80 176 86v10c0 9-6 15-16 18-10-3-16-9-16-18V86Z" fill="#1f9d4c" />
      <path d="m153 96 5 5 10-10" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="134" y="122" width="52" height="5" rx="2.5" fill="#9cc0fb" />
      <rect x="134" y="132" width="34" height="5" rx="2.5" fill="#cfe0fc" />
    </svg>
  )
}

export default function RetailerHome() {
  const { user } = useAuth()
  const dateFormat = user?.date_format ?? 'long'
  const [products, setProducts] = useState([])
  const [warranties, setWarranties] = useState([])
  const [period, setPeriod] = useState(30)
  const [showAll, setShowAll] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.listProducts(), api.listWarranties()])
      .then(([p, w]) => {
        setProducts(p)
        setWarranties(w)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  // created_at comes back without a timezone; the API stores UTC.
  const when = (iso) => new Date(iso.endsWith('Z') ? iso : `${iso}Z`)
  const since = period ? Date.now() - period * 24 * 60 * 60 * 1000 : 0
  const inPeriod = (item) => when(item.created_at).getTime() >= since

  const today = startOfToday()
  const soonDays = user?.expiring_soon_days ?? 90
  const activity = [
    ...warranties.map((w) => ({
      key: `w${w.id}`,
      kind: 'warranty',
      title: 'Warranty issued',
      subject: w.product.name,
      detail: `to ${w.owner.full_name}`,
      at: when(w.created_at),
      state: displayState(w, today, soonDays),
      to: `/warranties/${w.id}`,
    })),
    ...products.map((p) => ({
      key: `p${p.id}`,
      kind: 'product',
      title: 'Product added',
      subject: p.name,
      detail: p.serial_number,
      at: when(p.created_at),
      state: null,
      to: `/retailer/products/${p.id}`,
    })),
  ].sort((a, b) => b.at - a.at)

  const shown = showAll ? activity : activity.slice(0, RECENT_LIMIT)

  if (loading) return <p className="muted">Loading…</p>

  return (
    <div className="rh">
      <section className="rh-hero">
        <div>
          <p className="rh-eyebrow">Retailer Portal</p>
          <h1>Welcome Back!</h1>
          <p className="rh-lead">Issue warranties and manage your products all in one place.</p>
        </div>
        <StoreIllustration />
      </section>

      <section className="rh-actions">
        <Link to="/retailer/issue" className="rh-action">
          <span className="rh-action-icon blue">{ICONS.issue}</span>
          <span className="grow">
            <strong>Issue Warranty</strong>
            <span>Create a new warranty NFT</span>
          </span>
          <span className="rh-chevron">{ICONS.chevron}</span>
        </Link>
        <Link to="/retailer/products" className="rh-action">
          <span className="rh-action-icon green">{ICONS.box}</span>
          <span className="grow">
            <strong>Manage Products</strong>
            <span>Add products and view your list</span>
          </span>
          <span className="rh-chevron">{ICONS.chevron}</span>
        </Link>
      </section>

      {error && <p className="error">{error}</p>}

      <section className="rh-card">
        <div className="rh-card-head">
          <h2>Overview</h2>
          <label className="rh-period">
            <select value={period} onChange={(e) => setPeriod(Number(e.target.value))} aria-label="Time period">
              {PERIODS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {ICONS.calendar}
          </label>
        </div>
        <div className="rh-stats">
          <Link to="/retailer/warranties" className="rh-stat blue">
            {ICONS.document}
            <strong>{warranties.filter(inPeriod).length.toLocaleString()}</strong>
            <span>Warranties Issued</span>
          </Link>
          <div className="rh-stat purple">
            {ICONS.box}
            <strong>{products.filter(inPeriod).length.toLocaleString()}</strong>
            <span>{period ? 'Products Added' : 'Products'}</span>
          </div>
        </div>
      </section>

      <section className="rh-card">
        <div className="rh-card-head">
          <h2>Recent Activity</h2>
          {activity.length > RECENT_LIMIT && (
            <button type="button" className="rh-view-all" onClick={() => setShowAll(!showAll)}>
              {showAll ? 'Show less' : 'View All'} {ICONS.arrow}
            </button>
          )}
        </div>
        {activity.length === 0 ? (
          <p className="muted">Nothing yet. Add a product to get started.</p>
        ) : (
          <ul className="rh-activity">
            {shown.map((item) => (
              <li key={item.key}>
                <Link to={item.to} className="rh-activity-row">
                  <span className={`rh-activity-icon ${item.kind}`}>
                    {item.kind === 'warranty' ? ICONS.document : ICONS.box}
                  </span>
                  <span className="grow">
                    <strong>{item.title}</strong>
                    <span>
                      {item.subject} · {item.detail}
                    </span>
                  </span>
                  <span className="rh-when">
                    {formatDate(localDay(item.at), dateFormat)}
                    <span>{item.at.toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit' })}</span>
                  </span>
                  <span className={`owner-state ${item.state || 'added'}`}>
                    {item.state ? STATE_LABELS[item.state] : 'Added'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
