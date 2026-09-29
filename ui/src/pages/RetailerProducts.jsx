import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'
import ProductImage from '../components/ProductImage.jsx'
import { coverLength } from '../utils/warranty.js'

const IMAGE_TYPES = 'image/jpeg,image/png,image/webp'
const EMPTY_FORM = { name: '', brand: '', model: '', serial_number: '', warranty_months: 12 }
const COVER_OPTIONS = [6, 12, 18, 24, 36, 48, 60]

function Icon({ children }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

const PLUS = (
  <Icon>
    <path d="M12 5v14M5 12h14" />
  </Icon>
)

function ActionsMenu({ product, sold, onIssue }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const close = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  async function copySerial() {
    try {
      await navigator.clipboard.writeText(product.serial_number)
    } catch {
      // Clipboard can be blocked; the serial is visible in the row anyway.
    }
    setOpen(false)
  }

  return (
    <div className="rp-menu" ref={ref}>
      <button type="button" className="rp-menu-button" onClick={() => setOpen(!open)} aria-label={`Actions for ${product.name}`} aria-expanded={open}>
        <Icon>
          <circle cx="5" cy="12" r="1.3" />
          <circle cx="12" cy="12" r="1.3" />
          <circle cx="19" cy="12" r="1.3" />
        </Icon>
      </button>
      {open && (
        <div className="wd-more-menu" role="menu">
          <Link to={`/retailer/products/${product.id}`} role="menuitem">
            View details &amp; photo
          </Link>
          {sold ? (
            <Link to={`/warranties/${sold}`} role="menuitem">
              View its warranty
            </Link>
          ) : (
            <button type="button" role="menuitem" onClick={onIssue}>
              Issue a warranty
            </button>
          )}
          <button type="button" role="menuitem" onClick={copySerial}>
            Copy serial number
          </button>
        </div>
      )}
    </div>
  )
}

export default function RetailerProducts() {
  const navigate = useNavigate()
  const formRef = useRef(null)
  const [products, setProducts] = useState([])
  // product id -> warranty id, for products that have been sold.
  const [soldBy, setSoldBy] = useState({})
  const [form, setForm] = useState(EMPTY_FORM)
  // A product photo is optional: either a file to upload or a link to one hosted elsewhere.
  const [imageMode, setImageMode] = useState('upload')
  const [imageFile, setImageFile] = useState(null)
  const [imageLink, setImageLink] = useState('')
  const [filePreview, setFilePreview] = useState(null)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  async function refresh() {
    try {
      const [p, w] = await Promise.all([api.listProducts(), api.listWarranties()])
      setProducts(p)
      setSoldBy(Object.fromEntries(w.map((warranty) => [warranty.product.id, warranty.id])))
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  // Show the chosen file straight away, before it is uploaded.
  useEffect(() => {
    if (!imageFile) {
      setFilePreview(null)
      return undefined
    }
    const url = URL.createObjectURL(imageFile)
    setFilePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  function resetImage() {
    setImageFile(null)
    setImageLink('')
    setFileInputKey((key) => key + 1)
  }

  async function addProduct(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        serial_number: form.serial_number.trim(),
        brand: form.brand.trim(),
        model: form.model.trim(),
        warranty_months: Number(form.warranty_months),
      }
      if (imageMode === 'link' && imageLink.trim()) payload.image_url = imageLink.trim()
      const product = await api.createProduct(payload)
      setForm(EMPTY_FORM)
      if (imageMode === 'upload' && imageFile) {
        try {
          await api.uploadProductImage(product.id, imageFile)
        } catch (err) {
          setError(`Product added, but the photo was not saved: ${err.message}`)
        }
      }
      setNotice(`${product.name} was added. It's ready to be sold.`)
      resetImage()
      refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function startNew() {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    formRef.current?.querySelector('input')?.focus({ preventScroll: true })
  }

  const previewImage = imageMode === 'upload' ? filePreview : imageLink.trim()
  const dash = (value) => (value && String(value).trim()) || '–'

  return (
    <div className="rp">
      <Link to="/retailer" className="rp-back">
        <Icon>
          <path d="M19 12H5M11 18l-6-6 6-6" />
        </Icon>
        Back
      </Link>
      <header className="rp-head">
        <h1>Register a Product</h1>
        <p>Add the item before it sells. The serial number is what ties it to the token.</p>
      </header>

      <div className="rp-layout">
        <form onSubmit={addProduct} className="iw-card rp-form" ref={formRef}>
          <h2>Product Details</h2>
          <p className="rp-sub">Enter the product information.</p>

          <div className="rp-grid">
            <label>
              <span>
                Product name <em>*</em>
              </span>
              <input
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="e.g. Wireless Headphones XR200"
                required
              />
            </label>
            <label>
              <span>
                Serial number <em>*</em>
              </span>
              <input
                value={form.serial_number}
                onChange={(e) => update('serial_number', e.target.value)}
                placeholder="e.g. SN-48213-XR"
                required
              />
            </label>
            <label>
              <span>
                Brand <em>*</em>
              </span>
              <input value={form.brand} onChange={(e) => update('brand', e.target.value)} placeholder="e.g. Sony" required />
            </label>
            <label>
              <span>
                Model <em>*</em>
              </span>
              <input value={form.model} onChange={(e) => update('model', e.target.value)} placeholder="e.g. WH-XR200" required />
            </label>
            <label>
              <span>
                Warranty (months) <em>*</em>
              </span>
              <select value={form.warranty_months} onChange={(e) => update('warranty_months', e.target.value)}>
                {COVER_OPTIONS.map((months) => (
                  <option key={months} value={months}>
                    {months}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="rp-image">
            <span className="rp-image-label">
              Product image <small>(optional)</small>
            </span>
            <div className="rp-tabs">
              <button type="button" className={imageMode === 'upload' ? 'active' : ''} onClick={() => setImageMode('upload')}>
                Upload photo
              </button>
              <button type="button" className={imageMode === 'link' ? 'active' : ''} onClick={() => setImageMode('link')}>
                Image link
              </button>
            </div>
            {imageMode === 'upload' ? (
              <div className="rp-file">
                <input key={fileInputKey} type="file" accept={IMAGE_TYPES} onChange={(e) => setImageFile(e.target.files[0] || null)} />
                <span className="hint muted">JPG, PNG or WebP, up to 5 MB</span>
              </div>
            ) : (
              <input type="url" placeholder="https://…" value={imageLink} onChange={(e) => setImageLink(e.target.value)} />
            )}
          </div>

          {error && <p className="error">{error}</p>}
          {notice && <p className="account-saved">{notice}</p>}

          <button type="submit" className="rp-submit" disabled={busy}>
            {PLUS}
            {busy ? 'Adding…' : 'Add product'}
          </button>
        </form>

        <aside className="iw-card rp-preview">
          <h2>Product Preview</h2>
          <div className="rp-preview-image">
            {previewImage ? (
              <img src={previewImage} alt="" />
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 2 21 7v10l-9 5-9-5V7l9-5Z" />
                  <path d="M3 7l9 5 9-5M12 12v10" />
                </svg>
                <span>Upload a product image to see preview.</span>
              </>
            )}
          </div>
          <dl className="rp-facts">
            <dt>Product name</dt>
            <dd>{dash(form.name)}</dd>
            <dt>Serial number</dt>
            <dd>{dash(form.serial_number)}</dd>
            <dt>Brand</dt>
            <dd>{dash(form.brand)}</dd>
            <dt>Model</dt>
            <dd>{dash(form.model)}</dd>
            <dt>Warranty length</dt>
            <dd>{coverLength(Number(form.warranty_months))}</dd>
          </dl>
        </aside>
      </div>

      <section className="iw-card rp-table-card">
        <div className="rp-table-head">
          <h2>Products ({products.length})</h2>
          <button type="button" className="rw-new" onClick={startNew}>
            {PLUS}
            Register a new product
          </button>
        </div>
        {products.length === 0 ? (
          <p className="muted">Nothing registered yet.</p>
        ) : (
          <div className="rp-table-wrap">
            <table className="rp-table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Product Name</th>
                  <th>Serial Number</th>
                  <th>Brand</th>
                  <th>Model</th>
                  <th>Warranty</th>
                  <th>Status</th>
                  <th className="rp-actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <ProductImage product={product} size={40} />
                    </td>
                    <td>
                      <Link to={`/retailer/products/${product.id}`}>{product.name}</Link>
                    </td>
                    <td>{product.serial_number}</td>
                    <td>{product.brand || '–'}</td>
                    <td>{product.model || '–'}</td>
                    <td className="nowrap">{product.warranty_months} months</td>
                    <td>
                      <span className={soldBy[product.id] ? 'rp-badge sold' : 'rp-badge'}>
                        {soldBy[product.id] ? 'Sold' : 'In stock'}
                      </span>
                    </td>
                    <td className="rp-actions-col">
                      <ActionsMenu product={product} sold={soldBy[product.id]} onIssue={() => navigate(`/retailer/issue?product=${product.id}`)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
