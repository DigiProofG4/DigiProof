import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api, loadToken, setToken } from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // One session for both roles. The role on the account decides the landing page.
  useEffect(() => {
    const token = loadToken()
    if (!token) {
      setLoading(false)
      return
    }
    api
      .me()
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false))
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isRetailer: user?.role === 'retailer',
      async login(email, password) {
        const result = await api.login({ email, password })
        setToken(result.access_token)
        setUser(result.user)
        return result.user
      },
      async register(payload) {
        const result = await api.register(payload)
        setToken(result.access_token)
        setUser(result.user)
        return result.user
      },
      async connectWallet(walletAddress) {
        const updated = await api.updateWallet({ wallet_address: walletAddress })
        setUser(updated)
        return updated
      },
      logout() {
        setToken(null)
        setUser(null)
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
