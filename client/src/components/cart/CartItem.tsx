import { MinusIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import type { CartItem as CartItemType } from '../../types'
import { useAppDispatch } from '../../store/hooks'
import { updateCartItem, removeCartItem } from '../../store/slices/cartSlice'

interface CartItemProps {
  item: CartItemType
  isSelected: boolean
  onToggleSelect: () => void
}

export default function CartItem({ item, isSelected, onToggleSelect }: CartItemProps) {
  const dispatch = useAppDispatch()

  const handleUpdateQuantity = (quantity: number) => {
    dispatch(updateCartItem({ itemId: item.id, quantity }))
  }

  const handleRemove = () => {
    dispatch(removeCartItem(item.id))
  }

  return (
    <div className="flex gap-4 py-4 border-b border-warm-200 last:border-0">
      {/* Checkbox */}
      <div className="flex items-start pt-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="h-5 w-5 rounded border-warm-300 text-amber-600 focus:ring-amber-500"
        />
      </div>

      {/* Image */}
      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-warm-100">
        <img
          src={item.variant?.product?.images?.[0]?.url || '/placeholder-candle.jpg'}
          alt={item.variant?.product?.name || 'Product'}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col">
        <div className="flex justify-between">
          <div>
            <h3 className="font-medium text-warm-900">{item.variant?.product?.name || 'Product'}</h3>
            <p className="text-sm text-warm-500">{item.variant?.name || ''}</p>
          </div>
          <p className="font-medium text-warm-900">
            ₹{(Number(item.price) * item.quantity).toFixed(2)}
          </p>
        </div>

        {/* Quantity Controls */}
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center border border-warm-200 rounded-lg">
            <button
              onClick={() => handleUpdateQuantity(item.quantity - 1)}
              className="p-2 text-warm-600 hover:text-amber-600 transition-colors"
              aria-label="Decrease quantity"
            >
              <MinusIcon className="h-4 w-4" />
            </button>
            <span className="px-3 text-warm-900 min-w-[2rem] text-center">{item.quantity}</span>
            <button
              onClick={() => handleUpdateQuantity(item.quantity + 1)}
              className="p-2 text-warm-600 hover:text-amber-600 transition-colors"
              aria-label="Increase quantity"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={handleRemove}
            className="p-2 text-warm-400 hover:text-red-600 transition-colors"
            aria-label="Remove item"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
