import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../auth/AuthContext.jsx'
import ProductImage from '../components/ProductImage.jsx'
import { WALLET_HINT, WALLET_PATTERN } from '../components/WalletCard.jsx'
import { formatDate } from '../utils/dates.js'
import { coverLength } from '../utils/warranty.js'

function Icon({ children }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

// Same month arithmetic as the API (routers/warranties.py add_months), so the
// preview shows the expiry date the warranty will actually get.
function addMonths(iso, months) {
  const [year, month, day] = iso.split('-').map(Number)
  const index = month - 1 + months
  const y = year + Math.floor(index / 12)
  const m = (index % 12) + 1
  const lastDay = new Date(y, m, 0).getDate()
  const pad = (n) => String(n).padStart(2, '0')
  return `${y}-${pad(m)}-${pad(Math.min(day, lastDay))}`
}

function today() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export default function IssueWarranty() {
  const navigate = useNavigate()
  // /retailer/issue?product=<id> (from a product's actions menu) starts with it chosen.
  const [params] = useSearchParams()
  const { user } = useAuth()
  const dateFormat = user?.date_format ?? 'long'
  const [products, setProducts] = useState([])
  const [soldIds, setSoldIds] = useState(new Set())
  const [form, setForm] = useState({
    product_id: params.get('product') || '',
    customer_email: '',
    customer_wallet_address: '',
    purchase_date: today(),
    price_paid: '',
    terms: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    Promise.all([api.listProducts(), api.listWarranties()])
      .then(([p, w]) => {
        setProducts(p)
        // A product can only carry one warranty, so sold ones are left out of the list.
        setSoldIds(new Set(w.map((warranty) => warranty.product.id)))
      })
      .catch((err) => setError(err.message))
  }, [])

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const warranty = await api.issueWarranty({
        product_id: Number(form.product_id),
        customer_email: form.customer_email.trim(),
        customer_wallet_address: form.customer_wallet_address.trim() || null,
        purchase_date: form.purchase_date,
        price_paid: form.price_paid ? Number(form.price_paid) : null,
        terms: form.terms.trim() || null,
      })
      navigate(`/warranties/${warranty.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const available = products.filter((product) => !soldIds.has(product.id))
  const noneLeft = products.length > 0 && available.length === 0
  const selected = products.find((product) => String(product.id) === form.product_id)
  const expires = selected && form.purchase_date ? addMonths(form.purchase_date, selected.warranty_months) : null

  return (
    <div className="iw">
      <header className="iw-head">
        <h1>Issue a Warranty</h1>
        <p>Recording the sale mints the proof of purchase as an NFT. The customer needs a DigiProof account first.</p>
      </header>

      <div className="iw-layout">
        <form onSubmit={handleSubmit} className="iw-card tf">
          <label className="tf-field">
            <span className="tf-label">Product</span>
            <span className="tf-help">Only products without a warranty are listed.</span>
            <span className="tf-input">
              <Icon>
                <path d="M12 2 21 7v10l-9 5-9-5V7l9-5Z" />
                <path d="M3 7l9 5 9-5M12 12v10" />
              </Icon>
              <select
                value={form.product_id}
                onChange={(e) => update('product_id', e.target.value)}
                disabled={noneLeft}
                required
              >
                <option value="">{noneLeft ? 'No unsold products' : 'Choose a product…'}</option>
                {available.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} — {product.serial_number}
                  </option>
                ))}
              </select>
            </span>
            {noneLeft && (
              <span className="iw-empty">
                All your products already have a warranty. Each product can only be sold once.
                <Link to="/retailer/products" className="iw-empty-button">
                  + Add a product
                </Link>
              </span>
            )}
          </label>

          <label className="tf-field">
            <span className="tf-label">Customer Email</span>
            <span className="tf-help">The email the buyer signed up to DigiProof with.</span>
            <span className="tf-input">
              <Icon>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </Icon>
              <input
                type="email"
                placeholder="customer@example.com"
                value={form.customer_email}
                onChange={(e) => update('customer_email', e.target.value)}
                required
              />
            </span>
          </label>

          <label className="tf-field">
            <span className="tf-label">Buyer Wallet Address</span>
            <span className="tf-help">
              Leave blank if the buyer already saved a wallet in their account. Otherwise, enter the address that will receive the NFT.
            </span>
            <span className="tf-input">
              <Icon>
                <path d="M3 7a2 2 0 0 1 2-2h13v4" />
                <rect x="3" y="7" width="18" height="13" rx="2" />
                <path d="M16 13.5h2" />
              </Icon>
              <input
                className="mono"
                placeholder="0x..."
                value={form.customer_wallet_address}
                onChange={(e) => update('customer_wallet_address', e.target.value)}
                pattern={WALLET_PATTERN}
                title={WALLET_HINT}
              />
            </span>
          </label>

          <div className="iw-row">
            <label className="tf-field">
              <span className="tf-label">Purchase Date</span>
              <span className="tf-input">
                <Icon>
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M3 10h18M8 3v4M16 3v4" />
                </Icon>
                <input
                  type="date"
                  value={form.purchase_date}
                  max={today()}
                  onChange={(e) => update('purchase_date', e.target.value)}
                  required
                />
              </span>
            </label>

            <label className="tf-field">
              <span className="tf-label">Price Paid (Optional)</span>
              <span className="tf-input">
                <span className="iw-currency">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.price_paid}
                  onChange={(e) => update('price_paid', e.target.value)}
                />
              </span>
            </label>
          </div>

          <label className="tf-field">
            <span className="tf-label">Warranty Terms (Optional)</span>
            <textarea
              rows={4}
              placeholder="What the cover includes and excludes, e.g. Parts and labour. Excludes accidental damage."
              value={form.terms}
              onChange={(e) => update('terms', e.target.value)}
            />
          </label>

          {error && <p className="error">{error}</p>}

          <div className="tf-buttons">
            <button type="submit" disabled={busy || noneLeft}>
              {busy ? 'Recording…' : 'Record sale and mint'}
            </button>
            <Link to="/retailer" className="iw-cancel">
              Cancel
            </Link>
          </div>
        </form>

        <aside className="iw-card iw-preview">
          <h2>Warranty Preview</h2>
          {selected ? (
            <>
              <ProductImage product={selected} size={200} className="iw-photo" />
              <strong className="iw-name">{selected.name}</strong>
              <span className="iw-serial">{selected.serial_number}</span>
              <dl className="iw-facts">
                <dt>Cover</dt>
                <dd>{coverLength(selected.warranty_months)}</dd>
                <dt>Starts</dt>
                <dd>{form.purchase_date ? formatDate(form.purchase_date, dateFormat) : '—'}</dd>
                <dt>Expires</dt>
                <dd>{expires ? formatDate(expires, dateFormat) : '—'}</dd>
                <dt>Owner</dt>
                <dd>{form.customer_email.trim() || '—'}</dd>
              </dl>
            </>
          ) : (
            <p className="muted">Choose a product to see its photo, cover length and expiry date.</p>
          )}
          <div className="iw-note">
            <Icon>
              <path d="M12 2 20 5v6c0 5.5-3.4 9.4-8 11-4.6-1.6-8-5.5-8-11V5l8-3Z" />
              <path d="m9 12 2 2 4-4" />
            </Icon>
            <span>Minting records this warranty on the blockchain. It can't be edited afterwards.</span>
          </div>
        </aside>
      </div>
    </div>
  )
}
