import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AdjustmentsHorizontalIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useProducts, useCategories } from '../hooks/useProducts'
import ProductGrid from '../components/products/ProductGrid'
import ProductFilters from '../components/products/ProductFilters'
import Button from '../components/ui/Button'

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)

  const page = parseInt(searchParams.get('page') || '1', 10)
  const categorySlug = searchParams.get('category') || searchParams.get('occasion') || undefined
  const priceRange = searchParams.get('price') || undefined

  let minPrice: number | undefined
  let maxPrice: number | undefined

  if (priceRange) {
    if (priceRange.endsWith('+')) {
      minPrice = parseInt(priceRange, 10)
    } else {
      const [min, max] = priceRange.split('-').map(Number)
      minPrice = min
      maxPrice = max
    }
  }

  const { categories } = useCategories()
  const activeCategory = categories.find((c) => c.slug === categorySlug)
  const categoryId = activeCategory?.id

  const { products, isLoading, pagination } = useProducts({
    page,
    limit: 12,
    categoryId,
    status: 'active',
    minPrice,
    maxPrice,
  })

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('page', String(newPage))
    setSearchParams(newParams)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const hasActiveFilter = !!categorySlug || !!priceRange

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-semibold text-warm-900 mb-2">
          {activeCategory ? activeCategory.name : 'All Candles'}
        </h1>
        <p className="text-warm-600">
          {activeCategory?.description || 'Explore our full collection of hand-poured artisan candles'}
        </p>
      </div>

      {/* Mobile filter toggle bar */}
      <div className="lg:hidden flex items-center justify-between mb-5 bg-white rounded-xl px-4 py-3 shadow-soft">
        <button
          onClick={() => setFiltersOpen(true)}
          className="flex items-center gap-2 text-sm font-medium text-warm-700"
        >
          <AdjustmentsHorizontalIcon className="h-5 w-5" />
          Filters
          {hasActiveFilter && (
            <span className="bg-amber-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {[categorySlug, priceRange].filter(Boolean).length}
            </span>
          )}
        </button>
        {hasActiveFilter && (
          <button
            onClick={() => {
              const newParams = new URLSearchParams()
              setSearchParams(newParams)
            }}
            className="text-xs text-warm-400 hover:text-red-500 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Mobile filter drawer — slides in from left */}
      {filtersOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setFiltersOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 w-72 bg-white z-50 lg:hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-warm-100">
              <h2 className="font-semibold text-warm-900">Filters</h2>
              <button
                onClick={() => setFiltersOpen(false)}
                className="p-1 text-warm-400 hover:text-warm-700 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ProductFilters onSelect={() => setFiltersOpen(false)} />
            </div>
          </div>
        </>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Desktop Filters Sidebar */}
        <aside className="hidden lg:block lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl p-6 shadow-soft sticky top-24">
            <h2 className="font-semibold text-warm-900 mb-4">Filters</h2>
            <ProductFilters />
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          <ProductGrid products={products} isLoading={isLoading} />

          {/* Pagination */}
          {pagination?.totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                Previous
              </Button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={p === page ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(p)}
                >
                  {p}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
