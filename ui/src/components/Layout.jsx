import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'

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
