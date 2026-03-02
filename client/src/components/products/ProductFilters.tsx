import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

const FILTER_GROUPS = [
  {
    label: 'Shop',
    items: [
      { label: 'Jar Candles', slug: 'jar-candles' },
      { label: 'Scented Sachets', slug: 'scented-sachets' },
      { label: 'Tealights', slug: 'tealights' },
      { label: 'Gift Boxes', slug: 'gift-boxes' },
      { label: 'Custom Name Candles', slug: 'custom-name-candles' },
    ],
  },
  {
    label: 'Occasions',
    items: [
      { label: 'Birthdays', slug: 'birthdays' },
      { label: 'Baby Showers', slug: 'baby-showers' },
      { label: 'Anniversaries', slug: 'anniversaries' },
      { label: 'Housewarming', slug: 'housewarming' },
      { label: 'Festivals', slug: 'festivals' },
      { label: 'Return Favors', slug: 'return-favors' },
    ],
  },
  {
    label: 'Wedding & Events',
    items: [
      { label: 'Wedding Favors', slug: 'wedding-favors' },
      { label: 'Mehendi & Haldi', slug: 'mehendi-haldi' },
      { label: 'Bridal Shower', slug: 'bridal-shower' },
      { label: 'Save the Date', slug: 'save-the-date' },
      { label: 'Luxury Hampers', slug: 'luxury-hampers' },
      { label: 'Bulk Event Orders', slug: 'bulk-events' },
    ],
  },
  {
    label: 'Corporate',
    items: [
      { label: 'Corporate Gifting', slug: 'corporate' },
      { label: 'Client Gifts', slug: 'client-gifts' },
      { label: 'Welcome Kits', slug: 'welcome-kits' },
      { label: 'Festive Hampers', slug: 'festive-hampers' },
      { label: 'Brand Candles', slug: 'brand-candles' },
    ],
  },
]

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
  const activeCategory = searchParams.get('category') || searchParams.get('occasion') || ''
  const priceRange = searchParams.get('price') || ''

  // Find which group the active category belongs to and default it open
  const defaultOpen = FILTER_GROUPS.reduce<Record<string, boolean>>((acc, group) => {
    acc[group.label] = group.items.some((item) => item.slug === activeCategory)
    return acc
  }, {})

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(defaultOpen)

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }))
  }

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
        {FILTER_GROUPS.map((group) => {
          const isOpen = !!openGroups[group.label]
          const hasActive = group.items.some((item) => item.slug === activeCategory)

          return (
            <div key={group.label}>
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.label)}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-colors ${
                  hasActive
                    ? 'text-amber-700 bg-amber-50'
                    : 'text-warm-500 hover:text-warm-800 hover:bg-warm-50'
                }`}
              >
                <span>{group.label}</span>
                <ChevronDownIcon
                  className={`h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Group Items */}
              {isOpen && (
                <div className="mt-0.5 ml-2 space-y-0.5">
                  {group.items.map((item) => (
                    <button
                      key={item.slug}
                      onClick={() => handleCategoryChange(item.slug)}
                      className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeCategory === item.slug
                          ? 'bg-amber-100 text-amber-800 font-medium'
                          : 'text-warm-600 hover:bg-warm-50 hover:text-warm-900'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Divider */}
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
