import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useProducts, useProduct, useCategories } from '../../hooks/useProducts'
import { api } from '../../services/api'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
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
                    ${defaultVariant ? Number(defaultVariant.price).toFixed(2) : '-'}
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
  const [variants, setVariants] = useState<Partial<ProductVariant>[]>([
    { name: 'Default', sku: '', price: 0, quantity: 0, isDefault: true },
  ])

  // Load existing product data in edit mode
  useEffect(() => {
    if (isEditMode && product) {
      setName(product.name)
      setSlug(product.slug)
      setDescription(product.description || '')
      setStatus(product.status)
      setSelectedCategories(product.categories?.map((c) => c.id) || [])
      if (product.variants.length > 0) {
        setVariants(product.variants)
      }
    }
  }, [isEditMode, product])

  const handleNameChange = (value: string) => {
    setName(value)
    setSlug(value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
  }

  const addVariant = () => {
    setVariants([...variants, { name: '', sku: '', price: 0, quantity: 0, isDefault: false }])
  }

  const removeVariant = (index: number) => {
    if (variants.length <= 1) return
    setVariants(variants.filter((_, i) => i !== index))
  }

  const updateVariant = (index: number, field: keyof ProductVariant, value: unknown) => {
    const newVariants = [...variants]
    newVariants[index] = { ...newVariants[index], [field]: value }
    setVariants(newVariants)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const productData = {
        name,
        slug,
        description,
        status: status as 'draft' | 'active' | 'archived',
        variants: variants as ProductVariant[],
      }

      if (isEditMode && id) {
        await api.updateProduct(id, productData)
      } else {
        await api.createProduct(productData)
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
                  <label className="block text-sm font-medium text-warm-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Variants */}
            <div className="bg-white rounded-xl p-6 shadow-soft">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-warm-900">Variants</h2>
                <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                  Add Variant
                </Button>
              </div>
              <div className="space-y-4">
                {variants.map((variant, index) => (
                  <div key={index} className="p-4 border border-warm-200 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Input
                        label="Name"
                        value={variant.name || ''}
                        onChange={(e) => updateVariant(index, 'name', e.target.value)}
                        required
                      />
                      <Input
                        label="SKU"
                        value={variant.sku || ''}
                        onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                        required
                      />
                      <Input
                        label="Price"
                        type="number"
                        step="0.01"
                        value={variant.price || ''}
                        onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value))}
                        required
                      />
                      <Input
                        label="Quantity"
                        type="number"
                        value={variant.quantity || ''}
                        onChange={(e) => updateVariant(index, 'quantity', parseInt(e.target.value))}
                        required
                      />
                    </div>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="mt-2 text-sm text-red-600 hover:text-red-700"
                      >
                        Remove variant
                      </button>
                    )}
                  </div>
                ))}
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
              <h2 className="font-semibold text-warm-900 mb-4">Categories</h2>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories([...selectedCategories, cat.id])
                        } else {
                          setSelectedCategories(selectedCategories.filter((id) => id !== cat.id))
                        }
                      }}
                      className="rounded border-warm-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="ml-2 text-warm-700">{cat.name}</span>
                  </label>
                ))}
              </div>
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
