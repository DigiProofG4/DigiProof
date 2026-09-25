import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'customer',
    business_name: '',
    registration_number: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const payload = { ...form }
      if (payload.role !== 'retailer') {
        delete payload.business_name
        delete payload.registration_number
      }
      const user = await register(payload)
      navigate(user.role === 'retailer' ? '/retailer' : '/warranties')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card narrow">
      <h1>Create an account</h1>

      <form onSubmit={handleSubmit}>
        <fieldset className="roles">
          <legend>I am a</legend>
          <label className="radio">
            <input
              type="radio"
              name="role"
              value="customer"
              checked={form.role === 'customer'}
              onChange={(e) => update('role', e.target.value)}
            />
            Customer
          </label>
          <label className="radio">
            <input
              type="radio"
              name="role"
              value="retailer"
              checked={form.role === 'retailer'}
              onChange={(e) => update('role', e.target.value)}
            />
            Retailer
          </label>
        </fieldset>

        <label>
          Full name
          <input
            value={form.full_name}
            onChange={(e) => update('full_name', e.target.value)}
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            minLength={8}
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            required
          />
        </label>

        {form.role === 'retailer' && (
          <>
            <label>
              Business name
              <input
                value={form.business_name}
                onChange={(e) => update('business_name', e.target.value)}
                required
              />
            </label>
            <label>
              Registration number (optional)
              <input
                value={form.registration_number}
                onChange={(e) => update('registration_number', e.target.value)}
              />
            </label>
          </>
        )}

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={busy}>
          {busy ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <p className="muted">
        Already registered? <Link to="/login">Sign in</Link>
      </p>
    </div>
  )
}
