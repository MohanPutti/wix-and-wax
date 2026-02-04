import { useSearchParams } from 'react-router-dom'
import { useProducts, useCategories } from '../hooks/useProducts'
import ProductGrid from '../components/products/ProductGrid'
import ProductFilters from '../components/products/ProductFilters'
import Button from '../components/ui/Button'

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parseInt(searchParams.get('page') || '1', 10)
  const category = searchParams.get('category') || undefined
  const priceRange = searchParams.get('price') || undefined

  let minPrice: number | undefined
  let maxPrice: number | undefined

  if (priceRange) {
    if (priceRange === '50+') {
      minPrice = 50
    } else {
      const [min, max] = priceRange.split('-').map(Number)
      minPrice = min
      maxPrice = max
    }
  }

  const { products, isLoading, pagination } = useProducts({
    page,
    limit: 12,
    category,
    status: 'active',
    minPrice,
    maxPrice,
  })

  const { categories } = useCategories()

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('page', String(newPage))
    setSearchParams(newParams)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const activeCategory = categories.find((c) => c.slug === category)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold text-warm-900 mb-2">
          {activeCategory ? activeCategory.name : 'All Candles'}
        </h1>
        <p className="text-warm-600">
          {activeCategory?.description || 'Explore our full collection of hand-poured artisan candles'}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl p-6 shadow-soft sticky top-24">
            <h2 className="font-semibold text-warm-900 mb-4">Filters</h2>
            <ProductFilters categories={categories} />
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
