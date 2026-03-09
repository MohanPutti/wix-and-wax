import { Link, useNavigate } from 'react-router-dom'
import { ENABLE_GST } from '../config'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  selectCart,
  selectItemCount,
  applyDiscount,
  removeDiscount,
} from '../store/slices/cartSlice'
import CartItem from '../components/cart/CartItem'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useState, useMemo, useEffect } from 'react'

export default function Cart() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const cart = useAppSelector(selectCart)
  const itemCount = useAppSelector(selectItemCount)

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [discountCode, setDiscountCode] = useState('')
  const [discountError, setDiscountError] = useState('')
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false)
  const [orderNotes, setOrderNotes] = useState('')

  // Initialize selectedItems when cart loads or changes
  useEffect(() => {
    if (cart?.items) {
      // Select all items by default when cart changes
      setSelectedItems(new Set(cart.items.map(item => item.id)))
    }
  }, [cart?.items.length]) // Only re-run when number of items changes

  // Calculate selected subtotal
  const selectedSubtotal = useMemo(() => {
    if (!cart) return 0
    return cart.items
      .filter(item => selectedItems.has(item.id))
      .reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
  }, [cart, selectedItems])

  // Calculate discount amount from applied discounts
  const discountAmount = useMemo(() => {
    if (!cart?.discounts?.length) return 0
    let amount = 0
    for (const { discount } of cart.discounts) {
      if (discount.type === 'percentage') {
        amount += selectedSubtotal * (Number(discount.value) / 100)
      } else if (discount.type === 'fixed_amount') {
        amount += Number(discount.value)
      }
    }
    return Math.min(amount, selectedSubtotal)
  }, [cart?.discounts, selectedSubtotal])

  const estimatedTotal = Math.max(0, selectedSubtotal - discountAmount)

  // Toggle individual item selection
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  // Toggle all items selection
  const toggleSelectAll = () => {
    if (!cart) return
    if (selectedItems.size === cart.items.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(cart.items.map(item => item.id)))
    }
  }

  const selectedCount = selectedItems.size

  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!discountCode.trim()) return

    setIsApplyingDiscount(true)
    setDiscountError('')

    try {
      await dispatch(applyDiscount(discountCode)).unwrap()
      setDiscountCode('')
    } catch (err) {
      if (typeof err === 'string') {
        setDiscountError(err)
      } else if (err instanceof Error) {
        setDiscountError(err.message)
      } else {
        setDiscountError('Invalid discount code')
      }
    } finally {
      setIsApplyingDiscount(false)
    }
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="font-serif text-3xl font-semibold text-warm-900 mb-4">
          Your Cart is Empty
        </h1>
        <p className="text-warm-600 mb-8">
          Looks like you haven't added any candles yet.
        </p>
        <Link to="/products">
          <Button size="lg">Start Shopping</Button>
        </Link>
      </div>
    )
  }

  const handleCheckout = () => {
    if (selectedCount === 0) {
      return
    }
    // Pass selected items to checkout page
    const selectedItemsData = cart?.items
      .filter(item => selectedItems.has(item.id))
      .map(item => ({
        id: item.id,
        variantId: item.variantId,
        quantity: item.quantity
      }))
    navigate('/checkout', { state: { selectedItems: selectedItemsData, orderNotes: orderNotes.trim() || undefined } })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-serif text-3xl font-semibold text-warm-900 mb-8">
        Shopping Cart ({itemCount} items)
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-6 shadow-soft">
            {/* Select All Checkbox */}
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-warm-200">
              <input
                type="checkbox"
                checked={selectedItems.size === cart.items.length && cart.items.length > 0}
                onChange={toggleSelectAll}
                className="h-5 w-5 rounded border-warm-300 text-amber-600 focus:ring-amber-500"
              />
              <label className="text-sm font-medium text-warm-700">
                Select All ({cart.items.length} items)
              </label>
              {selectedCount > 0 && selectedCount < cart.items.length && (
                <span className="text-sm text-warm-500">
                  {selectedCount} selected
                </span>
              )}
            </div>

            {cart.items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                isSelected={selectedItems.has(item.id)}
                onToggleSelect={() => toggleItemSelection(item.id)}
              />
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-white rounded-xl p-6 shadow-soft sticky top-24">
            <h2 className="font-semibold text-warm-900 mb-6">Order Summary</h2>

            {/* Discount Code */}
            <form onSubmit={handleApplyDiscount} className="mb-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Discount code"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  error={discountError}
                />
                <Button
                  type="submit"
                  variant="outline"
                  isLoading={isApplyingDiscount}
                >
                  Apply
                </Button>
              </div>
            </form>

            {/* Applied Discounts */}
            {cart.discounts && cart.discounts.length > 0 && (
              <div className="mb-6 space-y-2">
                {cart.discounts.map((d) => (
                  <div
                    key={d.discount.id}
                    className="flex justify-between items-center text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold">{d.discount.code}</span>
                      <span className="text-green-600">
                        {d.discount.type === 'percentage'
                          ? `-${d.discount.value}%`
                          : d.discount.type === 'free_shipping'
                          ? 'Free Shipping'
                          : `-₹${d.discount.value}`}
                      </span>
                    </div>
                    <button
                      onClick={() => dispatch(removeDiscount(d.discount.id))}
                      className="text-green-400 hover:text-red-500 transition-colors ml-2 text-xs underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Summary Lines */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-warm-600">
                <span>Selected Items ({selectedCount})</span>
                <span className="font-medium text-warm-900">₹{selectedSubtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span className="font-medium">-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-warm-600">
                <span>Shipping</span>
                <span className="text-sm">Calculated at checkout</span>
              </div>
              {ENABLE_GST && (
                <div className="flex justify-between text-warm-600">
                  <span>Tax (GST)</span>
                  <span>Calculated at checkout</span>
                </div>
              )}
              <div className="border-t border-warm-200 pt-3">
                <div className="flex justify-between text-lg font-semibold text-warm-900">
                  <span>Estimated Total</span>
                  <span>₹{estimatedTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Order Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-warm-700 mb-1.5">
                Order Notes <span className="text-warm-400 font-normal">(optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Any special instructions for your order..."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full rounded-lg border border-warm-200 px-3 py-2 text-sm text-warm-900 placeholder-warm-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 resize-none"
              />
            </div>

            {/* Checkout Button */}
            <Button
              size="lg"
              className="w-full"
              onClick={handleCheckout}
              disabled={selectedCount === 0}
            >
              Proceed to Checkout{selectedCount > 0 && ` (${selectedCount} items)`}
            </Button>

            <Link
              to="/products"
              className="block mt-4 text-center text-amber-600 hover:text-amber-700 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
