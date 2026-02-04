import { Link } from 'react-router-dom'
import type { Product } from '../../types'
import Button from '../ui/Button'
import { useAppDispatch } from '../../store/hooks'
import { addToCart } from '../../store/slices/cartSlice'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const dispatch = useAppDispatch()
  const defaultVariant = product.variants.find((v) => v.isDefault) || product.variants[0]
  const mainImage = product.images[0]?.url || '/placeholder-candle.jpg'
  const price = Number(defaultVariant?.price) || 0
  const comparePrice = defaultVariant?.comparePrice ? Number(defaultVariant.comparePrice) : null

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (defaultVariant) {
      dispatch(addToCart({ variantId: defaultVariant.id }))
    }
  }

  return (
    <Link
      to={`/products/${product.slug}`}
      className="group bg-white rounded-2xl shadow-soft overflow-hidden hover:shadow-warm transition-shadow duration-300"
    >
      {/* Image */}
      <div className="aspect-square overflow-hidden bg-warm-100">
        <img
          src={mainImage}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Categories */}
        {product.categories.length > 0 && (
          <p className="text-xs text-amber-600 font-medium mb-1">
            {product.categories.map((c) => c.category.name).join(', ')}
          </p>
        )}

        {/* Name */}
        <h3 className="font-serif text-lg font-medium text-warm-900 group-hover:text-amber-700 transition-colors">
          {product.name}
        </h3>

        {/* Price */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-lg font-semibold text-warm-900">
            ₹{price.toFixed(2)}
          </span>
          {comparePrice && comparePrice > price && (
            <span className="text-sm text-warm-400 line-through">
              ₹{comparePrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleAddToCart}
          >
            Add to Cart
          </Button>
        </div>
      </div>
    </Link>
  )
}
