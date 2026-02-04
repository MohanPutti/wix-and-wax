import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useOrders, useOrder, useOrderByNumber } from '../hooks/useOrders'
import { useAppSelector } from '../store/hooks'
import { selectIsAuthenticated } from '../store/slices/authSlice'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  pending: 'warning',
  confirmed: 'info',
  processing: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
}

const paymentStatusColors: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  pending: 'warning',
  paid: 'success',
  refunded: 'info',
  failed: 'danger',
}

export function OrderList() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const { orders, isLoading, error } = useOrders({ enabled: isAuthenticated })

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="font-serif text-3xl font-semibold text-warm-900 mb-4">My Orders</h1>
        <p className="text-warm-600 mb-8">Please log in to view your orders.</p>
        <Link to="/login" state={{ from: '/orders' }}>
          <Button size="lg">Log In</Button>
        </Link>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="font-serif text-3xl font-semibold text-warm-900 mb-4">Error</h1>
        <p className="text-red-600 mb-8">{error}</p>
        <Link to="/products">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="font-serif text-3xl font-semibold text-warm-900 mb-4">My Orders</h1>
        <p className="text-warm-600 mb-8">You haven't placed any orders yet.</p>
        <Link to="/products">
          <Button size="lg">Start Shopping</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-serif text-3xl font-semibold text-warm-900 mb-8">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <Link
            key={order.id}
            to={`/orders/${order.id}`}
            className="block bg-white rounded-xl p-6 shadow-soft hover:shadow-warm transition-shadow"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="font-semibold text-warm-900">Order #{order.orderNumber}</h2>
                  <Badge variant={statusColors[order.status]}>{order.status}</Badge>
                </div>
                <p className="text-sm text-warm-600">
                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-warm-900">
                  ₹{Number(order.total).toFixed(2)}
                </p>
                <p className="text-sm text-warm-500">{order.items.length} items</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const isSuccess = searchParams.get('success') === 'true'
  const { order, isLoading, error } = useOrder(id || '')

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="font-serif text-3xl font-semibold text-warm-900 mb-4">Order Not Found</h1>
        <p className="text-warm-600 mb-8">We couldn't find this order.</p>
        <Link to="/orders">
          <Button>View All Orders</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {isSuccess && (
        <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-xl text-center">
          <h2 className="font-serif text-2xl font-semibold text-green-800 mb-2">
            Thank you for your order!
          </h2>
          <p className="text-green-700">
            We've received your order and will send you an email confirmation shortly.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <Link to="/orders" className="text-amber-600 hover:text-amber-700 text-sm mb-2 inline-block">
            &larr; Back to Orders
          </Link>
          <h1 className="font-serif text-3xl font-semibold text-warm-900">
            Order #{order.orderNumber}
          </h1>
        </div>
        <div className="flex gap-2">
          <Badge variant={statusColors[order.status]} size="md">
            {order.status}
          </Badge>
          <Badge variant={paymentStatusColors[order.paymentStatus]} size="md">
            {order.paymentStatus}
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-6 shadow-soft">
            <h2 className="font-semibold text-warm-900 mb-6">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 py-4 border-b border-warm-200 last:border-0">
                  <div className="h-20 w-20 bg-warm-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">&#x1F56F;</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-warm-900">{item.productName}</h3>
                    {item.variantName && (
                      <p className="text-sm text-warm-500">{item.variantName}</p>
                    )}
                    <p className="text-sm text-warm-500">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-warm-900">₹{Number(item.total).toFixed(2)}</p>
                    <p className="text-sm text-warm-500">₹{Number(item.price).toFixed(2)} each</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-xl p-6 shadow-soft">
            <h2 className="font-semibold text-warm-900 mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-warm-600">
                <span>Subtotal</span>
                <span>₹{Number(order.subtotal).toFixed(2)}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{Number(order.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-warm-600">
                <span>Shipping</span>
                <span>₹{Number(order.shipping).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-warm-600">
                <span>Tax</span>
                <span>₹{Number(order.tax).toFixed(2)}</span>
              </div>
              <div className="border-t border-warm-200 pt-3">
                <div className="flex justify-between text-lg font-semibold text-warm-900">
                  <span>Total</span>
                  <span>₹{Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-xl p-6 shadow-soft">
            <h2 className="font-semibold text-warm-900 mb-4">Shipping Address</h2>
            <div className="text-warm-600 text-sm space-y-1">
              <p className="font-medium text-warm-900">
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
              </p>
              <p>{order.shippingAddress.address1}</p>
              {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                {order.shippingAddress.postalCode}
              </p>
              <p>{order.shippingAddress.country}</p>
              {order.shippingAddress.phone && <p>{order.shippingAddress.phone}</p>}
            </div>
          </div>

          {/* Order Info */}
          <div className="bg-white rounded-xl p-6 shadow-soft">
            <h2 className="font-semibold text-warm-900 mb-4">Order Information</h2>
            <div className="text-warm-600 text-sm space-y-2">
              <p>
                <span className="text-warm-500">Order Date:</span>{' '}
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <p>
                <span className="text-warm-500">Email:</span> {order.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function OrderConfirmation() {
  const { orderNumber } = useParams<{ orderNumber: string }>()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || undefined
  const { order, isLoading, error } = useOrderByNumber(orderNumber || '', email)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  // If we can't fetch order details but have an order number, show generic success
  if ((error || !order) && orderNumber) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-xl">
          <div className="text-4xl mb-4">&#x2705;</div>
          <h2 className="font-serif text-2xl font-semibold text-green-800 mb-2">
            Thank you for your order!
          </h2>
          <p className="text-green-700 mb-4">
            Your order <span className="font-semibold">#{orderNumber}</span> has been placed successfully.
          </p>
          <p className="text-green-600 text-sm">
            We've sent a confirmation email to {email || 'your email address'}.
          </p>
        </div>
        <Link to="/products">
          <Button size="lg">Continue Shopping</Button>
        </Link>
      </div>
    )
  }

  // No order number at all - truly not found
  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="font-serif text-3xl font-semibold text-warm-900 mb-4">Order Not Found</h1>
        <p className="text-warm-600 mb-8">We couldn't find this order.</p>
        <Link to="/products">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-xl text-center">
        <div className="text-4xl mb-4">&#x2705;</div>
        <h2 className="font-serif text-2xl font-semibold text-green-800 mb-2">
          Thank you for your order!
        </h2>
        <p className="text-green-700">
          We've received your order and will send you an email confirmation shortly.
        </p>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-warm-900">
            Order #{order.orderNumber}
          </h1>
        </div>
        <div className="flex gap-2">
          <Badge variant={statusColors[order.status]} size="md">
            {order.status}
          </Badge>
          <Badge variant={paymentStatusColors[order.paymentStatus]} size="md">
            {order.paymentStatus}
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-6 shadow-soft">
            <h2 className="font-semibold text-warm-900 mb-6">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 py-4 border-b border-warm-200 last:border-0">
                  <div className="h-20 w-20 bg-warm-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">&#x1F56F;</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-warm-900">{item.productName}</h3>
                    {item.variantName && (
                      <p className="text-sm text-warm-500">{item.variantName}</p>
                    )}
                    <p className="text-sm text-warm-500">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-warm-900">₹{Number(item.total).toFixed(2)}</p>
                    <p className="text-sm text-warm-500">₹{Number(item.price).toFixed(2)} each</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-soft">
            <h2 className="font-semibold text-warm-900 mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-warm-600">
                <span>Subtotal</span>
                <span>₹{Number(order.subtotal).toFixed(2)}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{Number(order.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-warm-600">
                <span>Shipping</span>
                <span>₹{Number(order.shipping).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-warm-600">
                <span>Tax</span>
                <span>₹{Number(order.tax).toFixed(2)}</span>
              </div>
              <div className="border-t border-warm-200 pt-3">
                <div className="flex justify-between text-lg font-semibold text-warm-900">
                  <span>Total</span>
                  <span>₹{Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-soft">
            <h2 className="font-semibold text-warm-900 mb-4">Shipping Address</h2>
            <div className="text-warm-600 text-sm space-y-1">
              <p className="font-medium text-warm-900">
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
              </p>
              <p>{order.shippingAddress.address1}</p>
              {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                {order.shippingAddress.postalCode}
              </p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-soft">
            <h2 className="font-semibold text-warm-900 mb-4">Order Information</h2>
            <div className="text-warm-600 text-sm space-y-2">
              <p>
                <span className="text-warm-500">Order Date:</span>{' '}
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p>
                <span className="text-warm-500">Email:</span> {order.email}
              </p>
            </div>
          </div>

          <Link to="/products">
            <Button size="lg" className="w-full">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
