import { Link } from 'react-router-dom'
import type { Product } from '../../types'
import Button from '../ui/Button'
import { useAppDispatch } from '../../store/hooks'
import { addToCart } from '../../store/slices/cartSlice'

const SLUG_TO_GROUP: Record<string, string> = {
  'jar-candles': 'Shop', 'scented-sachets': 'Shop', 'tealights': 'Shop',
  'gift-boxes': 'Shop', 'custom-name-candles': 'Shop', 'new-arrivals': 'Shop', 'bestsellers': 'Shop',
  'birthdays': 'Occasions', 'baby-showers': 'Occasions', 'anniversaries': 'Occasions',
  'housewarming': 'Occasions', 'festivals': 'Occasions', 'return-favors': 'Occasions',
  'wedding-favors': 'Wedding & Events', 'mehendi-haldi': 'Wedding & Events',
  'bridal-shower': 'Wedding & Events', 'save-the-date': 'Wedding & Events',
  'luxury-hampers': 'Wedding & Events', 'bulk-events': 'Wedding & Events',
  'corporate': 'Corporate', 'client-gifts': 'Corporate', 'welcome-kits': 'Corporate',
  'festive-hampers': 'Corporate', 'brand-candles': 'Corporate',
}

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const dispatch = useAppDispatch()
  const defaultVariant = product.variants.find((v) => v.isDefault) || product.variants[0]
  const mainImage = product.images[0]?.url || '/placeholder-candle.jpg'
  const price = Number(defaultVariant?.price) || 0
  const mrp = defaultVariant?.comparePrice ? Number(defaultVariant.comparePrice) : null
  const hasDiscount = mrp !== null && mrp > price
  const discountPct = hasDiscount ? Math.round(((mrp! - price) / mrp!) * 100) : 0

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
      className="group bg-white rounded-2xl shadow-soft overflow-hidden hover:shadow-warm transition-shadow duration-300 flex flex-col h-full"
    >
      {/* Image */}
      <div className="aspect-square overflow-hidden bg-warm-100 relative">
        <img
          src={mainImage}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {hasDiscount && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {discountPct}% OFF
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Categories */}
        {product.categories.length > 0 && (
          <p className="text-xs text-amber-600 font-medium mb-1">
            {[...new Set(product.categories.map((c) => SLUG_TO_GROUP[c.category.slug] || c.category.name))].join(', ')}
          </p>
        )}

        {/* Name */}
        <h3 className="font-serif text-lg font-medium text-warm-900 group-hover:text-amber-700 transition-colors">
          {product.name}
        </h3>

        {/* Price — pushed down, button stays at bottom */}
        <div className="mt-auto pt-3">
          <div className="flex items-baseline gap-2 flex-wrap mb-3">
            <span className="text-lg font-semibold text-warm-900">
              ₹{price.toFixed(0)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-warm-400 line-through">
                ₹{mrp!.toFixed(0)}
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
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
