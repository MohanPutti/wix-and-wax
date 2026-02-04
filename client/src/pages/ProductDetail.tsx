import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { useProduct } from '../hooks/useProducts'
import { useAppDispatch } from '../store/hooks'
import { addToCart } from '../store/slices/cartSlice'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import type { ProductVariant } from '../types'

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { product, isLoading, error } = useProduct(slug || '', true)
  const dispatch = useAppDispatch()
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  // Set default variant when product loads
  if (product && !selectedVariant) {
    const defaultVariant = product.variants.find((v) => v.isDefault) || product.variants[0]
    if (defaultVariant) {
      setSelectedVariant(defaultVariant)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-semibold text-warm-900 mb-4">Product Not Found</h1>
        <p className="text-warm-600 mb-8">The candle you're looking for doesn't exist.</p>
        <Link to="/products">
          <Button>Back to Shop</Button>
        </Link>
      </div>
    )
  }

  const currentVariant = selectedVariant || product.variants[0]
  const mainImage = product.images[selectedImageIndex]?.url || '/placeholder-candle.jpg'

  const handleAddToCart = async () => {
    if (!currentVariant) return
    setIsAddingToCart(true)
    try {
      dispatch(addToCart({ variantId: currentVariant.id, quantity }))
    } finally {
      setIsAddingToCart(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <Link
        to="/products"
        className="inline-flex items-center text-warm-600 hover:text-amber-600 transition-colors mb-8"
      >
        <ChevronLeftIcon className="h-4 w-4 mr-1" />
        Back to Shop
      </Link>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Images */}
        <div>
          {/* Main Image */}
          <div className="aspect-square bg-warm-100 rounded-2xl overflow-hidden mb-4">
            <img
              src={mainImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Thumbnail Gallery */}
          {product.images.length > 1 && (
            <div className="flex gap-4">
              {product.images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImageIndex === index
                      ? 'border-amber-600'
                      : 'border-transparent hover:border-warm-300'
                  }`}
                >
                  <img
                    src={image.url}
                    alt={image.alt || `${product.name} - ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          {/* Categories */}
          {product.categories.length > 0 && (
            <div className="flex gap-2 mb-4">
              {product.categories.map((c) => (
                <Link
                  key={c.category.id}
                  to={`/products?category=${c.category.slug}`}
                  className="text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full hover:bg-amber-100 transition-colors"
                >
                  {c.category.name}
                </Link>
              ))}
            </div>
          )}

          {/* Name & Price */}
          <h1 className="font-serif text-3xl font-semibold text-warm-900 mb-4">
            {product.name}
          </h1>

          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl font-semibold text-warm-900">
              ₹{Number(currentVariant.price).toFixed(2)}
            </span>
            {currentVariant.comparePrice && Number(currentVariant.comparePrice) > Number(currentVariant.price) && (
              <span className="text-lg text-warm-400 line-through">
                ₹{Number(currentVariant.comparePrice).toFixed(2)}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-warm-600 mb-8 leading-relaxed">{product.description}</p>

          {/* Variant Selection */}
          {product.variants.length > 1 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-warm-700 mb-2">
                Size
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                      currentVariant.id === variant.id
                        ? 'border-amber-600 bg-amber-50 text-amber-700'
                        : 'border-warm-200 hover:border-warm-300 text-warm-700'
                    }`}
                  >
                    {variant.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-warm-700 mb-2">
              Quantity
            </label>
            <div className="flex items-center border border-warm-200 rounded-lg w-fit">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-2 text-warm-600 hover:text-amber-600 transition-colors"
              >
                -
              </button>
              <span className="px-4 py-2 text-warm-900 min-w-[3rem] text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-4 py-2 text-warm-600 hover:text-amber-600 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Add to Cart */}
          <Button
            size="lg"
            className="w-full mb-4"
            onClick={handleAddToCart}
            isLoading={isAddingToCart}
            disabled={currentVariant.quantity <= 0}
          >
            {currentVariant.quantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
          </Button>

          {/* Stock Status */}
          {currentVariant.quantity > 0 && currentVariant.quantity <= 10 && (
            <p className="text-amber-600 text-sm text-center">
              Only {currentVariant.quantity} left in stock!
            </p>
          )}

          {/* Product Details */}
          <div className="mt-12 border-t border-warm-200 pt-8">
            <h2 className="font-semibold text-warm-900 mb-4">Product Details</h2>
            <ul className="space-y-2 text-warm-600">
              <li>SKU: {currentVariant.sku}</li>
              {currentVariant.options && Object.entries(currentVariant.options).map(([key, value]) => (
                <li key={key} className="capitalize">
                  {key}: {value}
                </li>
              ))}
              <li>Burn time: Approximately 40-50 hours</li>
              <li>100% natural soy wax</li>
              <li>Cotton wick for clean burn</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
