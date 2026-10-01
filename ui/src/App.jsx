import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { useAuth } from './auth/AuthContext.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import RetailerHome from './pages/RetailerHome.jsx'
import RetailerProducts from './pages/RetailerProducts.jsx'
import RetailerWarranties from './pages/RetailerWarranties.jsx'
import IssueWarranty from './pages/IssueWarranty.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import MyWarranties from './pages/MyWarranties.jsx'
import WarrantyDetail from './pages/WarrantyDetail.jsx'
import Verify from './pages/Verify.jsx'
import Landing from './pages/Landing.jsx'
import Account from './pages/Account.jsx'

function Home() {
  const { user, loading } = useAuth()
  if (loading) return <p className="muted">Loading…</p>
  if (!user) return <Landing />
  return <Navigate to={user.role === 'retailer' ? '/retailer' : '/warranties'} replace />
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<Verify />} />

        <Route
          path="/retailer"
          element={
            <ProtectedRoute role="retailer">
              <RetailerHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/retailer/warranties"
          element={
            <ProtectedRoute role="retailer">
              <RetailerWarranties />
            </ProtectedRoute>
          }
        />
        <Route
          path="/retailer/products"
          element={
            <ProtectedRoute role="retailer">
              <RetailerProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/retailer/products/:id"
          element={
            <ProtectedRoute role="retailer">
              <ProductDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/retailer/issue"
          element={
            <ProtectedRoute role="retailer">
              <IssueWarranty />
            </ProtectedRoute>
          }
        />
        <Route
          path="/warranties"
          element={
            <ProtectedRoute>
              <MyWarranties />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />
        <Route
          path="/warranties/:id"
          element={
            <ProtectedRoute>
              <WarrantyDetail />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<p className="muted">That page does not exist.</p>} />
      </Routes>
    </Layout>
  )
}
