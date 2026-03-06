import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useOrderByNumber } from '../hooks/useOrders'
import Input from '../components/ui/Input'
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

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [lookupKey, setLookupKey] = useState<{ orderNumber: string; email: string } | null>(null)

  const { order, isLoading, error } = useOrderByNumber(
    lookupKey?.orderNumber || '',
    lookupKey?.email
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setLookupKey({ orderNumber: orderNumber.trim(), email: email.trim() })
  }

  const handleReset = () => {
    setOrderNumber('')
    setEmail('')
    setSubmitted(false)
    setLookupKey(null)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="font-serif text-3xl font-semibold text-warm-900 mb-3">Track Your Order</h1>
        <p className="text-warm-600">Enter your order number and email address to see your order status.</p>
      </div>

      {/* Lookup Form */}
      <div className="bg-white rounded-2xl shadow-soft p-6 mb-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Order Number"
              placeholder="e.g. ORD-ABC123"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              required
              autoComplete="off"
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" size="lg" className="flex-1">
              Track Order
            </Button>
            {submitted && (
              <Button type="button" variant="outline" size="lg" onClick={handleReset}>
                Reset
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Results */}
      {submitted && (
        <>
          {isLoading && (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          )}

          {!isLoading && (error || !order) && (
            <div className="bg-white rounded-2xl shadow-soft p-8 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h2 className="font-serif text-xl font-semibold text-warm-900 mb-2">Order Not Found</h2>
              <p className="text-warm-600 mb-6">
                We couldn't find an order matching that number and email address. Please double-check and try again.
              </p>
              <Link to="/login" state={{ from: '/orders' }}>
                <Button variant="outline">Sign in to view all your orders</Button>
              </Link>
            </div>
          )}

          {!isLoading && !error && order && (
            <div className="space-y-6">
              {/* Status Header */}
              <div className="bg-white rounded-2xl shadow-soft p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-sm text-warm-500 mb-1">Order</p>
                    <h2 className="font-serif text-2xl font-semibold text-warm-900">#{order.orderNumber}</h2>
                    <p className="text-sm text-warm-500 mt-1">
                      Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant={statusColors[order.status]} size="md">{order.status}</Badge>
                    <Badge variant={paymentStatusColors[order.paymentStatus]} size="md">{order.paymentStatus}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Items */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-soft p-6">
                  <h3 className="font-semibold text-warm-900 mb-4">Items Ordered</h3>
                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex gap-4 py-3 border-b border-warm-100 last:border-0">
                        <div className="h-16 w-16 bg-warm-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-xl">🕯️</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-warm-900">{item.productName}</p>
                          {item.variantName && <p className="text-sm text-warm-500">{item.variantName}</p>}
                          <p className="text-sm text-warm-500">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-medium text-warm-900">₹{Number(item.total).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary + Address */}
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl shadow-soft p-6">
                    <h3 className="font-semibold text-warm-900 mb-4">Order Summary</h3>
                    <div className="space-y-2 text-sm">
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
                      <div className="border-t border-warm-200 pt-2 flex justify-between font-semibold text-warm-900">
                        <span>Total</span>
                        <span>₹{Number(order.total).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-soft p-6">
                    <h3 className="font-semibold text-warm-900 mb-4">Shipping Address</h3>
                    <div className="text-sm text-warm-600 space-y-1">
                      <p className="font-medium text-warm-900">
                        {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                      </p>
                      <p>{order.shippingAddress.address1}</p>
                      {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                      <p>
                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                      </p>
                      {order.shippingAddress.phone && <p>{order.shippingAddress.phone}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Guest upsell */}
      {!submitted && (
        <p className="text-center text-sm text-warm-500">
          Have an account?{' '}
          <Link to="/login" state={{ from: '/orders' }} className="text-amber-600 hover:text-amber-700 font-medium">
            Sign in
          </Link>{' '}
          to view all your orders in one place.
        </p>
      )}
    </div>
  )
}
