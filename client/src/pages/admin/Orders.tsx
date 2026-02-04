import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EyeIcon } from '@heroicons/react/24/outline'
import { useOrders, useOrder } from '../../hooks/useOrders'
import Badge from '../../components/ui/Badge'
import Select from '../../components/ui/Select'
import Spinner from '../../components/ui/Spinner'
import type { Order } from '../../types'

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

export function AdminOrderList() {
  const [statusFilter, setStatusFilter] = useState('')
  const { orders, isLoading } = useOrders({ status: statusFilter || undefined })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold text-warm-900 mb-8">Orders</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-soft mb-6">
        <div className="flex gap-4">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'pending', label: 'Pending' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'processing', label: 'Processing' },
              { value: 'shipped', label: 'Shipped' },
              { value: 'delivered', label: 'Delivered' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-soft overflow-hidden">
        <table className="w-full">
          <thead className="bg-warm-50 border-b border-warm-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-warm-700">Order</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-warm-700">Customer</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-warm-700">Status</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-warm-700">Payment</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-warm-700">Total</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-warm-700">Date</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-warm-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-warm-100 hover:bg-warm-50">
                <td className="px-6 py-4">
                  <span className="font-medium text-warm-900">#{order.orderNumber}</span>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-warm-900">{order.email}</p>
                    <p className="text-sm text-warm-500">
                      {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={statusColors[order.status]}>{order.status}</Badge>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={paymentStatusColors[order.paymentStatus]}>
                    {order.paymentStatus}
                  </Badge>
                </td>
                <td className="px-6 py-4 font-medium text-warm-900">
                  ₹{Number(order.total).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-warm-600">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end">
                    <Link
                      to={`/admin/orders/${order.id}`}
                      className="p-2 text-warm-500 hover:text-amber-600 transition-colors"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {orders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-warm-500">No orders found</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>()
  const { order, isLoading, updateStatus, updatePaymentStatus } = useOrder(id || '')
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusChange = async (newStatus: Order['status']) => {
    setIsUpdating(true)
    try {
      await updateStatus(newStatus)
    } catch (err) {
      alert('Failed to update status')
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePaymentStatusChange = async (newStatus: Order['paymentStatus']) => {
    setIsUpdating(true)
    try {
      await updatePaymentStatus(newStatus)
    } catch (err) {
      alert('Failed to update payment status')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-warm-500">Order not found</p>
        <Link to="/admin/orders" className="text-amber-600 hover:text-amber-700 mt-4 inline-block">
          Back to Orders
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            to="/admin/orders"
            className="text-amber-600 hover:text-amber-700 text-sm mb-2 inline-block"
          >
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
          <div className="bg-white rounded-xl p-6 shadow-soft mb-6">
            <h2 className="font-semibold text-warm-900 mb-6">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 py-4 border-b border-warm-200 last:border-0"
                >
                  <div className="h-16 w-16 bg-warm-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">&#x1F56F;</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-warm-900">{item.productName}</h3>
                    {item.variantName && (
                      <p className="text-sm text-warm-500">{item.variantName}</p>
                    )}
                    <p className="text-sm text-warm-500">SKU: {item.sku || '-'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-warm-600">Qty: {item.quantity}</p>
                    <p className="font-medium text-warm-900">₹{Number(item.total).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Update Status */}
          <div className="bg-white rounded-xl p-6 shadow-soft">
            <h2 className="font-semibold text-warm-900 mb-4">Update Order Status</h2>
            <div className="flex gap-4">
              <Select
                value={order.status}
                onChange={(e) => handleStatusChange(e.target.value as Order['status'])}
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'confirmed', label: 'Confirmed' },
                  { value: 'processing', label: 'Processing' },
                  { value: 'shipped', label: 'Shipped' },
                  { value: 'delivered', label: 'Delivered' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
                disabled={isUpdating}
              />
            </div>
          </div>

          {/* Update Payment Status */}
          <div className="bg-white rounded-xl p-6 shadow-soft">
            <h2 className="font-semibold text-warm-900 mb-4">Update Payment Status</h2>
            <div className="flex gap-4">
              <Select
                value={order.paymentStatus}
                onChange={(e) => handlePaymentStatusChange(e.target.value as Order['paymentStatus'])}
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'paid', label: 'Paid' },
                  { value: 'refunded', label: 'Refunded' },
                  { value: 'failed', label: 'Failed' },
                ]}
                disabled={isUpdating}
              />
            </div>
          </div>
        </div>

        {/* Order Info */}
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

          {/* Customer */}
          <div className="bg-white rounded-xl p-6 shadow-soft">
            <h2 className="font-semibold text-warm-900 mb-4">Customer</h2>
            <p className="text-warm-900">{order.email}</p>
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
        </div>
      </div>
    </div>
  )
}
