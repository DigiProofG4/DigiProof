import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { WALLET_HINT, WALLET_PATTERN } from '../components/WalletCard.jsx'

export default function WarrantyDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [warranty, setWarranty] = useState(null)
  const [error, setError] = useState('')
  const [transferEmail, setTransferEmail] = useState('')
  const [transferWallet, setTransferWallet] = useState('')
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
      })
      const latest = updated.transfers[updated.transfers.length - 1]
      setWarranty(updated)
      setNotice({ to: updated.owner, txUrl: latest?.explorer_tx_url, onChain: Boolean(latest?.tx_hash) })
      setTransferEmail('')
      setTransferWallet('')
      setStep('form')
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
          <dd className="mono truncate">
            {warranty.explorer_tx_url ? (
              <a href={warranty.explorer_tx_url} target="_blank" rel="noreferrer">
                {warranty.tx_hash}
              </a>
            ) : (
              warranty.tx_hash || '—'
            )}
          </dd>
          {warranty.block_number != null && (
            <>
              <dt>Block</dt>
              <dd className="mono">{warranty.block_number}</dd>
            </>
          )}
          {warranty.gas_fee_eth != null && (
            <>
              <dt>Gas fee</dt>
              <dd className="mono">
                {warranty.gas_fee_eth.toFixed(8)} ETH
                <span className="muted"> ({warranty.gas_used.toLocaleString()} gas)</span>
              </dd>
            </>
          )}
        </dl>
      </div>

      {notice && (
        <div className="card notice">
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

      <div className="card">
        <h2>Ownership history</h2>
        {warranty.transfers.length === 0 ? (
          <p className="muted">No transfers recorded.</p>
        ) : (
          <ul className="list">
            {warranty.transfers.map((transfer) => (
              <li key={transfer.id}>
                {transfer.from_user ? transfer.from_user.full_name : 'Issued by retailer'} →{' '}
                <strong>{transfer.to_user.full_name}</strong>
                <span className="muted"> · {new Date(transfer.transferred_at).toLocaleString()}</span>
                {transfer.explorer_tx_url && (
                  <>
                    {' · '}
                    <a href={transfer.explorer_tx_url} target="_blank" rel="noreferrer">
                      transaction
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {isOwner && (
        <div className="card">
          <h2>Transfer ownership</h2>
          {step === 'form' ? (
            <>
              <p className="muted">
                Selling it on? Hand this warranty to the new owner. They need a DigiProof account.
              </p>
              <form onSubmit={handleReview} className="narrow-form">
                <label>
                  New owner's email
                  <input
                    type="email"
                    placeholder="new-owner@example.com"
                    value={transferEmail}
                    onChange={(e) => setTransferEmail(e.target.value)}
                    required
                  />
                </label>
                <label>
                  New owner's wallet address (optional)
                  <input
                    className="mono"
                    placeholder="0x…"
                    value={transferWallet}
                    onChange={(e) => setTransferWallet(e.target.value)}
                    pattern={WALLET_PATTERN}
                    title={WALLET_HINT}
                  />
                  <span className="hint">
                    Leave blank to use the wallet saved on their account. If they have none, the
                    warranty stays in DigiProof custody for them.
                  </span>
                </label>
                <button type="submit">Continue</button>
              </form>
            </>
          ) : (
            <div className="confirm">
              <p>
                Transfer <strong>{warranty.product.name}</strong> to{' '}
                <strong>{transferEmail.trim()}</strong>?
              </p>
              <dl className="details">
                <dt>Send token to</dt>
                <dd className="mono wallet">
                  {transferWallet.trim() || 'Their saved wallet, or DigiProof custody'}
                </dd>
              </dl>
              <p className="muted">
                This can't be undone. Once transferred, the warranty moves to their account.
              </p>
              <div className="row">
                <button type="button" onClick={handleTransfer} disabled={busy}>
                  {busy ? 'Transferring…' : 'Yes, transfer'}
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setStep('form')}
                  disabled={busy}
                >
                  Back
                </button>
              </div>
            </div>
          )}
          {error && <p className="error">{error}</p>}
        </div>
      )}
    </div>
  )
}
