import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../auth/AuthContext.jsx'
import ProductImage from '../components/ProductImage.jsx'
import { formatDate, parseDate } from '../utils/dates.js'
import { STATE_LABELS, displayState, startOfToday } from '../utils/warranty.js'

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'expiring', label: 'Expiring Soon' },
  { value: 'expired', label: 'Expired' },
]

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'expiring', label: 'Expiring first' },
]

function Icon({ children }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

// Retailer's view of every warranty they have issued, whoever owns it now.
export default function RetailerWarranties() {
  const { user } = useAuth()
  const dateFormat = user?.date_format ?? 'long'
  const soonDays = user?.expiring_soon_days ?? 90
  const [warranties, setWarranties] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('newest')

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

  const counts = { all: rows.length }
  for (const { state } of rows) counts[state] = (counts[state] || 0) + 1

  const needle = query.trim().toLowerCase()
  const visible = rows
    .filter(({ state }) => tab === 'all' || state === tab)
    .filter(({ warranty }) => {
      if (!needle) return true
      const { product, owner } = warranty
      return [product.name, product.serial_number, owner.full_name, owner.email].some((text) =>
        text.toLowerCase().includes(needle),
      )
    })
    .sort((a, b) => {
      if (sort === 'expiring') return parseDate(a.warranty.expires_on) - parseDate(b.warranty.expires_on)
      const diff = new Date(a.warranty.created_at) - new Date(b.warranty.created_at)
      return sort === 'oldest' ? diff : -diff
    })

  if (loading) return <p className="muted">Loading…</p>

  return (
    <div className="rw">
      <header className="rw-head">
        <div>
          <h1>Warranty List</h1>
          <p>View and manage all issued product warranties.</p>
        </div>
        <Link to="/retailer/issue" className="rw-new">
          <Icon>
            <path d="M12 5v14M5 12h14" />
          </Icon>
          Issue New Warranty
        </Link>
      </header>

      <section className="rw-tools">
        <label className="owner-search">
          <Icon>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.8-3.8" />
          </Icon>
          <input
            type="search"
            placeholder="Search by product name, serial number or customer..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search warranties"
          />
        </label>
        <label className="rw-filter">
          <Icon>
            <path d="M3 5h18l-7 8v6l-4 2v-8Z" />
          </Icon>
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort warranties">
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <nav className="rw-tabs" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={tab === item.value}
            className={tab === item.value ? 'active' : ''}
            onClick={() => setTab(item.value)}
          >
            {item.label} ({(counts[item.value] || 0).toLocaleString()})
          </button>
        ))}
      </nav>

      {error && <p className="error">{error}</p>}

      {warranties.length === 0 ? (
        <div className="owner-empty">
          No warranties yet. <Link to="/retailer/issue">Issue your first one</Link>.
        </div>
      ) : visible.length === 0 ? (
        <div className="owner-empty">No warranties match.</div>
      ) : (
        <ul className="rw-list">
          {visible.map(({ warranty, state }) => (
            <li key={warranty.id}>
              <Link to={`/warranties/${warranty.id}`} className="rw-row">
                <ProductImage product={warranty.product} size={88} className="owner-photo" />
                <div className="rw-main">
                  <strong>{warranty.product.name}</strong>
                  <span className="rw-serial">{warranty.product.serial_number}</span>
                  <span className="rw-meta">
                    <Icon>
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 21a8 8 0 0 1 16 0" />
                    </Icon>
                    {warranty.owner.full_name}
                  </span>
                  <span className="rw-meta">
                    <Icon>
                      <rect x="3" y="5" width="18" height="16" rx="2" />
                      <path d="M3 10h18M8 3v4M16 3v4" />
                    </Icon>
                    {formatDate(warranty.purchase_date, dateFormat)}
                    <span className="rw-sep">|</span>
                    {state === 'expired' ? 'Expired' : 'Expires'} {formatDate(warranty.expires_on, dateFormat)}
                  </span>
                </div>
                <span className={`rw-status ${state}`}>
                  <span className="dot" />
                  {STATE_LABELS[state]}
                </span>
                <span className="rw-chevron">
                  <Icon>
                    <path d="m9 6 6 6-6 6" />
                  </Icon>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
