import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../auth/AuthContext.jsx'

function decodeTokenMetadata(uri) {
  if (!uri || !uri.startsWith('data:application/json;base64,')) return null
  try {
    return JSON.parse(atob(uri.split(',', 2)[1]))
  } catch {
    return null
  }
}

export default function WarrantyDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [warranty, setWarranty] = useState(null)
  const [error, setError] = useState('')
  const [transferEmail, setTransferEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [contractAddress, setContractAddress] = useState(null)
  const [walletBusy, setWalletBusy] = useState(false)
  const [walletError, setWalletError] = useState('')

  function load() {
    api
      .getWarranty(id)
      .then(setWarranty)
      .catch((err) => setError(err.message))
  }

  useEffect(load, [id])
  useEffect(() => {
    api
      .health()
      .then((health) => setContractAddress(health.contract_address))
      .catch(() => {})
  }, [])

  async function handleAddToWallet() {
    setWalletError('')
    if (!window.ethereum) {
      setWalletError('No wallet found — install MetaMask first')
      return
    }
    if (!contractAddress) {
      setWalletError('Contract not deployed yet')
      return
    }
    setWalletBusy(true)
    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC721',
          options: { address: contractAddress, tokenId: warranty.token_id },
        },
      })
    } catch (err) {
      setWalletError(err.message || 'Could not add to wallet')
    } finally {
      setWalletBusy(false)
    }
  }

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
  const tokenMetadata = decodeTokenMetadata(warranty.metadata_uri)

  return (
    <div className="stack">
      <div className="card">
        <div className="row-between">
          <h1>{warranty.product.name}</h1>
          <span className={`pill pill-${warranty.status}`}>{warranty.status}</span>
        </div>
        {tokenMetadata?.image && (
          <img
            src={tokenMetadata.image}
            alt={`${warranty.product.name} warranty certificate`}
            style={{ width: 200, height: 200, borderRadius: 8, margin: '12px 0' }}
          />
        )}
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
          <dd className="mono">
            {warranty.token_id || 'not minted yet'}
            {warranty.token_id && (
              <>
                {' '}
                <button className="link-button" onClick={handleAddToWallet} disabled={walletBusy}>
                  {walletBusy ? 'Adding…' : 'Add to MetaMask'}
                </button>
                {walletError && <span className="error"> {walletError}</span>}
              </>
            )}
          </dd>
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
