import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'

export default function RetailerDashboard() {
  const [products, setProducts] = useState([])
  const [warranties, setWarranties] = useState([])
  const [form, setForm] = useState({
    name: '',
    brand: '',
    model: '',
    serial_number: '',
    warranty_months: 12,
  })
  const [error, setError] = useState('')

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

  async function addProduct(event) {
    event.preventDefault()
    setError('')
    try {
      await api.createProduct({ ...form, warranty_months: Number(form.warranty_months) })
      setForm({ name: '', brand: '', model: '', serial_number: '', warranty_months: 12 })
      refresh()
    } catch (err) {
      setError(err.message)
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
          <div className="actions">
            <button type="submit">Add product</button>
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
                <th>Name</th>
                <th>Serial</th>
                <th>Cover</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    {product.name}
                    {product.model ? ` (${product.model})` : ''}
                  </td>
                  <td className="mono">{product.serial_number}</td>
                  <td>{product.warranty_months} months</td>
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
