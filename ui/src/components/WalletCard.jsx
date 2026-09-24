import { useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'

export const WALLET_PATTERN = '0x[0-9a-fA-F]{40}'
export const WALLET_HINT = 'A wallet address starts with 0x followed by 40 letters and numbers'

// The customer keys in their own wallet once; warranties transferred to them
// are sent straight to it.
export default function WalletCard() {
  const { user, updateWallet } = useAuth()
  const [editing, setEditing] = useState(!user?.wallet_address)
  const [address, setAddress] = useState(user?.wallet_address || '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSave(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const updated = await updateWallet(address.trim())
      setEditing(!updated.wallet_address)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card">
      <h2>My wallet</h2>
      {!editing ? (
        <div className="row-between">
          <span className="mono wallet">{user.wallet_address}</span>
          <button type="button" className="secondary" onClick={() => setEditing(true)}>
            Change
          </button>
        </div>
      ) : (
        <>
          <p className="muted">
            Paste the address from your wallet app (for example MetaMask). Warranties transferred to
            you will be sent to it.
          </p>
          <form onSubmit={handleSave} className="row">
            <input
              className="mono grow"
              placeholder="0x…"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              pattern={WALLET_PATTERN}
              title={WALLET_HINT}
              required
            />
            <button type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Save'}
            </button>
            {user.wallet_address && (
              <button type="button" className="secondary" onClick={() => setEditing(false)}>
                Cancel
              </button>
            )}
          </form>
        </>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  )
}
