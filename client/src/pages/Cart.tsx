import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  selectCart,
  selectSubtotal,
  selectItemCount,
  applyDiscount,
} from '../store/slices/cartSlice'
import CartItem from '../components/cart/CartItem'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useState, useMemo, useEffect } from 'react'

export default function Cart() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const cart = useAppSelector(selectCart)
  const subtotal = useAppSelector(selectSubtotal)
  const itemCount = useAppSelector(selectItemCount)

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [discountCode, setDiscountCode] = useState('')
  const [discountError, setDiscountError] = useState('')
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false)

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
    navigate('/checkout', { state: { selectedItems: selectedItemsData } })
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
                    className="flex justify-between items-center text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg"
                  >
                    <span>{d.discount.code}</span>
                    <span>
                      {d.discount.type === 'percentage'
                        ? `-${d.discount.value}%`
                        : d.discount.type === 'free_shipping'
                        ? 'Free Shipping'
                        : `-$${d.discount.value}`}
                    </span>
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
              <div className="flex justify-between text-warm-600">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="flex justify-between text-warm-600">
                <span>Tax</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="border-t border-warm-200 pt-3">
                <div className="flex justify-between text-lg font-semibold text-warm-900">
                  <span>Estimated Total</span>
                  <span>₹{selectedSubtotal.toFixed(2)}</span>
                </div>
              </div>
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
