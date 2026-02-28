import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { PencilIcon, TrashIcon, PlusIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { useProducts, useProduct, useCategories } from '../../hooks/useProducts'
import { api } from '../../services/api'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import ImageUpload from '../../components/admin/ImageUpload'
import type { ProductVariant } from '../../types'

const statusColors: Record<string, 'default' | 'success' | 'warning'> = {
  draft: 'default',
  active: 'success',
  archived: 'warning',
}

export function AdminProductList() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { products, isLoading, pagination, refresh } = useProducts({ page, limit: 10 })

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      await api.deleteProduct(id)
      refresh()
    } catch (err) {
      alert('Failed to delete product')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-serif text-3xl font-semibold text-warm-900">Products</h1>
        <Link to="/admin/products/new">
          <Button>
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-soft mb-6">
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-soft overflow-hidden">
        <table className="w-full">
          <thead className="bg-warm-50 border-b border-warm-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-warm-700">Product</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-warm-700">Status</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-warm-700">Price</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-warm-700">Inventory</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-warm-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const defaultVariant = product.variants.find((v) => v.isDefault) || product.variants[0]
              const totalStock = product.variants.reduce((sum, v) => sum + v.quantity, 0)

              return (
                <tr key={product.id} className="border-b border-warm-100 hover:bg-warm-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-warm-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {product.images[0] ? (
                          <img
                            src={product.images[0].url}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span>&#x1F56F;</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-warm-900">{product.name}</p>
                        <p className="text-sm text-warm-500">{product.variants.length} variants</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={statusColors[product.status]}>{product.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-warm-700">
                    ₹{defaultVariant ? Number(defaultVariant.price).toFixed(0) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={totalStock <= 10 ? 'text-red-600' : 'text-warm-700'}>
                      {totalStock} in stock
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/admin/products/${product.id}`}
                        className="p-2 text-warm-500 hover:text-amber-600 transition-colors"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-warm-500 hover:text-red-600 transition-colors"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-warm-500">No products found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="px-4 py-2 text-warm-600">
            Page {page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

const CATEGORY_GROUPS = [
  {
    label: 'Shop',
    slugs: ['jar-candles', 'scented-sachets', 'tealights', 'gift-boxes', 'custom-name-candles'],
  },
  {
    label: 'Occasions',
    slugs: ['birthdays', 'baby-showers', 'anniversaries', 'housewarming', 'festivals', 'return-favors'],
  },
  {
    label: 'Wedding & Events',
    slugs: ['wedding-favors', 'mehendi-haldi', 'bridal-shower', 'save-the-date', 'luxury-hampers', 'bulk-events'],
  },
  {
    label: 'Corporate',
    slugs: ['corporate', 'client-gifts', 'welcome-kits', 'festive-hampers', 'brand-candles'],
  },
]

interface CategoryGroupSelectorProps {
  categories: { id: string; name: string; slug: string }[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

function CategoryGroupSelector({ categories, selectedIds, onChange }: CategoryGroupSelectorProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  const toggleGroup = (label: string) =>
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }))

  const toggle = (id: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedIds, id])
    } else {
      onChange(selectedIds.filter((s) => s !== id))
    }
  }

  return (
    <div className="space-y-1 mt-2">
      {CATEGORY_GROUPS.map((group) => {
        const groupCats = categories.filter((c) => group.slugs.includes(c.slug))
        if (groupCats.length === 0) return null
        const isOpen = !!openGroups[group.label]
        const selectedCount = groupCats.filter((c) => selectedIds.includes(c.id)).length

        return (
          <div key={group.label}>
            <button
              type="button"
              onClick={() => toggleGroup(group.label)}
              className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase text-warm-500 hover:text-warm-800 hover:bg-warm-50 transition-colors"
            >
              <span className="flex items-center gap-2">
                {group.label}
                {selectedCount > 0 && (
                  <span className="bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5 text-[10px] font-semibold normal-case tracking-normal">
                    {selectedCount}
                  </span>
                )}
              </span>
              <ChevronDownIcon
                className={`h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isOpen && (
              <div className="mt-0.5 ml-2 space-y-0.5">
                {groupCats.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-warm-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(cat.id)}
                      onChange={(e) => toggle(cat.id, e.target.checked)}
                      className="rounded border-warm-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-sm text-warm-700">{cat.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const SIZE_DEFS = [
  { key: 'sm', label: 'Small', weight: '100g', suffix: 'SM' },
  { key: 'md', label: 'Medium', weight: '200g', suffix: 'MD' },
  { key: 'lg', label: 'Large', weight: '350g', suffix: 'LG' },
] as const

type SizeKey = (typeof SIZE_DEFS)[number]['key']

interface SizeEntry {
  enabled: boolean
  price: string
  quantity: string
  isDefault: boolean
}

const defaultSizes = (): Record<SizeKey, SizeEntry> => ({
  sm: { enabled: false, price: '', quantity: '', isDefault: false },
  md: { enabled: true,  price: '', quantity: '', isDefault: true  },
  lg: { enabled: false, price: '', quantity: '', isDefault: false },
})

function sizesToVariants(sizes: Record<SizeKey, SizeEntry>, slug: string) {
  return SIZE_DEFS.filter((s) => sizes[s.key].enabled).map((s) => ({
    name: `${s.label} (${s.weight})`,
    sku: `${slug.toUpperCase().replace(/-/g, '_')}_${s.suffix}`,
    price: parseFloat(sizes[s.key].price) || 0,
    quantity: parseInt(sizes[s.key].quantity) || 0,
    isDefault: sizes[s.key].isDefault,
    options: { size: s.label, weight: s.weight },
  }))
}

function variantsToSizes(variants: ProductVariant[]): Record<SizeKey, SizeEntry> {
  const sizes = defaultSizes()
  for (const v of variants) {
    const match = SIZE_DEFS.find(
      (s) => v.name.toLowerCase().includes(s.label.toLowerCase()) || v.sku.endsWith(`_${s.suffix}`)
    )
    if (match) {
      sizes[match.key] = {
        enabled: true,
        price: String(v.price),
        quantity: String(v.quantity),
        isDefault: v.isDefault,
      }
    }
  }
  return sizes
}

export function AdminProductForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditMode = Boolean(id)

  const { categories } = useCategories()
  const { product, isLoading: isLoadingProduct } = useProduct(id || '')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('draft')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [images, setImages] = useState<string[]>([])
  const [sizes, setSizes] = useState<Record<SizeKey, SizeEntry>>(defaultSizes())

  useEffect(() => {
    if (isEditMode && product) {
      setName(product.name)
      setSlug(product.slug)
      setDescription(product.description || '')
      setStatus(product.status)
      setSelectedCategories(product.categories?.map((c) => c.category.id) || [])
      setImages(product.images?.map((img) => img.url) || [])
      if (product.variants.length > 0) {
        setSizes(variantsToSizes(product.variants))
      }
    }
  }, [isEditMode, product])

  const handleNameChange = (value: string) => {
    setName(value)
    setSlug(value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
  }

  const updateSize = (key: SizeKey, field: keyof SizeEntry, value: string | boolean) => {
    setSizes((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }))
  }

  const setDefaultSize = (key: SizeKey) => {
    setSizes((prev) => {
      const next = { ...prev }
      ;(Object.keys(next) as SizeKey[]).forEach((k) => {
        next[k] = { ...next[k], isDefault: k === key }
      })
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const enabledSizes = SIZE_DEFS.filter((s) => sizes[s.key].enabled)
    if (enabledSizes.length === 0) {
      setError('Please enable at least one size.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const newVariants = sizesToVariants(sizes, slug)

      if (isEditMode && id) {
        // 1. Update basic product fields + categories
        await api.updateProduct(id, {
          name,
          slug,
          description,
          status: status as 'draft' | 'active' | 'archived',
          categoryIds: selectedCategories,
        } as any)

        // 2. Sync images — replace all in one call
        await api.syncProductImages(id, images)

        // 3. Sync variants — update existing, add new, delete removed
        const existingVariants = product?.variants || []
        for (const v of newVariants) {
          const existing = existingVariants.find((ev) => ev.sku === v.sku)
          if (existing) {
            await api.updateVariant(id, existing.id, { price: v.price, quantity: v.quantity, isDefault: v.isDefault, name: v.name })
          } else {
            await api.addVariant(id, v)
          }
        }
        for (const ev of existingVariants) {
          if (!newVariants.find((v) => v.sku === ev.sku)) {
            await api.deleteVariant(id, ev.id)
          }
        }
      } else {
        // Create: send everything in one request
        await api.createProduct({
          name,
          slug,
          description,
          status: status as 'draft' | 'active' | 'archived',
          variants: newVariants,
          categoryIds: selectedCategories,
          images: images.map((url, i) => ({ url, alt: name, sortOrder: i })),
        } as any)
      }

      navigate('/admin/products')
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isEditMode ? 'update' : 'create'} product`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isEditMode && isLoadingProduct) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold text-warm-900 mb-8">
        {isEditMode ? 'Edit Product' : 'Add Product'}
      </h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-xl p-6 shadow-soft">
              <h2 className="font-semibold text-warm-900 mb-4">Basic Information</h2>
              <div className="space-y-4">
                <Input
                  label="Product Name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
                <Input
                  label="Slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  helperText="URL-friendly identifier"
                />
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Photos */}
            <div className="bg-white rounded-xl p-6 shadow-soft">
              <h2 className="font-semibold text-warm-900 mb-4">Photos</h2>
              <ImageUpload images={images} onChange={setImages} maxImages={6} />
            </div>

            {/* Sizes & Pricing */}
            <div className="bg-white rounded-xl p-6 shadow-soft">
              <h2 className="font-semibold text-warm-900 mb-1">Sizes & Pricing</h2>
              <p className="text-sm text-warm-500 mb-5">Enable the sizes you offer. The default size is shown first on the product page.</p>
              <div className="space-y-3">
                {SIZE_DEFS.map((s) => {
                  const entry = sizes[s.key]
                  return (
                    <div
                      key={s.key}
                      className={`rounded-xl border-2 transition-colors ${
                        entry.enabled ? 'border-amber-300 bg-amber-50/40' : 'border-warm-200 bg-warm-50/30'
                      }`}
                    >
                      {/* Size header row */}
                      <div className="flex items-center gap-3 px-4 py-3">
                        <input
                          type="checkbox"
                          id={`size-${s.key}`}
                          checked={entry.enabled}
                          onChange={(e) => updateSize(s.key, 'enabled', e.target.checked)}
                          className="rounded border-warm-300 text-amber-600 focus:ring-amber-500"
                        />
                        <label htmlFor={`size-${s.key}`} className="flex-1 cursor-pointer">
                          <span className="font-medium text-warm-900">{s.label}</span>
                          <span className="ml-2 text-sm text-warm-400">{s.weight}</span>
                        </label>
                        {entry.enabled && (
                          <button
                            type="button"
                            onClick={() => setDefaultSize(s.key)}
                            className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                              entry.isDefault
                                ? 'bg-amber-500 text-white'
                                : 'bg-warm-200 text-warm-600 hover:bg-amber-100 hover:text-amber-700'
                            }`}
                          >
                            {entry.isDefault ? 'Default' : 'Set default'}
                          </button>
                        )}
                      </div>

                      {/* Price & stock row */}
                      {entry.enabled && (
                        <div className="grid grid-cols-2 gap-4 px-4 pb-4">
                          <div>
                            <label className="block text-xs font-medium text-warm-600 mb-1">Price (₹)</label>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              placeholder="e.g. 349"
                              value={entry.price}
                              onChange={(e) => updateSize(s.key, 'price', e.target.value)}
                              required={entry.enabled}
                              className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-warm-600 mb-1">Stock (units)</label>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              placeholder="e.g. 50"
                              value={entry.quantity}
                              onChange={(e) => updateSize(s.key, 'quantity', e.target.value)}
                              required={entry.enabled}
                              className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white rounded-xl p-6 shadow-soft">
              <h2 className="font-semibold text-warm-900 mb-4">Status</h2>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'active', label: 'Active' },
                  { value: 'archived', label: 'Archived' },
                ]}
              />
            </div>

            {/* Categories */}
            <div className="bg-white rounded-xl p-6 shadow-soft">
              <h2 className="font-semibold text-warm-900 mb-1">Categories</h2>
              {selectedCategories.length > 0 && (
                <p className="text-xs text-amber-700 mb-3">{selectedCategories.length} selected</p>
              )}
              <CategoryGroupSelector
                categories={categories}
                selectedIds={selectedCategories}
                onChange={setSelectedCategories}
              />
            </div>

            {/* Submit */}
            <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
              {isEditMode ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
