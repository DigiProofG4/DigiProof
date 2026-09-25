import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'

function shortAddress(address) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

function WalletButton() {
  const { user, connectWallet } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleConnect() {
    setError('')
    if (!window.ethereum) {
      setError('No wallet found — install MetaMask first')
      return
    }
    setBusy(true)
    try {
      // Re-prompt the account picker even if already connected, so switching
      // accounts in MetaMask is reflected here instead of silently reusing
      // whichever address was granted first.
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      })
      const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' })
      await connectWallet(address)
    } catch (err) {
      setError(err.message || 'Could not connect wallet')
    } finally {
      setBusy(false)
    }
  }

  if (user.wallet_address) {
    return (
      <span>
        <button
          className="link-button mono"
          onClick={handleConnect}
          disabled={busy}
          title={`${user.wallet_address} — click to switch wallet`}
        >
          {busy ? 'Connecting…' : shortAddress(user.wallet_address)}
        </button>
        {error && <span className="error"> {error}</span>}
      </span>
    )
  }

  return (
    <span>
      <button className="link-button" onClick={handleConnect} disabled={busy}>
        {busy ? 'Connecting…' : 'Connect MetaMask'}
      </button>
      {error && <span className="error"> {error}</span>}
    </span>
  )
}

export default function Layout({ children }) {
  const { user, isRetailer, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="brand">
          DigiProof
        </Link>
        <nav>
          {user && isRetailer && (
            <>
              <Link to="/retailer">Products</Link>
              <Link to="/retailer/issue">Issue warranty</Link>
            </>
          )}
          {user && !isRetailer && <Link to="/warranties">My warranties</Link>}
          <Link to="/verify">Verify</Link>
          {user && <WalletButton />}
          {user ? (
            <button className="link-button" onClick={handleLogout}>
              Sign out ({user.full_name})
            </button>
          ) : (
            <Link to="/login">Sign in</Link>
          )}
        </nav>
      </header>
      <main className="content">{children}</main>
      <footer className="footer">Proof of purchase, recorded on chain.</footer>
    </div>
  )
}
