import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { PencilIcon, TrashIcon, PlusIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useProducts, useProduct, useCategories } from '../../hooks/useProducts'
import { api } from '../../services/api'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import ImageUpload from '../../components/admin/ImageUpload'
import type { ProductVariant, ProductBase, Fragrance, Color } from '../../types'

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

// ─── Category Selector ────────────────────────────────────────────────────────

const CATEGORY_GROUPS = [
  { label: 'Shop', slugs: ['jar-candles', 'scented-sachets', 'tealights', 'gift-boxes', 'custom-name-candles'] },
  { label: 'Occasions', slugs: ['birthdays', 'baby-showers', 'anniversaries', 'housewarming', 'festivals', 'return-favors'] },
  { label: 'Wedding & Events', slugs: ['wedding-favors', 'mehendi-haldi', 'bridal-shower', 'save-the-date', 'luxury-hampers', 'bulk-events'] },
  { label: 'Corporate', slugs: ['corporate', 'client-gifts', 'welcome-kits', 'festive-hampers', 'brand-candles'] },
  { label: 'Featured', slugs: ['featured'] },
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

        // Single-item group (e.g. Featured) — direct checkbox, no accordion
        if (groupCats.length === 1) {
          const cat = groupCats[0]
          return (
            <label key={group.label} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-warm-50 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.includes(cat.id)}
                onChange={(e) => toggle(cat.id, e.target.checked)}
                className="rounded border-warm-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-xs font-bold tracking-wider uppercase text-warm-500">{group.label}</span>
            </label>
          )
        }

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

// ─── Multi-Select Chips ────────────────────────────────────────────────────────

interface MultiSelectChipsProps {
  label: string
  all: { id: string; name: string; hex?: string }[]
  selected: string[]
  onChange: (names: string[]) => void
  placeholder?: string
}

type SelectionMode = 'none' | 'single' | 'multi'

interface MultiSelectChipsProps {
  label: string
  all: { id: string; name: string; hex?: string }[]
  selected: string[]
  onChange: (names: string[]) => void
  placeholder?: string
  mode: SelectionMode
  onModeChange: (mode: SelectionMode) => void
}

function MultiSelectChips({ label, all, selected, onChange, placeholder, mode, onModeChange }: MultiSelectChipsProps) {
  const toggle = (name: string) => {
    if (selected.includes(name)) {
      onChange(selected.filter((s) => s !== name))
    } else {
      onChange([...selected, name])
    }
  }

  const allSelected = all.length > 0 && selected.length === all.length
  const toggleAll = () => {
    onChange(allSelected ? [] : all.map((item) => item.name))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-warm-700">{label}</label>
        {all.length > 0 && (
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs text-amber-600 hover:text-amber-700 font-medium"
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>

      {/* Selection mode */}
      <div className="flex gap-3 mb-3">
        {(['none', 'single', 'multi'] as SelectionMode[]).map((m) => (
          <label key={m} className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name={`${label}-mode`}
              value={m}
              checked={mode === m}
              onChange={() => onModeChange(m)}
              className="text-amber-600 focus:ring-amber-500"
            />
            <span className="text-xs text-warm-600 capitalize">
              {m === 'none' ? 'Display only' : m === 'single' ? 'Single select' : 'Multi select'}
            </span>
          </label>
        ))}
      </div>

      {all.length === 0 ? (
        <p className="text-sm text-warm-400 italic">
          {placeholder || `No ${label.toLowerCase()} added yet. Go to Catalog to add them.`}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {all.map((item) => {
            const isSelected = selected.includes(item.name)
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggle(item.name)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-colors ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50 text-amber-800'
                    : 'border-warm-200 bg-white text-warm-600 hover:border-warm-300'
                }`}
              >
                {item.hex && (
                  <span
                    className="w-3 h-3 rounded-full border border-warm-300 flex-shrink-0"
                    style={{ background: item.hex }}
                  />
                )}
                {item.name}
                {isSelected && <XMarkIcon className="w-3.5 h-3.5 ml-0.5 text-amber-600" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Variant entry per size ───────────────────────────────────────────────────

interface SizeEntry {
  enabled: boolean
  mrp: string
  price: string
  quantity: string
  isDefault: boolean
}

function buildDefaultSizeMap(sizes: string[]): Record<string, SizeEntry> {
  const map: Record<string, SizeEntry> = {}
  sizes.forEach((size, i) => {
    map[size] = { enabled: i === 0, mrp: '', price: '', quantity: '', isDefault: i === 0 }
  })
  return map
}

function sizesToVariants(
  sizeMap: Record<string, SizeEntry>,
  base: string,
  slug: string
) {
  return Object.entries(sizeMap)
    .filter(([, entry]) => entry.enabled)
    .map(([size, entry]) => ({
      name: `${base} - ${size}`,
      sku: `${slug.toUpperCase().replace(/-/g, '_')}_${base.toUpperCase().replace(/\s+/g, '_')}_${size.toUpperCase().replace(/\s+/g, '_')}`,
      price: parseFloat(entry.price) || 0,
      comparePrice: entry.mrp ? parseFloat(entry.mrp) : undefined,
      quantity: parseInt(entry.quantity) || 0,
      isDefault: entry.isDefault,
      options: { base, size },
    }))
}

function variantsToSizeMap(variants: ProductVariant[]): Record<string, SizeEntry> {
  const map: Record<string, SizeEntry> = {}
  for (const v of variants) {
    const size = v.options?.size
    if (!size) continue
    map[size] = {
      enabled: true,
      mrp: v.comparePrice ? String(v.comparePrice) : '',
      price: String(v.price),
      quantity: String(v.quantity),
      isDefault: v.isDefault,
    }
  }
  return map
}

// ─── Admin Product Form ───────────────────────────────────────────────────────

export function AdminProductForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditMode = Boolean(id)

  const { categories } = useCategories()
  const { product, isLoading: isLoadingProduct } = useProduct(id || '')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Basic info
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('active')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [images, setImages] = useState<string[]>([])

  // Catalog selections
  const [bases, setBases] = useState<ProductBase[]>([])
  const [fragrances, setFragrances] = useState<Fragrance[]>([])
  const [colors, setColors] = useState<Color[]>([])

  const [selectedBase, setSelectedBase] = useState<ProductBase | null>(null)
  const [sizeMap, setSizeMap] = useState<Record<string, SizeEntry>>({})
  const [selectedFragrances, setSelectedFragrances] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [fragranceMode, setFragranceMode] = useState<SelectionMode>('none')
  const [colorMode, setColorMode] = useState<SelectionMode>('none')

  // Load catalog data
  useEffect(() => {
    Promise.all([api.getBases(), api.getFragrances(), api.getColors()]).then(
      ([b, f, c]) => {
        if (b.success) setBases(b.data)
        if (f.success) setFragrances(f.data)
        if (c.success) setColors(c.data)
      }
    )
  }, [])

  // Populate form when editing
  useEffect(() => {
    if (isEditMode && product) {
      setName(product.name)
      setSlug(product.slug)
      setDescription(product.description || '')
      setStatus(product.status)
      const catIds = product.categories?.map((c) => c.category.id) || []
      setSelectedCategories(catIds)
      setImages(product.images?.map((img) => img.url) || [])

      const meta = product.metadata as { fragrances?: string[]; colors?: string[]; fragranceMode?: SelectionMode; colorMode?: SelectionMode } | undefined
      setSelectedFragrances(meta?.fragrances || [])
      setSelectedColors(meta?.colors || [])
      setFragranceMode(meta?.fragranceMode || 'none')
      setColorMode(meta?.colorMode || 'none')

      if (product.variants.length > 0) {
        // Restore base from first variant options
        const firstBase = product.variants[0]?.options?.base
        setSizeMap(variantsToSizeMap(product.variants))
        // selectedBase will be resolved once bases load
        if (firstBase) {
          setBases((prev) => {
            const found = prev.find((b) => b.name === firstBase)
            if (found) setSelectedBase(found)
            return prev
          })
          // Also set after bases load via an additional effect
          setSelectedBase({ id: '', name: firstBase, sizes: product.variants.map((v) => v.options?.size || '') })
        }
      }
    }
  }, [isEditMode, product])

  // When bases load, resolve the selectedBase name
  useEffect(() => {
    if (bases.length > 0 && selectedBase) {
      const found = bases.find((b) => b.name === selectedBase.name)
      if (found) setSelectedBase(found)
    }
  }, [bases])

  const handleBaseChange = (baseId: string) => {
    const base = bases.find((b) => b.id === baseId) || null
    setSelectedBase(base)
    if (base) {
      setSizeMap(buildDefaultSizeMap(base.sizes))
    } else {
      setSizeMap({})
    }
  }

  const handleNameChange = (value: string) => {
    setName(value)
    setSlug(value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
  }

  const updateSize = (size: string, field: keyof SizeEntry, value: string | boolean) => {
    setSizeMap((prev) => ({ ...prev, [size]: { ...prev[size], [field]: value } }))
  }

  const setDefaultSize = (size: string) => {
    setSizeMap((prev) => {
      const next = { ...prev }
      Object.keys(next).forEach((k) => {
        next[k] = { ...next[k], isDefault: k === size }
      })
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedBase) {
      setError('Please select a base (e.g. Jar, Bowl, Tealight).')
      return
    }

    const enabledSizes = Object.entries(sizeMap).filter(([, e]) => e.enabled)
    if (enabledSizes.length === 0) {
      setError('Please enable at least one size.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const newVariants = sizesToVariants(sizeMap, selectedBase.name, slug)
      const metadata = { fragrances: selectedFragrances, colors: selectedColors, fragranceMode, colorMode }

      if (isEditMode && id) {
        await api.updateProduct(id, {
          name,
          slug,
          description,
          status: status as 'draft' | 'active' | 'archived',
          categoryIds: selectedCategories,
          metadata,
        } as any)

        await api.syncProductImages(id, images)

        const existingVariants = product?.variants || []
        for (const v of newVariants) {
          const existing = existingVariants.find((ev) => ev.sku === v.sku)
          if (existing) {
            await api.updateVariant(id, existing.id, {
              price: v.price,
              comparePrice: v.comparePrice,
              quantity: v.quantity,
              isDefault: v.isDefault,
              name: v.name,
            })
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
        // Create product WITHOUT images first — image URLs are relative paths
        // that fail the core API's z.string().url() validation.
        // We sync images separately via the custom /images/sync endpoint.
        const created = await api.createProduct({
          name,
          slug,
          description,
          status: status as 'draft' | 'active' | 'archived',
          metadata,
          variants: newVariants,
          categoryIds: selectedCategories,
        } as any)

        if (images.length > 0) {
          await api.syncProductImages(created.data.id, images)
        }
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

  const enabledSizeCount = Object.values(sizeMap).filter((e) => e.enabled).length

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

            {/* Fragrances */}
            <div className="bg-white rounded-xl p-6 shadow-soft">
              <h2 className="font-semibold text-warm-900 mb-1">Fragrances</h2>
              <p className="text-sm text-warm-500 mb-4">Select fragrances available for this product and how customers choose them.</p>
              <MultiSelectChips
                label="Available Fragrances"
                all={fragrances}
                selected={selectedFragrances}
                onChange={setSelectedFragrances}
                placeholder="No fragrances added yet. Go to Catalog to add them."
                mode={fragranceMode}
                onModeChange={setFragranceMode}
              />
            </div>

            {/* Colors */}
            <div className="bg-white rounded-xl p-6 shadow-soft">
              <h2 className="font-semibold text-warm-900 mb-1">Colors</h2>
              <p className="text-sm text-warm-500 mb-4">Select colors available for this product and how customers choose them.</p>
              <MultiSelectChips
                label="Available Colors"
                all={colors}
                selected={selectedColors}
                onChange={setSelectedColors}
                placeholder="No colors added yet. Go to Catalog to add them."
                mode={colorMode}
                onModeChange={setColorMode}
              />
            </div>

            {/* Base & Sizes */}
            <div className="bg-white rounded-xl p-6 shadow-soft">
              <h2 className="font-semibold text-warm-900 mb-1">Base & Sizes</h2>
              <p className="text-sm text-warm-500 mb-5">
                Choose the product base (e.g. Jar, Bowl, Tealight). Available sizes will appear based on your selection.
                {bases.length === 0 && (
                  <span className="ml-1 text-amber-600">
                    No bases configured —{' '}
                    <Link to="/admin/catalog" className="underline">go to Catalog</Link> to add them.
                  </span>
                )}
              </p>

              {/* Base selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-warm-700 mb-1">Base *</label>
                <select
                  value={selectedBase?.id || ''}
                  onChange={(e) => handleBaseChange(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                >
                  <option value="">Select a base…</option>
                  {bases.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Size entries */}
              {selectedBase && Object.keys(sizeMap).length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-warm-500 uppercase tracking-wider">
                    Sizes for {selectedBase.name}
                    {enabledSizeCount > 0 && (
                      <span className="ml-2 text-amber-600 normal-case tracking-normal font-medium">
                        {enabledSizeCount} enabled
                      </span>
                    )}
                  </p>

                  {(selectedBase.sizes || Object.keys(sizeMap)).map((size) => {
                    const entry = sizeMap[size]
                    if (!entry) return null
                    return (
                      <div
                        key={size}
                        className={`rounded-xl border-2 transition-colors ${
                          entry.enabled ? 'border-amber-300 bg-amber-50/40' : 'border-warm-200 bg-warm-50/30'
                        }`}
                      >
                        {/* Size header row */}
                        <div className="flex items-center gap-3 px-4 py-3">
                          <input
                            type="checkbox"
                            id={`size-${size}`}
                            checked={entry.enabled}
                            onChange={(e) => updateSize(size, 'enabled', e.target.checked)}
                            className="rounded border-warm-300 text-amber-600 focus:ring-amber-500"
                          />
                          <label htmlFor={`size-${size}`} className="flex-1 cursor-pointer">
                            <span className="font-medium text-warm-900">{size}</span>
                          </label>
                          {entry.enabled && (
                            <button
                              type="button"
                              onClick={() => setDefaultSize(size)}
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

                        {/* MRP, Price & Stock */}
                        {entry.enabled && (
                          <div className="grid grid-cols-3 gap-3 px-4 pb-4">
                            <div>
                              <label className="block text-xs font-medium text-warm-600 mb-1">
                                MRP (₹)
                                <span className="ml-1 text-warm-400 font-normal">(optional)</span>
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                placeholder="e.g. 499"
                                value={entry.mrp}
                                onChange={(e) => updateSize(size, 'mrp', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-warm-600 mb-1">Selling Price (₹)</label>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                placeholder="e.g. 349"
                                value={entry.price}
                                onChange={(e) => updateSize(size, 'price', e.target.value)}
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
                                onChange={(e) => updateSize(size, 'quantity', e.target.value)}
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
              )}
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
