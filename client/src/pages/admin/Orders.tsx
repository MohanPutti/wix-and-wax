import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { EyeIcon, PlusIcon, TrashIcon, PencilIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useOrders, useOrder } from '../../hooks/useOrders'
import { api } from '../../services/api'
import Badge from '../../components/ui/Badge'
import Select from '../../components/ui/Select'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import type { Product } from '../../types'

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

interface EditItem {
  id?: string
  productName: string
  variantName: string
  sku: string
  quantity: number
  price: string
}

let editItemKey = 0
const newEditItem = (): EditItem & { key: number } => ({
  key: ++editItemKey,
  productName: '',
  variantName: '',
  sku: '',
  quantity: 1,
  price: '',
})

export function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { order, isLoading, updateMetadata } = useOrder(id || '')
  const [amountPaid, setAmountPaid] = useState('')
  const [isSavingAmount, setIsSavingAmount] = useState(false)

  // Edit mode
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    email: '', firstName: '', lastName: '', phone: '',
    address1: '', address2: '', city: '', state: '', postalCode: '', country: '',
    status: '', paymentStatus: '', amountPaid: '',
    shippingCost: '', notes: '',
  })
  const [editItems, setEditItems] = useState<(EditItem & { key: number })[]>([])
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Product search for edit items
  const [searchItemKey, setSearchItemKey] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    setIsSearching(true)
    const t = setTimeout(async () => {
      try {
        const res = await api.getProducts({ search: searchQuery, limit: 10, status: 'active' })
        if (res.success) setSearchResults(res.data)
      } finally { setIsSearching(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  const selectVariant = (itemKey: number, product: Product, variantId: string) => {
    const variant = product.variants.find(v => v.id === variantId)
    if (!variant) return
    setEditItems(prev => prev.map(i => i.key === itemKey ? { ...i, productName: product.name, variantName: variant.name, sku: variant.sku || '', price: String(variant.price) } : i))
    setSearchItemKey(null); setSearchQuery(''); setSearchResults([])
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
        email: order.email || '',
        firstName: addr.firstName || '',
        lastName: addr.lastName || '',
        phone: addr.phone || '',
        address1: addr.address1 || '',
        address2: addr.address2 || '',
        city: addr.city || '',
        state: addr.state || '',
        postalCode: addr.postalCode || '',
        country: addr.country || '',
        status: order.status,
        paymentStatus: order.paymentStatus,
        amountPaid: order.metadata?.amountPaid !== undefined ? String(order.metadata.amountPaid) : '',
        shippingCost: String(Number(order.shipping) || 0),
        notes: order.notes || '',
      })
      setEditItems(order.items.map(item => ({
        key: ++editItemKey,
        id: item.id,
        productName: item.productName,
        variantName: item.variantName || '',
        sku: item.sku || '',
        quantity: item.quantity,
        price: String(Number(item.price)),
      })))
    }
  }, [order?.id])

  const updateEditItem = (key: number, patch: Partial<EditItem>) => {
    setEditItems(prev => prev.map(i => i.key === key ? { ...i, ...patch } : i))
  }

  const handleSaveEdit = async () => {
    if (!id) return
    setIsSavingEdit(true)
    try {
      await api.adminUpdateOrder(id, {
        email: editForm.email,
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        phone: editForm.phone,
        address1: editForm.address1,
        address2: editForm.address2,
        city: editForm.city,
        state: editForm.state,
        postalCode: editForm.postalCode,
        country: editForm.country,
        status: editForm.status,
        paymentStatus: editForm.paymentStatus,
        amountPaid: editForm.paymentStatus === 'partially_paid' && editForm.amountPaid ? Number(editForm.amountPaid) : undefined,
        shippingCost: Number(editForm.shippingCost) || 0,
        notes: editForm.notes,
        items: editItems.filter(i => i.productName.trim()).map(i => ({
          id: i.id,
          productName: i.productName,
          variantName: i.variantName || undefined,
          sku: i.sku || undefined,
          quantity: i.quantity,
          price: Number(i.price) || 0,
        })),
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

  const editSubtotal = editItems.reduce((s, i) => s + (Number(i.price) || 0) * i.quantity, 0)
  const editShipping = Number(editForm.shippingCost) || 0
  const editTotal = editSubtotal + editShipping

  if (isEditing) {
    return (
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button onClick={() => setIsEditing(false)} className="text-amber-600 hover:text-amber-700 text-sm mb-2 block">&larr; Cancel Edit</button>
            <h1 className="font-serif text-3xl font-semibold text-warm-900">Edit Order #{order.orderNumber}</h1>
          </div>
          <button
            onClick={handleSaveEdit}
            disabled={isSavingEdit}
            className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {isSavingEdit ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="space-y-6">
          {/* Customer */}
          <div className="bg-white rounded-xl p-6 shadow-soft">
            <h2 className="font-semibold text-warm-900 mb-4">Customer</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" value={editForm.firstName} onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))} />
              <Input label="Last Name" value={editForm.lastName} onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))} />
              <Input label="Email" type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
              <Input label="Phone" type="tel" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-xl p-6 shadow-soft">
            <h2 className="font-semibold text-warm-900 mb-4">Shipping Address</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Input label="Address Line 1" value={editForm.address1} onChange={e => setEditForm(f => ({ ...f, address1: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Input label="Address Line 2 (optional)" value={editForm.address2} onChange={e => setEditForm(f => ({ ...f, address2: e.target.value }))} />
              </div>
              <Input label="City" value={editForm.city} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} />
              <Input label="State" value={editForm.state} onChange={e => setEditForm(f => ({ ...f, state: e.target.value }))} />
              <Input label="Postal Code" value={editForm.postalCode} onChange={e => setEditForm(f => ({ ...f, postalCode: e.target.value }))} />
              <Input label="Country" value={editForm.country} onChange={e => setEditForm(f => ({ ...f, country: e.target.value }))} />
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-xl p-6 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-warm-900">Order Items</h2>
              <button
                type="button"
                onClick={() => setEditItems(prev => [...prev, newEditItem()])}
                className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                <PlusIcon className="h-4 w-4" /> Add Item
              </button>
            </div>
            <div className="space-y-4">
              {editItems.map((item, idx) => (
                <div key={item.key} className="border border-warm-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-warm-600">Item {idx + 1}</span>
                    <div className="flex items-center gap-3">
                      {searchItemKey === item.key ? (
                        <div className="relative">
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-400" />
                              <input
                                autoFocus
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-9 pr-3 py-1.5 text-sm border border-warm-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 w-52"
                              />
                            </div>
                            <button type="button" onClick={() => { setSearchItemKey(null); setSearchQuery(''); setSearchResults([]) }}>
                              <XMarkIcon className="h-4 w-4 text-warm-400 hover:text-warm-700" />
                            </button>
                          </div>
                          {(searchResults.length > 0 || isSearching) && (
                            <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-warm-200 rounded-xl shadow-lg z-10 max-h-64 overflow-y-auto">
                              {isSearching ? (
                                <div className="p-3 text-sm text-warm-500 text-center">Searching...</div>
                              ) : searchResults.map(product => (
                                <div key={product.id}>
                                  <div className="px-3 py-2 text-xs font-semibold text-warm-500 bg-warm-50 border-b border-warm-100">{product.name}</div>
                                  {product.variants.map(variant => (
                                    <button key={variant.id} type="button" onClick={() => selectVariant(item.key, product, variant.id)}
                                      className="w-full text-left px-4 py-2 text-sm hover:bg-amber-50 flex justify-between items-center">
                                      <span className="text-warm-900">{variant.name}</span>
                                      <span className="text-amber-600 font-medium">₹{Number(variant.price).toFixed(0)}</span>
                                    </button>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <button type="button" onClick={() => { setSearchItemKey(item.key); setSearchQuery(''); setSearchResults([]) }}
                          className="text-xs text-amber-600 hover:text-amber-700 border border-amber-300 px-2 py-1 rounded-lg">
                          Pick from website
                        </button>
                      )}
                      {editItems.length > 1 && (
                        <button type="button" onClick={() => setEditItems(prev => prev.filter(i => i.key !== item.key))} className="text-warm-400 hover:text-red-600">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-5">
                      <Input label="Product Name" value={item.productName} onChange={e => updateEditItem(item.key, { productName: e.target.value })} />
                    </div>
                    <div className="col-span-3">
                      <Input label="Variant (optional)" value={item.variantName} onChange={e => updateEditItem(item.key, { variantName: e.target.value })} />
                    </div>
                    <div className="col-span-2">
                      <Input label="Qty" type="number" min="1" value={String(item.quantity)} onChange={e => updateEditItem(item.key, { quantity: Math.max(1, Number(e.target.value)) })} />
                    </div>
                    <div className="col-span-2">
                      <Input label="Price (₹)" type="number" min="0" step="0.01" value={item.price} onChange={e => updateEditItem(item.key, { price: e.target.value })} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-warm-100 pt-4">
              <div className="flex items-end justify-between gap-4">
                <div className="w-48">
                  <Input label="Shipping Cost (₹)" type="number" min="0" step="0.01" value={editForm.shippingCost} onChange={e => setEditForm(f => ({ ...f, shippingCost: e.target.value }))} />
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm text-warm-500">Subtotal <span className="text-warm-900 font-medium">₹{editSubtotal.toFixed(2)}</span></p>
                  {editShipping > 0 && <p className="text-sm text-warm-500">Shipping <span className="text-warm-900 font-medium">₹{editShipping.toFixed(2)}</span></p>}
                  <p className="text-xl font-semibold text-warm-900">Total ₹{editTotal.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-xl p-6 shadow-soft">
            <h2 className="font-semibold text-warm-900 mb-4">Order Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Order Status" value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'confirmed', label: 'Confirmed' },
                  { value: 'processing', label: 'Processing' },
                  { value: 'shipped', label: 'Shipped' },
                  { value: 'delivered', label: 'Delivered' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
              />
              <Select label="Payment Status" value={editForm.paymentStatus} onChange={e => setEditForm(f => ({ ...f, paymentStatus: e.target.value }))}
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'partially_paid', label: 'Partially Paid' },
                  { value: 'paid', label: 'Paid' },
                  { value: 'refunded', label: 'Refunded' },
                  { value: 'failed', label: 'Failed' },
                ]}
              />
              {editForm.paymentStatus === 'partially_paid' && (() => {
                const paid = Number(editForm.amountPaid) || 0
                const left = editTotal - paid
                return (
                  <>
                    <div>
                      <Input label="Amount Paid (₹)" type="number" min="0" step="0.01" value={editForm.amountPaid} onChange={e => setEditForm(f => ({ ...f, amountPaid: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-warm-700 mb-1">Amount Left (₹)</label>
                      <div className={`px-3 py-2 rounded-lg border border-warm-200 text-sm font-semibold bg-warm-50 ${left < 0 ? 'text-green-600' : left > 0 ? 'text-red-500' : 'text-warm-700'}`}>
                        ₹{left.toFixed(2)}
                      </div>
                    </div>
                  </>
                )
              })()}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-warm-700 mb-1">Notes <span className="text-warm-400 font-normal">(optional)</span></label>
                <textarea rows={3} value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full rounded-lg border border-warm-200 px-3 py-2 text-sm text-warm-900 placeholder-warm-400 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link to="/admin/orders" className="text-amber-600 hover:text-amber-700 text-sm mb-2 inline-block">
            &larr; Back to Orders
          </Link>
          <h1 className="font-serif text-3xl font-semibold text-warm-900">
            Order #{order.orderNumber}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={statusColors[order.status]} size="md">{order.status}</Badge>
          <Badge variant={paymentStatusColors[order.paymentStatus]} size="md">{order.paymentStatus}</Badge>
          <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 px-3 py-1.5 border border-warm-200 text-warm-600 text-sm rounded-lg hover:bg-warm-50 transition-colors">
            <PencilIcon className="h-4 w-4" /> Edit
          </button>
          <DeleteOrderButton id={order.id} onDeleted={() => navigate('/admin/orders')} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-6 shadow-soft mb-6">
            <h2 className="font-semibold text-warm-900 mb-6">Order Items</h2>
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
                        <input type="number" min="0" step="0.01" value={amountPaid} onChange={e => setAmountPaid(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-warm-900" placeholder="0.00" />
                        <button onClick={handleSaveAmountPaid} disabled={isSavingAmount}
                          className="px-3 py-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors disabled:opacity-50">
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
