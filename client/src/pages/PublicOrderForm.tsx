import { useState, useEffect } from 'react'
import { PlusIcon, TrashIcon, MagnifyingGlassIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { api } from '../services/api'
import type { Product } from '../types'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

interface Item {
  key: number
  productName: string
  variantName: string
  quantity: number
  note: string
  // from catalog
  fromCatalog?: boolean
  price?: number
}

let keyCounter = 0
const newItem = (): Item => ({
  key: ++keyCounter,
  productName: '',
  variantName: '',
  quantity: 1,
  note: '',
})

export default function PublicOrderForm() {
  // Customer
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  // Address
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry] = useState('India')

  // Items
  const [items, setItems] = useState<Item[]>([newItem()])

  // Notes & amount
  const [notes, setNotes] = useState('')
  const [amountPaid, setAmountPaid] = useState('')

  // Product search
  const [searchKey, setSearchKey] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState<{ orderNumber: string } | null>(null)

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

  const updateItem = (key: number, patch: Partial<Item>) =>
    setItems(prev => prev.map(i => i.key === key ? { ...i, ...patch } : i))

  const removeItem = (key: number) =>
    setItems(prev => prev.filter(i => i.key !== key))

  const selectVariant = (itemKey: number, product: Product, variantId: string) => {
    const variant = product.variants.find(v => v.id === variantId)
    if (!variant) return
    updateItem(itemKey, {
      productName: product.name,
      variantName: variant.name,
      fromCatalog: true,
      price: Number(variant.price),
    })
    setSearchKey(null); setSearchQuery(''); setSearchResults([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!firstName.trim()) { setError('Please enter your name'); return }
    if (!phone.trim()) { setError('Please enter your phone number'); return }
    if (!address1.trim() || !city.trim() || !postalCode.trim()) {
      setError('Please fill in your delivery address'); return
    }
    const validItems = items.filter(i => i.productName.trim())
    if (!validItems.length) { setError('Please add at least one product'); return }

    setIsSaving(true)
    try {
      const res = await api.submitPublicOrder({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address1: address1.trim(),
        address2: address2.trim() || undefined,
        city: city.trim(),
        state: state.trim() || undefined,
        postalCode: postalCode.trim(),
        country: country.trim() || 'India',
        items: validItems.map(i => ({
          productName: i.productName.trim(),
          variantName: i.variantName.trim() || undefined,
          quantity: i.quantity,
          note: i.note.trim() || undefined,
        })),
        notes: notes.trim() || undefined,
        amountPaid: amountPaid ? Number(amountPaid) : undefined,
      })
      if (res.success) {
        setSubmitted({ orderNumber: res.data.orderNumber })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit order. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-soft p-10 max-w-md w-full text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="font-serif text-2xl font-semibold text-warm-900 mb-2">Order Received!</h1>
          <p className="text-warm-600 mb-6">
            We've received your order and will be in touch soon to confirm and share payment details.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-6 py-4 mb-6">
            <p className="text-xs text-warm-500 mb-1">Your Order Number</p>
            <p className="font-mono font-bold text-amber-700 text-lg">{submitted.orderNumber}</p>
          </div>
          <p className="text-sm text-warm-400">Please save your order number for reference.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <div className="bg-white border-b border-warm-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <h1 className="font-serif text-2xl font-semibold text-warm-900">Place an Order</h1>
          <p className="text-sm text-warm-500 mt-1">Fill in your details and we'll get back to you with payment info.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer */}
          <section className="bg-white rounded-2xl p-6 shadow-soft">
            <h2 className="font-semibold text-warm-900 mb-4">Your Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1">First Name <span className="text-red-400">*</span></label>
                  <input value={firstName} onChange={e => setFirstName(e.target.value)} required
                    className="w-full border border-warm-200 rounded-xl px-3 py-2.5 text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-amber-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1">Last Name</label>
                  <input value={lastName} onChange={e => setLastName(e.target.value)}
                    className="w-full border border-warm-200 rounded-xl px-3 py-2.5 text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-amber-300" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">Phone Number <span className="text-red-400">*</span></label>
                <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" required
                  className="w-full border border-warm-200 rounded-xl px-3 py-2.5 text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">Email <span className="text-warm-400 font-normal">(optional)</span></label>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email"
                  className="w-full border border-warm-200 rounded-xl px-3 py-2.5 text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-amber-300" />
              </div>
            </div>
          </section>

          {/* Delivery Address */}
          <section className="bg-white rounded-2xl p-6 shadow-soft">
            <h2 className="font-semibold text-warm-900 mb-4">Delivery Address</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">Address Line 1 <span className="text-red-400">*</span></label>
                <input value={address1} onChange={e => setAddress1(e.target.value)} required
                  placeholder="House / Flat / Building, Street"
                  className="w-full border border-warm-200 rounded-xl px-3 py-2.5 text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-amber-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">Address Line 2 <span className="text-warm-400 font-normal">(optional)</span></label>
                <input value={address2} onChange={e => setAddress2(e.target.value)}
                  placeholder="Area / Landmark"
                  className="w-full border border-warm-200 rounded-xl px-3 py-2.5 text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-amber-300" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1">City <span className="text-red-400">*</span></label>
                  <input value={city} onChange={e => setCity(e.target.value)} required
                    className="w-full border border-warm-200 rounded-xl px-3 py-2.5 text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-amber-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1">State</label>
                  <input value={state} onChange={e => setState(e.target.value)}
                    className="w-full border border-warm-200 rounded-xl px-3 py-2.5 text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-amber-300" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1">Pincode <span className="text-red-400">*</span></label>
                  <input value={postalCode} onChange={e => setPostalCode(e.target.value)} required
                    className="w-full border border-warm-200 rounded-xl px-3 py-2.5 text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-amber-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1">Country</label>
                  <input value={country} onChange={e => setCountry(e.target.value)}
                    className="w-full border border-warm-200 rounded-xl px-3 py-2.5 text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-amber-300" />
                </div>
              </div>
            </div>
          </section>

          {/* Products */}
          <section className="bg-white rounded-2xl p-6 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-warm-900">Products</h2>
              <button type="button" onClick={() => setItems(prev => [...prev, newItem()])}
                className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1 font-medium">
                <PlusIcon className="h-4 w-4" /> Add Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={item.key} className="border border-warm-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-warm-600">Item {idx + 1}</span>
                    <div className="flex items-center gap-2">
                      {/* Pick from website */}
                      {searchKey === item.key ? (
                        <div className="relative">
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-400" />
                              <input autoFocus type="text" placeholder="Search products..."
                                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                className="pl-8 pr-3 py-1.5 text-sm border border-warm-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-400 w-48" />
                            </div>
                            <button type="button" onClick={() => { setSearchKey(null); setSearchQuery(''); setSearchResults([]) }}>
                              <XMarkIcon className="h-4 w-4 text-warm-400 hover:text-warm-700" />
                            </button>
                          </div>
                          {(searchResults.length > 0 || isSearching) && (
                            <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-warm-200 rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto">
                              {isSearching ? (
                                <div className="p-3 text-sm text-warm-500 text-center">Searching...</div>
                              ) : searchResults.map(product => (
                                <div key={product.id}>
                                  <div className="px-3 py-2 text-xs font-semibold text-warm-500 bg-warm-50 border-b border-warm-100">{product.name}</div>
                                  {product.variants.map(variant => (
                                    <button key={variant.id} type="button"
                                      onClick={() => selectVariant(item.key, product, variant.id)}
                                      className="w-full text-left px-4 py-2 text-sm hover:bg-amber-50 flex justify-between items-center">
                                      <span className="text-warm-900">{variant.name}</span>
                                      <span className="text-amber-600 font-medium">{fmt(Number(variant.price))}</span>
                                    </button>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <button type="button"
                          onClick={() => { setSearchKey(item.key); setSearchQuery(''); setSearchResults([]) }}
                          className="text-xs text-amber-600 hover:text-amber-700 border border-amber-300 px-2.5 py-1 rounded-lg">
                          Browse catalogue
                        </button>
                      )}
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(item.key)} className="text-warm-400 hover:text-red-500">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-warm-600 mb-1">Product Name <span className="text-red-400">*</span></label>
                        <input value={item.productName} onChange={e => updateItem(item.key, { productName: e.target.value, fromCatalog: false })}
                          placeholder="e.g. Lavender Candle"
                          className="w-full border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-900 focus:outline-none focus:ring-1 focus:ring-amber-400" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-warm-600 mb-1">Qty</label>
                        <input type="number" min="1" value={item.quantity}
                          onChange={e => updateItem(item.key, { quantity: Math.max(1, Number(e.target.value)) })}
                          className="w-full border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-900 focus:outline-none focus:ring-1 focus:ring-amber-400" />
                      </div>
                    </div>
                    {item.fromCatalog && item.variantName && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">{item.variantName}</span>
                        {item.price && <span className="text-xs text-warm-500">{fmt(item.price)} each</span>}
                        <button type="button" onClick={() => updateItem(item.key, { variantName: '', fromCatalog: false, price: undefined })}
                          className="text-xs text-warm-400 hover:text-warm-600 ml-auto">clear</button>
                      </div>
                    )}
                    {!item.fromCatalog && (
                      <div>
                        <label className="block text-xs font-medium text-warm-600 mb-1">Variant / Size <span className="text-warm-400 font-normal">(optional)</span></label>
                        <input value={item.variantName} onChange={e => updateItem(item.key, { variantName: e.target.value })}
                          placeholder="e.g. 100ml, Rose, Large"
                          className="w-full border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-900 focus:outline-none focus:ring-1 focus:ring-amber-400" />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-warm-600 mb-1">Note for this item <span className="text-warm-400 font-normal">(optional)</span></label>
                      <input value={item.note} onChange={e => updateItem(item.key, { note: e.target.value })}
                        placeholder="e.g. gift wrap, specific colour preference..."
                        className="w-full border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-900 focus:outline-none focus:ring-1 focus:ring-amber-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Notes & Payment */}
          <section className="bg-white rounded-2xl p-6 shadow-soft">
            <h2 className="font-semibold text-warm-900 mb-4">Additional Info</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">Order Notes <span className="text-warm-400 font-normal">(optional)</span></label>
                <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Any special instructions, delivery preferences, occasion details..."
                  className="w-full border border-warm-200 rounded-xl px-3 py-2.5 text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">
                  Amount Already Paid <span className="text-warm-400 font-normal">(optional — if you've made an advance)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-500 text-sm">₹</span>
                  <input type="number" min="0" step="0.01" value={amountPaid} onChange={e => setAmountPaid(e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-warm-200 rounded-xl pl-7 pr-3 py-2.5 text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-amber-300" />
                </div>
                {amountPaid && Number(amountPaid) > 0 && (
                  <p className="text-xs text-amber-700 mt-1.5">Your order will be marked as partially paid with ₹{Number(amountPaid).toLocaleString('en-IN')} advance.</p>
                )}
              </div>
            </div>
          </section>

          <button type="submit" disabled={isSaving}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-4 rounded-2xl text-base transition-colors disabled:opacity-60 shadow-warm">
            {isSaving ? 'Submitting...' : 'Submit Order'}
          </button>
        </form>

        <p className="text-center text-xs text-warm-400 mt-6">
          We'll contact you to confirm your order and share payment details.
        </p>
      </div>
    </div>
  )
}
