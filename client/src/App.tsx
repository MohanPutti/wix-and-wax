import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from './store/hooks'
import { fetchCurrentUser, selectToken } from './store/slices/authSlice'
import { fetchCart } from './store/slices/cartSlice'
import { api } from './services/api'
import Layout from './components/layout/Layout'
import AdminLayout from './components/layout/AdminLayout'

// Customer Pages
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import AuthCallback from './pages/AuthCallback'
import { OrderList, OrderDetail, OrderConfirmation } from './pages/Orders'

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import { AdminProductList, AdminProductForm } from './pages/admin/Products'
import { AdminOrderList, AdminOrderDetail } from './pages/admin/Orders'
import AdminCategories from './pages/admin/Categories'

function AppContent() {
  const dispatch = useAppDispatch()
  const token = useAppSelector(selectToken)

  useEffect(() => {
    // Always sync token to API client (handles both initial load and changes)
    api.setAccessToken(token)
    if (token) {
      dispatch(fetchCurrentUser())
    }
  }, [token, dispatch])

  useEffect(() => {
    // Fetch cart on app load
    dispatch(fetchCart())
  }, [dispatch])

  return (
    <Routes>
      {/* Customer Routes */}
      <Route
        path="/"
        element={
          <Layout>
            <Home />
          </Layout>
        }
      />
      <Route
        path="/products"
        element={
          <Layout>
            <Products />
          </Layout>
        }
      />
      <Route
        path="/products/:slug"
        element={
          <Layout>
            <ProductDetail />
          </Layout>
        }
      />
      <Route
        path="/cart"
        element={
          <Layout>
            <Cart />
          </Layout>
        }
      />
      <Route
        path="/checkout"
        element={
          <Layout>
            <Checkout />
          </Layout>
        }
      />
      <Route
        path="/login"
        element={
          <Layout>
            <Login />
          </Layout>
        }
      />
      <Route
        path="/register"
        element={
          <Layout>
            <Register />
          </Layout>
        }
      />
      <Route
        path="/auth/callback"
        element={<AuthCallback />}
      />
      <Route
        path="/profile"
        element={
          <Layout>
            <Profile />
          </Layout>
        }
      />
      <Route
        path="/orders"
        element={
          <Layout>
            <OrderList />
          </Layout>
        }
      />
      <Route
        path="/orders/:id"
        element={
          <Layout>
            <OrderDetail />
          </Layout>
        }
      />
      <Route
        path="/order-confirmation/:orderNumber"
        element={
          <Layout>
            <OrderConfirmation />
          </Layout>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/products"
        element={
          <AdminLayout>
            <AdminProductList />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/products/new"
        element={
          <AdminLayout>
            <AdminProductForm />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/products/:id"
        element={
          <AdminLayout>
            <AdminProductForm />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <AdminLayout>
            <AdminOrderList />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/orders/:id"
        element={
          <AdminLayout>
            <AdminOrderDetail />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <AdminLayout>
            <AdminCategories />
          </AdminLayout>
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
