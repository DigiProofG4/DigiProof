import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client.js'
import ProductImage from '../components/ProductImage.jsx'

const IMAGE_TYPES = 'image/jpeg,image/png,image/webp'

// A retailer's view of one product: its details, its photo, and the warranty if it has sold.
export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [warranty, setWarranty] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    try {
      const [p, issued] = await Promise.all([api.getProduct(id), api.listWarranties()])
      setProduct(p)
      setWarranty(issued.find((w) => w.product.id === p.id) || null)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function run(action) {
    setError('')
    setBusy(true)
    try {
      setProduct(await action())
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function uploadImage(file) {
    if (file) run(() => api.uploadProductImage(product.id, file))
  }

  function linkImage() {
    const current = product.image_url?.startsWith('http') ? product.image_url : ''
    const link = window.prompt('Paste a link to the product image (https://…)', current)
    if (link) run(() => api.linkProductImage(product.id, link.trim()))
  }

  function removeImage() {
    if (window.confirm('Remove this product photo?')) run(() => api.removeProductImage(product.id))
  }

  if (error && !product) return <p className="error">{error}</p>
  if (!product) return <p className="muted">Loading…</p>

  return (
    <div className="stack">
      <p>
        <Link to="/retailer/products">← Back to products</Link>
      </p>

      <div className="card product-detail">
        <div className="product-detail-photo">
          <ProductImage product={product} size={240} />
          <div className="image-actions">
            <label className={busy ? 'disabled' : ''}>
              {product.image_url ? 'Change photo' : 'Upload photo'}
              <input
                type="file"
                accept={IMAGE_TYPES}
                disabled={busy}
                onChange={(e) => {
                  uploadImage(e.target.files[0])
                  e.target.value = ''
                }}
              />
            </label>
            <button type="button" className="secondary" onClick={linkImage} disabled={busy}>
              Use a link
            </button>
            {product.image_url && (
              <button type="button" className="secondary" onClick={removeImage} disabled={busy}>
                Remove
              </button>
            )}
          </div>
          <span className="hint muted">JPG, PNG or WebP, up to 5 MB</span>
        </div>

        <div className="grow">
          <h1>{product.name}</h1>
          <dl className="details">
            <dt>Brand</dt>
            <dd>{product.brand || '—'}</dd>
            <dt>Model</dt>
            <dd>{product.model || '—'}</dd>
            <dt>Serial number</dt>
            <dd className="mono">{product.serial_number}</dd>
            <dt>Warranty cover</dt>
            <dd>{product.warranty_months} months</dd>
            <dt>Registered</dt>
            <dd>{product.created_at.slice(0, 10)}</dd>
            <dt>Warranty</dt>
            <dd>
              {warranty ? (
                <>
                  <span className={`pill pill-${warranty.status}`}>{warranty.status}</span>{' '}
                  <Link to={`/warranties/${warranty.id}`}>issued to {warranty.owner.email}</Link>
                </>
              ) : (
                <>
                  Not sold yet · <Link to={`/retailer/issue?product=${product.id}`}>Issue a warranty</Link>
                </>
              )}
            </dd>
          </dl>
          {error && <p className="error">{error}</p>}
        </div>
      </div>
    </div>
  )
}
