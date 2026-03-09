import { useState, useEffect } from 'react'
import { PlusIcon, TrashIcon, PencilIcon, XMarkIcon, CheckIcon, LinkIcon } from '@heroicons/react/24/outline'
import { api } from '../../services/api'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import type { ProductBase, Fragrance, Color, Packaging, Customisation, Product } from '../../types'

type Tab = 'bases' | 'fragrances' | 'colors' | 'packaging' | 'customisations'

// ─── Tag Products Modal ────────────────────────────────────────────────────────

interface TagProductsModalProps {
  itemName: string
  field: 'fragrances' | 'colors' | 'customisations'
  onClose: () => void
}

function TagProductsModal({ itemName, field, onClose }: TagProductsModalProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    api.getProducts({ limit: 100 }).then((res) => {
      if (res.success) setProducts(res.data)
      setIsLoading(false)
    })
  }, [])

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleSave = async () => {
    if (selected.size === 0) { onClose(); return }
    setIsSaving(true)
    try {
      await Promise.all(
        [...selected].map((id) => {
          const product = products.find((p) => p.id === id)
          if (!product) return Promise.resolve()
          const meta = (product.metadata as Record<string, unknown>) || {}
          const existing = (meta[field] as string[]) || []
          if (existing.includes(itemName)) return Promise.resolve()
          const extraMeta = field === 'customisations' && !meta.customisationMode
            ? { customisationMode: 'single' }
            : {}
          return api.updateProduct(id, { metadata: { ...meta, [field]: [...existing, itemName], ...extraMeta } } as any)
        })
      )
    } finally {
      setIsSaving(false)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-warm-100">
          <h2 className="font-semibold text-warm-900">Tag products with "{itemName}"</h2>
          <button onClick={onClose} className="p-1 text-warm-400 hover:text-warm-700">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-4">
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 mb-3"
          />
          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filtered.map((p) => {
                const meta = (p.metadata as Record<string, unknown>) || {}
                const alreadyTagged = ((meta[field] as string[]) || []).includes(itemName)
                return (
                  <label key={p.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-warm-50 ${alreadyTagged ? 'opacity-50' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selected.has(p.id) || alreadyTagged}
                      disabled={alreadyTagged}
                      onChange={() => toggle(p.id)}
                      className="rounded border-warm-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-sm text-warm-900">{p.name}</span>
                    {alreadyTagged && <span className="text-xs text-warm-400 ml-auto">already tagged</span>}
                  </label>
                )
              })}
              {filtered.length === 0 && <p className="text-sm text-warm-400 text-center py-4">No products found</p>}
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-warm-100">
          <Button variant="outline" size="sm" onClick={onClose} className="flex-1">Skip</Button>
          <Button size="sm" onClick={handleSave} isLoading={isSaving} className="flex-1">
            Tag {selected.size > 0 ? `${selected.size} product${selected.size > 1 ? 's' : ''}` : 'Selected'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Link Packaging Modal ─────────────────────────────────────────────────────

interface PackagingPricing {
  addonPrice: string   // for base products (add-on cost)
  price: string        // selling price for packaging-only products
  mrp: string          // MRP for packaging-only products
  stock: string        // stock for packaging-only products
}

function LinkPackagingModal({ packagingName, onClose }: { packagingName: string; onClose: () => void }) {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pricing, setPricing] = useState<Record<string, PackagingPricing>>({})
  const [search, setSearch] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchAll = async () => {
      let page = 1, all: Product[] = []
      while (true) {
        const res = await api.getProducts({ limit: 100, page })
        if (!res.success) break
        all = [...all, ...res.data]
        if (all.length >= res.meta.total) break
        page++
      }
      setProducts(all)
      setIsLoading(false)
    }
    fetchAll().catch(() => setIsLoading(false))
  }, [])

  // A product is "base type" if it has base variants OR has bases in metadata
  const isBaseProduct = (p: Product) =>
    p.variants.some((v) => v.options?.base) ||
    (((p.metadata as Record<string, unknown>)?.bases as string[] | undefined)?.length ?? 0) > 0

  const alreadyLinked = (p: Product) => {
    const meta = (p.metadata as Record<string, unknown>) || {}
    if (((meta.packaging || []) as string[]).includes(packagingName)) return true
    if (p.variants.some((v) => v.options?.packaging === packagingName)) return true
    return false
  }

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    if (!pricing[id]) {
      setPricing((prev) => ({ ...prev, [id]: { addonPrice: '', price: '', mrp: '', stock: '' } }))
    }
  }

  const setPrice = (productId: string, field: keyof PackagingPricing, value: string) => {
    setPricing((prev) => ({ ...prev, [productId]: { ...(prev[productId] || { addonPrice: '', price: '', mrp: '', stock: '' }), [field]: value } }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      for (const productId of [...selected]) {
        const product = products.find((p) => p.id === productId)!
        const meta = (product.metadata as Record<string, unknown>) || {}
        const p = pricing[productId] || { addonPrice: '', price: '', mrp: '', stock: '' }

        if (isBaseProduct(product)) {
          // Case 1: packaging is an add-on — merge into existing metadata
          const existingPkg = ((meta.packaging || []) as string[]).filter((n) => n !== packagingName)
          const existingPrices = (meta.packagingPrices || {}) as Record<string, string>
          await api.updateProduct(productId, {
            metadata: {
              ...meta,
              packaging: [...existingPkg, packagingName],
              // Store as string to match Products.tsx format
              packagingPrices: { ...existingPrices, [packagingName]: p.addonPrice || '0' },
            },
          } as Parameters<typeof api.updateProduct>[1])
        } else {
          // Case 2: packaging-only — add as a new variant alongside existing ones
          const slugBase = product.slug.toUpperCase().replace(/-/g, '_')
          const existingVariant = product.variants.find((v) => v.options?.packaging === packagingName)
          if (existingVariant) {
            // Update existing variant if somehow already linked (shouldn't reach here but safe)
            await api.updateVariant(productId, existingVariant.id, {
              price: parseFloat(p.price) || 0,
              comparePrice: p.mrp ? parseFloat(p.mrp) : undefined,
              quantity: parseInt(p.stock) || 0,
            })
          } else {
            await api.addVariant(productId, {
              name: packagingName,
              sku: `${slugBase}_${packagingName.toUpperCase().replace(/\s+/g, '_')}`,
              price: parseFloat(p.price) || 0,
              comparePrice: p.mrp ? parseFloat(p.mrp) : undefined,
              quantity: parseInt(p.stock) || 0,
              isDefault: product.variants.length === 0,
              options: { packaging: packagingName },
            })
          }
        }
      }
      onClose()
    } catch {
      alert('Some products could not be updated')
    } finally {
      setIsSaving(false)
    }
  }

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-warm-100">
          <div>
            <h2 className="font-semibold text-warm-900">Link "{packagingName}" to products</h2>
            <p className="text-xs text-warm-500 mt-0.5">Set prices per product type</p>
          </div>
          <button onClick={onClose} className="p-1 text-warm-400 hover:text-warm-700"><XMarkIcon className="h-5 w-5" /></button>
        </div>

        <div className="px-6 py-3 border-b border-warm-100">
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-3">
          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : (
            <div className="space-y-3">
              {filtered.map((product) => {
                const linked = alreadyLinked(product)
                const isSelected = selected.has(product.id)
                const hasBase = isBaseProduct(product)
                const p = pricing[product.id] || { addonPrice: '', price: '', mrp: '', stock: '' }

                return (
                  <div key={product.id} className={`rounded-xl border transition-colors ${
                    linked ? 'border-warm-100 opacity-50' : isSelected ? 'border-amber-300 bg-amber-50' : 'border-warm-200 hover:border-warm-300'
                  }`}>
                    <label className={`flex items-center gap-3 px-4 py-3 cursor-pointer ${linked ? 'cursor-not-allowed' : ''}`}>
                      <input
                        type="checkbox"
                        checked={isSelected || linked}
                        disabled={linked}
                        onChange={() => !linked && toggle(product.id)}
                        className="rounded border-warm-300 text-amber-600 focus:ring-amber-500 flex-shrink-0"
                      />
                      {product.images[0]?.url && (
                        <img src={product.images[0].url} alt={product.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-warm-900 truncate">{product.name}</p>
                        <p className="text-xs text-warm-400">{hasBase ? 'Has base — addon price' : 'Packaging-only — full variant'}</p>
                      </div>
                      {linked && <span className="text-xs text-amber-600 flex-shrink-0">Already linked</span>}
                    </label>

                    {isSelected && !linked && (
                      <div className="px-4 pb-3 pt-0">
                        {hasBase ? (
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-warm-600 whitespace-nowrap">Add-on price ₹</label>
                            <input
                              type="number"
                              placeholder="e.g. 50"
                              value={p.addonPrice}
                              onChange={(e) => setPrice(product.id, 'addonPrice', e.target.value)}
                              className="w-28 px-2 py-1.5 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-xs text-warm-500 mb-1 block">MRP ₹</label>
                              <input type="number" placeholder="0" value={p.mrp} onChange={(e) => setPrice(product.id, 'mrp', e.target.value)}
                                className="w-full px-2 py-1.5 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                            </div>
                            <div>
                              <label className="text-xs text-warm-500 mb-1 block">Selling ₹</label>
                              <input type="number" placeholder="0" value={p.price} onChange={(e) => setPrice(product.id, 'price', e.target.value)}
                                className="w-full px-2 py-1.5 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                            </div>
                            <div>
                              <label className="text-xs text-warm-500 mb-1 block">Stock</label>
                              <input type="number" placeholder="0" value={p.stock} onChange={(e) => setPrice(product.id, 'stock', e.target.value)}
                                className="w-full px-2 py-1.5 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
              {filtered.length === 0 && <p className="text-sm text-warm-400 text-center py-4">No products found</p>}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-warm-100">
          <Button variant="outline" size="sm" onClick={onClose} className="flex-1">Skip</Button>
          <Button size="sm" onClick={handleSave} isLoading={isSaving} className="flex-1" disabled={selected.size === 0}>
            Link {selected.size > 0 ? `${selected.size} product${selected.size > 1 ? 's' : ''}` : 'Selected'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Link Base Modal ──────────────────────────────────────────────────────────

interface SizePricing { mrp: string; price: string; stock: string }

function LinkBaseModal({ base, onClose }: { base: ProductBase; onClose: () => void }) {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sizing, setSizing] = useState<Record<string, Record<string, SizePricing>>>({})
  const [search, setSearch] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchAll = async () => {
      let page = 1, all: Product[] = []
      while (true) {
        const res = await api.getProducts({ limit: 100, page })
        if (!res.success) break
        all = [...all, ...res.data]
        if (all.length >= res.meta.total) break
        page++
      }
      setProducts(all)
      setIsLoading(false)
    }
    fetchAll().catch(() => setIsLoading(false))
  }, [])

  const alreadyLinked = (p: Product) =>
    p.variants.some((v) => v.options?.base === base.name)

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    if (!sizing[id]) {
      const empty: Record<string, SizePricing> = {}
      base.sizes.forEach((s) => { empty[s] = { mrp: '', price: '', stock: '' } })
      setSizing((prev) => ({ ...prev, [id]: empty }))
    }
  }

  const setField = (productId: string, size: string, field: keyof SizePricing, value: string) => {
    setSizing((prev) => ({
      ...prev,
      [productId]: { ...(prev[productId] || {}), [size]: { ...(prev[productId]?.[size] || { mrp: '', price: '', stock: '' }), [field]: value } },
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      for (const productId of [...selected]) {
        const product = products.find((p) => p.id === productId)!
        const productSizing = sizing[productId] || {}
        const slugBase = product.slug.toUpperCase().replace(/-/g, '_')
        const baseKey = base.name.toUpperCase().replace(/\s+/g, '_')

        for (let i = 0; i < base.sizes.length; i++) {
          const size = base.sizes[i]
          const s = productSizing[size] || { mrp: '', price: '', stock: '' }
          const sku = `${slugBase}_${baseKey}_${size.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '')}`
          const existingVariant = product.variants.find((v) => v.options?.base === base.name && v.options?.size === size)

          if (existingVariant) {
            await api.updateVariant(productId, existingVariant.id, {
              price: parseFloat(s.price) || 0,
              comparePrice: s.mrp ? parseFloat(s.mrp) : undefined,
              quantity: parseInt(s.stock) || 0,
            })
          } else {
            await api.addVariant(productId, {
              name: `${base.name} - ${size}`,
              sku,
              price: parseFloat(s.price) || 0,
              comparePrice: s.mrp ? parseFloat(s.mrp) : undefined,
              quantity: parseInt(s.stock) || 0,
              isDefault: i === 0 && product.variants.length === 0,
              options: { base: base.name, size },
            })
          }
        }

        // Update metadata to include this base
        const meta = (product.metadata as Record<string, unknown>) || {}
        const existingBases = (meta.bases as string[]) || []
        if (!existingBases.includes(base.name)) {
          await api.updateProduct(productId, {
            metadata: { ...meta, bases: [...existingBases, base.name] },
          } as Parameters<typeof api.updateProduct>[1])
        }
      }
      onClose()
    } catch {
      alert('Some products could not be updated')
    } finally {
      setIsSaving(false)
    }
  }

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-warm-100">
          <div>
            <h2 className="font-semibold text-warm-900">Link "{base.name}" base to products</h2>
            <p className="text-xs text-warm-500 mt-0.5">Set MRP, selling price & stock per size</p>
          </div>
          <button onClick={onClose} className="p-1 text-warm-400 hover:text-warm-700"><XMarkIcon className="h-5 w-5" /></button>
        </div>

        <div className="px-6 py-3 border-b border-warm-100">
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-3">
          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : (
            <div className="space-y-3">
              {filtered.map((product) => {
                const linked = alreadyLinked(product)
                const isSelected = selected.has(product.id)
                const productSizing = sizing[product.id] || {}

                return (
                  <div key={product.id} className={`rounded-xl border transition-colors ${
                    linked ? 'border-warm-100 opacity-50' : isSelected ? 'border-amber-300 bg-amber-50' : 'border-warm-200 hover:border-warm-300'
                  }`}>
                    <label className={`flex items-center gap-3 px-4 py-3 cursor-pointer ${linked ? 'cursor-not-allowed' : ''}`}>
                      <input
                        type="checkbox"
                        checked={isSelected || linked}
                        disabled={linked}
                        onChange={() => !linked && toggle(product.id)}
                        className="rounded border-warm-300 text-amber-600 focus:ring-amber-500 flex-shrink-0"
                      />
                      {product.images[0]?.url && (
                        <img src={product.images[0].url} alt={product.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-warm-900 truncate">{product.name}</p>
                        <p className="text-xs text-warm-400">{base.sizes.length} size{base.sizes.length > 1 ? 's' : ''}: {base.sizes.join(', ')}</p>
                      </div>
                      {linked && <span className="text-xs text-amber-600 flex-shrink-0">Already linked</span>}
                    </label>

                    {isSelected && !linked && (
                      <div className="px-4 pb-3 space-y-2">
                        {base.sizes.map((size) => {
                          const s = productSizing[size] || { mrp: '', price: '', stock: '' }
                          return (
                            <div key={size} className="grid grid-cols-4 gap-2 items-center">
                              <span className="text-xs font-medium text-warm-700 truncate">{size}</span>
                              <div>
                                <label className="text-xs text-warm-400 block mb-0.5">MRP ₹</label>
                                <input type="number" placeholder="0" value={s.mrp} onChange={(e) => setField(product.id, size, 'mrp', e.target.value)}
                                  className="w-full px-2 py-1.5 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                              </div>
                              <div>
                                <label className="text-xs text-warm-400 block mb-0.5">Selling ₹</label>
                                <input type="number" placeholder="0" value={s.price} onChange={(e) => setField(product.id, size, 'price', e.target.value)}
                                  className="w-full px-2 py-1.5 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                              </div>
                              <div>
                                <label className="text-xs text-warm-400 block mb-0.5">Stock</label>
                                <input type="number" placeholder="0" value={s.stock} onChange={(e) => setField(product.id, size, 'stock', e.target.value)}
                                  className="w-full px-2 py-1.5 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
              {filtered.length === 0 && <p className="text-sm text-warm-400 text-center py-4">No products found</p>}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-warm-100">
          <Button variant="outline" size="sm" onClick={onClose} className="flex-1">Skip</Button>
          <Button size="sm" onClick={handleSave} isLoading={isSaving} className="flex-1" disabled={selected.size === 0}>
            Link {selected.size > 0 ? `${selected.size} product${selected.size > 1 ? 's' : ''}` : 'Selected'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Base Management ──────────────────────────────────────────────────────────

function BasesPanel() {
  const [bases, setBases] = useState<ProductBase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [linkingBase, setLinkingBase] = useState<ProductBase | null>(null)

  // form state
  const [name, setName] = useState('')
  const [sizesText, setSizesText] = useState('') // comma-separated

  const [newName, setNewName] = useState('')
  const [newSizesText, setNewSizesText] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const load = async () => {
    setIsLoading(true)
    const res = await api.getBases()
    if (res.success) setBases(res.data)
    setIsLoading(false)
  }

  useEffect(() => { load() }, [])

  const startEdit = (base: ProductBase) => {
    setEditingId(base.id)
    setName(base.name)
    setSizesText(base.sizes.join(', '))
  }

  const cancelEdit = () => {
    setEditingId(null)
    setName('')
    setSizesText('')
  }

  const saveEdit = async () => {
    if (!editingId) return
    setIsSaving(true)
    try {
      const sizes = sizesText.split(',').map((s) => s.trim()).filter(Boolean)
      await api.updateBase(editingId, { name, sizes })
      setEditingId(null)
      await load()
    } catch {
      alert('Failed to update base')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAdd = async () => {
    const sizes = newSizesText.split(',').map((s) => s.trim()).filter(Boolean)
    if (!newName || sizes.length === 0) {
      alert('Provide a name and at least one size')
      return
    }
    setIsAdding(true)
    try {
      await api.createBase({ name: newName, sizes })
      setNewName('')
      setNewSizesText('')
      await load()
    } catch {
      alert('Failed to create base')
    } finally {
      setIsAdding(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete base "${name}"?`)) return
    try {
      await api.deleteBase(id)
      await load()
    } catch {
      alert('Failed to delete base')
    }
  }

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>

  return (
    <div className="space-y-6">
      {linkingBase && (
        <LinkBaseModal base={linkingBase} onClose={() => setLinkingBase(null)} />
      )}
      {/* Add new */}
      <div className="bg-white rounded-xl p-6 shadow-soft">
        <h3 className="font-semibold text-warm-900 mb-4">Add New Base</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">Base Name</label>
            <input
              type="text"
              placeholder="e.g. Jar, Bowl, Tealight"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-warm-700 mb-1">
              Sizes <span className="text-warm-400 font-normal">(comma-separated)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 60ml, 100ml, 200ml"
              value={newSizesText}
              onChange={(e) => setNewSizesText(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={handleAdd} isLoading={isAdding} size="sm">
            <PlusIcon className="h-4 w-4 mr-1.5" />
            Add Base
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-soft overflow-hidden">
        {bases.length === 0 ? (
          <div className="text-center py-12 text-warm-400">No bases added yet.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-warm-50 border-b border-warm-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-warm-700">Name</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-warm-700">Sizes</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-warm-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bases.map((base) => (
                <tr key={base.id} className="border-b border-warm-100 hover:bg-warm-50">
                  <td className="px-6 py-4">
                    {editingId === base.id ? (
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-amber-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 w-full max-w-[160px]"
                      />
                    ) : (
                      <span className="font-medium text-warm-900">{base.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === base.id ? (
                      <input
                        type="text"
                        value={sizesText}
                        onChange={(e) => setSizesText(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-amber-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 w-full"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {base.sizes.map((s) => (
                          <span key={s} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      {editingId === base.id ? (
                        <>
                          <button
                            onClick={saveEdit}
                            disabled={isSaving}
                            className="p-2 text-green-600 hover:text-green-700 transition-colors"
                          >
                            <CheckIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-2 text-warm-400 hover:text-warm-600 transition-colors"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setLinkingBase(base)}
                            className="p-2 text-warm-400 hover:text-amber-600 transition-colors"
                            title="Link to products"
                          >
                            <LinkIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => startEdit(base)}
                            className="p-2 text-warm-400 hover:text-amber-600 transition-colors"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(base.id, base.name)}
                            className="p-2 text-warm-400 hover:text-red-600 transition-colors"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─── Simple list panel (shared by Fragrances + Colors) ────────────────────────

interface SimpleItem { id: string; name: string; hex?: string }

interface SimpleListPanelProps {
  items: SimpleItem[]
  isLoading: boolean
  onAdd: (name: string, hex?: string) => Promise<void>
  onDelete: (id: string, name: string) => Promise<void>
  onLink: (name: string) => void
  namePlaceholder: string
  withHex?: boolean
  hideLink?: boolean
}

function SimpleListPanel({ items, isLoading, onAdd, onDelete, onLink, namePlaceholder, withHex, hideLink }: SimpleListPanelProps) {
  const [newName, setNewName] = useState('')
  const [newHex, setNewHex] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState('')

  const handleAdd = async () => {
    if (!newName.trim()) return
    setIsAdding(true)
    setAddError('')
    try {
      await onAdd(newName.trim(), withHex && newHex ? newHex : undefined)
      setNewName('')
      setNewHex('')
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add. Please try again.')
    } finally {
      setIsAdding(false)
    }
  }

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>

  return (
    <div className="space-y-6">
      {/* Add */}
      <div className="bg-white rounded-xl p-6 shadow-soft">
        <h3 className="font-semibold text-warm-900 mb-4">Add New</h3>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder={namePlaceholder}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1 px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          {withHex && (
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={newHex || '#ffffff'}
                onChange={(e) => setNewHex(e.target.value)}
                className="w-10 h-10 rounded-lg border border-warm-200 cursor-pointer p-0.5"
                title="Pick color"
              />
              <span className="text-xs text-warm-400 w-16">{newHex || 'optional'}</span>
            </div>
          )}
          <Button onClick={handleAdd} isLoading={isAdding} size="sm">
            <PlusIcon className="h-4 w-4 mr-1.5" />
            Add
          </Button>
        </div>
        {addError && <p className="mt-3 text-sm text-red-600">{addError}</p>}
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-soft overflow-hidden">
        {items.length === 0 ? (
          <div className="text-center py-12 text-warm-400">None added yet.</div>
        ) : (
          <div className="divide-y divide-warm-100">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-6 py-4 hover:bg-warm-50">
                <div className="flex items-center gap-3">
                  {item.hex && (
                    <span
                      className="w-6 h-6 rounded-full border border-warm-200 flex-shrink-0"
                      style={{ background: item.hex }}
                    />
                  )}
                  <span className="font-medium text-warm-900">{item.name}</span>
                  {item.hex && (
                    <span className="text-xs text-warm-400 font-mono">{item.hex}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {!hideLink && (
                    <button
                      onClick={() => onLink(item.name)}
                      className="p-2 text-warm-400 hover:text-amber-600 transition-colors"
                      title="Link to products"
                    >
                      <LinkIcon className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(item.id, item.name)}
                    className="p-2 text-warm-400 hover:text-red-600 transition-colors"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Catalog Page ────────────────────────────────────────────────────────

export default function AdminCatalog() {
  const [tab, setTab] = useState<Tab>('bases')

  const [fragrances, setFragrances] = useState<Fragrance[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [packagingList, setPackagingList] = useState<Packaging[]>([])
  const [customisationsList, setCustomisationsList] = useState<Customisation[]>([])
  const [isLoadingFragrances, setIsLoadingFragrances] = useState(true)
  const [isLoadingColors, setIsLoadingColors] = useState(true)
  const [isLoadingPackaging, setIsLoadingPackaging] = useState(true)
  const [isLoadingCustomisations, setIsLoadingCustomisations] = useState(true)

  const [tagModal, setTagModal] = useState<{ name: string; field: 'fragrances' | 'colors' | 'customisations' } | null>(null)
  const [packagingLinkModal, setPackagingLinkModal] = useState<string | null>(null)

  const loadFragrances = async () => {
    setIsLoadingFragrances(true)
    const res = await api.getFragrances()
    if (res.success) setFragrances(res.data)
    setIsLoadingFragrances(false)
  }

  const loadColors = async () => {
    setIsLoadingColors(true)
    const res = await api.getColors()
    if (res.success) setColors(res.data)
    setIsLoadingColors(false)
  }

  const loadPackaging = async () => {
    setIsLoadingPackaging(true)
    const res = await api.getPackaging()
    if (res.success) setPackagingList(res.data)
    setIsLoadingPackaging(false)
  }

  const loadCustomisations = async () => {
    setIsLoadingCustomisations(true)
    const res = await api.getCustomisations()
    if (res.success) setCustomisationsList(res.data)
    setIsLoadingCustomisations(false)
  }

  useEffect(() => {
    loadFragrances()
    loadColors()
    loadPackaging()
    loadCustomisations()
  }, [])

  const addFragrance = async (name: string) => {
    const prevCount = fragrances.length
    await api.createFragrance(name)
    await loadFragrances()
    // Auto-add to products that had ALL fragrances selected
    try {
      let page = 1, all: Product[] = []
      while (true) {
        const res = await api.getProducts({ limit: 100, page })
        if (!res.success) break
        all = [...all, ...res.data]
        if (all.length >= res.meta.total) break
        page++
      }
      const toUpdate = all.filter((p) => {
        const meta = (p.metadata as Record<string, unknown>) || {}
        return Array.isArray(meta.fragrances) && (meta.fragrances as string[]).length === prevCount
      })
      await Promise.all(toUpdate.map((p) => {
        const meta = (p.metadata as Record<string, unknown>) || {}
        return api.updateProduct(p.id, { metadata: { ...meta, fragrances: [...((meta.fragrances as string[]) || []), name] } } as Parameters<typeof api.updateProduct>[1])
      }))
    } catch { /* silent — auto-add is best-effort */ }
    setTagModal({ name, field: 'fragrances' })
  }

  const deleteFragrance = async (id: string, name: string) => {
    if (!confirm(`Delete fragrance "${name}"?`)) return
    await api.deleteFragrance(id)
    await loadFragrances()
  }

  const addColor = async (name: string, hex?: string) => {
    const prevCount = colors.length
    await api.createColor({ name, hex })
    await loadColors()
    // Auto-add to products that had ALL colors selected
    try {
      let page = 1, all: Product[] = []
      while (true) {
        const res = await api.getProducts({ limit: 100, page })
        if (!res.success) break
        all = [...all, ...res.data]
        if (all.length >= res.meta.total) break
        page++
      }
      const toUpdate = all.filter((p) => {
        const meta = (p.metadata as Record<string, unknown>) || {}
        return Array.isArray(meta.colors) && (meta.colors as string[]).length === prevCount
      })
      await Promise.all(toUpdate.map((p) => {
        const meta = (p.metadata as Record<string, unknown>) || {}
        return api.updateProduct(p.id, { metadata: { ...meta, colors: [...((meta.colors as string[]) || []), name] } } as Parameters<typeof api.updateProduct>[1])
      }))
    } catch { /* silent — auto-add is best-effort */ }
    setTagModal({ name, field: 'colors' })
  }

  const deleteColor = async (id: string, name: string) => {
    if (!confirm(`Delete color "${name}"?`)) return
    await api.deleteColor(id)
    await loadColors()
  }

  const addPackaging = async (name: string) => {
    await api.createPackaging(name)
    await loadPackaging()
    setPackagingLinkModal(name)
  }

  const deletePackaging = async (id: string, name: string) => {
    if (!confirm(`Delete packaging "${name}"?`)) return
    await api.deletePackaging(id)
    await loadPackaging()
  }

  const addCustomisation = async (name: string) => {
    await api.createCustomisation(name)
    await loadCustomisations()
    setTagModal({ name, field: 'customisations' })
  }

  const deleteCustomisation = async (id: string, name: string) => {
    if (!confirm(`Delete customisation "${name}"?`)) return
    await api.deleteCustomisation(id)
    await loadCustomisations()
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'bases', label: 'Bases' },
    { id: 'fragrances', label: 'Fragrances' },
    { id: 'colors', label: 'Colors' },
    { id: 'packaging', label: 'Packaging' },
    { id: 'customisations', label: 'Customisations' },
  ]

  return (
    <div>
      {tagModal && (
        <TagProductsModal
          itemName={tagModal.name}
          field={tagModal.field}
          onClose={() => setTagModal(null)}
        />
      )}
      {packagingLinkModal && (
        <LinkPackagingModal
          packagingName={packagingLinkModal}
          onClose={() => setPackagingLinkModal(null)}
        />
      )}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold text-warm-900">Catalog</h1>
        <p className="text-warm-500 mt-1">Manage bases, fragrances, colors, packaging, and customisations used in your products.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-warm-100 rounded-xl p-1 w-fit mb-8">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-white text-warm-900 shadow-sm'
                : 'text-warm-500 hover:text-warm-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'bases' && <BasesPanel />}

      {tab === 'fragrances' && (
        <SimpleListPanel
          items={fragrances}
          isLoading={isLoadingFragrances}
          onAdd={addFragrance}
          onDelete={deleteFragrance}
          onLink={(name) => setTagModal({ name, field: 'fragrances' })}
          namePlaceholder="e.g. Lavender, Rose, Vanilla…"
        />
      )}

      {tab === 'colors' && (
        <SimpleListPanel
          items={colors}
          isLoading={isLoadingColors}
          onAdd={addColor}
          onDelete={deleteColor}
          onLink={(name) => setTagModal({ name, field: 'colors' })}
          namePlaceholder="e.g. White, Ivory, Blush…"
          withHex
        />
      )}

      {tab === 'packaging' && (
        <SimpleListPanel
          items={packagingList}
          isLoading={isLoadingPackaging}
          onAdd={addPackaging}
          onDelete={deletePackaging}
          onLink={(name) => setPackagingLinkModal(name)}
          namePlaceholder="e.g. Gift Box, Kraft Bag, Ribbon…"
        />
      )}

      {tab === 'customisations' && (
        <SimpleListPanel
          items={customisationsList}
          isLoading={isLoadingCustomisations}
          onAdd={addCustomisation}
          onDelete={deleteCustomisation}
          onLink={(name) => setTagModal({ name, field: 'customisations' })}
          namePlaceholder="e.g. Sticker, Card, Gift Wrap…"
        />
      )}
    </div>
  )
}
