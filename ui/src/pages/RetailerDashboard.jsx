import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'
import ProductImage from '../components/ProductImage.jsx'

const IMAGE_TYPES = 'image/jpeg,image/png,image/webp'
const EMPTY_FORM = { name: '', brand: '', model: '', serial_number: '', warranty_months: 12 }

export default function RetailerDashboard() {
  const [products, setProducts] = useState([])
  const [warranties, setWarranties] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  // A product photo is optional: either a file to upload or a link to one hosted elsewhere.
  const [imageMode, setImageMode] = useState('upload')
  const [imageFile, setImageFile] = useState(null)
  const [imageLink, setImageLink] = useState('')
  const [fileInputKey, setFileInputKey] = useState(0)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function refresh() {
    try {
      const [p, w] = await Promise.all([api.listProducts(), api.listWarranties()])
      setProducts(p)
      setWarranties(w)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  function resetImage() {
    setImageFile(null)
    setImageLink('')
    setFileInputKey((key) => key + 1)
  }

  async function addProduct(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const payload = { ...form, warranty_months: Number(form.warranty_months) }
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

  return (
    <div className="stack">
      <div className="card">
        <h1>Register a product</h1>
        <p className="muted">
          Add the item before it sells. The serial number is what ties it to the token.
        </p>
        <form onSubmit={addProduct} className="grid">
          <label>
            Product name
            <input value={form.name} onChange={(e) => update('name', e.target.value)} required />
          </label>
          <label>
            Serial number
            <input
              value={form.serial_number}
              onChange={(e) => update('serial_number', e.target.value)}
              required
            />
          </label>
          <label>
            Brand
            <input value={form.brand} onChange={(e) => update('brand', e.target.value)} />
          </label>
          <label>
            Model
            <input value={form.model} onChange={(e) => update('model', e.target.value)} />
          </label>
          <label>
            Warranty (months)
            <input
              type="number"
              min="1"
              value={form.warranty_months}
              onChange={(e) => update('warranty_months', e.target.value)}
            />
          </label>
          <div className="image-field">
            Product image (optional)
            <div className="tabs">
              <button
                type="button"
                className={imageMode === 'upload' ? '' : 'secondary'}
                onClick={() => setImageMode('upload')}
              >
                Upload photo
              </button>
              <button
                type="button"
                className={imageMode === 'link' ? '' : 'secondary'}
                onClick={() => setImageMode('link')}
              >
                Image link
              </button>
            </div>
            {imageMode === 'upload' ? (
              <div className="preview">
                <input
                  key={fileInputKey}
                  type="file"
                  accept={IMAGE_TYPES}
                  onChange={(e) => setImageFile(e.target.files[0] || null)}
                />
                <span className="hint">JPG, PNG or WebP, up to 5 MB</span>
              </div>
            ) : (
              <input
                type="url"
                placeholder="https://…"
                value={imageLink}
                onChange={(e) => setImageLink(e.target.value)}
              />
            )}
          </div>
          <div className="actions">
            <button type="submit" disabled={busy}>
              {busy ? 'Adding…' : 'Add product'}
            </button>
          </div>
        </form>
        {error && <p className="error">{error}</p>}
      </div>

      <div className="card">
        <div className="row-between">
          <h2>Products ({products.length})</h2>
          <Link to="/retailer/issue" className="button-link">
            Issue a warranty
          </Link>
        </div>
        {products.length === 0 ? (
          <p className="muted">Nothing registered yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Photo</th>
                <th>Name</th>
                <th>Serial</th>
                <th>Cover</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="photo-cell">
                    <ProductImage product={product} size={48} />
                  </td>
                  <td>
                    <Link to={`/retailer/products/${product.id}`}>
                      {product.name}
                      {product.model ? ` (${product.model})` : ''}
                    </Link>
                  </td>
                  <td className="mono">{product.serial_number}</td>
                  <td className="nowrap">{product.warranty_months} months</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2>Warranties issued ({warranties.length})</h2>
        {warranties.length === 0 ? (
          <p className="muted">No sales recorded yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Owner</th>
                <th>Expires</th>
                <th>Gas fee</th>
              </tr>
            </thead>
            <tbody>
              {warranties.map((warranty) => (
                <tr key={warranty.id}>
                  <td>
                    <Link to={`/warranties/${warranty.id}`}>{warranty.product.name}</Link>
                  </td>
                  <td>{warranty.owner.email}</td>
                  <td>{warranty.expires_on}</td>
                  <td className="mono">
                    {warranty.gas_fee_eth != null ? `${warranty.gas_fee_eth.toFixed(8)} ETH` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
