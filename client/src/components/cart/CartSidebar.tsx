import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, MinusIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
  selectCart,
  selectIsCartOpen,
  selectItemCount,
  selectSubtotal,
  closeCart,
  updateCartItem,
  removeCartItem,
} from '../../store/slices/cartSlice'
import Button from '../ui/Button'

export default function CartSidebar() {
  const dispatch = useAppDispatch()
  const cart = useAppSelector(selectCart)
  const isCartOpen = useAppSelector(selectIsCartOpen)
  const itemCount = useAppSelector(selectItemCount)
  const subtotal = useAppSelector(selectSubtotal)

  const handleClose = () => {
    dispatch(closeCart())
  }

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    dispatch(updateCartItem({ itemId, quantity }))
  }

  const handleRemoveItem = (itemId: string) => {
    dispatch(removeCartItem(itemId))
  }

  return (
    <Transition.Root show={isCartOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-warm-900/50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-cream-50 shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-6 border-b border-warm-200">
                      <Dialog.Title className="font-serif text-xl font-semibold text-warm-900">
                        Shopping Cart ({itemCount})
                      </Dialog.Title>
                      <button
                        onClick={handleClose}
                        className="p-2 text-warm-500 hover:text-warm-700 transition-colors"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto px-4 py-6">
                      {!cart || cart.items.length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-warm-500 mb-4">Your cart is empty</p>
                          <Button onClick={handleClose} variant="outline">
                            Continue Shopping
                          </Button>
                        </div>
                      ) : (
                        <ul className="space-y-6">
                          {cart.items.map((item) => (
                            <li key={item.id} className="flex gap-4">
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
                                    <h3 className="font-medium text-warm-900">
                                      {item.variant?.product?.name || 'Product'}
                                    </h3>
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
                                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                      className="p-2 text-warm-600 hover:text-amber-600 transition-colors"
                                    >
                                      <MinusIcon className="h-4 w-4" />
                                    </button>
                                    <span className="px-3 text-warm-900">{item.quantity}</span>
                                    <button
                                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                      className="p-2 text-warm-600 hover:text-amber-600 transition-colors"
                                    >
                                      <PlusIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveItem(item.id)}
                                    className="p-2 text-warm-400 hover:text-red-600 transition-colors"
                                  >
                                    <TrashIcon className="h-5 w-5" />
                                  </button>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Footer */}
                    {cart && cart.items.length > 0 && (
                      <div className="border-t border-warm-200 px-4 py-6">
                        <div className="flex justify-between text-lg font-medium text-warm-900 mb-4">
                          <span>Subtotal</span>
                          <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        <p className="text-sm text-warm-500 mb-6">
                          Shipping and taxes calculated at checkout.
                        </p>
                        <Link to="/cart" onClick={handleClose}>
                          <Button className="w-full mb-3" size="lg" variant="outline">
                            View Full Cart
                          </Button>
                        </Link>
                        <Link to="/checkout" onClick={handleClose}>
                          <Button className="w-full" size="lg">
                            Checkout
                          </Button>
                        </Link>
                        <button
                          onClick={handleClose}
                          className="w-full mt-3 text-center text-amber-600 hover:text-amber-700 transition-colors"
                        >
                          Continue Shopping
                        </button>
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
