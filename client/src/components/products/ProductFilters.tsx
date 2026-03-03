import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { useCategories } from '../../hooks/useProducts'

const PRICE_RANGES = [
  { value: '', label: 'All Prices' },
  { value: '0-299', label: 'Under ₹299' },
  { value: '299-599', label: '₹299 – ₹599' },
  { value: '599-999', label: '₹599 – ₹999' },
  { value: '999-1999', label: '₹999 – ₹1,999' },
  { value: '1999+', label: '₹1,999+' },
]

interface ProductFiltersProps {
  onSelect?: () => void
}

export default function ProductFilters({ onSelect }: ProductFiltersProps = {}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeCategory = searchParams.get('category') || ''
  const priceRange = searchParams.get('price') || ''

  const { categories } = useCategories()
  const groups = categories.filter((c) => !c.parentId && c.slug !== 'featured')

  const defaultOpen = groups.reduce<Record<string, boolean>>((acc, group) => {
    const children = categories.filter((c) => c.parentId === group.id)
    acc[group.id] = children.some((c) => c.slug === activeCategory)
    return acc
  }, {})

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(defaultOpen)

  const toggleGroup = (id: string) =>
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }))

  const handleCategoryChange = (slug: string) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('occasion')
    if (slug) {
      newParams.set('category', slug)
    } else {
      newParams.delete('category')
    }
    newParams.delete('page')
    setSearchParams(newParams)
    onSelect?.()
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
    onSelect?.()
  }

  return (
    <div className="space-y-1">
      {/* All Candles */}
      <button
        onClick={() => handleCategoryChange('')}
        className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          !activeCategory ? 'bg-amber-100 text-amber-800' : 'text-warm-600 hover:bg-warm-50'
        }`}
      >
        All Candles
      </button>

      <div className="pt-2 space-y-1">
        {groups.map((group) => {
          const children = categories
            .filter((c) => c.parentId === group.id)
            .sort((a, b) => a.sortOrder - b.sortOrder)
          if (children.length === 0) return null

          const isOpen = !!openGroups[group.id]
          const hasActive = children.some((c) => c.slug === activeCategory)

          return (
            <div key={group.id}>
              <button
                onClick={() => toggleGroup(group.id)}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-colors ${
                  hasActive ? 'text-amber-700 bg-amber-50' : 'text-warm-500 hover:text-warm-800 hover:bg-warm-50'
                }`}
              >
                <span>{group.name}</span>
                <ChevronDownIcon
                  className={`h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isOpen && (
                <div className="mt-0.5 ml-2 space-y-0.5">
                  {children.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat.slug)}
                      className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeCategory === cat.slug
                          ? 'bg-amber-100 text-amber-800 font-medium'
                          : 'text-warm-600 hover:bg-warm-50 hover:text-warm-900'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Price Range */}
      <div className="border-t border-warm-100 pt-4 mt-4">
        <p className="px-3 text-xs font-bold tracking-wider uppercase text-warm-500 mb-2">
          Price Range
        </p>
        <div className="space-y-0.5">
          {PRICE_RANGES.map((range) => (
            <button
              key={range.value}
              onClick={() => handlePriceChange(range.value)}
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                priceRange === range.value
                  ? 'bg-amber-100 text-amber-800 font-medium'
                  : 'text-warm-600 hover:bg-warm-50 hover:text-warm-900'
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
