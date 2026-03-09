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
import type { ProductVariant, ProductBase, Fragrance, Color, Packaging, Customisation } from '../../types'

const statusColors: Record<string, 'default' | 'success' | 'warning'> = {
  draft: 'default',
  active: 'success',
  archived: 'warning',
}

export function AdminProductList() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const { products, isLoading, pagination, refresh } = useProducts({ page, limit: 10, search: debouncedSearch || undefined })

  useEffect(() => {
    if (!isLoading) setHasLoaded(true)
  }, [isLoading])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      await api.deleteProduct(id)
      refresh()
    } catch (err) {
      alert('Failed to delete product')
    }
  }

  if (isLoading && !hasLoaded) {
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

interface CategoryGroupSelectorProps {
  categories: { id: string; name: string; slug: string; parentId?: string | null }[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

function CategoryGroupSelector({ categories, selectedIds, onChange }: CategoryGroupSelectorProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  const toggleGroup = (id: string) =>
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }))

  const toggle = (id: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedIds, id])
    } else {
      onChange(selectedIds.filter((s) => s !== id))
    }
  }

  // Build tree dynamically from flat category list
  const groups = categories.filter((c) => !c.parentId)
  const childrenOf = (parentId: string) => categories.filter((c) => c.parentId === parentId)

  return (
    <div className="space-y-1 mt-2">
      {groups.map((group) => {
        const groupCats = childrenOf(group.id)
        if (groupCats.length === 0) {
          // Leaf group (e.g. Featured) — direct checkbox
          return (
            <label key={group.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-warm-50 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.includes(group.id)}
                onChange={(e) => toggle(group.id, e.target.checked)}
                className="rounded border-warm-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-xs font-bold tracking-wider uppercase text-warm-500">{group.name}</span>
            </label>
          )
        }

        const isOpen = !!openGroups[group.id]
        const selectedCount = groupCats.filter((c) => selectedIds.includes(c.id)).length

        return (
          <div key={group.id}>
            <button
              type="button"
              onClick={() => toggleGroup(group.id)}
              className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase text-warm-500 hover:text-warm-800 hover:bg-warm-50 transition-colors"
            >
              <span className="flex items-center gap-2">
                {group.name}
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
  hideMode?: boolean
}

function MultiSelectChips({ label, all, selected, onChange, placeholder, mode, onModeChange, hideMode }: MultiSelectChipsProps) {
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
      {!hideMode && (
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
      )}

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
  const [packagingList, setPackagingList] = useState<Packaging[]>([])
  const [customisationsList, setCustomisationsList] = useState<Customisation[]>([])

  // Multi-base: array of selected bases + per-base size maps (keyed by base name)
  const [selectedBases, setSelectedBases] = useState<ProductBase[]>([])
  const [baseSizeMaps, setBaseSizeMaps] = useState<Record<string, Record<string, SizeEntry>>>({})
  const [pendingBaseNames, setPendingBaseNames] = useState<string[]>([])

  const [selectedFragrances, setSelectedFragrances] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedPackaging, setSelectedPackaging] = useState<string[]>([])
  const [packagingPrices, setPackagingPrices] = useState<Record<string, string>>({})
  const [packagingMrp, setPackagingMrp] = useState<Record<string, string>>({})
  const [packagingStock, setPackagingStock] = useState<Record<string, string>>({})
  const [baseMode, setBaseMode] = useState<SelectionMode>('single')
  const [fragranceMode, setFragranceMode] = useState<SelectionMode>('none')
  const [colorMode, setColorMode] = useState<SelectionMode>('none')
  const [packagingMode, setPackagingMode] = useState<SelectionMode>('none')
  const [selectedCustomisations, setSelectedCustomisations] = useState<string[]>([])
  const [customisationPrices, setCustomisationPrices] = useState<Record<string, string>>({})
  const [customisationMode, setCustomisationMode] = useState<SelectionMode>('none')

  // Load catalog data — use allSettled so one failure doesn't wipe the rest
  useEffect(() => {
    Promise.allSettled([api.getBases(), api.getFragrances(), api.getColors(), api.getPackaging(), api.getCustomisations()]).then(
      ([b, f, c, p, cu]) => {
        if (b.status === 'fulfilled' && b.value.success) setBases(b.value.data)
        if (f.status === 'fulfilled' && f.value.success) setFragrances(f.value.data)
        if (c.status === 'fulfilled' && c.value.success) setColors(c.value.data)
        if (p.status === 'fulfilled' && p.value.success) setPackagingList(p.value.data)
        if (cu.status === 'fulfilled' && cu.value.success) setCustomisationsList(cu.value.data)
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

      const meta = product.metadata as {
        fragrances?: string[]
        colors?: string[]
        packaging?: string[]
        packagingPrices?: Record<string, string>
        baseMode?: SelectionMode
        fragranceMode?: SelectionMode
        colorMode?: SelectionMode
        packagingMode?: SelectionMode
        customisations?: string[]
        customisationPrices?: Record<string, string>
        customisationMode?: SelectionMode
      } | undefined
      setSelectedFragrances(meta?.fragrances || [])
      setSelectedColors(meta?.colors || [])
      setBaseMode(meta?.baseMode || 'single')
      setFragranceMode(meta?.fragranceMode || 'none')
      setColorMode(meta?.colorMode || 'none')
      setPackagingMode(meta?.packagingMode || 'none')
      setCustomisationMode(meta?.customisationMode || 'none')
      setSelectedCustomisations(meta?.customisations || [])
      setCustomisationPrices(meta?.customisationPrices || {})

      // Detect Case 2 (packaging-only): variants have options.packaging but no options.base
      const isPackagingOnly = product.variants.length > 0 &&
        product.variants.every((v) => v.options?.packaging && !v.options?.base)

      if (isPackagingOnly) {
        // Restore packaging names, prices, mrp, stock from variants
        const pkgNames: string[] = []
        const prices: Record<string, string> = {}
        const mrps: Record<string, string> = {}
        const stock: Record<string, string> = {}
        for (const v of product.variants) {
          const name = v.options?.packaging
          if (name) {
            pkgNames.push(name)
            prices[name] = String(v.price)
            mrps[name] = v.comparePrice ? String(v.comparePrice) : ''
            stock[name] = String(v.quantity)
          }
        }
        setSelectedPackaging(pkgNames)
        setPackagingPrices(prices)
        setPackagingMrp(mrps)
        setPackagingStock(stock)
      } else {
        // Case 1 or base-only: packaging from metadata
        setSelectedPackaging(meta?.packaging || [])
        setPackagingPrices(meta?.packagingPrices || {})
      }

      if (!isPackagingOnly && product.variants.length > 0) {
        // Get unique base names from variants
        const baseNames = [...new Set(
          product.variants.map((v) => v.options?.base).filter(Boolean) as string[]
        )]
        // Build per-base size maps (keyed by base name)
        const maps: Record<string, Record<string, SizeEntry>> = {}
        for (const baseName of baseNames) {
          const baseVariants = product.variants.filter((v) => v.options?.base === baseName)
          maps[baseName] = variantsToSizeMap(baseVariants)
        }
        setBaseSizeMaps(maps)
        // Resolve selectedBases once bases catalog loads
        setPendingBaseNames(baseNames)
      }
    }
  }, [isEditMode, product])

  // When bases catalog loads, resolve pendingBaseNames → selectedBases
  useEffect(() => {
    if (bases.length > 0 && pendingBaseNames.length > 0) {
      const resolved = pendingBaseNames
        .map((name) => bases.find((b) => b.name === name))
        .filter(Boolean) as ProductBase[]
      if (resolved.length > 0) {
        setSelectedBases(resolved)
        setPendingBaseNames([])
      }
    }
  }, [bases, pendingBaseNames])

  const handleBaseToggle = (base: ProductBase) => {
    const isSelected = selectedBases.some((b) => b.id === base.id)
    if (isSelected) {
      setSelectedBases((prev) => prev.filter((b) => b.id !== base.id))
      setBaseSizeMaps((prev) => {
        const next = { ...prev }
        delete next[base.name]
        return next
      })
    } else {
      setSelectedBases((prev) => [...prev, base])
      setBaseSizeMaps((prev) => ({ ...prev, [base.name]: buildDefaultSizeMap(base.sizes) }))
    }
  }

  const handleNameChange = (value: string) => {
    setName(value)
    setSlug(value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
  }

  const updateSize = (baseName: string, size: string, field: keyof SizeEntry, value: string | boolean) => {
    setBaseSizeMaps((prev) => ({
      ...prev,
      [baseName]: { ...prev[baseName], [size]: { ...prev[baseName]?.[size], [field]: value } },
    }))
  }

  const setDefaultSize = (baseName: string, size: string) => {
    setBaseSizeMaps((prev) => {
      const map = { ...prev[baseName] }
      Object.keys(map).forEach((k) => { map[k] = { ...map[k], isDefault: k === size } })
      return { ...prev, [baseName]: map }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)
    setError('')

    try {
      // Case 2: no base selected → packaging options generate variants
      const isPackagingOnly = selectedBases.length === 0 && selectedPackaging.length > 0
      const newVariants = isPackagingOnly
        ? selectedPackaging.map((name, i) => ({
            name,
            sku: `${slug.toUpperCase().replace(/-/g, '_')}_${name.toUpperCase().replace(/\s+/g, '_')}`,
            price: parseFloat(packagingPrices[name]) || 0,
            comparePrice: packagingMrp[name] ? parseFloat(packagingMrp[name]) : undefined,
            quantity: parseInt(packagingStock[name]) || 0,
            isDefault: i === 0,
            options: { packaging: name },
          }))
        : selectedBases.flatMap((base) =>
            sizesToVariants(baseSizeMaps[base.name] || {}, base.name, slug)
          )

      // Case 1: store packaging add-on prices in metadata
      const metadata = {
        fragrances: selectedFragrances,
        colors: selectedColors,
        packaging: isPackagingOnly ? undefined : selectedPackaging,
        packagingPrices: !isPackagingOnly && selectedPackaging.length > 0 ? packagingPrices : undefined,
        baseMode,
        fragranceMode,
        colorMode,
        packagingMode,
        customisations: selectedCustomisations.length > 0 ? selectedCustomisations : undefined,
        customisationPrices: selectedCustomisations.length > 0 ? customisationPrices : undefined,
        customisationMode,
      }

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

  const totalEnabledSizeCount = selectedBases.reduce(
    (sum, base) => sum + Object.values(baseSizeMaps[base.name] || {}).filter((e) => e.enabled).length,
    0
  )

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
              <h2 className="font-semibold text-warm-900 mb-1">Bases & Sizes</h2>
              <p className="text-sm text-warm-500 mb-5">
                Select one or more bases (e.g. Jar, Bowl, Tealight). Configure sizes for each selected base.
                {bases.length === 0 && (
                  <span className="ml-1 text-amber-600">
                    No bases configured —{' '}
                    <Link to="/admin/catalog" className="underline">go to Catalog</Link> to add them.
                  </span>
                )}
              </p>

              {/* Base selection mode */}
              <div className="flex gap-3 mb-5">
                {(['none', 'single', 'multi'] as SelectionMode[]).map((m) => (
                  <label key={m} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="base-mode"
                      value={m}
                      checked={baseMode === m}
                      onChange={() => setBaseMode(m)}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-xs text-warm-600 capitalize">
                      {m === 'none' ? 'Display only' : m === 'single' ? 'Single select' : 'Multi select'}
                    </span>
                  </label>
                ))}
              </div>

              {/* Base multi-select checkboxes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-warm-700 mb-2">Bases</label>
                {bases.length === 0 ? (
                  <p className="text-sm text-warm-400 italic">No bases available.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {bases.map((base) => {
                      const isSelected = selectedBases.some((b) => b.id === base.id)
                      return (
                        <button
                          key={base.id}
                          type="button"
                          onClick={() => handleBaseToggle(base)}
                          className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-colors ${
                            isSelected
                              ? 'border-amber-500 bg-amber-50 text-amber-800'
                              : 'border-warm-200 bg-white text-warm-600 hover:border-warm-300'
                          }`}
                        >
                          {base.name}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Size entries per selected base */}
              {selectedBases.map((base) => {
                const sizeMap = baseSizeMaps[base.name] || {}
                const enabledCount = Object.values(sizeMap).filter((e) => e.enabled).length
                return (
                  <div key={base.id} className="mb-6 last:mb-0">
                    <p className="text-xs font-semibold text-warm-500 uppercase tracking-wider mb-3">
                      Sizes for {base.name}
                      {enabledCount > 0 && (
                        <span className="ml-2 text-amber-600 normal-case tracking-normal font-medium">
                          {enabledCount} enabled
                        </span>
                      )}
                    </p>
                    <div className="space-y-3">
                      {(base.sizes || Object.keys(sizeMap)).map((size) => {
                        const entry = sizeMap[size]
                        if (!entry) return null
                        return (
                          <div
                            key={size}
                            className={`rounded-xl border-2 transition-colors ${
                              entry.enabled ? 'border-amber-300 bg-amber-50/40' : 'border-warm-200 bg-warm-50/30'
                            }`}
                          >
                            <div className="flex items-center gap-3 px-4 py-3">
                              <input
                                type="checkbox"
                                id={`size-${base.name}-${size}`}
                                checked={entry.enabled}
                                onChange={(e) => updateSize(base.name, size, 'enabled', e.target.checked)}
                                className="rounded border-warm-300 text-amber-600 focus:ring-amber-500"
                              />
                              <label htmlFor={`size-${base.name}-${size}`} className="flex-1 cursor-pointer">
                                <span className="font-medium text-warm-900">{size}</span>
                              </label>
                              {entry.enabled && (
                                <button
                                  type="button"
                                  onClick={() => setDefaultSize(base.name, size)}
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
                                    onChange={(e) => updateSize(base.name, size, 'mrp', e.target.value)}
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
                                    onChange={(e) => updateSize(base.name, size, 'price', e.target.value)}
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
                                    onChange={(e) => updateSize(base.name, size, 'quantity', e.target.value)}
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
                )
              })}

              {selectedBases.length === 0 && bases.length > 0 && (
                <p className="text-sm text-warm-400 italic mt-2">Optionally select a base to configure sizes and variants.</p>
              )}

              {totalEnabledSizeCount > 0 && (
                <p className="text-xs text-amber-700 mt-4 font-medium">
                  {totalEnabledSizeCount} size variant{totalEnabledSizeCount > 1 ? 's' : ''} will be created
                </p>
              )}
            </div>

            {/* Packaging */}
            <div className="bg-white rounded-xl p-6 shadow-soft">
              <h2 className="font-semibold text-warm-900 mb-1">Packaging</h2>
              <p className="text-sm text-warm-500 mb-4">
                {selectedBases.length === 0
                  ? 'No base selected — each packaging option becomes a purchasable variant with its own price and stock.'
                  : 'Optional add-on packaging for this product. Set the extra cost per packaging type.'}
              </p>
              <MultiSelectChips
                label="Available Packaging"
                all={packagingList}
                selected={selectedPackaging}
                onChange={setSelectedPackaging}
                placeholder="No packaging added yet. Go to Catalog to add them."
                mode={packagingMode}
                onModeChange={setPackagingMode}
              />

              {/* Price / stock fields per selected packaging */}
              {selectedPackaging.length > 0 && (
                <div className="mt-5 space-y-3">
                  <p className="text-xs font-semibold text-warm-500 uppercase tracking-wider">
                    {selectedBases.length === 0 ? 'Pricing & Stock per Packaging' : 'Add-on Price per Packaging'}
                  </p>
                  {selectedPackaging.map((name) => (
                    <div key={name} className="rounded-xl border-2 border-warm-200 px-4 py-3">
                      <span className="text-sm font-semibold text-warm-900 block mb-2">{name}</span>
                      {selectedBases.length === 0 ? (
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-warm-600 mb-1">
                              MRP (₹) <span className="text-warm-400 font-normal">(optional)</span>
                            </label>
                            <input
                              type="number" min="0" step="1" placeholder="e.g. 499"
                              value={packagingMrp[name] || ''}
                              onChange={(e) => setPackagingMrp((prev) => ({ ...prev, [name]: e.target.value }))}
                              className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-warm-600 mb-1">Selling Price (₹)</label>
                            <input
                              type="number" min="0" step="1" placeholder="e.g. 349"
                              value={packagingPrices[name] || ''}
                              onChange={(e) => setPackagingPrices((prev) => ({ ...prev, [name]: e.target.value }))}
                              className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-warm-600 mb-1">Stock (units)</label>
                            <input
                              type="number" min="0" step="1" placeholder="e.g. 50"
                              value={packagingStock[name] || ''}
                              onChange={(e) => setPackagingStock((prev) => ({ ...prev, [name]: e.target.value }))}
                              className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-medium text-warm-600 whitespace-nowrap">Add-on (₹)</label>
                          <input
                            type="number" min="0" step="1" placeholder="e.g. 50"
                            value={packagingPrices[name] || ''}
                            onChange={(e) => setPackagingPrices((prev) => ({ ...prev, [name]: e.target.value }))}
                            className="w-28 px-3 py-1.5 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Customisations */}
            <div className="bg-white rounded-xl p-6 shadow-soft">
              <h2 className="font-semibold text-warm-900 mb-1">Customisations</h2>
              <p className="text-sm text-warm-500 mb-4">Optional add-ons the customer can select (e.g. sticker, card). Set the extra cost per option. Manage available options in Catalog.</p>
              <MultiSelectChips
                label="Available Customisations"
                all={customisationsList}
                selected={selectedCustomisations}
                onChange={setSelectedCustomisations}
                placeholder="No customisations added yet. Go to Catalog to add them."
                mode={customisationMode}
                onModeChange={setCustomisationMode}
              />
              {selectedCustomisations.length > 0 && (
                <div className="mt-5 space-y-3">
                  <p className="text-xs font-semibold text-warm-500 uppercase tracking-wider">Add-on Price per Customisation</p>
                  {selectedCustomisations.map((name) => (
                    <div key={name} className="rounded-xl border-2 border-warm-200 px-4 py-3">
                      <span className="text-sm font-semibold text-warm-900 block mb-2">{name}</span>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-warm-600 whitespace-nowrap">Add-on (₹)</label>
                        <input
                          type="number" min="0" step="1" placeholder="e.g. 50"
                          value={customisationPrices[name] || ''}
                          onChange={(e) => setCustomisationPrices((prev) => ({ ...prev, [name]: e.target.value }))}
                          className="w-28 px-3 py-1.5 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  ))}
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
