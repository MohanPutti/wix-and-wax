import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'
import type { SavedAddress } from '../types'
import { useAppSelector } from '../store/hooks'
import { selectIsAuthenticated } from '../store/slices/authSlice'

export function useAddresses() {
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isAuthenticated = useAppSelector(selectIsAuthenticated)

  const fetchAddresses = useCallback(async () => {
    if (!isAuthenticated) {
      setAddresses([])
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const response = await api.getAddresses()
      if (response.success) {
        setAddresses(response.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch addresses')
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    fetchAddresses()
  }, [fetchAddresses])

  const createAddress = async (data: Omit<SavedAddress, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    setError(null)
    try {
      const response = await api.createAddress(data)
      if (response.success) {
        setAddresses((prev) => [...prev, response.data])
        return response.data
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create address')
      throw err
    }
  }

  const updateAddress = async (id: string, data: Partial<Omit<SavedAddress, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
    setError(null)
    try {
      const response = await api.updateAddress(id, data)
      if (response.success) {
        setAddresses((prev) => prev.map((addr) => (addr.id === id ? response.data : addr)))
        return response.data
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update address')
      throw err
    }
  }

  const deleteAddress = async (id: string) => {
    setError(null)
    try {
      const response = await api.deleteAddress(id)
      if (response.success) {
        setAddresses((prev) => prev.filter((addr) => addr.id !== id))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete address')
      throw err
    }
  }

  const getDefaultAddress = (type: 'shipping' | 'billing') => {
    return addresses.find((addr) => addr.type === type && addr.isDefault)
  }

  return {
    addresses,
    isLoading,
    error,
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    getDefaultAddress,
  }
}
