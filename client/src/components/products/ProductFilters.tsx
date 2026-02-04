import { useSearchParams } from 'react-router-dom'
import type { Category } from '../../types'

interface ProductFiltersProps {
  categories: Category[]
}

export default function ProductFilters({ categories }: ProductFiltersProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeCategory = searchParams.get('category') || ''
  const priceRange = searchParams.get('price') || ''

  const handleCategoryChange = (categorySlug: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (categorySlug) {
      newParams.set('category', categorySlug)
    } else {
      newParams.delete('category')
    }
    newParams.delete('page')
    setSearchParams(newParams)
  }

  const handlePriceChange = (range: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (range) {
      newParams.set('price', range)
    } else {
      newParams.delete('price')
    }
    newParams.delete('page')
    setSearchParams(newParams)
  }

  const priceRanges = [
    { value: '', label: 'All Prices' },
    { value: '0-20', label: 'Under $20' },
    { value: '20-35', label: '$20 - $35' },
    { value: '35-50', label: '$35 - $50' },
    { value: '50+', label: '$50+' },
  ]

  return (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-semibold text-warm-900 mb-3">Categories</h3>
        <div className="space-y-2">
          <button
            onClick={() => handleCategoryChange('')}
            className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${
              !activeCategory
                ? 'bg-amber-100 text-amber-800'
                : 'text-warm-600 hover:bg-warm-100'
            }`}
          >
            All Candles
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.slug)}
              className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${
                activeCategory === category.slug
                  ? 'bg-amber-100 text-amber-800'
                  : 'text-warm-600 hover:bg-warm-100'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold text-warm-900 mb-3">Price Range</h3>
        <div className="space-y-2">
          {priceRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => handlePriceChange(range.value)}
              className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${
                priceRange === range.value
                  ? 'bg-amber-100 text-amber-800'
                  : 'text-warm-600 hover:bg-warm-100'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
