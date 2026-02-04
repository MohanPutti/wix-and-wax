import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'
import type { Order } from '../types'

interface UseOrdersParams {
  page?: number
  limit?: number
  status?: string
  enabled?: boolean
}

export function useOrders(params: UseOrdersParams = {}) {
  const { enabled = true, ...queryParams } = params
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  const fetchOrders = useCallback(async () => {
    if (!enabled) return
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.getOrders(queryParams)
      if (response.success) {
        setOrders(response.data)
        setPagination(response.meta)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders')
    } finally {
      setIsLoading(false)
    }
  }, [JSON.stringify(queryParams), enabled])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return {
    orders,
    isLoading,
    error,
    pagination,
    refresh: fetchOrders,
  }
}

export function useOrder(id: string) {
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    setIsLoading(true)
    setError(null)

    api
      .getOrder(id)
      .then((response) => {
        if (response.success) {
          setOrder(response.data)
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to fetch order')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [id])

  const updateStatus = async (status: Order['status']) => {
    if (!id) return
    try {
      const response = await api.updateOrderStatus(id, status)
      if (response.success) {
        setOrder(response.data)
      }
    } catch (err) {
      throw err
    }
  }

  const updatePaymentStatus = async (paymentStatus: Order['paymentStatus']) => {
    if (!id) return
    try {
      const response = await api.updateOrderPaymentStatus(id, paymentStatus)
      if (response.success) {
        setOrder(response.data)
      }
    } catch (err) {
      throw err
    }
  }

  return { order, isLoading, error, updateStatus, updatePaymentStatus }
}

export function useOrderByNumber(orderNumber: string, email?: string) {
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderNumber) return

    setIsLoading(true)
    setError(null)

    api
      .getOrderByNumber(orderNumber, email)
      .then((response) => {
        if (response.success) {
          setOrder(response.data)
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to fetch order')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [orderNumber, email])

  return { order, isLoading, error }
}
