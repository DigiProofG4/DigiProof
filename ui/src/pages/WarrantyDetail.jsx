import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { WALLET_HINT, WALLET_PATTERN } from '../components/WalletCard.jsx'
import ProductImage from '../components/ProductImage.jsx'
import { formatDate } from '../utils/dates.js'
import { STATE_LABELS, coverLength, displayState, startOfToday, timeLeft } from '../utils/warranty.js'

// What the status banner says under the state name; "Your" only for the owner.
const STATE_TEXT = {
  active: (whose) => `${whose} warranty is valid.`,
  expiring: (whose) => `${whose} warranty is valid, but ends soon.`,
  expired: () => 'This warranty has ended.',
  pending: () => 'Recorded, but not written to the blockchain yet.',
  void: () => 'This warranty has been cancelled.',
}

const TABS = [
  { key: 'details', label: 'Warranty Details' },
  { key: 'product', label: 'Product Information' },
  { key: 'history', label: 'Ownership History' },
]

function Icon({ children, ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  )
}

function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard can be blocked (e.g. http on another host); the value is still selectable.
    }
  }
  return (
    <button type="button" className="wd-copy" onClick={copy} aria-label={`Copy ${label}`} title={copied ? 'Copied' : `Copy ${label}`}>
      {copied ? (
        <Icon>
          <path d="m5 12 5 5 9-10" />
        </Icon>
      ) : (
        <Icon>
          <rect x="9" y="9" width="12" height="12" rx="2" />
          <path d="M5 15V5a2 2 0 0 1 2-2h8" />
        </Icon>
      )}
    </button>
  )
}

function StatusShield({ state }) {
  const good = state === 'active' || state === 'expiring'
  return (
    <svg viewBox="0 0 40 44" className={`wd-shield ${state}`} aria-hidden="true">
      <path d="M20 1 L38 7 V20 C38 31 30 39 20 43 C10 39 2 31 2 20 V7 Z" />
      {good ? (
        <path d="M12 22 L18 28 L29 16" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M20 13v11M20 30h.01" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      )}
    </svg>
  )
}

function MoreMenu({ serial }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const verifyPath = `/verify?serial=${encodeURIComponent(serial)}`

  useEffect(() => {
    if (!open) return undefined
    const close = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${verifyPath}`)
    } catch {
      // ignore; the menu also offers opening the page
    }
    setOpen(false)
  }

  return (
    <div className="wd-more" ref={ref}>
      <button type="button" className="wd-more-button" onClick={() => setOpen(!open)} aria-label="More actions" aria-expanded={open}>
        <Icon>
          <circle cx="5" cy="12" r="1.2" />
          <circle cx="12" cy="12" r="1.2" />
          <circle cx="19" cy="12" r="1.2" />
        </Icon>
      </button>
      {open && (
        <div className="wd-more-menu" role="menu">
          <Link to={verifyPath} role="menuitem">
            Open public verify page
          </Link>
          <button type="button" role="menuitem" onClick={copyLink}>
            Copy verify link
          </button>
        </div>
      )}
    </div>
  )
}

export default function WarrantyDetail() {
  const { id } = useParams()
  const { user, isRetailer } = useAuth()
  const [warranty, setWarranty] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('details')
  const [showTransfer, setShowTransfer] = useState(false)
  const [transferEmail, setTransferEmail] = useState('')
  const [transferWallet, setTransferWallet] = useState('')
  const [transferMessage, setTransferMessage] = useState('')
  // 'form' -> 'confirm' -> back to 'form' with a success notice
  const [step, setStep] = useState('form')
  const [notice, setNotice] = useState(null)
  const [busy, setBusy] = useState(false)

  function load() {
    api
      .getWarranty(id)
      .then(setWarranty)
      .catch((err) => setError(err.message))
  }

  useEffect(load, [id])

  function handleReview(event) {
    event.preventDefault()
    setError('')
    setStep('confirm')
  }

  async function handleTransfer() {
    setError('')
    setBusy(true)
    try {
      const wallet = transferWallet.trim()
      const updated = await api.transferWarranty(id, {
        new_owner_email: transferEmail.trim(),
        new_owner_wallet: wallet || null,
        message: transferMessage.trim() || null,
      })
      const latest = updated.transfers[updated.transfers.length - 1]
      setWarranty(updated)
      setNotice({ to: updated.owner, txUrl: latest?.explorer_tx_url, onChain: Boolean(latest?.tx_hash) })
      setTransferEmail('')
      setTransferWallet('')
      setTransferMessage('')
      setStep('form')
      setShowTransfer(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (error && !warranty) return <p className="error">{error}</p>
  if (!warranty) return <p className="muted">Loading…</p>

  const { product } = warranty
  const isOwner = user?.id === warranty.owner.id
  const dateFormat = user?.date_format ?? 'long'
  const today = startOfToday()
  const state = displayState(warranty, today, user?.expiring_soon_days ?? 90)
  const back = isRetailer ? { to: '/retailer/warranties', label: 'Back to Warranties' } : { to: '/warranties', label: 'Back to My Warranties' }

  return (
    <div className="wd">
      <Link to={back.to} className="wd-back">
        <span className="wd-back-icon">
          <Icon>
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </Icon>
        </span>
        {back.label}
      </Link>

      <section className="wd-hero">
        <ProductImage product={product} size={240} className="wd-photo" />
        <div className="wd-hero-text">
          {product.brand && <p className="wd-eyebrow">{product.brand}</p>}
          <h1>{product.name}</h1>
          <p className="wd-serial">
            {product.serial_number}
            <CopyButton value={product.serial_number} label="serial number" />
          </p>
          <div className="wd-tags">
            {warranty.issued_by && <span>{warranty.issued_by.business_name}</span>}
            {product.model && <span>{product.model}</span>}
          </div>
        </div>
        <MoreMenu serial={product.serial_number} />
      </section>

      <section className={`wd-status ${state}`}>
        <StatusShield state={state} />
        <div className="wd-status-main">
          <strong>{STATE_LABELS[state]}</strong>
          <span>{STATE_TEXT[state](isOwner ? 'Your' : 'This')}</span>
        </div>
        <div className="wd-status-expiry">
          <span>{state === 'expired' ? 'Expired on' : 'Expires on'}</span>
          <strong>{formatDate(warranty.expires_on, dateFormat)}</strong>
          <span>{timeLeft(warranty.expires_on, today)}</span>
        </div>
      </section>

      {notice && (
        <div className="wd-notice">
          <strong>Transferred to {notice.to.full_name}.</strong>{' '}
          {notice.onChain ? (
            <>
              The token was sent on the blockchain
              {notice.txUrl && (
                <>
                  {' '}
                  (
                  <a href={notice.txUrl} target="_blank" rel="noreferrer">
                    view transaction
                  </a>
                  )
                </>
              )}
              .
            </>
          ) : (
            'No wallet was given, so the token stays in DigiProof custody for them.'
          )}
        </div>
      )}

      <section className="wd-actions">
        {isOwner && (
          <button
            type="button"
            className={showTransfer ? 'wd-action active' : 'wd-action'}
            onClick={() => {
              setShowTransfer(!showTransfer)
              setStep('form')
              setError('')
            }}
            aria-expanded={showTransfer}
          >
            <Icon className="wd-action-icon">
              <path d="M4 8h15l-4-4M20 16H5l4 4" />
            </Icon>
            <span>
              <strong>Transfer Ownership</strong>
              <span>Transfer this warranty to another owner.</span>
            </span>
          </button>
        )}
        {warranty.explorer_tx_url ? (
          <a href={warranty.explorer_tx_url} target="_blank" rel="noreferrer" className="wd-action">
            <Icon className="wd-action-icon">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <path d="M14 14h3v3M21 14v.01M14 21h3M21 17v4h-4" />
            </Icon>
            <span>
              <strong>View NFT on Blockchain</strong>
              <span>View the warranty record on the blockchain.</span>
            </span>
          </a>
        ) : (
          <div className="wd-action disabled">
            <Icon className="wd-action-icon">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <path d="M14 14h3v3M21 14v.01M14 21h3M21 17v4h-4" />
            </Icon>
            <span>
              <strong>View NFT on Blockchain</strong>
              <span>No on-chain record for this warranty yet.</span>
            </span>
          </div>
        )}
      </section>

      {isOwner && showTransfer && (
        <section className="wd-card wd-transfer">
          <h2>Transfer Ownership</h2>
          {step === 'form' ? (
            <form onSubmit={handleReview} className="tf">
              <label className="tf-field">
                <span className="tf-label">New Owner's Email</span>
                <span className="tf-help">They need a DigiProof account. The warranty moves to it.</span>
                <span className="tf-input">
                  <Icon>
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" />
                  </Icon>
                  <input
                    type="email"
                    placeholder="new-owner@example.com"
                    value={transferEmail}
                    onChange={(e) => setTransferEmail(e.target.value)}
                    required
                  />
                </span>
              </label>

              <label className="tf-field">
                <span className="tf-label">New Owner's Wallet Address</span>
                <span className="tf-help">
                  Enter the recipient's wallet address to transfer this warranty NFT. Leave blank to use the wallet
                  saved on their account.
                </span>
                <span className="tf-input">
                  <Icon>
                    <path d="M3 7a2 2 0 0 1 2-2h13v4" />
                    <rect x="3" y="7" width="18" height="13" rx="2" />
                    <path d="M16 13.5h2" />
                  </Icon>
                  <input
                    placeholder="0x..."
                    value={transferWallet}
                    onChange={(e) => setTransferWallet(e.target.value)}
                    pattern={WALLET_PATTERN}
                    title={WALLET_HINT}
                  />
                </span>
              </label>

              <label className="tf-field">
                <span className="tf-label">Add a Personal Message (Optional)</span>
                <textarea
                  rows={4}
                  maxLength={200}
                  placeholder="e.g. Enjoy your new product! The warranty is now yours."
                  value={transferMessage}
                  onChange={(e) => setTransferMessage(e.target.value)}
                />
                <span className="tf-count">{transferMessage.length}/200</span>
              </label>

              <div className="tf-info">
                <span className="tf-info-icon">i</span>
                <div>
                  <strong>Important Information</strong>
                  <ul>
                    <li>The warranty NFT will be transferred to the new owner's wallet address.</li>
                    <li>If they have no wallet, it stays in DigiProof custody for them.</li>
                    <li>This action cannot be undone.</li>
                    <li>Make sure the email and wallet address are correct.</li>
                  </ul>
                </div>
              </div>

              <div className="tf-buttons">
                <button type="submit">Review transfer</button>
                <button type="button" className="secondary" onClick={() => setShowTransfer(false)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="confirm">
              <p>
                Transfer <strong>{product.name}</strong> to <strong>{transferEmail.trim()}</strong>?
              </p>
              <dl className="details">
                <dt>Send token to</dt>
                <dd className="mono wallet">{transferWallet.trim() || 'Their saved wallet, or DigiProof custody'}</dd>
                {transferMessage.trim() && (
                  <>
                    <dt>Your message</dt>
                    <dd>“{transferMessage.trim()}”</dd>
                  </>
                )}
              </dl>
              <p className="muted">This can't be undone. Once transferred, the warranty moves to their account.</p>
              <div className="row">
                <button type="button" onClick={handleTransfer} disabled={busy}>
                  {busy ? 'Transferring…' : 'Yes, transfer'}
                </button>
                <button type="button" className="secondary" onClick={() => setStep('form')} disabled={busy}>
                  Back
                </button>
              </div>
            </div>
          )}
          {error && <p className="error">{error}</p>}
        </section>
      )}

      <nav className="wd-tabs" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            className={tab === item.key ? 'active' : ''}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <section className="wd-card">
        {tab === 'details' && (
          <>
            <h2 className="wd-card-title">
              <Icon>
                <path d="M12 2 20 5v6c0 5.5-3.4 9.4-8 11-4.6-1.6-8-5.5-8-11V5l8-3Z" />
              </Icon>
              Warranty Details
            </h2>
            <dl className="wd-table">
              <dt>Serial Number</dt>
              <dd>
                {product.serial_number}
                <CopyButton value={product.serial_number} label="serial number" />
              </dd>
              <dt>Product Name</dt>
              <dd>{product.name}</dd>
              <dt>Brand</dt>
              <dd>{product.brand || '—'}</dd>
              <dt>Model</dt>
              <dd>{product.model || '—'}</dd>
              <dt>Warranty Period</dt>
              <dd>{coverLength(product.warranty_months)}</dd>
              <dt>Purchase Date</dt>
              <dd>{formatDate(warranty.purchase_date, dateFormat)}</dd>
              <dt>Expiry Date</dt>
              <dd>{formatDate(warranty.expires_on, dateFormat)}</dd>
              <dt>Warranty Status</dt>
              <dd>
                <span className={`owner-state ${state}`}>{STATE_LABELS[state]}</span>
              </dd>
              {warranty.terms && (
                <>
                  <dt>Terms</dt>
                  <dd>{warranty.terms}</dd>
                </>
              )}
              <dt>Blockchain Token ID</dt>
              <dd>
                {warranty.token_id ? (
                  <>
                    {warranty.token_id}
                    <CopyButton value={warranty.token_id} label="token ID" />
                  </>
                ) : (
                  'Not minted yet'
                )}
              </dd>
              {warranty.tx_hash && (
                <>
                  <dt>Mint Transaction</dt>
                  <dd>
                    {warranty.explorer_tx_url ? (
                      <a href={warranty.explorer_tx_url} target="_blank" rel="noreferrer">
                        {warranty.tx_hash.slice(0, 10)}…{warranty.tx_hash.slice(-6)} ↗
                      </a>
                    ) : (
                      `${warranty.tx_hash.slice(0, 10)}…${warranty.tx_hash.slice(-6)}`
                    )}
                    <CopyButton value={warranty.tx_hash} label="transaction hash" />
                  </dd>
                </>
              )}
              {warranty.block_number != null && (
                <>
                  <dt>Block</dt>
                  <dd>{warranty.block_number.toLocaleString()}</dd>
                </>
              )}
              {warranty.gas_fee_eth != null && (
                <>
                  <dt>Gas Fee</dt>
                  <dd>
                    {warranty.gas_fee_eth.toFixed(8)} ETH
                    <span className="muted"> ({warranty.gas_used.toLocaleString()} gas)</span>
                  </dd>
                </>
              )}
            </dl>
          </>
        )}

        {tab === 'product' && (
          <>
            <h2 className="wd-card-title">
              <Icon>
                <path d="M12 2 21 7v10l-9 5-9-5V7l9-5Z" />
                <path d="M3 7l9 5 9-5M12 12v10" />
              </Icon>
              Product Information
            </h2>
            <dl className="wd-table">
              <dt>Product Name</dt>
              <dd>{product.name}</dd>
              <dt>Brand</dt>
              <dd>{product.brand || '—'}</dd>
              <dt>Model</dt>
              <dd>{product.model || '—'}</dd>
              <dt>Serial Number</dt>
              <dd>
                {product.serial_number}
                <CopyButton value={product.serial_number} label="serial number" />
              </dd>
              <dt>Sold By</dt>
              <dd>{warranty.issued_by?.business_name || '—'}</dd>
              {warranty.price_paid != null && (
                <>
                  <dt>Price Paid</dt>
                  <dd>${warranty.price_paid.toFixed(2)}</dd>
                </>
              )}
              <dt>Current Owner</dt>
              <dd>{warranty.owner.full_name}</dd>
            </dl>
          </>
        )}

        {tab === 'history' && (
          <>
            <h2 className="wd-card-title">
              <Icon>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </Icon>
              Ownership History
            </h2>
            {warranty.transfers.length === 0 ? (
              <p className="muted">No transfers recorded.</p>
            ) : (
              <ol className="wd-timeline">
                {[...warranty.transfers].reverse().map((transfer) => (
                  <li key={transfer.id}>
                    <span className="wd-dot" />
                    <div>
                      <strong>
                        {transfer.from_user ? `${transfer.from_user.full_name} → ${transfer.to_user.full_name}` : `Issued to ${transfer.to_user.full_name}`}
                      </strong>
                      <span className="muted">
                        {transfer.from_user ? 'Ownership transferred' : `Sold by ${warranty.issued_by?.business_name || 'the retailer'}`}
                        {' · '}
                        {formatDate(transfer.transferred_at, dateFormat)}
                      </span>
                      {transfer.message && <span className="wd-message">“{transfer.message}”</span>}
                    </div>
                    {transfer.explorer_tx_url && (
                      <a href={transfer.explorer_tx_url} target="_blank" rel="noreferrer">
                        View ↗
                      </a>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </>
        )}
      </section>

      <section className="wd-footer">
        <span className="wd-footer-icon">
          <Icon>
            <path d="m12 3 9 5-9 5-9-5 9-5Z" />
            <path d="m3 13 9 5 9-5M3 17l9 5 9-5" />
          </Icon>
        </span>
        <div>
          <strong>This warranty is stored on the blockchain.</strong>
          <span>Transparent. Tamper-proof. Always yours.</span>
        </div>
      </section>
    </div>
  )
}
