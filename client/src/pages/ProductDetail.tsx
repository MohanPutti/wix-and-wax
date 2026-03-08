import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useProduct } from '../hooks/useProducts'
import { useAppDispatch } from '../store/hooks'
import { addToCart } from '../store/slices/cartSlice'
import Button from '../components/ui/Button'
import Skeleton from '../components/ui/Skeleton'
import type { ProductVariant, ProductMetadata } from '../types'

const SEARCH_THRESHOLD = 2

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { product, isLoading, error } = useProduct(slug || '', true)
  const dispatch = useAppDispatch()
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [selectedBaseName, setSelectedBaseName] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedColorList, setSelectedColorList] = useState<string[]>([])
  const [selectedFragranceList, setSelectedFragranceList] = useState<string[]>([])
  const [selectedPackagingList, setSelectedPackagingList] = useState<string[]>([])
  const [selectionError, setSelectionError] = useState('')
  const [isZoomed, setIsZoomed] = useState(false)
  const [fragranceSearch, setFragranceSearch] = useState('')
  const [colorSearch, setColorSearch] = useState('')

  useEffect(() => {
    if (!isZoomed || !product) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsZoomed(false)
      if (e.key === 'ArrowLeft') setSelectedImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length)
      if (e.key === 'ArrowRight') setSelectedImageIndex((prev) => (prev + 1) % product.images.length)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isZoomed, product])

  // Set default variant + base when product loads
  if (product && !selectedVariant) {
    const defaultVariant = product.variants.find((v) => v.isDefault) || product.variants[0]
    if (defaultVariant) {
      setSelectedVariant(defaultVariant)
      if (defaultVariant.options?.base && !selectedBaseName) {
        setSelectedBaseName(defaultVariant.options.base)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image column */}
          <div className="space-y-4">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="flex gap-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="w-20 h-20 rounded-lg flex-shrink-0" />)}
            </div>
          </div>
          {/* Info column */}
          <div className="space-y-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-8 w-1/3" />
            <div className="space-y-2 pt-2">
              <Skeleton className="h-3 w-20" />
              <div className="flex gap-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-9 w-20 rounded-full" />)}
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-16 rounded-full" />)}
              </div>
            </div>
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-semibold text-warm-900 mb-4">Product Not Found</h1>
        <p className="text-warm-600 mb-8">The candle you're looking for doesn't exist.</p>
        <Link to="/products">
          <Button>Back to Shop</Button>
        </Link>
      </div>
    )
  }

  const currentVariant = selectedVariant || product.variants[0]
  const mainImage = product.images[selectedImageIndex]?.url || '/placeholder-candle.jpg'

  const basePrice = Number(currentVariant.price)

  const meta = product.metadata as ProductMetadata & {
    baseMode?: string
    colorMode?: string
    fragranceMode?: string
    packaging?: string[]
    packagingPrices?: Record<string, number>
    packagingMode?: string
  } | undefined
  const fragrances = meta?.fragrances?.filter(Boolean) || []
  const colors = meta?.colors?.filter(Boolean) || []
  const packaging = meta?.packaging?.filter(Boolean) || []
  const packagingPrices = meta?.packagingPrices || {}
  const baseMode = meta?.baseMode || 'single'
  const colorMode = meta?.colorMode || 'none'
  const fragranceMode = meta?.fragranceMode || 'none'
  const packagingMode = meta?.packagingMode || 'none'

  // Case 2: packaging-only product (variants have options.packaging, no options.base)
  const isPackagingOnly = product.variants.length > 0 &&
    product.variants.every((v) => v.options?.packaging && !v.options?.base)

  // Case 1 add-on: sum prices of selected packaging options
  const packagingAddon = !isPackagingOnly && selectedPackagingList.length > 0
    ? selectedPackagingList.reduce((sum, name) => sum + (Number(packagingPrices[name]) || 0), 0)
    : 0
  const price = basePrice + packagingAddon
  const mrp = currentVariant.comparePrice ? Number(currentVariant.comparePrice) : null
  const hasDiscount = mrp !== null && mrp > basePrice
  const discountPct = hasDiscount ? Math.round(((mrp! - basePrice) / mrp!) * 100) : 0

  // Multi-base support: get unique base names from variants
  const uniqueBases = [...new Set(
    product.variants.map((v) => v.options?.base).filter(Boolean) as string[]
  )]
  const hasMultipleBases = uniqueBases.length > 1

  const handleBaseSelect = (baseName: string) => {
    setSelectedBaseName(baseName)
    const defaultVariant = product.variants.find((v) => v.options?.base === baseName && v.isDefault)
      || product.variants.find((v) => v.options?.base === baseName)
    if (defaultVariant) setSelectedVariant(defaultVariant)
  }

  // Variants to show in the size picker (filtered by selected base)
  const baseVariants = hasMultipleBases && selectedBaseName
    ? product.variants.filter((v) => v.options?.base === selectedBaseName)
    : product.variants

  const toggleFragrance = (f: string) => {
    setSelectedFragranceList((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    )
  }

  const togglePackaging = (p: string) => {
    setSelectedPackagingList((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    )
  }

  const handleAddToCart = async () => {
    if (!currentVariant) return

    // Validate required selections
    if (hasMultipleBases && baseMode !== 'none' && !selectedBaseName) {
      setSelectionError('Please select a base before adding to cart.')
      return
    }
    if (colorMode === 'single' && colors.length > 0 && !selectedColor) {
      setSelectionError('Please select a color before adding to cart.')
      return
    }
    if (fragranceMode === 'single' && fragrances.length > 0 && selectedFragranceList.length === 0) {
      setSelectionError('Please select a fragrance before adding to cart.')
      return
    }
    if (packagingMode === 'single' && packaging.length > 0 && selectedPackagingList.length === 0) {
      setSelectionError('Please select a packaging option before adding to cart.')
      return
    }
    setSelectionError('')

    // Build note from selections
    const noteParts: string[] = []
    const colorSelection = colorMode === 'multi' ? selectedColorList : selectedColor ? [selectedColor] : []
    if (colorSelection.length > 0) noteParts.push(`Color: ${colorSelection.join(', ')}`)
    if (selectedFragranceList.length > 0) noteParts.push(`Fragrance: ${selectedFragranceList.join(', ')}`)
    if (selectedPackagingList.length > 0) noteParts.push(`Packaging: ${selectedPackagingList.join(', ')}`)
    const note = noteParts.join(' | ') || undefined

    setIsAddingToCart(true)
    try {
      dispatch(addToCart({ variantId: currentVariant.id, quantity, note }))
    } finally {
      setIsAddingToCart(false)
    }
  }

  const filteredFragrances = fragrances.filter((f) =>
    f.toLowerCase().includes(fragranceSearch.toLowerCase())
  )
  const filteredColors = colors.filter((c) =>
    c.toLowerCase().includes(colorSearch.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Zoom lightbox */}
      {isZoomed && (
        <div
          className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-8 w-8" />
          </button>
          {product.images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length)
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/35 rounded-full p-3 transition-colors"
              >
                <ChevronLeftIcon className="h-6 w-6 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedImageIndex((prev) => (prev + 1) % product.images.length)
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/35 rounded-full p-3 transition-colors"
              >
                <ChevronRightIcon className="h-6 w-6 text-white" />
              </button>
            </>
          )}
          <img
            src={mainImage}
            alt={product.name}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          {product.images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {product.images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(i) }}
                  className={`rounded-full transition-all ${
                    i === selectedImageIndex ? 'w-5 h-2.5 bg-white' : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Breadcrumb */}
      <Link
        to="/products"
        className="inline-flex items-center text-warm-600 hover:text-amber-600 transition-colors mb-8"
      >
        <ChevronLeftIcon className="h-4 w-4 mr-1" />
        Back to Shop
      </Link>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Images */}
        <div>
          {/* Main Image */}
          <div
            className="aspect-square bg-warm-100 rounded-2xl overflow-hidden mb-4 relative group cursor-zoom-in"
            onClick={() => setIsZoomed(true)}
          >
            <img
              src={mainImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {hasDiscount && (
              <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                {discountPct}% OFF
              </span>
            )}
            {/* Arrow navigation */}
            {product.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length)
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeftIcon className="h-4 w-4 text-warm-700" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedImageIndex((prev) => (prev + 1) % product.images.length)
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRightIcon className="h-4 w-4 text-warm-700" />
                </button>
              </>
            )}
            {/* Zoom hint */}
            <div className="absolute bottom-3 right-3 bg-black/30 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity select-none">
              Click to zoom
            </div>
          </div>

          {/* Dot indicators */}
          {product.images.length > 1 && (
            <div className="flex justify-center gap-1.5 mb-3">
              {product.images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImageIndex(i)}
                  className={`rounded-full transition-all ${
                    i === selectedImageIndex
                      ? 'w-5 h-2 bg-amber-600'
                      : 'w-2 h-2 bg-warm-300 hover:bg-warm-400'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Thumbnail Gallery */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {product.images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors flex-shrink-0 ${
                    selectedImageIndex === index
                      ? 'border-amber-600'
                      : 'border-transparent hover:border-warm-300'
                  }`}
                >
                  <img
                    src={image.url}
                    alt={image.alt || `${product.name} - ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          {/* Categories */}
          {product.categories.length > 0 && (
            <div className="flex gap-2 mb-4 flex-wrap">
              {product.categories.map((c) => (
                <Link
                  key={c.category.id}
                  to={`/products?category=${c.category.slug}`}
                  className="text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full hover:bg-amber-100 transition-colors"
                >
                  {c.category.name}
                </Link>
              ))}
            </div>
          )}

          {/* Name */}
          <h1 className="font-serif text-3xl font-semibold text-warm-900 mb-4">
            {product.name}
          </h1>

          {/* Pricing */}
          <div className="flex items-baseline gap-3 mb-2 flex-wrap">
            <span className="text-3xl font-bold text-warm-900">
              ₹{price.toFixed(0)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-xl text-warm-400 line-through">
                  ₹{mrp!.toFixed(0)}
                </span>
                <span className="text-sm font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                  {discountPct}% off
                </span>
              </>
            )}
          </div>
          {hasDiscount && (
            <p className="text-sm text-warm-500 mb-6">
              MRP: <span className="line-through">₹{mrp!.toFixed(0)}</span>
              {' '}· You save ₹{(mrp! - price).toFixed(0)}
            </p>
          )}
          {!hasDiscount && <div className="mb-6" />}

          {/* Description */}
          {product.description && (
            <p className="text-warm-600 mb-8 leading-relaxed">{product.description}</p>
          )}

          {/* Case 1: Base picker + Size picker */}
          {!isPackagingOnly && (
            <>
              {/* Base picker */}
              {hasMultipleBases && baseMode !== 'none' && (
                <div className="mb-5">
                  <p className="text-sm font-medium text-warm-700 mb-2">
                    Base<span className="text-red-500 ml-0.5">*</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {uniqueBases.map((base) => (
                      <button
                        key={base}
                        onClick={() => handleBaseSelect(base)}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors text-sm ${
                          selectedBaseName === base
                            ? 'border-amber-600 bg-amber-50 text-amber-700 font-medium'
                            : 'border-warm-200 hover:border-warm-300 text-warm-700'
                        }`}
                      >
                        {base}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size picker */}
              {baseVariants.length > 0 && (
                <div className="mb-5">
                  <label className="block text-sm font-medium text-warm-700 mb-2">Size</label>
                  <div className="flex flex-wrap gap-2">
                    {baseVariants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors text-sm ${
                          currentVariant.id === variant.id
                            ? 'border-amber-600 bg-amber-50 text-amber-700'
                            : 'border-warm-200 hover:border-warm-300 text-warm-700'
                        }`}
                      >
                        {variant.options?.size || variant.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Case 2: Packaging-only variant selector */}
          {isPackagingOnly && product.variants.length > 0 && (
            <div className="mb-5">
              <label className="block text-sm font-medium text-warm-700 mb-2">
                Packaging<span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors text-sm ${
                      currentVariant.id === variant.id
                        ? 'border-amber-600 bg-amber-50 text-amber-700 font-medium'
                        : 'border-warm-200 hover:border-warm-300 text-warm-700'
                    }`}
                  >
                    {variant.options?.packaging || variant.name}
                    <span className="ml-1.5 text-warm-500">₹{Number(variant.price).toFixed(0)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Packaging add-on (Case 1 only) */}
          {!isPackagingOnly && packaging.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium text-warm-700 mb-2">
                Packaging{packagingMode !== 'none' && <span className="text-red-500 ml-0.5">*</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {packaging.map((p) => {
                  const addonPrice = Number(packagingPrices[p]) || 0
                  if (packagingMode === 'none') {
                    return (
                      <span key={p} className="text-sm bg-warm-50 text-warm-700 px-3 py-1 rounded-full border border-warm-200">
                        {p}{addonPrice > 0 && <span className="ml-1 text-warm-500">+₹{addonPrice}</span>}
                      </span>
                    )
                  }
                  const isSelected = selectedPackagingList.includes(p)
                  return (
                    <button
                      key={p}
                      onClick={() => {
                        if (packagingMode === 'single') {
                          setSelectedPackagingList(isSelected ? [] : [p])
                        } else {
                          togglePackaging(p)
                        }
                        setSelectionError('')
                      }}
                      className={`text-sm px-3 py-1.5 rounded-full border-2 transition-colors ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50 text-amber-800 font-medium'
                          : 'border-warm-200 text-warm-700 hover:border-amber-300'
                      }`}
                    >
                      {p}{addonPrice > 0 && <span className={`ml-1.5 text-xs ${isSelected ? 'text-amber-600' : 'text-warm-400'}`}>+₹{addonPrice}</span>}
                    </button>
                  )
                })}
              </div>
              {packagingAddon > 0 && (
                <p className="text-xs text-amber-700 mt-2">
                  Packaging add-on: +₹{packagingAddon} → Total: ₹{price.toFixed(0)}
                </p>
              )}
            </div>
          )}

          {/* Fragrances + Colors — side by side when both exist */}
          {(fragrances.length > 0 || colors.length > 0) && (
            <div className={`mb-6 ${fragrances.length > 0 && colors.length > 0 ? 'grid grid-cols-2 gap-4' : ''}`}>

              {/* Fragrances */}
              {fragrances.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-warm-800">
                      Fragrance{fragranceMode !== 'none' && <span className="text-red-500 ml-0.5">*</span>}
                    </p>
                    {selectedFragranceList.length > 0 && (
                      <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full">
                        {selectedFragranceList.length} selected
                      </span>
                    )}
                  </div>
                  {fragrances.length > SEARCH_THRESHOLD ? (
                    <div className="rounded-xl border border-warm-300 shadow-sm overflow-hidden">
                      {/* Search bar */}
                      <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50/60 border-b border-warm-200">
                        <MagnifyingGlassIcon className="h-3.5 w-3.5 text-warm-400 flex-shrink-0" />
                        <input
                          type="text"
                          value={fragranceSearch}
                          onChange={(e) => setFragranceSearch(e.target.value)}
                          placeholder="Search fragrances..."
                          className="w-full text-sm bg-transparent outline-none text-warm-700 placeholder-warm-400"
                        />
                      </div>
                      {/* List */}
                      <div className="max-h-44 overflow-y-auto bg-white">
                        {filteredFragrances.length === 0 ? (
                          <div className="py-6 text-xs text-warm-400 text-center">No results</div>
                        ) : filteredFragrances.map((f, i) => {
                          if (fragranceMode === 'none') {
                            return (
                              <div key={f} className={`px-3 py-2.5 text-sm text-warm-700 ${i % 2 === 0 ? 'bg-white' : 'bg-warm-50/40'}`}>
                                {f}
                              </div>
                            )
                          }
                          const isSelected = selectedFragranceList.includes(f)
                          return (
                            <button
                              key={f}
                              onClick={() => {
                                if (fragranceMode === 'single') {
                                  setSelectedFragranceList(isSelected ? [] : [f])
                                } else {
                                  toggleFragrance(f)
                                }
                                setSelectionError('')
                              }}
                              className={`w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center justify-between border-b border-warm-100 last:border-0 ${
                                isSelected
                                  ? 'bg-amber-100 text-amber-900 font-medium'
                                  : 'text-warm-700 hover:bg-amber-50'
                              }`}
                            >
                              <span className="truncate pr-2">{f}</span>
                              {isSelected && (
                                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8"><path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M1 4l3 3 5-6"/></svg>
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {fragrances.map((f) => {
                        if (fragranceMode === 'none') {
                          return (
                            <span key={f} className="text-sm bg-amber-50 text-amber-800 px-3 py-1 rounded-full border border-amber-200">
                              {f}
                            </span>
                          )
                        }
                        const isSelected = selectedFragranceList.includes(f)
                        return (
                          <button
                            key={f}
                            onClick={() => {
                              if (fragranceMode === 'single') {
                                setSelectedFragranceList(isSelected ? [] : [f])
                              } else {
                                toggleFragrance(f)
                              }
                              setSelectionError('')
                            }}
                            className={`text-sm px-3 py-1 rounded-full border-2 transition-colors ${
                              isSelected
                                ? 'border-amber-500 bg-amber-100 text-amber-800 font-medium'
                                : 'border-warm-200 text-warm-700 hover:border-amber-300 hover:bg-amber-50'
                            }`}
                          >
                            {f}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Colors */}
              {colors.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-warm-800">
                      Color{colorMode !== 'none' && <span className="text-red-500 ml-0.5">*</span>}
                    </p>
                    {colorMode === 'single' && selectedColor && (
                      <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full truncate max-w-[7rem]">
                        {selectedColor}
                      </span>
                    )}
                    {colorMode === 'multi' && selectedColorList.length > 0 && (
                      <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full">
                        {selectedColorList.length} selected
                      </span>
                    )}
                  </div>
                  {colors.length > SEARCH_THRESHOLD ? (
                    <div className="rounded-xl border border-warm-300 shadow-sm overflow-hidden">
                      {/* Search bar */}
                      <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50/60 border-b border-warm-200">
                        <MagnifyingGlassIcon className="h-3.5 w-3.5 text-warm-400 flex-shrink-0" />
                        <input
                          type="text"
                          value={colorSearch}
                          onChange={(e) => setColorSearch(e.target.value)}
                          placeholder="Search colors..."
                          className="w-full text-sm bg-transparent outline-none text-warm-700 placeholder-warm-400"
                        />
                      </div>
                      {/* List */}
                      <div className="max-h-44 overflow-y-auto bg-white">
                        {filteredColors.length === 0 ? (
                          <div className="py-6 text-xs text-warm-400 text-center">No results</div>
                        ) : filteredColors.map((c, i) => {
                          if (colorMode === 'none') {
                            return (
                              <div key={c} className={`px-3 py-2.5 text-sm text-warm-700 ${i % 2 === 0 ? 'bg-white' : 'bg-warm-50/40'}`}>
                                {c}
                              </div>
                            )
                          }
                          const isSelected = colorMode === 'multi' ? selectedColorList.includes(c) : selectedColor === c
                          return (
                            <button
                              key={c}
                              onClick={() => {
                                if (colorMode === 'multi') {
                                  setSelectedColorList((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c])
                                } else {
                                  setSelectedColor(isSelected ? null : c)
                                }
                                setSelectionError('')
                              }}
                              className={`w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center justify-between border-b border-warm-100 last:border-0 ${
                                isSelected
                                  ? 'bg-amber-100 text-amber-900 font-medium'
                                  : 'text-warm-700 hover:bg-amber-50'
                              }`}
                            >
                              <span className="truncate pr-2">{c}</span>
                              {isSelected && (
                                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8"><path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M1 4l3 3 5-6"/></svg>
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {colors.map((c) => {
                        if (colorMode === 'none') {
                          return (
                            <span key={c} className="text-sm bg-warm-50 text-warm-700 px-3 py-1 rounded-full border border-warm-200">
                              {c}
                            </span>
                          )
                        }
                        const isSelected = colorMode === 'multi' ? selectedColorList.includes(c) : selectedColor === c
                        return (
                          <button
                            key={c}
                            onClick={() => {
                              if (colorMode === 'multi') {
                                setSelectedColorList((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c])
                              } else {
                                setSelectedColor(isSelected ? null : c)
                              }
                              setSelectionError('')
                            }}
                            className={`text-sm px-3 py-1 rounded-full border-2 transition-colors ${
                              isSelected
                                ? 'border-amber-500 bg-amber-100 text-amber-800 font-medium'
                                : 'border-warm-200 text-warm-700 hover:border-amber-300 hover:bg-amber-50'
                            }`}
                          >
                            {c}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {selectionError && (
            <p className="text-sm text-red-500 mb-4">{selectionError}</p>
          )}

          {/* Quantity */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-warm-700 mb-2">
              Quantity
            </label>
            <div className="flex items-center border border-warm-200 rounded-lg w-fit">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-2 text-warm-600 hover:text-amber-600 transition-colors"
              >
                -
              </button>
              <span className="px-4 py-2 text-warm-900 min-w-[3rem] text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-4 py-2 text-warm-600 hover:text-amber-600 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Add to Cart */}
          <Button
            size="lg"
            className="w-full mb-4"
            onClick={handleAddToCart}
            isLoading={isAddingToCart}
            disabled={currentVariant.quantity <= 0}
          >
            {currentVariant.quantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
          </Button>

          {/* Stock Status */}
          {currentVariant.quantity > 0 && currentVariant.quantity <= 10 && (
            <p className="text-amber-600 text-sm text-center">
              Only {currentVariant.quantity} left in stock!
            </p>
          )}

          {/* Product Details */}
          <div className="mt-12 border-t border-warm-200 pt-8">
            <h2 className="font-semibold text-warm-900 mb-4">Product Details</h2>
            <ul className="space-y-2 text-warm-600 text-sm">
              <li>SKU: {currentVariant.sku}</li>
              {currentVariant.options && Object.entries(currentVariant.options).map(([key, value]) => (
                <li key={key} className="capitalize">{key}: {value}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
