import { useState, useEffect } from 'react'
import { TrashIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { api } from '../../services/api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import type { InventoryType, InventoryEntry, InventorySummary } from '../../types'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n)

export default function AdminInventory() {
  const [types, setTypes] = useState<InventoryType[]>([])
  const [entries, setEntries] = useState<InventoryEntry[]>([])
  const [summary, setSummary] = useState<InventorySummary>({ totalInvested: 0, currentValue: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Add type form
  const [typeName, setTypeName] = useState('')
  const [typeUnit, setTypeUnit] = useState('')
  const [isAddingType, setIsAddingType] = useState(false)

  // Add entry modal
  const [showModal, setShowModal] = useState(false)
  const [entryTypeId, setEntryTypeId] = useState('')
  const [entryQty, setEntryQty] = useState('')
  const [entryPrice, setEntryPrice] = useState('')
  const [entryNote, setEntryNote] = useState('')
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10))
  const [isSaving, setIsSaving] = useState(false)
  const [modalError, setModalError] = useState('')

  const load = async () => {
    setIsLoading(true)
    try {
      const [typesRes, entriesRes, summaryRes] = await Promise.all([
        api.getInventoryTypes(),
        api.getInventoryEntries(),
        api.getInventorySummary(),
      ])
      if (typesRes.success) setTypes(typesRes.data)
      if (entriesRes.success) setEntries(entriesRes.data)
      if (summaryRes.success) setSummary(summaryRes.data)
    } catch {
      setError('Failed to load inventory')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!typeName.trim()) return
    setIsAddingType(true)
    try {
      const res = await api.createInventoryType({ name: typeName.trim(), unit: typeUnit.trim() || undefined })
      if (res.success) {
        setTypes(prev => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)))
        setTypeName('')
        setTypeUnit('')
      }
    } catch {
      setError('Failed to add type')
    } finally {
      setIsAddingType(false)
    }
  }

  const handleDeleteType = async (id: string) => {
    try {
      await api.deleteInventoryType(id)
      setTypes(prev => prev.filter(t => t.id !== id))
    } catch {
      setError('Delete all entries for this type before removing it.')
    }
  }

  const openModal = () => {
    setEntryTypeId(types[0]?.id || '')
    setEntryQty('')
    setEntryPrice('')
    setEntryNote('')
    setEntryDate(new Date().toISOString().slice(0, 10))
    setModalError('')
    setShowModal(true)
  }

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!entryTypeId || !entryQty || !entryPrice) {
      setModalError('Type, quantity and price are required.')
      return
    }
    setIsSaving(true)
    setModalError('')
    try {
      const res = await api.createInventoryEntry({
        typeId: entryTypeId,
        quantity: Number(entryQty),
        pricePerUnit: Number(entryPrice),
        note: entryNote.trim() || undefined,
        date: entryDate,
      })
      if (res.success) {
        setShowModal(false)
        load()
      }
    } catch {
      setModalError('Failed to add entry')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteEntry = async (id: string) => {
    try {
      await api.deleteInventoryEntry(id)
      setEntries(prev => prev.filter(e => e.id !== id))
      load() // refresh summary
    } catch {
      setError('Failed to delete entry')
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
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl font-semibold text-warm-900">Inventory</h1>
        <Button onClick={openModal} disabled={types.length === 0}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Entry
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-3 underline">Dismiss</button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-soft">
          <p className="text-sm text-warm-500 mb-1">Total Invested (all time)</p>
          <p className="text-3xl font-semibold text-amber-600">{fmt(summary.totalInvested)}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-soft">
          <p className="text-sm text-warm-500 mb-1">Current Inventory Value</p>
          <p className="text-3xl font-semibold text-warm-900">{fmt(summary.currentValue)}</p>
          <p className="text-xs text-warm-400 mt-1">Based on current stock × latest price per type</p>
        </div>
      </div>

      {/* Entries Table */}
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-warm-100">
          <h2 className="font-semibold text-warm-900">Purchase History</h2>
        </div>
        {entries.length === 0 ? (
          <div className="py-16 text-center text-warm-400">
            No entries yet. Add your first inventory purchase.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-warm-50 text-warm-600 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">Type</th>
                  <th className="px-6 py-3 text-right">Quantity</th>
                  <th className="px-6 py-3 text-right">Price / Unit</th>
                  <th className="px-6 py-3 text-right">Total Cost</th>
                  <th className="px-6 py-3 text-left">Note</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {entries.map(entry => (
                  <tr key={entry.id} className="hover:bg-warm-50 transition-colors">
                    <td className="px-6 py-4 text-warm-600">
                      {new Date(entry.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 font-medium text-warm-900">
                      {entry.type.name}
                      {entry.type.unit && <span className="ml-1 text-xs text-warm-400">({entry.type.unit})</span>}
                    </td>
                    <td className="px-6 py-4 text-right text-warm-700">
                      {Number(entry.quantity).toLocaleString('en-IN')}
                      {entry.type.unit && <span className="ml-1 text-xs text-warm-400">{entry.type.unit}</span>}
                    </td>
                    <td className="px-6 py-4 text-right text-warm-700">{fmt(Number(entry.pricePerUnit))}</td>
                    <td className="px-6 py-4 text-right font-semibold text-warm-900">{fmt(Number(entry.totalCost))}</td>
                    <td className="px-6 py-4 text-warm-500 max-w-[200px] truncate">{entry.note || '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="p-1.5 text-warm-400 hover:text-red-600 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manage Types */}
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <h2 className="font-semibold text-warm-900 mb-4">Manage Types</h2>
        <form onSubmit={handleAddType} className="flex gap-3 mb-4">
          <Input
            placeholder="Type name (e.g. Wax, Wicks, Jars)"
            value={typeName}
            onChange={e => setTypeName(e.target.value)}
          />
          <Input
            placeholder="Unit (e.g. kg, pieces)"
            value={typeUnit}
            onChange={e => setTypeUnit(e.target.value)}
            className="w-40"
          />
          <Button type="submit" variant="outline" isLoading={isAddingType}>
            Add
          </Button>
        </form>
        {types.length === 0 ? (
          <p className="text-sm text-warm-400">No types yet. Add one above.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {types.map(t => (
              <div key={t.id} className="flex items-center gap-2 bg-warm-100 px-3 py-1.5 rounded-lg text-sm text-warm-800">
                <span>{t.name}{t.unit ? ` (${t.unit})` : ''}</span>
                <button onClick={() => handleDeleteType(t.id)} className="text-warm-400 hover:text-red-600 transition-colors">
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-warm-100">
              <h2 className="font-semibold text-warm-900">Add Inventory Entry</h2>
              <button onClick={() => setShowModal(false)} className="text-warm-400 hover:text-warm-700">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddEntry} className="p-6 space-y-4">
              {modalError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{modalError}</p>
              )}

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">Type</label>
                <select
                  value={entryTypeId}
                  onChange={e => setEntryTypeId(e.target.value)}
                  className="w-full rounded-lg border border-warm-200 px-3 py-2 text-sm text-warm-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {types.map(t => (
                    <option key={t.id} value={t.id}>{t.name}{t.unit ? ` (${t.unit})` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Quantity"
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="0"
                  value={entryQty}
                  onChange={e => setEntryQty(e.target.value)}
                  required
                />
                <Input
                  label="Price per Unit (₹)"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={entryPrice}
                  onChange={e => setEntryPrice(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center justify-between bg-warm-50 rounded-lg px-4 py-3">
                <span className="text-sm text-warm-600">Total Cost</span>
                <span className="font-semibold text-warm-900">
                  {entryQty && entryPrice ? fmt(Number(entryQty) * Number(entryPrice)) : '—'}
                </span>
              </div>

              <Input
                label="Date"
                type="date"
                value={entryDate}
                onChange={e => setEntryDate(e.target.value)}
              />

              <Input
                label="Note (optional)"
                placeholder="e.g. Supplier name, batch number"
                value={entryNote}
                onChange={e => setEntryNote(e.target.value)}
              />

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1" isLoading={isSaving}>
                  Save Entry
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
