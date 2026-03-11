import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { EyeIcon, PlusIcon, TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useOrders, useOrder } from '../../hooks/useOrders'
import { api } from '../../services/api'
import Badge from '../../components/ui/Badge'
import Select from '../../components/ui/Select'
import Input from '../../components/ui/Input'
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
  partially_paid: 'info',
  paid: 'success',
  refunded: 'info',
  failed: 'danger',
}

export function AdminOrderList() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(searchInput); setPage(1) }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => { setPage(1) }, [statusFilter, paymentStatusFilter])

  const { orders, isLoading, pagination } = useOrders({
    status: statusFilter || undefined,
    paymentStatus: paymentStatusFilter || undefined,
    search: debouncedSearch || undefined,
    page,
    limit: 50,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl font-semibold text-warm-900">Orders</h1>
        <button
          onClick={() => navigate('/admin/orders/new')}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          New Order
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-soft mb-6">
        <div className="flex gap-4 flex-col sm:flex-row">
          <div className="flex-1">
            <Input
              placeholder="Search by order # or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
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
          <Select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Payments' },
              { value: 'pending', label: 'Pending' },
              { value: 'partially_paid', label: 'Partially Paid' },
              { value: 'paid', label: 'Paid' },
              { value: 'failed', label: 'Failed' },
              { value: 'refunded', label: 'Refunded' },
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
                  <div className="flex justify-end gap-1">
                    <Link
                      to={`/admin/orders/${order.id}`}
                      className="p-2 text-warm-500 hover:text-amber-600 transition-colors"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </Link>
                    <DeleteOrderButton id={order.id} onDeleted={() => window.location.reload()} />
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

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-sm text-warm-500">
            Showing {(page - 1) * 50 + 1}–{Math.min(page * 50, pagination.total)} of {pagination.total} orders
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-warm-200 rounded-lg text-warm-700 hover:bg-warm-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-sm text-warm-600">
              Page {page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="px-3 py-1.5 text-sm border border-warm-200 rounded-lg text-warm-700 hover:bg-warm-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function DeleteOrderButton({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm('Delete this order? This cannot be undone.')) return
    setIsDeleting(true)
    try {
      await api.deleteOrder(id)
      onDeleted()
    } catch {
      alert('Failed to delete order')
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-2 text-warm-400 hover:text-red-600 transition-colors disabled:opacity-50"
      title="Delete order"
    >
      <TrashIcon className="h-5 w-5" />
    </button>
  )
}

export function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { order, isLoading, updateStatus, updatePaymentStatus, updateMetadata } = useOrder(id || '')
  const [isUpdating, setIsUpdating] = useState(false)
  const [amountPaid, setAmountPaid] = useState('')
  const [isSavingAmount, setIsSavingAmount] = useState(false)

  // Edit mode
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    firstName: '', lastName: '', phone: '',
    address1: '', city: '', state: '', postalCode: '', country: '',
    productName: '', total: '', notes: '',
  })
  const [isSavingEdit, setIsSavingEdit] = useState(false)

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

  // Sync amountPaid from metadata when order loads
  useEffect(() => {
    if (order?.metadata?.amountPaid !== undefined) {
      setAmountPaid(String(order.metadata.amountPaid))
    }
  }, [order?.id])

  // Populate edit form when order loads
  useEffect(() => {
    if (order) {
      const addr = order.shippingAddress
      setEditForm({
        firstName: addr.firstName || '',
        lastName: addr.lastName || '',
        phone: addr.phone || '',
        address1: addr.address1 || '',
        city: addr.city || '',
        state: addr.state || '',
        postalCode: addr.postalCode || '',
        country: addr.country || '',
        productName: order.items[0]?.productName || '',
        total: String(Number(order.total)),
        notes: order.notes || '',
      })
    }
  }, [order?.id])

  const handleSaveEdit = async () => {
    if (!id) return
    setIsSavingEdit(true)
    try {
      await api.adminUpdateOrder(id, {
        ...editForm,
        total: Number(editForm.total),
      })
      setIsEditing(false)
      window.location.reload()
    } catch {
      alert('Failed to save changes')
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleSaveAmountPaid = async () => {
    setIsSavingAmount(true)
    try {
      await updateMetadata({ amountPaid: Number(amountPaid) || 0 })
    } catch {
      alert('Failed to save amount paid')
    } finally {
      setIsSavingAmount(false)
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
        <div className="flex items-center gap-3">
          <Badge variant={statusColors[order.status]} size="md">
            {order.status}
          </Badge>
          <Badge variant={paymentStatusColors[order.paymentStatus]} size="md">
            {order.paymentStatus}
          </Badge>
          {isEditing ? (
            <>
              <button onClick={handleSaveEdit} disabled={isSavingEdit} className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50">
                <CheckIcon className="h-4 w-4" /> {isSavingEdit ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setIsEditing(false)} className="flex items-center gap-1 px-3 py-1.5 border border-warm-200 text-warm-600 text-sm rounded-lg hover:bg-warm-50 transition-colors">
                <XMarkIcon className="h-4 w-4" /> Cancel
              </button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 px-3 py-1.5 border border-warm-200 text-warm-600 text-sm rounded-lg hover:bg-warm-50 transition-colors">
              <PencilIcon className="h-4 w-4" /> Edit
            </button>
          )}
          <DeleteOrderButton id={order.id} onDeleted={() => navigate('/admin/orders')} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-6 shadow-soft mb-6">
            <h2 className="font-semibold text-warm-900 mb-6">Order Items</h2>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-warm-600 mb-1">Product / Order Description</label>
                  <textarea
                    rows={3}
                    value={editForm.productName}
                    onChange={e => setEditForm(f => ({ ...f, productName: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-warm-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-warm-600 mb-1">Total Amount (₹)</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={editForm.total}
                    onChange={e => setEditForm(f => ({ ...f, total: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-warm-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-warm-600 mb-1">Notes</label>
                  <textarea
                    rows={2}
                    value={editForm.notes}
                    onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-warm-900"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4 py-4 border-b border-warm-200 last:border-0">
                    <div className="h-16 w-16 bg-warm-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">&#x1F56F;</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-warm-900">{item.productName}</h3>
                      {item.variantName && <p className="text-sm text-warm-500">{item.variantName}</p>}
                      <p className="text-sm text-warm-500">SKU: {item.sku || '-'}</p>
                      {item.metadata?.note && (
                        <div className="mt-1.5 space-y-0.5">
                          {item.metadata.note.split(' | ').map((part, i) => {
                            const [label, ...rest] = part.split(': ')
                            return (
                              <p key={i} className="text-xs text-warm-500">
                                <span className="font-medium text-warm-600">{label}:</span> {rest.join(': ')}
                              </p>
                            )
                          })}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-warm-600">Qty: {item.quantity}</p>
                      <p className="font-medium text-warm-900">₹{Number(item.total).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                  { value: 'partially_paid', label: 'Partially Paid' },
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

              {order.paymentStatus === 'partially_paid' && (() => {
                const total = Number(order.total) || 0
                const paid = Number(amountPaid) || 0
                const left = total - paid
                return (
                  <div className="border-t border-warm-200 pt-3 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-warm-600 mb-1">Amount Paid (₹)</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={amountPaid}
                          onChange={e => setAmountPaid(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-warm-900"
                          placeholder="0.00"
                        />
                        <button
                          onClick={handleSaveAmountPaid}
                          disabled={isSavingAmount}
                          className="px-3 py-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                          {isSavingAmount ? '...' : 'Save'}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-warm-600">Amount Left</span>
                      <span className={`font-semibold ${left < 0 ? 'text-green-600' : left > 0 ? 'text-red-500' : 'text-warm-900'}`}>
                        ₹{left.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )
              })()}
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
            {isEditing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'First Name', key: 'firstName' },
                    { label: 'Last Name', key: 'lastName' },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-warm-600 mb-1">{label}</label>
                      <input value={editForm[key as keyof typeof editForm]} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                        className="w-full px-3 py-1.5 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-warm-900" />
                    </div>
                  ))}
                </div>
                {[
                  { label: 'Phone', key: 'phone' },
                  { label: 'Address', key: 'address1' },
                  { label: 'City', key: 'city' },
                  { label: 'State', key: 'state' },
                  { label: 'Pin Code', key: 'postalCode' },
                  { label: 'Country', key: 'country' },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-warm-600 mb-1">{label}</label>
                    <input value={editForm[key as keyof typeof editForm]} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-3 py-1.5 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-warm-900" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-warm-600 text-sm space-y-1">
                <p className="font-medium text-warm-900">
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </p>
                <p>{order.shippingAddress.address1}</p>
                {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && <p>{order.shippingAddress.phone}</p>}
              </div>
            )}
          </div>

          {/* Customer Notes */}
          {order.metadata?.customerNotes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <h2 className="font-semibold text-warm-900 mb-2">Customer Notes</h2>
              <p className="text-sm text-warm-700 whitespace-pre-wrap">{order.metadata.customerNotes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
