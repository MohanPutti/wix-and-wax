import { useState, useRef, useEffect } from 'react'
import { PencilIcon, TrashIcon, PlusIcon, PhotoIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useCategories } from '../../hooks/useProducts'
import { api } from '../../services/api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import type { Category, Product } from '../../types'

// ─── Tag Products Modal ────────────────────────────────────────────────────────

interface TagProductsModalProps {
  categoryId: string
  categoryName: string
  onClose: () => void
}

function TagProductsModal({ categoryId, categoryName, onClose }: TagProductsModalProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isTagging, setIsTagging] = useState(false)

  useEffect(() => {
    const fetchAll = async () => {
      let page = 1
      let all: Product[] = []
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

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map((p) => p.id)))
    }
  }

  const handleConfirm = async () => {
    if (selected.size === 0) { onClose(); return }
    setIsTagging(true)
    try {
      await Promise.all(
        [...selected].map((productId) => {
          const product = products.find((p) => p.id === productId)!
          const existingIds = product.categories.map((c) => c.category.id)
          if (existingIds.includes(categoryId)) return Promise.resolve()
          return api.updateProduct(productId, {
            categoryIds: [...existingIds, categoryId],
          } as Parameters<typeof api.updateProduct>[1])
        })
      )
      onClose()
    } catch {
      alert('Some products could not be tagged')
    } finally {
      setIsTagging(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-warm-100">
          <div>
            <h2 className="font-semibold text-warm-900">Tag products to <span className="text-amber-600">"{categoryName}"</span></h2>
            <p className="text-xs text-warm-500 mt-0.5">Select products to add this category to</p>
          </div>
          <button onClick={onClose} className="p-1 text-warm-400 hover:text-warm-700">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-warm-100">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Select all */}
        {!isLoading && filtered.length > 0 && (
          <div className="px-6 py-2 border-b border-warm-100">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-warm-600 uppercase tracking-wide">
              <input
                type="checkbox"
                checked={selected.size === filtered.length && filtered.length > 0}
                onChange={toggleAll}
                className="rounded border-warm-300 text-amber-600 focus:ring-amber-500"
              />
              Select all ({filtered.length})
            </label>
          </div>
        )}

        {/* Product list */}
        <div className="overflow-y-auto flex-1 px-6 py-3">
          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner size="md" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-warm-400 py-8 text-sm">No products found</p>
          ) : (
            <div className="space-y-1">
              {filtered.map((product) => {
                const alreadyTagged = product.categories.some((c) => c.category.id === categoryId)
                return (
                  <label
                    key={product.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                      alreadyTagged ? 'opacity-50 cursor-not-allowed' : 'hover:bg-amber-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(product.id) || alreadyTagged}
                      disabled={alreadyTagged}
                      onChange={() => !alreadyTagged && toggle(product.id)}
                      className="rounded border-warm-300 text-amber-600 focus:ring-amber-500 flex-shrink-0"
                    />
                    {product.images[0]?.url && (
                      <img src={product.images[0].url} alt={product.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-warm-100" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-warm-900 truncate">{product.name}</p>
                      {alreadyTagged && <p className="text-xs text-amber-600">Already tagged</p>}
                    </div>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-warm-100 flex items-center justify-between">
          <span className="text-sm text-warm-500">{selected.size} product{selected.size !== 1 ? 's' : ''} selected</span>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>Skip</Button>
            <Button onClick={handleConfirm} isLoading={isTagging} disabled={selected.size === 0}>
              Tag {selected.size > 0 ? `${selected.size} ` : ''}Product{selected.size !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AdminCategories() {
  const { categories, isLoading, refresh } = useCategories()
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', group: '' })
  const [imageUrl, setImageUrl] = useState<string>('')
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tagModal, setTagModal] = useState<{ id: string; name: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (file: File) => {
    setIsUploadingImage(true)
    try {
      const res = await api.uploadImage(file)
      if (res.success) setImageUrl(res.data.url)
    } catch {
      alert('Image upload failed')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const parentCat = categories.find((c) => c.name === formData.group && !c.parentId)

    const payload: Partial<Category> = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description || undefined,
      image: imageUrl || undefined,
      parentId: parentCat?.id || undefined,
    }

    try {
      if (editingId) {
        await api.updateCategory(editingId, payload)
        setFormData({ name: '', slug: '', description: '', group: '' })
        setImageUrl('')
        setIsAdding(false)
        setEditingId(null)
        refresh()
      } else {
        const res = await api.createCategory(payload)
        setFormData({ name: '', slug: '', description: '', group: '' })
        setImageUrl('')
        setIsAdding(false)
        refresh()
        // Show tag-products modal only for sub-categories
        if (parentCat && res.success && res.data?.id) {
          setTagModal({ id: res.data.id, name: res.data.name })
        }
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save category')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingId(category.id)
    const parent = categories.find((c) => c.id === category.parentId)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      group: parent?.name || '',
    })
    setImageUrl(category.image || '')
    setIsAdding(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return
    try {
      await api.deleteCategory(id)
      refresh()
    } catch {
      alert('Failed to delete category')
    }
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({ name: '', slug: '', description: '', group: '' })
    setImageUrl('')
  }

  const getGroupName = (cat: Category) => {
    if (!cat.parentId) return '—'
    return categories.find((c) => c.id === cat.parentId)?.name || '—'
  }

  return (
    <div>
      {tagModal && (
        <TagProductsModal
          categoryId={tagModal.id}
          categoryName={tagModal.name}
          onClose={() => setTagModal(null)}
        />
      )}

      {isLoading && !tagModal ? (
        <div className="flex justify-center items-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      ) : !isLoading && (
        <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-serif text-3xl font-semibold text-warm-900">Categories</h1>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Category
          </Button>
        )}
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="bg-white rounded-xl p-6 shadow-soft mb-6">
          <h2 className="font-semibold text-warm-900 mb-4">
            {editingId ? 'Edit Category' : 'Add Category'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
              <Input
                label="Slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">Category Group</label>
              <select
                value={formData.group}
                onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-warm-900 bg-white"
              >
                <option value="">None (Top-level group)</option>
                {categories.filter((c) => !c.parentId).map((g) => (
                  <option key={g.id} value={g.name}>{g.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            {/* Image upload — only for sub-categories */}
            {formData.group && (
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-2">Category Image</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]) }}
                />
                {imageUrl ? (
                  <div className="relative inline-block">
                    <img src={imageUrl} alt="Category" className="w-32 h-32 object-cover rounded-xl border border-warm-200" />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                    >
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-2 py-1 rounded-lg hover:bg-black/70"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-warm-300 rounded-xl text-warm-400 hover:border-amber-400 hover:text-amber-500 transition-colors"
                  >
                    {isUploadingImage ? <Spinner size="sm" /> : <><PhotoIcon className="h-8 w-8 mb-1" /><span className="text-xs">Add Image</span></>}
                  </button>
                )}
              </div>
            )}

            <div className="flex gap-4">
              <Button type="submit" isLoading={isSubmitting}>
                {editingId ? 'Update' : 'Create'} Category
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      {!isAdding && (
        <div className="bg-white rounded-xl shadow-soft overflow-hidden">
          <table className="w-full">
            <thead className="bg-warm-50 border-b border-warm-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-warm-700">Name</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-warm-700">Group</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-warm-700">Slug</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-warm-700">Description</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-warm-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-b border-warm-100 hover:bg-warm-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {category.image
                        ? <img src={category.image} alt={category.name} className="w-9 h-9 rounded-lg object-cover border border-warm-200 flex-shrink-0" />
                        : <div className="w-9 h-9 rounded-lg bg-warm-100 flex-shrink-0" />
                      }
                      <span className="font-medium text-warm-900">{category.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getGroupName(category) !== '—' ? (
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                        {getGroupName(category)}
                      </span>
                    ) : (
                      <span className="text-warm-400 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-warm-600">{category.slug}</td>
                  <td className="px-6 py-4 text-warm-600 max-w-xs truncate">
                    {category.description || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-2 text-warm-500 hover:text-amber-600 transition-colors"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-2 text-warm-500 hover:text-red-600 transition-colors"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {categories.length === 0 && (
            <div className="text-center py-12">
              <p className="text-warm-500">No categories found</p>
            </div>
          )}
        </div>
      )}
        </>
      )}
    </div>
  )
}
