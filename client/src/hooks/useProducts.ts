import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'
import type { Product, Category } from '../types'

interface UseProductsParams {
  page?: number
  limit?: number
  category?: string
  status?: string
  search?: string
  minPrice?: number
  maxPrice?: number
}

interface UseProductsResult {
  products: Product[]
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  refresh: () => Promise<void>
}

export function useProducts(params: UseProductsParams = {}): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  })

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.getProducts(params)
      if (response.success) {
        setProducts(response.data)
        setPagination(response.meta)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
    } finally {
      setIsLoading(false)
    }
  }, [JSON.stringify(params)])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return {
    products,
    isLoading,
    error,
    pagination,
    refresh: fetchProducts,
  }
}

export function useProduct(idOrSlug: string, bySlug = false) {
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!idOrSlug) return

    setIsLoading(true)
    setError(null)

    const fetch = bySlug ? api.getProductBySlug(idOrSlug) : api.getProduct(idOrSlug)

    fetch
      .then((response) => {
        if (response.success) {
          setProduct(response.data)
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to fetch product')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [idOrSlug, bySlug])

  return { product, isLoading, error }
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.getCategories()
      if (response.success) {
        setCategories(response.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return { categories, isLoading, error, refresh: fetchCategories }
}
