import { useState, useEffect } from 'react'
import { PlusIcon, TrashIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { api } from '../../services/api'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import type { Discount } from '../../types'

const TYPE_LABELS: Record<string, string> = {
  percentage: 'Percentage',
  fixed_amount: 'Fixed Amount',
  free_shipping: 'Free Shipping',
}

const emptyForm = {
  code: '',
  description: '',
  type: 'percentage' as Discount['type'],
  value: '',
  minPurchase: '',
  maxUses: '',
  startsAt: '',
  endsAt: '',
  isActive: true,
}

type FormState = typeof emptyForm

export default function AdminDiscounts() {
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setIsLoading(true)
    const res = await api.getDiscounts()
    if (res.success) setDiscounts(res.data)
    setIsLoading(false)
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setShowForm(true)
  }

  const openEdit = (d: Discount) => {
    setEditingId(d.id)
    setForm({
      code: d.code,
      description: d.description || '',
      type: d.type,
      value: String(d.value),
      minPurchase: d.minPurchase ? String(d.minPurchase) : '',
      maxUses: d.maxUses ? String(d.maxUses) : '',
      startsAt: d.startsAt ? d.startsAt.slice(0, 16) : '',
      endsAt: d.endsAt ? d.endsAt.slice(0, 16) : '',
      isActive: d.isActive,
    })
    setError('')
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
    setError('')
  }

  const handleSave = async () => {
    if (!form.code.trim()) { setError('Code is required'); return }
    if (form.type !== 'free_shipping' && !form.value) { setError('Value is required'); return }
    setIsSaving(true)
    setError('')
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description || undefined,
        type: form.type,
        value: form.type === 'free_shipping' ? 0 : Number(form.value),
        minPurchase: form.minPurchase ? Number(form.minPurchase) : undefined,
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        startsAt: form.startsAt || undefined,
        endsAt: form.endsAt || undefined,
        isActive: form.isActive,
      }
      if (editingId) {
        await api.updateDiscount(editingId, payload)
      } else {
        await api.createDiscount(payload)
      }
      closeForm()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Delete discount "${code}"?`)) return
    try {
      await api.deleteDiscount(id)
      await load()
    } catch {
      alert('Failed to delete discount')
    }
  }

  const handleToggleActive = async (d: Discount) => {
    try {
      await api.updateDiscount(d.id, { isActive: !d.isActive })
      await load()
    } catch {
      alert('Failed to update')
    }
  }

  const set = (key: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-warm-900">Discounts</h1>
          <p className="text-warm-500 mt-1">Manage coupon codes and promotional discounts.</p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon className="h-4 w-4 mr-1.5" />
          Create Discount
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-warm-100">
              <h2 className="font-semibold text-warm-900">{editingId ? 'Edit Discount' : 'Create Discount'}</h2>
              <button onClick={closeForm} className="p-1 text-warm-400 hover:text-warm-700">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">Code <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => set('code', e.target.value.toUpperCase())}
                  placeholder="e.g. SAVE20"
                  className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Internal note"
                  className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Type + Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1">Type <span className="text-red-500">*</span></label>
                  <select
                    value={form.type}
                    onChange={(e) => set('type', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_amount">Fixed Amount (₹)</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1">
                    Value {form.type === 'percentage' ? '(%)' : form.type === 'fixed_amount' ? '(₹)' : ''}
                  </label>
                  <input
                    type="number"
                    value={form.value}
                    onChange={(e) => set('value', e.target.value)}
                    disabled={form.type === 'free_shipping'}
                    placeholder={form.type === 'free_shipping' ? 'N/A' : form.type === 'percentage' ? '10' : '100'}
                    min="0"
                    className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-warm-50 disabled:text-warm-400"
                  />
                </div>
              </div>

              {/* Min Purchase + Max Uses */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1">Min. Purchase (₹)</label>
                  <input
                    type="number"
                    value={form.minPurchase}
                    onChange={(e) => set('minPurchase', e.target.value)}
                    placeholder="Optional"
                    min="0"
                    className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1">Max Uses</label>
                  <input
                    type="number"
                    value={form.maxUses}
                    onChange={(e) => set('maxUses', e.target.value)}
                    placeholder="Unlimited"
                    min="1"
                    className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1">Starts At</label>
                  <input
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(e) => set('startsAt', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1">Ends At</label>
                  <input
                    type="datetime-local"
                    value={form.endsAt}
                    onChange={(e) => set('endsAt', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Active */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => set('isActive', !form.isActive)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${form.isActive ? 'bg-amber-500' : 'bg-warm-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
                <span className="text-sm font-medium text-warm-700">Active</span>
              </label>

              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-warm-100">
              <Button variant="outline" size="sm" onClick={closeForm} className="flex-1">Cancel</Button>
              <Button size="sm" onClick={handleSave} isLoading={isSaving} className="flex-1">
                {editingId ? 'Save Changes' : 'Create Discount'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-soft overflow-hidden">
          {discounts.length === 0 ? (
            <div className="text-center py-16 text-warm-400">
              <p className="mb-4">No discounts yet.</p>
              <Button size="sm" onClick={openCreate}>
                <PlusIcon className="h-4 w-4 mr-1.5" />
                Create your first discount
              </Button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-warm-50 border-b border-warm-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-warm-700">Code</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-warm-700">Type</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-warm-700">Value</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-warm-700">Uses</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-warm-700">Expiry</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-warm-700">Status</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-warm-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {discounts.map((d) => (
                  <tr key={d.id} className="border-b border-warm-100 hover:bg-warm-50">
                    <td className="px-6 py-4">
                      <span className="font-mono font-semibold text-warm-900 text-sm">{d.code}</span>
                      {d.description && <p className="text-xs text-warm-400 mt-0.5">{d.description}</p>}
                    </td>
                    <td className="px-6 py-4 text-sm text-warm-600">{TYPE_LABELS[d.type]}</td>
                    <td className="px-6 py-4 text-sm font-medium text-warm-900">
                      {d.type === 'percentage' ? `${d.value}%`
                        : d.type === 'fixed_amount' ? `₹${d.value}`
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-warm-600">
                      {d.usedCount}{d.maxUses ? ` / ${d.maxUses}` : ''}
                    </td>
                    <td className="px-6 py-4 text-sm text-warm-600">
                      {d.endsAt ? new Date(d.endsAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleToggleActive(d)} className="flex items-center gap-1.5">
                        <div className={`w-8 h-5 rounded-full transition-colors ${d.isActive ? 'bg-amber-500' : 'bg-warm-300'}`}>
                          <div className={`mt-0.5 w-4 h-4 rounded-full bg-white transition-transform ${d.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </div>
                        <span className={`text-xs font-medium ${d.isActive ? 'text-amber-600' : 'text-warm-400'}`}>
                          {d.isActive ? 'Active' : 'Off'}
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(d)}
                          className="p-2 text-warm-400 hover:text-amber-600 transition-colors"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(d.id, d.code)}
                          className="p-2 text-warm-400 hover:text-red-600 transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
