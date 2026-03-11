import { useState, useEffect } from 'react'
import { TrashIcon, PlusIcon, MinusIcon, XMarkIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { api } from '../../services/api'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import type { InventoryType, InventoryEntry } from '../../types'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n)

interface StockRow {
  type: InventoryType
  quantity: number
  value: number
  latestPrice: number
  entries: InventoryEntry[]
}

function computeStock(types: InventoryType[], entries: InventoryEntry[]): StockRow[] {
  return types.map(type => {
    const typeEntries = entries.filter(e => e.typeId === type.id)
    const quantity = typeEntries.reduce((sum, e) => sum + Number(e.quantity), 0)
    const totalCost = typeEntries.reduce((sum, e) => sum + Number(e.totalCost), 0)
    const purchaseEntries = typeEntries
      .filter(e => Number(e.quantity) > 0)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    const lastEntry = purchaseEntries.length > 0 ? purchaseEntries[purchaseEntries.length - 1] : null
    const latestPrice = lastEntry ? Number(lastEntry.pricePerUnit) : 0
    return { type, quantity, value: totalCost, latestPrice, entries: typeEntries }
  })
}

type ModalMode = 'add' | 'use'

export default function AdminInventory() {
  const [types, setTypes] = useState<InventoryType[]>([])
  const [entries, setEntries] = useState<InventoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Purchase history toggle
  const [showHistory, setShowHistory] = useState(false)
  const [showManageTypes, setShowManageTypes] = useState(false)

  // Add type form
  const [typeName, setTypeName] = useState('')
  const [typeUnit, setTypeUnit] = useState('')
  const [isAddingType, setIsAddingType] = useState(false)

  // Expanded row for entry history
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  // Stock adjustment modal
  const [modal, setModal] = useState<{ mode: ModalMode; typeId: string } | null>(null)
  const [entryQty, setEntryQty] = useState('')
  const [entryPrice, setEntryPrice] = useState('')
  const [entryNote, setEntryNote] = useState('')
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10))
  const [isSaving, setIsSaving] = useState(false)
  const [modalError, setModalError] = useState('')

  const load = async () => {
    setIsLoading(true)
    try {
      const [typesRes, entriesRes] = await Promise.all([
        api.getInventoryTypes(),
        api.getInventoryEntries(),
      ])
      if (typesRes.success) setTypes(typesRes.data)
      if (entriesRes.success) setEntries(entriesRes.data)
    } catch {
      setError('Failed to load inventory')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const stock = computeStock(types, entries)
  const totalValue = stock.reduce((sum, r) => sum + r.value, 0)
  const totalInvested = entries.reduce((sum, e) => sum + Number(e.totalCost), 0)

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

  const openModal = (mode: ModalMode, typeId: string) => {
    setModal({ mode, typeId })
    setEntryQty('')
    setEntryPrice(mode === 'add' ? '' : '0')
    setEntryNote('')
    setEntryDate(new Date().toISOString().slice(0, 10))
    setModalError('')
  }

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modal) return
    if (!entryQty || Number(entryQty) <= 0) {
      setModalError('Enter a valid quantity.')
      return
    }
    if (modal.mode === 'add' && (!entryPrice || Number(entryPrice) < 0)) {
      setModalError('Enter a valid price.')
      return
    }
    setIsSaving(true)
    setModalError('')
    try {
      const qty = modal.mode === 'use' ? -Number(entryQty) : Number(entryQty)
      const price = modal.mode === 'use' ? 0 : Number(entryPrice)
      const res = await api.createInventoryEntry({
        typeId: modal.typeId,
        quantity: qty,
        pricePerUnit: price,
        note: entryNote.trim() || undefined,
        date: entryDate,
      })
      if (res.success) {
        setModal(null)
        load()
      }
    } catch {
      setModalError('Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteEntry = async (id: string) => {
    try {
      await api.deleteInventoryEntry(id)
      setEntries(prev => prev.filter(e => e.id !== id))
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

  const modalType = modal ? types.find(t => t.id === modal.typeId) : null

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl font-semibold text-warm-900">Inventory</h1>
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
          <p className="text-sm text-warm-500 mb-1">Current Inventory Value</p>
          <p className="text-3xl font-semibold text-amber-600">{fmt(totalValue)}</p>
          <p className="text-xs text-warm-400 mt-1">Total actual cost across all purchases</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-soft">
          <p className="text-sm text-warm-500 mb-1">Total Invested (all time)</p>
          <p className="text-3xl font-semibold text-warm-900">{fmt(totalInvested)}</p>
        </div>
      </div>

      {/* Current Inventory Table */}
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-warm-100">
          <h2 className="font-semibold text-warm-900">Current Inventory</h2>
        </div>
        {stock.length === 0 ? (
          <div className="py-16 text-center text-warm-400">
            No inventory types yet. Add types below to get started.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-warm-50 text-warm-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-6 py-3 text-left">Item</th>
                <th className="px-6 py-3 text-right">In Stock</th>
                <th className="px-6 py-3 text-right">Price / Unit</th>
                <th className="px-6 py-3 text-right">Value</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100">
              {stock.map(row => (
                <>
                  <tr key={row.type.id} className="hover:bg-warm-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-warm-900">
                      {row.type.name}
                      {row.type.unit && <span className="ml-1 text-xs text-warm-400 font-normal">({row.type.unit})</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-semibold ${row.quantity <= 0 ? 'text-red-500' : 'text-warm-900'}`}>
                        {Number(row.quantity).toLocaleString('en-IN')}
                      </span>
                      {row.type.unit && <span className="ml-1 text-xs text-warm-400">{row.type.unit}</span>}
                    </td>
                    <td className="px-6 py-4 text-right text-warm-600">
                      <button
                        onClick={() => setExpandedRow(expandedRow === row.type.id ? null : row.type.id)}
                        className="inline-flex items-center gap-1 hover:text-amber-600 transition-colors"
                      >
                        {row.latestPrice > 0 ? fmt(row.latestPrice) : '—'}
                        {row.entries.length > 0 && (
                          expandedRow === row.type.id
                            ? <ChevronUpIcon className="h-3.5 w-3.5" />
                            : <ChevronDownIcon className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-warm-900">
                      {row.value > 0 ? fmt(row.value) : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal('add', row.type.id)}
                          className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 border border-amber-300 hover:border-amber-400 px-2 py-1 rounded-lg transition-colors"
                        >
                          <PlusIcon className="h-3.5 w-3.5" /> Add Stock
                        </button>
                        <button
                          onClick={() => openModal('use', row.type.id)}
                          className="flex items-center gap-1 text-xs text-warm-500 hover:text-warm-700 border border-warm-200 hover:border-warm-400 px-2 py-1 rounded-lg transition-colors"
                        >
                          <MinusIcon className="h-3.5 w-3.5" /> Use
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRow === row.type.id && (
                    <tr key={`${row.type.id}-history`} className="bg-warm-50">
                      <td colSpan={5} className="px-8 py-3">
                        <div className="text-xs text-warm-500 font-medium uppercase tracking-wide mb-2">Purchase History</div>
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-warm-400">
                              <th className="text-left pb-1">Date</th>
                              <th className="text-right pb-1">Qty</th>
                              <th className="text-right pb-1">Price/Unit</th>
                              <th className="text-right pb-1">Total</th>
                              <th className="text-left pb-1 pl-4">Note</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-warm-100">
                            {[...row.entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(e => (
                              <tr key={e.id} className="text-warm-700">
                                <td className="py-1.5">{new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                <td className={`py-1.5 text-right font-medium ${Number(e.quantity) < 0 ? 'text-red-500' : ''}`}>
                                  {Number(e.quantity) > 0 ? '+' : ''}{Number(e.quantity).toLocaleString('en-IN')}
                                </td>
                                <td className="py-1.5 text-right">{Number(e.pricePerUnit) > 0 ? fmt(Number(e.pricePerUnit)) : '—'}</td>
                                <td className="py-1.5 text-right font-medium">{Number(e.totalCost) !== 0 ? fmt(Number(e.totalCost)) : '—'}</td>
                                <td className="py-1.5 pl-4 text-warm-400">{e.note || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Purchase History (collapsible) */}
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden mb-6">
        <button
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-warm-50 transition-colors"
          onClick={() => setShowHistory(v => !v)}
        >
          <span className="font-semibold text-warm-900">Purchase History</span>
          {showHistory ? <ChevronUpIcon className="h-5 w-5 text-warm-400" /> : <ChevronDownIcon className="h-5 w-5 text-warm-400" />}
        </button>
        {showHistory && (
          entries.length === 0 ? (
            <div className="py-12 text-center text-warm-400 border-t border-warm-100">No entries yet.</div>
          ) : (
            <div className="overflow-x-auto border-t border-warm-100">
              <table className="w-full text-sm">
                <thead className="bg-warm-50 text-warm-600 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-6 py-3 text-left">Date</th>
                    <th className="px-6 py-3 text-left">Type</th>
                    <th className="px-6 py-3 text-right">Qty</th>
                    <th className="px-6 py-3 text-right">Price / Unit</th>
                    <th className="px-6 py-3 text-right">Total Cost</th>
                    <th className="px-6 py-3 text-left">Note</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100">
                  {[...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(entry => (
                    <tr key={entry.id} className="hover:bg-warm-50 transition-colors">
                      <td className="px-6 py-3 text-warm-600">
                        {new Date(entry.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-3 font-medium text-warm-900">{entry.type.name}</td>
                      <td className="px-6 py-3 text-right">
                        <span className={Number(entry.quantity) < 0 ? 'text-red-500' : 'text-warm-700'}>
                          {Number(entry.quantity) > 0 ? '+' : ''}{Number(entry.quantity).toLocaleString('en-IN')}
                          {entry.type.unit && <span className="ml-1 text-xs text-warm-400">{entry.type.unit}</span>}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right text-warm-700">
                        {Number(entry.pricePerUnit) > 0 ? fmt(Number(entry.pricePerUnit)) : '—'}
                      </td>
                      <td className="px-6 py-3 text-right font-semibold text-warm-900">
                        {Number(entry.totalCost) !== 0 ? fmt(Number(entry.totalCost)) : '—'}
                      </td>
                      <td className="px-6 py-3 text-warm-500 max-w-[180px] truncate">{entry.note || '—'}</td>
                      <td className="px-6 py-3 text-right">
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
          )
        )}
      </div>

      {/* Manage Types */}
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden mb-6">
        <button
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-warm-50 transition-colors"
          onClick={() => setShowManageTypes(v => !v)}
        >
          <span className="font-semibold text-warm-900">Manage Item Types</span>
          {showManageTypes ? <ChevronUpIcon className="h-5 w-5 text-warm-400" /> : <ChevronDownIcon className="h-5 w-5 text-warm-400" />}
        </button>
        {showManageTypes && (
          <div className="border-t border-warm-100 p-6">
            <form onSubmit={handleAddType} className="flex gap-3 mb-4">
              <Input
                placeholder="Type name (e.g. Wax, Wicks, Jars)"
                value={typeName}
                onChange={e => setTypeName(e.target.value)}
              />
              <Input
                placeholder="Unit (optional)"
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
              <div className="divide-y divide-warm-100 border border-warm-100 rounded-xl overflow-hidden">
                {types.map(t => (
                  <div key={t.id} className="flex items-center justify-between px-4 py-3 hover:bg-warm-50 transition-colors">
                    <span className="text-sm text-warm-800">{t.name}{t.unit ? <span className="ml-1 text-xs text-warm-400">({t.unit})</span> : ''}</span>
                    <button onClick={() => handleDeleteType(t.id)} className="p-1.5 text-warm-400 hover:text-red-600 transition-colors">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Stock / Record Use Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-warm-100">
              <h2 className="font-semibold text-warm-900">
                {modal.mode === 'add' ? 'Add Stock' : 'Record Usage'}
                {modalType && <span className="ml-2 text-warm-500 font-normal">— {modalType.name}</span>}
              </h2>
              <button onClick={() => setModal(null)} className="text-warm-400 hover:text-warm-700">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEntry} className="p-6 space-y-4">
              {modalError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{modalError}</p>
              )}

              <Input
                label={`Quantity${modalType?.unit ? ` (${modalType.unit})` : ''}`}
                type="number"
                step="0.001"
                min="0.001"
                placeholder="0"
                value={entryQty}
                onChange={e => setEntryQty(e.target.value)}
                required
              />

              {modal.mode === 'add' && (
                <>
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
                  {entryQty && entryPrice && (
                    <div className="flex items-center justify-between bg-warm-50 rounded-lg px-4 py-3">
                      <span className="text-sm text-warm-600">Total Cost</span>
                      <span className="font-semibold text-warm-900">{fmt(Number(entryQty) * Number(entryPrice))}</span>
                    </div>
                  )}
                </>
              )}

              <Input
                label="Date"
                type="date"
                value={entryDate}
                onChange={e => setEntryDate(e.target.value)}
              />

              <Input
                label="Note (optional)"
                placeholder={modal.mode === 'add' ? 'Supplier, batch...' : 'Reason for usage...'}
                value={entryNote}
                onChange={e => setEntryNote(e.target.value)}
              />

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1" isLoading={isSaving}>
                  {modal.mode === 'add' ? 'Add Stock' : 'Record Usage'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setModal(null)}>
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
