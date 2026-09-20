import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../auth/AuthContext.jsx'

export default function WarrantyDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [warranty, setWarranty] = useState(null)
  const [error, setError] = useState('')
  const [transferEmail, setTransferEmail] = useState('')
  const [busy, setBusy] = useState(false)

  function load() {
    api
      .getWarranty(id)
      .then(setWarranty)
      .catch((err) => setError(err.message))
  }

  useEffect(load, [id])

  async function handleTransfer(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const updated = await api.transferWarranty(id, { new_owner_email: transferEmail })
      setWarranty(updated)
      setTransferEmail('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (error && !warranty) return <p className="error">{error}</p>
  if (!warranty) return <p className="muted">Loading…</p>

  const isOwner = user?.id === warranty.owner.id

  return (
    <div className="stack">
      <div className="card">
        <div className="row-between">
          <h1>{warranty.product.name}</h1>
          <span className={`pill pill-${warranty.status}`}>{warranty.status}</span>
        </div>
        <dl className="details">
          <dt>Serial number</dt>
          <dd className="mono">{warranty.product.serial_number}</dd>
          <dt>Purchased</dt>
          <dd>{warranty.purchase_date}</dd>
          <dt>Cover until</dt>
          <dd>{warranty.expires_on}</dd>
          <dt>Owner</dt>
          <dd>
            {warranty.owner.full_name} ({warranty.owner.email})
          </dd>
          {warranty.terms && (
            <>
              <dt>Terms</dt>
              <dd>{warranty.terms}</dd>
            </>
          )}
          <dt>On-chain token</dt>
          <dd className="mono">{warranty.token_id || 'not minted yet'}</dd>
          <dt>Transaction</dt>
          <dd className="mono truncate">{warranty.tx_hash || '—'}</dd>
        </dl>
      </div>

      <div className="card">
        <h2>Ownership history</h2>
        {warranty.transfers.length === 0 ? (
          <p className="muted">No transfers recorded.</p>
        ) : (
          <ul className="list">
            {warranty.transfers.map((transfer) => (
              <li key={transfer.id}>
                {transfer.from_user_id ? `#${transfer.from_user_id}` : 'Minted'} →{' '}
                {`#${transfer.to_user_id}`}
                <span className="muted"> · {new Date(transfer.transferred_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isOwner && (
        <div className="card">
          <h2>Transfer ownership</h2>
          <p className="muted">Selling it on? Hand the proof of purchase to the new owner.</p>
          <form onSubmit={handleTransfer} className="row">
            <input
              type="email"
              placeholder="new-owner@example.com"
              value={transferEmail}
              onChange={(e) => setTransferEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={busy}>
              {busy ? 'Transferring…' : 'Transfer'}
            </button>
          </form>
          {error && <p className="error">{error}</p>}
        </div>
      )}
    </div>
  )
}
