import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline'
import { useAppSelector } from '../store/hooks'
import { selectUser, selectIsAuthenticated } from '../store/slices/authSlice'
import { useAddresses } from '../hooks/useAddresses'
import type { SavedAddress } from '../types'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'

interface AddressFormData {
  firstName: string
  lastName: string
  company: string
  address1: string
  address2: string
  city: string
  state: string
  postalCode: string
  country: string
  phone: string
  type: 'shipping' | 'billing'
  isDefault: boolean
}

const emptyAddress: AddressFormData = {
  firstName: '',
  lastName: '',
  company: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
  phone: '',
  type: 'shipping',
  isDefault: false,
}

export default function Profile() {
  const user = useAppSelector(selectUser)
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const { addresses, isLoading, error, createAddress, updateAddress, deleteAddress } = useAddresses()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<AddressFormData>(emptyAddress)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const handleOpenForm = (address?: SavedAddress) => {
    if (address) {
      setEditingId(address.id)
      setFormData({
        firstName: address.firstName,
        lastName: address.lastName,
        company: address.company || '',
        address1: address.address1,
        address2: address.address2 || '',
        city: address.city,
        state: address.state || '',
        postalCode: address.postalCode,
        country: address.country,
        phone: address.phone || '',
        type: address.type,
        isDefault: address.isDefault,
      })
    } else {
      setEditingId(null)
      setFormData(emptyAddress)
    }
    setFormError(null)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingId(null)
    setFormData(emptyAddress)
    setFormError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setIsSaving(true)

    try {
      if (editingId) {
        await updateAddress(editingId, formData)
      } else {
        await createAddress(formData)
      }
      handleCloseForm()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save address')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await deleteAddress(id)
      } catch (err) {
        // Error is handled by the hook
      }
    }
  }

  const handleSetDefault = async (address: SavedAddress) => {
    try {
      await updateAddress(address.id, { isDefault: true })
    } catch (err) {
      // Error is handled by the hook
    }
  }

  const shippingAddresses = addresses.filter((a) => a.type === 'shipping')
  const billingAddresses = addresses.filter((a) => a.type === 'billing')

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl font-semibold text-warm-900 mb-8">My Profile</h1>

      {/* User Info */}
      <div className="bg-white rounded-xl p-6 shadow-soft mb-8">
        <h2 className="font-semibold text-warm-900 mb-4">Account Information</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-warm-500">Name</p>
            <p className="text-warm-900">{user?.firstName} {user?.lastName}</p>
          </div>
          <div>
            <p className="text-sm text-warm-500">Email</p>
            <p className="text-warm-900">{user?.email}</p>
          </div>
          {user?.phone && (
            <div>
              <p className="text-sm text-warm-500">Phone</p>
              <p className="text-warm-900">{user.phone}</p>
            </div>
          )}
        </div>
      </div>

      {/* Addresses */}
      <div className="bg-white rounded-xl p-6 shadow-soft">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-semibold text-warm-900">Saved Addresses</h2>
          <Button onClick={() => handleOpenForm()} size="sm">
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Address
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">{error}</div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : addresses.length === 0 ? (
          <p className="text-warm-500 text-center py-8">No saved addresses yet.</p>
        ) : (
          <div className="space-y-6">
            {/* Shipping Addresses */}
            {shippingAddresses.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-warm-600 mb-3">Shipping Addresses</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {shippingAddresses.map((address) => (
                    <AddressCard
                      key={address.id}
                      address={address}
                      onEdit={() => handleOpenForm(address)}
                      onDelete={() => handleDelete(address.id)}
                      onSetDefault={() => handleSetDefault(address)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Billing Addresses */}
            {billingAddresses.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-warm-600 mb-3">Billing Addresses</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {billingAddresses.map((address) => (
                    <AddressCard
                      key={address.id}
                      address={address}
                      onEdit={() => handleOpenForm(address)}
                      onDelete={() => handleDelete(address.id)}
                      onSetDefault={() => handleSetDefault(address)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Address Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-warm-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="font-semibold text-warm-900 text-lg mb-4">
                {editingId ? 'Edit Address' : 'Add New Address'}
              </h3>

              {formError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">{formError}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-warm-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-warm-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1">Address Line 1 *</label>
                  <input
                    type="text"
                    value={formData.address1}
                    onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                    className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1">Address Line 2</label>
                  <input
                    type="text"
                    value={formData.address2}
                    onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                    className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-warm-700 mb-1">City *</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-warm-700 mb-1">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-warm-700 mb-1">Postal Code *</label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-warm-700 mb-1">Country *</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-warm-700 mb-1">Address Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as 'shipping' | 'billing' })}
                      className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="shipping">Shipping</option>
                      <option value="billing">Billing</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isDefault}
                        onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                        className="w-4 h-4 text-amber-600 border-warm-300 rounded focus:ring-amber-500"
                      />
                      <span className="text-sm text-warm-700">Set as default</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseForm} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving} className="flex-1">
                    {isSaving ? 'Saving...' : editingId ? 'Update' : 'Add Address'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface AddressCardProps {
  address: SavedAddress
  onEdit: () => void
  onDelete: () => void
  onSetDefault: () => void
}

function AddressCard({ address, onEdit, onDelete, onSetDefault }: AddressCardProps) {
  return (
    <div className="border border-warm-200 rounded-lg p-4 relative">
      {address.isDefault && (
        <span className="absolute top-2 right-2 bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded">
          Default
        </span>
      )}
      <p className="font-medium text-warm-900">
        {address.firstName} {address.lastName}
      </p>
      {address.company && <p className="text-warm-600 text-sm">{address.company}</p>}
      <p className="text-warm-600 text-sm">{address.address1}</p>
      {address.address2 && <p className="text-warm-600 text-sm">{address.address2}</p>}
      <p className="text-warm-600 text-sm">
        {address.city}, {address.state} {address.postalCode}
      </p>
      <p className="text-warm-600 text-sm">{address.country}</p>
      {address.phone && <p className="text-warm-600 text-sm">{address.phone}</p>}

      <div className="flex gap-2 mt-3 pt-3 border-t border-warm-100">
        <button
          onClick={onEdit}
          className="p-1.5 text-warm-500 hover:text-amber-600 transition-colors"
          title="Edit"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 text-warm-500 hover:text-red-600 transition-colors"
          title="Delete"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
        {!address.isDefault && (
          <button
            onClick={onSetDefault}
            className="p-1.5 text-warm-500 hover:text-green-600 transition-colors"
            title="Set as default"
          >
            <CheckIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
