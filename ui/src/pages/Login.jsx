import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { ShieldIcon } from '../components/Logo.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      // Same form for retailers and customers; the account decides where you land.
      const user = await login(email, password)
      navigate(user.role === 'retailer' ? '/retailer' : '/warranties')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card narrow auth-card">
      <ShieldIcon size={44} />
      <h1>Welcome back</h1>
      <p className="muted">Sign in to your DigiProof account. Retailers and customers use the same login.</p>

      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>

        {error && <p className="error">{error}</p>}

        <button type="submit" className="auth-submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="muted auth-switch">
        No account yet? <Link to="/register">Register</Link>
      </p>
    </div>
  )
}
