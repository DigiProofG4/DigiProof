import { useState } from 'react'
import { api } from '../api/client.js'

export default function Verify() {
  const [serial, setSerial] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setResult(null)
    setBusy(true)
    try {
      const warranty = await api.verifyBySerial(serial.trim())
      setResult(warranty)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card narrow">
      <h1>Verify a warranty</h1>
      <p className="muted">
        Check any serial number's cover — no account needed. Useful for a second-hand buyer or a
        service centre.
      </p>

      <form onSubmit={handleSubmit} className="row">
        <input
          value={serial}
          onChange={(e) => setSerial(e.target.value)}
          placeholder="Serial number"
          required
        />
        <button type="submit" disabled={busy}>
          {busy ? 'Checking…' : 'Check'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {result && (
        <dl className="details">
          <dt>Product</dt>
          <dd>{result.product.name}</dd>
          <dt>Status</dt>
          <dd>
            <span className={`pill pill-${result.status}`}>{result.status}</span>
          </dd>
          <dt>Cover until</dt>
          <dd>{result.expires_on}</dd>
          <dt>Token</dt>
          <dd className="mono">{result.token_id || 'not minted yet'}</dd>
        </dl>
      )}
    </div>
  )
}
