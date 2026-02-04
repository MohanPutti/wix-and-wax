import { Link } from 'react-router-dom'
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
import { useState } from 'react'

export default function Cart() {
  const dispatch = useAppDispatch()
  const cart = useAppSelector(selectCart)
  const subtotal = useAppSelector(selectSubtotal)
  const itemCount = useAppSelector(selectItemCount)

  const [discountCode, setDiscountCode] = useState('')
  const [discountError, setDiscountError] = useState('')
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false)

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-serif text-3xl font-semibold text-warm-900 mb-8">
        Shopping Cart ({itemCount} items)
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-6 shadow-soft">
            {cart.items.map((item) => (
              <CartItem key={item.id} item={item} />
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
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
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
                  <span>Total</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Checkout Button */}
            <Link to="/checkout">
              <Button size="lg" className="w-full">
                Proceed to Checkout
              </Button>
            </Link>

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
