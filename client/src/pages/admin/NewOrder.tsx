import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon, TrashIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { api } from '../../services/api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import type { Product } from '../../types'

interface OrderItem {
  key: number
  variantId?: string
  productName: string
  variantName: string
  sku: string
  quantity: number
  price: string
}

let keyCounter = 0
const newItem = (): OrderItem => ({
  key: ++keyCounter,
  variantId: undefined,
  productName: '',
  variantName: '',
  sku: '',
  quantity: 1,
  price: '',
})

export default function AdminNewOrder() {
  const navigate = useNavigate()

  // Customer
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  // Address
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry] = useState('India')

  // Items
  const [items, setItems] = useState<OrderItem[]>([newItem()])

  // Status
  const [status, setStatus] = useState('confirmed')
  const [paymentStatus, setPaymentStatus] = useState('paid')
  const [notes, setNotes] = useState('')

  // Product search
  const [searchKey, setSearchKey] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  // Search products when query changes
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    setIsSearching(true)
    const timer = setTimeout(async () => {
      try {
        const res = await api.getProducts({ search: searchQuery, limit: 10, status: 'active' })
        if (res.success) setSearchResults(res.data)
      } finally {
        setIsSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const updateItem = (key: number, patch: Partial<OrderItem>) => {
    setItems(prev => prev.map(i => i.key === key ? { ...i, ...patch } : i))
  }

  const removeItem = (key: number) => {
    setItems(prev => prev.filter(i => i.key !== key))
  }

  const selectVariant = (itemKey: number, product: Product, variantId: string) => {
    const variant = product.variants.find(v => v.id === variantId)
    if (!variant) return
    updateItem(itemKey, {
      variantId: variant.id,
      productName: product.name,
      variantName: variant.name,
      sku: variant.sku,
      price: String(variant.price),
    })
    setSearchKey(null)
    setSearchQuery('')
    setSearchResults([])
  }

  const subtotal = items.reduce((sum, i) => sum + (Number(i.price) || 0) * i.quantity, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!firstName.trim() || !lastName.trim()) { setError('Customer name is required'); return }
    if (!address1.trim() || !city.trim() || !postalCode.trim()) { setError('Address, city and postal code are required'); return }
    const validItems = items.filter(i => i.productName.trim() && Number(i.price) > 0 && i.quantity > 0)
    if (!validItems.length) { setError('Add at least one item with name, price and quantity'); return }

    setIsSaving(true)
    try {
      const res = await api.createManualOrder({
        email,
        firstName,
        lastName,
        phone: phone || undefined,
        shippingAddress: { address1, address2: address2 || undefined, city, state: state || undefined, postalCode, country },
        items: validItems.map(i => ({
          variantId: i.variantId,
          productName: i.productName,
          variantName: i.variantName || undefined,
          sku: i.sku || undefined,
          quantity: i.quantity,
          price: Number(i.price),
        })),
        status,
        paymentStatus,
        notes: notes || undefined,
      })
      if (res.success) {
        navigate(`/admin/orders/${res.data.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl font-semibold text-warm-900">New Manual Order</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer */}
        <div className="bg-white rounded-xl p-6 shadow-soft">
          <h2 className="font-semibold text-warm-900 mb-4">Customer</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} required />
            <Input label="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} required />
            <Input label="Email (optional)" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            <Input label="Phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white rounded-xl p-6 shadow-soft">
          <h2 className="font-semibold text-warm-900 mb-4">Shipping Address</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input label="Address Line 1" value={address1} onChange={e => setAddress1(e.target.value)} required />
            </div>
            <div className="col-span-2">
              <Input label="Address Line 2 (optional)" value={address2} onChange={e => setAddress2(e.target.value)} />
            </div>
            <Input label="City" value={city} onChange={e => setCity(e.target.value)} required />
            <Input label="State" value={state} onChange={e => setState(e.target.value)} />
            <Input label="Postal Code" value={postalCode} onChange={e => setPostalCode(e.target.value)} required />
            <Input label="Country" value={country} onChange={e => setCountry(e.target.value)} required />
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-warm-900">Order Items</h2>
            <button
              type="button"
              onClick={() => setItems(prev => [...prev, newItem()])}
              className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              <PlusIcon className="h-4 w-4" /> Add Item
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={item.key} className="border border-warm-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-warm-600">Item {idx + 1}</span>
                  <div className="flex items-center gap-3">
                    {/* Search from website products */}
                    {searchKey === item.key ? (
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
                          <button type="button" onClick={() => { setSearchKey(null); setSearchQuery(''); setSearchResults([]) }}>
                            <XMarkIcon className="h-4 w-4 text-warm-400 hover:text-warm-700" />
                          </button>
                        </div>
                        {(searchResults.length > 0 || isSearching) && (
                          <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-warm-200 rounded-xl shadow-lg z-10 max-h-64 overflow-y-auto">
                            {isSearching ? (
                              <div className="p-3 text-sm text-warm-500 text-center">Searching...</div>
                            ) : (
                              searchResults.map(product => (
                                <div key={product.id}>
                                  <div className="px-3 py-2 text-xs font-semibold text-warm-500 bg-warm-50 border-b border-warm-100">
                                    {product.name}
                                  </div>
                                  {product.variants.map(variant => (
                                    <button
                                      key={variant.id}
                                      type="button"
                                      onClick={() => selectVariant(item.key, product, variant.id)}
                                      className="w-full text-left px-4 py-2 text-sm hover:bg-amber-50 flex justify-between items-center"
                                    >
                                      <span className="text-warm-900">{variant.name}</span>
                                      <span className="text-amber-600 font-medium">₹{Number(variant.price).toFixed(0)}</span>
                                    </button>
                                  ))}
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setSearchKey(item.key); setSearchQuery(''); setSearchResults([]) }}
                        className="text-xs text-amber-600 hover:text-amber-700 border border-amber-300 px-2 py-1 rounded-lg"
                      >
                        Pick from website
                      </button>
                    )}
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(item.key)} className="text-warm-400 hover:text-red-600">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-5">
                    <Input
                      label="Product Name"
                      placeholder="e.g. Daisy Candle"
                      value={item.productName}
                      onChange={e => updateItem(item.key, { productName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      label="Variant (optional)"
                      placeholder="e.g. 100ml, Red"
                      value={item.variantName}
                      onChange={e => updateItem(item.key, { variantName: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      label="Qty"
                      type="number"
                      min="1"
                      value={String(item.quantity)}
                      onChange={e => updateItem(item.key, { quantity: Math.max(1, Number(e.target.value)) })}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      label="Price (₹)"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={item.price}
                      onChange={e => updateItem(item.key, { price: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end border-t border-warm-100 pt-4">
            <div className="text-right">
              <p className="text-sm text-warm-500">Subtotal</p>
              <p className="text-xl font-semibold text-warm-900">₹{subtotal.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-xl p-6 shadow-soft">
          <h2 className="font-semibold text-warm-900 mb-4">Order Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Order Status"
              value={status}
              onChange={e => setStatus(e.target.value)}
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'processing', label: 'Processing' },
                { value: 'shipped', label: 'Shipped' },
                { value: 'delivered', label: 'Delivered' },
              ]}
            />
            <Select
              label="Payment Status"
              value={paymentStatus}
              onChange={e => setPaymentStatus(e.target.value)}
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'paid', label: 'Paid' },
                { value: 'failed', label: 'Failed' },
              ]}
            />
            <div className="col-span-2">
              <label className="block text-sm font-medium text-warm-700 mb-1">
                Notes <span className="text-warm-400 font-normal">(optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Any notes about this order, customer requests, source..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full rounded-lg border border-warm-200 px-3 py-2 text-sm text-warm-900 placeholder-warm-400 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" size="lg" isLoading={isSaving}>
            Create Order
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => navigate('/admin/orders')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
