import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { selectCart, selectSubtotal, selectSessionId, fetchCart } from '../store/slices/cartSlice'
import { selectUser, selectIsAuthenticated } from '../store/slices/authSlice'
import { useAddresses } from '../hooks/useAddresses'
import { api } from '../services/api'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'
import type { Address, SavedAddress } from '../types'

// Razorpay types
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: RazorpayResponse) => void
  prefill: { email: string; contact?: string }
  theme: { color: string }
  modal?: { ondismiss?: () => void }
}

interface RazorpayInstance {
  open: () => void
  close: () => void
}

interface RazorpayResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

// Load Razorpay script
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function Checkout() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const cart = useAppSelector(selectCart)
  const subtotal = useAppSelector(selectSubtotal)
  const sessionId = useAppSelector(selectSessionId)
  const user = useAppSelector(selectUser)
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const { addresses, isLoading: addressesLoading, getDefaultAddress } = useAddresses()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [error, setError] = useState('')
  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new'>('new')

  const [email, setEmail] = useState(user?.email || '')
  const [shippingAddress, setShippingAddress] = useState<Address>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    address1: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    phone: user?.phone || '',
  })

  // Set default address when addresses load
  useEffect(() => {
    if (addresses.length > 0 && selectedAddressId === 'new') {
      const defaultAddr = getDefaultAddress('shipping')
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id)
        setShippingAddressFromSaved(defaultAddr)
      }
    }
  }, [addresses, getDefaultAddress, selectedAddressId])

  const setShippingAddressFromSaved = (saved: SavedAddress) => {
    setShippingAddress({
      firstName: saved.firstName,
      lastName: saved.lastName,
      company: saved.company,
      address1: saved.address1,
      address2: saved.address2,
      city: saved.city,
      state: saved.state,
      postalCode: saved.postalCode,
      country: saved.country,
      phone: saved.phone,
    })
  }

  const handleSelectAddress = (addressId: string | 'new') => {
    setSelectedAddressId(addressId)
    if (addressId === 'new') {
      setShippingAddress({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        address1: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        phone: user?.phone || '',
      })
    } else {
      const selected = addresses.find((a) => a.id === addressId)
      if (selected) {
        setShippingAddressFromSaved(selected)
      }
    }
  }

  // Don't show empty cart if order was just placed (prevents flash before redirect)
  if ((!cart || cart.items.length === 0) && !orderPlaced) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="font-serif text-3xl font-semibold text-warm-900 mb-4">
          Your Cart is Empty
        </h1>
        <p className="text-warm-600 mb-8">Add some candles before checking out.</p>
        <Link to="/products">
          <Button size="lg">Start Shopping</Button>
        </Link>
      </div>
    )
  }

  // Show loading state while redirecting after order
  if (orderPlaced) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  const handleAddressChange = (field: keyof Address, value: string) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }))
  }

  const initiateRazorpayPayment = useCallback(async (orderId: string, orderNumber: string) => {
    // Load Razorpay script
    const loaded = await loadRazorpayScript()
    if (!loaded) {
      setError('Failed to load payment gateway. Please try again.')
      setIsSubmitting(false)
      return
    }

    try {
      // Create Razorpay order
      const paymentResponse = await api.createPaymentOrder(orderId)
      if (!paymentResponse.success) {
        throw new Error('Failed to create payment order')
      }

      const { razorpayOrderId, amount, currency, keyId } = paymentResponse.data

      // Open Razorpay checkout
      const options: RazorpayOptions = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'Wix and Wax',
        description: `Order ${orderNumber}`,
        order_id: razorpayOrderId,
        handler: async (response: RazorpayResponse) => {
          try {
            // Verify payment
            const verifyResponse = await api.verifyPayment({
              orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            })

            if (verifyResponse.success) {
              setOrderPlaced(true)
              dispatch(fetchCart())
              navigate(`/order-confirmation/${orderNumber}?email=${encodeURIComponent(email)}`)
            } else {
              setError('Payment verification failed. Please contact support.')
              setIsSubmitting(false)
            }
          } catch {
            setError('Payment verification failed. Please contact support.')
            setIsSubmitting(false)
          }
        },
        prefill: {
          email: email,
          contact: shippingAddress.phone || '',
        },
        theme: {
          color: '#D97706', // amber-600
        },
        modal: {
          ondismiss: () => {
            setError('Payment was cancelled. Your order has been saved. You can complete payment later.')
            setIsSubmitting(false)
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate payment')
      setIsSubmitting(false)
    }
  }, [email, shippingAddress.phone, dispatch, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cart) return

    setIsSubmitting(true)
    setError('')

    try {
      // Use secure checkout endpoint - prices are validated server-side
      // Send items with variantId and quantity only (NOT prices)
      const itemsToCheckout = cart.items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      }))

      const response = await api.checkout({
        sessionId, // Always send sessionId to find guest carts
        email: isAuthenticated ? undefined : email,
        shippingAddress,
        items: itemsToCheckout,
      })

      if (response.success) {
        const orderId = response.data.id
        const orderNumber = response.data.orderNumber

        // Initiate Razorpay payment
        await initiateRazorpayPayment(orderId, orderNumber)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order')
      setIsSubmitting(false)
    }
  }

  const shipping = 99
  const tax = subtotal * 0.18
  const total = subtotal + shipping + tax

  const shippingAddresses = addresses.filter((a) => a.type === 'shipping')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-serif text-3xl font-semibold text-warm-900 mb-8">Checkout</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Contact Information */}
            <div className="bg-white rounded-xl p-6 shadow-soft">
              <h2 className="font-semibold text-warm-900 mb-4">Contact Information</h2>
              {!isAuthenticated && (
                <p className="text-sm text-warm-600 mb-4">
                  Already have an account?{' '}
                  <Link to="/login" className="text-amber-600 hover:text-amber-700">
                    Log in
                  </Link>
                </p>
              )}
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-xl p-6 shadow-soft">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-warm-900">Shipping Address</h2>
                {isAuthenticated && (
                  <Link to="/profile" className="text-sm text-amber-600 hover:text-amber-700">
                    Manage addresses
                  </Link>
                )}
              </div>

              {/* Saved Addresses Selection */}
              {isAuthenticated && addressesLoading && (
                <div className="flex justify-center py-4">
                  <Spinner size="sm" />
                </div>
              )}

              {isAuthenticated && !addressesLoading && shippingAddresses.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-warm-700 mb-3">
                    Select a saved address or enter a new one
                  </label>
                  <div className="grid gap-3">
                    {shippingAddresses.map((addr) => (
                      <label
                        key={addr.id}
                        className={`relative flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedAddressId === addr.id
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-warm-200 hover:border-warm-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="savedAddress"
                          checked={selectedAddressId === addr.id}
                          onChange={() => handleSelectAddress(addr.id)}
                          className="sr-only"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-warm-900">
                              {addr.firstName} {addr.lastName}
                            </span>
                            {addr.isDefault && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-warm-600 mt-1">
                            {addr.address1}
                            {addr.address2 && `, ${addr.address2}`}
                          </p>
                          <p className="text-sm text-warm-600">
                            {addr.city}, {addr.state} {addr.postalCode}
                          </p>
                        </div>
                        {selectedAddressId === addr.id && (
                          <CheckCircleIcon className="h-5 w-5 text-amber-600 flex-shrink-0" />
                        )}
                      </label>
                    ))}

                    <label
                      className={`relative flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedAddressId === 'new'
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-warm-200 hover:border-warm-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="savedAddress"
                        checked={selectedAddressId === 'new'}
                        onChange={() => handleSelectAddress('new')}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-warm-900">Enter a new address</span>
                      </div>
                      {selectedAddressId === 'new' && (
                        <CheckCircleIcon className="h-5 w-5 text-amber-600 flex-shrink-0" />
                      )}
                    </label>
                  </div>
                </div>
              )}

              {/* Address Form - Show if no saved addresses or "new" is selected */}
              {(selectedAddressId === 'new' || shippingAddresses.length === 0) && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    value={shippingAddress.firstName}
                    onChange={(e) => handleAddressChange('firstName', e.target.value)}
                    required
                  />
                  <Input
                    label="Last Name"
                    value={shippingAddress.lastName}
                    onChange={(e) => handleAddressChange('lastName', e.target.value)}
                    required
                  />
                  <div className="col-span-2">
                    <Input
                      label="Address"
                      value={shippingAddress.address1}
                      onChange={(e) => handleAddressChange('address1', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      label="Apartment, suite, etc. (optional)"
                      value={shippingAddress.address2 || ''}
                      onChange={(e) => handleAddressChange('address2', e.target.value)}
                    />
                  </div>
                  <Input
                    label="City"
                    value={shippingAddress.city}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    required
                  />
                  <Input
                    label="State"
                    value={shippingAddress.state || ''}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                  />
                  <Input
                    label="Postal Code"
                    value={shippingAddress.postalCode}
                    onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                    required
                  />
                  <Input
                    label="Country"
                    value={shippingAddress.country}
                    onChange={(e) => handleAddressChange('country', e.target.value)}
                    required
                  />
                  <div className="col-span-2">
                    <Input
                      label="Phone (optional)"
                      type="tel"
                      value={shippingAddress.phone || ''}
                      onChange={(e) => handleAddressChange('phone', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Show selected saved address details (read-only) */}
              {selectedAddressId !== 'new' && shippingAddresses.length > 0 && (
                <div className="text-sm text-warm-600 mt-2">
                  <p>
                    Shipping to: {shippingAddress.firstName} {shippingAddress.lastName},{' '}
                    {shippingAddress.address1}, {shippingAddress.city}, {shippingAddress.state}{' '}
                    {shippingAddress.postalCode}, {shippingAddress.country}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-xl p-6 shadow-soft sticky top-24">
              <h2 className="font-semibold text-warm-900 mb-6">Order Summary</h2>

              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {cart?.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-warm-100">
                      <img
                        src={item.variant?.product?.images?.[0]?.url || '/placeholder-candle.jpg'}
                        alt={item.variant?.product?.name || 'Product'}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-warm-900">
                        {item.variant?.product?.name || 'Product'}
                      </h3>
                      <p className="text-xs text-warm-500">
                        {item.variant?.name || ''} x {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-warm-900">
                      ₹{(Number(item.price) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Summary Lines */}
              <div className="space-y-3 border-t border-warm-200 pt-6 mb-6">
                <div className="flex justify-between text-warm-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-warm-600">
                  <span>Shipping</span>
                  <span>₹{shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-warm-600">
                  <span>Tax (18% GST)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-warm-200 pt-3">
                  <div className="flex justify-between text-lg font-semibold text-warm-900">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Place Order Button */}
              <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
                Pay ₹{total.toFixed(2)}
              </Button>

              <p className="mt-4 text-xs text-warm-500 text-center">
                By placing this order, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
