import { useProducts } from '../../hooks/useProducts'
import { useOrders } from '../../hooks/useOrders'
import { Link } from 'react-router-dom'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  pending: 'warning',
  confirmed: 'info',
  processing: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
}

export default function AdminDashboard() {
  const { products, isLoading: productsLoading } = useProducts({ limit: 100 })
  const { orders, isLoading: ordersLoading } = useOrders({ limit: 100 })

  const isLoading = productsLoading || ordersLoading

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  const totalProducts = products.length
  const totalOrders = orders.length
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0)
  const pendingOrders = orders.filter((o) => o.status === 'pending').length
  const recentOrders = orders.slice(0, 5)

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold text-warm-900 mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-soft">
          <p className="text-warm-500 text-sm mb-1">Total Revenue</p>
          <p className="font-serif text-3xl font-bold text-warm-900">₹{totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-soft">
          <p className="text-warm-500 text-sm mb-1">Total Orders</p>
          <p className="font-serif text-3xl font-bold text-warm-900">{totalOrders}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-soft">
          <p className="text-warm-500 text-sm mb-1">Pending Orders</p>
          <p className="font-serif text-3xl font-bold text-amber-600">{pendingOrders}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-soft">
          <p className="text-warm-500 text-sm mb-1">Total Products</p>
          <p className="font-serif text-3xl font-bold text-warm-900">{totalProducts}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl p-6 shadow-soft">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-semibold text-warm-900">Recent Orders</h2>
            <Link to="/admin/orders" className="text-amber-600 hover:text-amber-700 text-sm">
              View All
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-warm-500 text-center py-8">No orders yet</p>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  to={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between p-4 rounded-lg hover:bg-warm-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-warm-900">#{order.orderNumber}</p>
                    <p className="text-sm text-warm-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={statusColors[order.status]}>{order.status}</Badge>
                    <span className="font-medium text-warm-900">
                      ₹{Number(order.total).toFixed(2)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-soft">
          <h2 className="font-semibold text-warm-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/admin/products/new"
              className="p-4 bg-amber-50 rounded-lg text-center hover:bg-amber-100 transition-colors"
            >
              <span className="text-2xl mb-2 block">&#x2795;</span>
              <span className="font-medium text-amber-700">Add Product</span>
            </Link>
            <Link
              to="/admin/categories"
              className="p-4 bg-warm-50 rounded-lg text-center hover:bg-warm-100 transition-colors"
            >
              <span className="text-2xl mb-2 block">&#x1F3F7;</span>
              <span className="font-medium text-warm-700">Manage Categories</span>
            </Link>
            <Link
              to="/admin/orders?status=pending"
              className="p-4 bg-warm-50 rounded-lg text-center hover:bg-warm-100 transition-colors"
            >
              <span className="text-2xl mb-2 block">&#x1F4E6;</span>
              <span className="font-medium text-warm-700">Pending Orders</span>
            </Link>
            <Link
              to="/"
              className="p-4 bg-warm-50 rounded-lg text-center hover:bg-warm-100 transition-colors"
            >
              <span className="text-2xl mb-2 block">&#x1F3EA;</span>
              <span className="font-medium text-warm-700">View Store</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
