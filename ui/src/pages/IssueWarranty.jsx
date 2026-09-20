import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'

export default function IssueWarranty() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({
    product_id: '',
    customer_email: '',
    purchase_date: new Date().toISOString().slice(0, 10),
    price_paid: '',
    terms: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.listProducts().then(setProducts).catch((err) => setError(err.message))
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
        customer_email: form.customer_email,
        purchase_date: form.purchase_date,
        price_paid: form.price_paid ? Number(form.price_paid) : null,
        terms: form.terms || null,
      })
      navigate(`/warranties/${warranty.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const unissued = products.filter((product) => !product.issued)

  return (
    <div className="card narrow">
      <h1>Issue a warranty</h1>
      <p className="muted">
        Recording the sale mints the proof of purchase. The customer needs an account first.
      </p>

      <form onSubmit={handleSubmit}>
        <label>
          Product
          <select
            value={form.product_id}
            onChange={(e) => update('product_id', e.target.value)}
            required
          >
            <option value="">Choose a product…</option>
            {(unissued.length ? unissued : products).map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} — {product.serial_number}
              </option>
            ))}
          </select>
        </label>
        <label>
          Customer email
          <input
            type="email"
            value={form.customer_email}
            onChange={(e) => update('customer_email', e.target.value)}
            required
          />
        </label>
        <label>
          Purchase date
          <input
            type="date"
            value={form.purchase_date}
            onChange={(e) => update('purchase_date', e.target.value)}
            required
          />
        </label>
        <label>
          Price paid (optional)
          <input
            type="number"
            step="0.01"
            value={form.price_paid}
            onChange={(e) => update('price_paid', e.target.value)}
          />
        </label>
        <label>
          Warranty terms
          <textarea
            rows="3"
            value={form.terms}
            onChange={(e) => update('terms', e.target.value)}
            placeholder="What the cover includes and excludes"
          />
        </label>

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={busy}>
          {busy ? 'Recording…' : 'Record sale and mint'}
        </button>
      </form>
    </div>
  )
}
