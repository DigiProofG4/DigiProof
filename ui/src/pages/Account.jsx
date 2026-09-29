import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { WALLET_HINT, WALLET_PATTERN } from '../components/WalletCard.jsx'
import { formatDate } from '../utils/dates.js'

const SUPPORT_EMAIL = 'blockchaing4@gmail.com'

function Icon({ children }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

const ICONS = {
  gear: (
    <Icon>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </Icon>
  ),
  person: (
    <Icon>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </Icon>
  ),
  lock: (
    <Icon>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
    </Icon>
  ),
  receipt: (
    <Icon>
      <path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2Z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </Icon>
  ),
  help: (
    <Icon>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01" />
    </Icon>
  ),
  wallet: (
    <Icon>
      <path d="M3 7a2 2 0 0 1 2-2h13v4" />
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M16 13.5h2" />
    </Icon>
  ),
  pencil: (
    <Icon>
      <path d="M4 20h4L19 9l-4-4L4 16Z" />
    </Icon>
  ),
  link: (
    <Icon>
      <path d="M10 14a4 4 0 0 0 6 .5l3-3a4 4 0 0 0-5.7-5.7l-1.5 1.5" />
      <path d="M14 10a4 4 0 0 0-6-.5l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5" />
    </Icon>
  ),
  copy: (
    <Icon>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h8" />
    </Icon>
  ),
  logout: (
    <Icon>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3" />
    </Icon>
  ),
  chevron: (
    <Icon>
      <path d="m9 6 6 6-6 6" />
    </Icon>
  ),
  store: (
    <Icon>
      <path d="M3 9 5 4h14l2 5M3 9v11h18V9M3 9h18" />
      <path d="M9 20v-6h6v6" />
    </Icon>
  ),
}

const MENU = [
  { key: 'profile', tone: 'blue', icon: ICONS.person, title: 'Profile Information', text: 'Manage your personal information' },
  { key: 'business', retailerOnly: true, tone: 'amber', icon: ICONS.store, title: 'Business Information', text: 'Business name and registration number' },
  { key: 'security', tone: 'green', icon: ICONS.lock, title: 'Security', text: 'Update password and security settings' },
  { key: 'history', tone: 'purple', icon: ICONS.receipt, title: 'Transaction History', retailerTitle: 'Minting History', text: 'View your on-chain transactions', retailerText: 'Warranties your shop minted on-chain' },
  { key: 'settings', tone: 'slate', icon: ICONS.gear, title: 'App Settings', text: 'Date format and dashboard preferences' },
  { key: 'help', tone: 'red', icon: ICONS.help, title: 'Help & Support', text: 'Get help or contact our support team' },
]

function shortAddress(address) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export default function Account() {
  const { user, logout, isRetailer } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(null)

  function toggle(key) {
    setOpen((current) => (current === key ? null : key))
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="account">
      <header className="account-head">
        <span className="account-head-icon">{ICONS.gear}</span>
        <div>
          <h1>{isRetailer ? 'Account & Business' : 'Account & Wallet'}</h1>
          <p>
            {isRetailer
              ? 'Manage your profile, business details and app settings.'
              : 'Manage your profile, wallet and app settings.'}
          </p>
        </div>
      </header>

      <section className="account-card account-profile">
        <span className="account-avatar">{ICONS.person}</span>
        <div className="grow">
          <strong>{isRetailer ? user.business_name : user.full_name}</strong>
          <span>
            {isRetailer && user.full_name !== user.business_name ? `${user.full_name} · ${user.email}` : user.email}
          </span>
        </div>
        <button type="button" className="account-outline" onClick={() => setOpen('profile')}>
          {ICONS.pencil} Edit Profile
        </button>
      </section>

      {isRetailer ? <BusinessCard onEdit={() => setOpen('business')} /> : <WalletPanel />}

      <section className="account-card account-menu">
        {MENU.filter((item) => isRetailer || !item.retailerOnly).map((item) => (
          <div key={item.key} className={open === item.key ? 'account-item open' : 'account-item'}>
            <button type="button" className="account-row" onClick={() => toggle(item.key)} aria-expanded={open === item.key}>
              <span className={`account-row-icon ${item.tone}`}>{item.icon}</span>
              <span className="grow">
                <strong>{(isRetailer && item.retailerTitle) || item.title}</strong>
                <span>{(isRetailer && item.retailerText) || item.text}</span>
              </span>
              <span className="account-chevron">{ICONS.chevron}</span>
            </button>
            {open === item.key && (
              <div className="account-panel">
                {item.key === 'profile' && <ProfilePanel onDone={() => setOpen(null)} />}
                {item.key === 'business' && <BusinessPanel onDone={() => setOpen(null)} />}
                {item.key === 'security' && <SecurityPanel />}
                {item.key === 'history' && <HistoryPanel />}
                {item.key === 'settings' && <SettingsPanel />}
                {item.key === 'help' && <HelpPanel />}
              </div>
            )}
          </div>
        ))}

        <button type="button" className="account-logout" onClick={handleLogout}>
          {ICONS.logout} Log Out
        </button>
      </section>
    </div>
  )
}

function WalletPanel() {
  const { user, updateWallet } = useAuth()
  const [editing, setEditing] = useState(false)
  const [address, setAddress] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const connected = Boolean(user.wallet_address)

  async function save(value) {
    setError('')
    setBusy(true)
    try {
      await updateWallet(value)
      setEditing(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(user.wallet_address)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setError('Could not copy. Select the address and copy it instead.')
    }
  }

  function disconnect() {
    if (window.confirm('Disconnect this wallet? Warranties transferred to you will stay in DigiProof custody until you add one again.')) {
      save(null)
    }
  }

  return (
    <section className={connected ? 'account-card account-wallet connected' : 'account-card account-wallet'}>
      <span className="account-wallet-icon">{ICONS.wallet}</span>
      <div className="grow">
        {connected && !editing ? (
          <>
            <strong className="account-wallet-title">Connected Wallet</strong>
            <span className="account-wallet-address">
              <span title={user.wallet_address}>{shortAddress(user.wallet_address)}</span>
              <button type="button" className="account-icon-button" onClick={copy} aria-label="Copy wallet address">
                {ICONS.copy}
              </button>
              {copied && <span className="account-copied">Copied</span>}
            </span>
            <span className="account-wallet-status">
              <span className="dot" /> Connected <span className="sep" /> Sepolia testnet
            </span>
          </>
        ) : (
          <>
            <strong className="account-wallet-title">{connected ? 'Change Wallet' : 'No Wallet Connected'}</strong>
            <p className="account-note">
              Paste the address from your wallet app (for example MetaMask). Warranties transferred to you will
              be sent to it.
            </p>
            <form
              className="account-inline-form"
              onSubmit={(e) => {
                e.preventDefault()
                save(address.trim())
              }}
            >
              <input
                className="mono"
                placeholder="0x…"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                pattern={WALLET_PATTERN}
                title={WALLET_HINT}
                required
              />
              <button type="submit" disabled={busy}>
                {busy ? 'Saving…' : 'Save'}
              </button>
              {connected && (
                <button type="button" className="secondary" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              )}
            </form>
          </>
        )}
        {error && <p className="error">{error}</p>}
      </div>
      {connected && !editing && (
        <div className="account-wallet-actions">
          <button
            type="button"
            className="account-outline"
            onClick={() => {
              setAddress('')
              setEditing(true)
            }}
          >
            {ICONS.pencil} Change
          </button>
          <button type="button" className="account-outline" onClick={disconnect} disabled={busy}>
            {ICONS.link} Disconnect
          </button>
        </div>
      )}
    </section>
  )
}

function useSaver() {
  const [status, setStatus] = useState({ error: '', saved: false, busy: false })
  async function run(action) {
    setStatus({ error: '', saved: false, busy: true })
    try {
      await action()
      setStatus({ error: '', saved: true, busy: false })
    } catch (err) {
      setStatus({ error: err.message, saved: false, busy: false })
    }
  }
  return [status, run]
}

function ProfilePanel({ onDone }) {
  const { user, updateProfile } = useAuth()
  const [form, setForm] = useState({ full_name: user.full_name, email: user.email })
  const [status, run] = useSaver()

  return (
    <form
      className="account-form"
      onSubmit={(e) => {
        e.preventDefault()
        run(async () => {
          await updateProfile({ full_name: form.full_name.trim(), email: form.email.trim() })
          onDone()
        })
      }}
    >
      <label>
        Full name
        <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
      </label>
      <label>
        Email
        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      </label>
      <p className="account-note">
        Account type: <strong>{user.role === 'retailer' ? 'Retailer' : 'Customer'}</strong> · Member since{' '}
        {formatDate(user.created_at, user.date_format)}
      </p>
      {status.error && <p className="error">{status.error}</p>}
      <button type="submit" disabled={status.busy}>
        {status.busy ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}

function SecurityPanel() {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [status, run] = useSaver()
  const mismatch = form.confirm && form.confirm !== form.new_password

  return (
    <form
      className="account-form"
      onSubmit={(e) => {
        e.preventDefault()
        if (mismatch) return
        run(async () => {
          await api.changePassword({ current_password: form.current_password, new_password: form.new_password })
          setForm({ current_password: '', new_password: '', confirm: '' })
        })
      }}
    >
      <label>
        Current password
        <input
          type="password"
          autoComplete="current-password"
          value={form.current_password}
          onChange={(e) => setForm({ ...form, current_password: e.target.value })}
          required
        />
      </label>
      <label>
        New password
        <input
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={form.new_password}
          onChange={(e) => setForm({ ...form, new_password: e.target.value })}
          required
        />
      </label>
      <label>
        Confirm new password
        <input
          type="password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={(e) => setForm({ ...form, confirm: e.target.value })}
          required
        />
      </label>
      {mismatch && <p className="error">The new passwords don't match.</p>}
      {status.error && <p className="error">{status.error}</p>}
      {status.saved && <p className="account-saved">Password updated.</p>}
      <button type="submit" disabled={status.busy || mismatch}>
        {status.busy ? 'Updating…' : 'Update password'}
      </button>
    </form>
  )
}

const KIND_LABELS = { issued: 'Issued', minted: 'Minted to you', received: 'Received', sent: 'Sent' }

function HistoryPanel() {
  const { user } = useAuth()
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.myTransactions().then(setItems).catch((err) => setError(err.message))
  }, [])

  if (error) return <p className="error">{error}</p>
  if (!items) return <p className="muted">Loading…</p>
  if (items.length === 0) return <p className="muted">No on-chain transactions yet.</p>

  return (
    <ul className="account-history">
      {items.map((item, index) => (
        <li key={`${item.tx_hash}-${index}`}>
          <span className={`account-kind ${item.kind}`}>{KIND_LABELS[item.kind]}</span>
          <span className="grow">
            <Link to={`/warranties/${item.warranty_id}`}>{item.product_name}</Link>
            <span className="muted">
              {item.counterparty
                ? ['sent', 'issued'].includes(item.kind)
                  ? ` to ${item.counterparty}`
                  : ` from ${item.counterparty}`
                : ''}
              {' · '}
              {formatDate(item.at, user.date_format)}
            </span>
          </span>
          {item.explorer_tx_url ? (
            <a href={item.explorer_tx_url} target="_blank" rel="noreferrer">
              View ↗
            </a>
          ) : (
            <span className="muted">off-chain</span>
          )}
        </li>
      ))}
    </ul>
  )
}

function SettingsPanel() {
  const { user, updateProfile } = useAuth()
  const [status, run] = useSaver()

  function set(field, value) {
    run(() => updateProfile({ [field]: value }))
  }

  return (
    <div className="account-form">
      <label>
        Date format
        <select value={user.date_format} onChange={(e) => set('date_format', e.target.value)} disabled={status.busy}>
          <option value="long">{formatDate('2027-09-24', 'long')}</option>
          <option value="iso">2027-09-24</option>
        </select>
      </label>
      <label>
        Mark warranties as "Expiring Soon"
        <select
          value={user.expiring_soon_days}
          onChange={(e) => set('expiring_soon_days', Number(e.target.value))}
          disabled={status.busy}
        >
          {[30, 60, 90, 180].map((days) => (
            <option key={days} value={days}>
              {days} days before they end
            </option>
          ))}
        </select>
      </label>
      {status.error && <p className="error">{status.error}</p>}
      {status.saved && <p className="account-saved">Saved.</p>}
    </div>
  )
}

function BusinessCard({ onEdit }) {
  const { user } = useAuth()
  return (
    <section className="account-card account-wallet connected account-business">
      <span className="account-wallet-icon">{ICONS.store}</span>
      <div className="grow">
        <strong className="account-wallet-title">Business Details</strong>
        <span className="account-wallet-address">{user.business_name}</span>
        <span className="account-wallet-status">
          <span className="dot" /> Retailer account <span className="sep" />
          {user.registration_number ? `Reg. ${user.registration_number}` : 'No registration number'}
        </span>
      </div>
      <div className="account-wallet-actions">
        <button type="button" className="account-outline" onClick={onEdit}>
          {ICONS.pencil} Edit
        </button>
      </div>
    </section>
  )
}

function BusinessPanel({ onDone }) {
  const { user, updateProfile } = useAuth()
  const [form, setForm] = useState({
    business_name: user.business_name || '',
    registration_number: user.registration_number || '',
  })
  const [status, run] = useSaver()

  return (
    <form
      className="account-form"
      onSubmit={(e) => {
        e.preventDefault()
        run(async () => {
          await updateProfile({
            business_name: form.business_name.trim(),
            registration_number: form.registration_number.trim() || null,
          })
          onDone()
        })
      }}
    >
      <label>
        Business name
        <input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} required />
      </label>
      <label>
        Registration number (optional)
        <input
          value={form.registration_number}
          onChange={(e) => setForm({ ...form, registration_number: e.target.value })}
          placeholder="e.g. NZBN 9429041234567"
        />
      </label>
      <p className="account-note">The business name is shown to customers on the warranties you issue.</p>
      {status.error && <p className="error">{status.error}</p>}
      <button type="submit" disabled={status.busy}>
        {status.busy ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}

function HelpPanel() {
  const { isRetailer } = useAuth()
  if (isRetailer) {
    return (
      <div className="account-help">
        <details>
          <summary>How do I issue a warranty?</summary>
          <p>
            Add the product under <Link to="/retailer/products">Products</Link>, then use{' '}
            <Link to="/retailer/issue">Issue warranty</Link> with the buyer's DigiProof email.
          </p>
        </details>
        <details>
          <summary>Who pays the gas fee for minting?</summary>
          <p>DigiProof's minting wallet signs and pays for every mint. You can see the fee on each warranty's details.</p>
        </details>
        <details>
          <summary>Can I change a warranty after it's minted?</summary>
          <p>No. It's recorded on the blockchain, which is what makes it trustworthy to buyers and service centres.</p>
        </details>
        <p className="account-note">
          Still stuck? Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </div>
    )
  }
  return (
    <div className="account-help">
      <details>
        <summary>How do I get a warranty into my account?</summary>
        <p>Give the retailer the email you signed up with when you buy. Once they record the sale, it appears on your dashboard.</p>
      </details>
      <details>
        <summary>How can someone check my warranty is real?</summary>
        <p>
          Anyone can enter the serial number on the <Link to="/verify">Verify</Link> page, no account needed.
        </p>
      </details>
      <details>
        <summary>What happens when I sell the product?</summary>
        <p>Open the warranty and use Transfer. The new owner gets it in their account and the change is recorded on-chain.</p>
      </details>
      <p className="account-note">
        Still stuck? Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    </div>
  )
}
