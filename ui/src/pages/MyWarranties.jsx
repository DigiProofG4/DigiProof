import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'

export default function MyWarranties() {
  const [warranties, setWarranties] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .listWarranties()
      .then(setWarranties)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="muted">Loading…</p>

  return (
    <div className="stack">
      <div className="card">
        <h1>My warranties</h1>
        {error && <p className="error">{error}</p>}
        {warranties.length === 0 ? (
          <p className="muted">
            Nothing here yet. A warranty shows up once a retailer records your purchase.
          </p>
        ) : (
          <ul className="list">
            {warranties.map((warranty) => (
              <li key={warranty.id}>
                <Link to={`/warranties/${warranty.id}`}>
                  <strong>{warranty.product.name}</strong>
                </Link>
                <span className="muted">
                  {' '}
                  · serial {warranty.product.serial_number} · cover until {warranty.expires_on}
                </span>
                <span className={`pill pill-${warranty.status}`}>{warranty.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
