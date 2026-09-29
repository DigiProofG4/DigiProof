import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import Logo from './Logo.jsx'

export default function Layout({ children }) {
  const { user, isRetailer, logout } = useAuth()
  const navigate = useNavigate()
  // The signed-out start page runs full width; every other page keeps the narrow column.
  // Sign in and register share its background so the three read as one flow.
  const { pathname } = useLocation()
  const isLanding = !user && pathname === '/'
  const isVerify = pathname === '/verify'
  const isWelcome = isVerify || (!user && ['/', '/login', '/register'].includes(pathname))

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className={isWelcome ? 'shell shell-landing' : 'shell'}>
      <header className="topbar">
        <Link to="/" className="brand" aria-label="DigiProof home">
          <Logo />
        </Link>
        <nav>
          {user && isRetailer && (
            <>
              <NavLink to="/retailer" end>
                Products
              </NavLink>
              <NavLink to="/retailer/issue">Issue warranty</NavLink>
            </>
          )}
          {user && !isRetailer && <NavLink to="/warranties">My warranties</NavLink>}
          <NavLink to="/verify">Verify</NavLink>
          {user ? (
            <button className="link-button" onClick={handleLogout}>
              Sign out ({user.full_name})
            </button>
          ) : (
            <>
              <NavLink to="/login">Sign in</NavLink>
              <Link to="/register" className="nav-cta">
                Register
              </Link>
            </>
          )}
        </nav>
      </header>
      <main className={isLanding || isVerify ? 'content content-wide' : 'content'}>{children}</main>
      <footer className="footer">Proof of purchase, recorded on chain.</footer>
    </div>
  )
}
