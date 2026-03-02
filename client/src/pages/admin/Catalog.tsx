import { useState, useEffect } from 'react'
import { PlusIcon, TrashIcon, PencilIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import { api } from '../../services/api'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import type { ProductBase, Fragrance, Color } from '../../types'

type Tab = 'bases' | 'fragrances' | 'colors'

// ─── Base Management ──────────────────────────────────────────────────────────

function BasesPanel() {
  const [bases, setBases] = useState<ProductBase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)

  // form state
  const [name, setName] = useState('')
  const [sizesText, setSizesText] = useState('') // comma-separated

  const [newName, setNewName] = useState('')
  const [newSizesText, setNewSizesText] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const load = async () => {
    setIsLoading(true)
    const res = await api.getBases()
    if (res.success) setBases(res.data)
    setIsLoading(false)
  }

  useEffect(() => { load() }, [])

  const startEdit = (base: ProductBase) => {
    setEditingId(base.id)
    setName(base.name)
    setSizesText(base.sizes.join(', '))
  }

  const cancelEdit = () => {
    setEditingId(null)
    setName('')
    setSizesText('')
  }

  const saveEdit = async () => {
    if (!editingId) return
    setIsSaving(true)
    try {
      const sizes = sizesText.split(',').map((s) => s.trim()).filter(Boolean)
      await api.updateBase(editingId, { name, sizes })
      setEditingId(null)
      await load()
    } catch {
      alert('Failed to update base')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAdd = async () => {
    const sizes = newSizesText.split(',').map((s) => s.trim()).filter(Boolean)
    if (!newName || sizes.length === 0) {
      alert('Provide a name and at least one size')
      return
    }
    setIsAdding(true)
    try {
      await api.createBase({ name: newName, sizes })
      setNewName('')
      setNewSizesText('')
      await load()
    } catch {
      alert('Failed to create base')
    } finally {
      setIsAdding(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete base "${name}"?`)) return
    try {
      await api.deleteBase(id)
      await load()
    } catch {
      alert('Failed to delete base')
    }
  }

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>

  return (
    <div className="space-y-6">
      {/* Add new */}
      <div className="bg-white rounded-xl p-6 shadow-soft">
        <h3 className="font-semibold text-warm-900 mb-4">Add New Base</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">Base Name</label>
            <input
              type="text"
              placeholder="e.g. Jar, Bowl, Tealight"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-warm-700 mb-1">
              Sizes <span className="text-warm-400 font-normal">(comma-separated)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 60ml, 100ml, 200ml"
              value={newSizesText}
              onChange={(e) => setNewSizesText(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={handleAdd} isLoading={isAdding} size="sm">
            <PlusIcon className="h-4 w-4 mr-1.5" />
            Add Base
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-soft overflow-hidden">
        {bases.length === 0 ? (
          <div className="text-center py-12 text-warm-400">No bases added yet.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-warm-50 border-b border-warm-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-warm-700">Name</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-warm-700">Sizes</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-warm-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bases.map((base) => (
                <tr key={base.id} className="border-b border-warm-100 hover:bg-warm-50">
                  <td className="px-6 py-4">
                    {editingId === base.id ? (
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-amber-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 w-full max-w-[160px]"
                      />
                    ) : (
                      <span className="font-medium text-warm-900">{base.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === base.id ? (
                      <input
                        type="text"
                        value={sizesText}
                        onChange={(e) => setSizesText(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-amber-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 w-full"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {base.sizes.map((s) => (
                          <span key={s} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      {editingId === base.id ? (
                        <>
                          <button
                            onClick={saveEdit}
                            disabled={isSaving}
                            className="p-2 text-green-600 hover:text-green-700 transition-colors"
                          >
                            <CheckIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-2 text-warm-400 hover:text-warm-600 transition-colors"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(base)}
                            className="p-2 text-warm-400 hover:text-amber-600 transition-colors"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(base.id, base.name)}
                            className="p-2 text-warm-400 hover:text-red-600 transition-colors"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─── Simple list panel (shared by Fragrances + Colors) ────────────────────────

interface SimpleItem { id: string; name: string; hex?: string }

interface SimpleListPanelProps {
  items: SimpleItem[]
  isLoading: boolean
  onAdd: (name: string, hex?: string) => Promise<void>
  onDelete: (id: string, name: string) => Promise<void>
  namePlaceholder: string
  withHex?: boolean
}

function SimpleListPanel({ items, isLoading, onAdd, onDelete, namePlaceholder, withHex }: SimpleListPanelProps) {
  const [newName, setNewName] = useState('')
  const [newHex, setNewHex] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleAdd = async () => {
    if (!newName.trim()) return
    setIsAdding(true)
    try {
      await onAdd(newName.trim(), withHex && newHex ? newHex : undefined)
      setNewName('')
      setNewHex('')
    } finally {
      setIsAdding(false)
    }
  }

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>

  return (
    <div className="space-y-6">
      {/* Add */}
      <div className="bg-white rounded-xl p-6 shadow-soft">
        <h3 className="font-semibold text-warm-900 mb-4">Add New</h3>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder={namePlaceholder}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1 px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          {withHex && (
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={newHex || '#ffffff'}
                onChange={(e) => setNewHex(e.target.value)}
                className="w-10 h-10 rounded-lg border border-warm-200 cursor-pointer p-0.5"
                title="Pick color"
              />
              <span className="text-xs text-warm-400 w-16">{newHex || 'optional'}</span>
            </div>
          )}
          <Button onClick={handleAdd} isLoading={isAdding} size="sm">
            <PlusIcon className="h-4 w-4 mr-1.5" />
            Add
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-soft overflow-hidden">
        {items.length === 0 ? (
          <div className="text-center py-12 text-warm-400">None added yet.</div>
        ) : (
          <div className="divide-y divide-warm-100">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-6 py-4 hover:bg-warm-50">
                <div className="flex items-center gap-3">
                  {item.hex && (
                    <span
                      className="w-6 h-6 rounded-full border border-warm-200 flex-shrink-0"
                      style={{ background: item.hex }}
                    />
                  )}
                  <span className="font-medium text-warm-900">{item.name}</span>
                  {item.hex && (
                    <span className="text-xs text-warm-400 font-mono">{item.hex}</span>
                  )}
                </div>
                <button
                  onClick={() => onDelete(item.id, item.name)}
                  className="p-2 text-warm-400 hover:text-red-600 transition-colors"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Catalog Page ────────────────────────────────────────────────────────

export default function AdminCatalog() {
  const [tab, setTab] = useState<Tab>('bases')

  const [fragrances, setFragrances] = useState<Fragrance[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [isLoadingFragrances, setIsLoadingFragrances] = useState(true)
  const [isLoadingColors, setIsLoadingColors] = useState(true)

  const loadFragrances = async () => {
    setIsLoadingFragrances(true)
    const res = await api.getFragrances()
    if (res.success) setFragrances(res.data)
    setIsLoadingFragrances(false)
  }

  const loadColors = async () => {
    setIsLoadingColors(true)
    const res = await api.getColors()
    if (res.success) setColors(res.data)
    setIsLoadingColors(false)
  }

  useEffect(() => {
    loadFragrances()
    loadColors()
  }, [])

  const addFragrance = async (name: string) => {
    await api.createFragrance(name)
    await loadFragrances()
  }

  const deleteFragrance = async (id: string, name: string) => {
    if (!confirm(`Delete fragrance "${name}"?`)) return
    await api.deleteFragrance(id)
    await loadFragrances()
  }

  const addColor = async (name: string, hex?: string) => {
    await api.createColor({ name, hex })
    await loadColors()
  }

  const deleteColor = async (id: string, name: string) => {
    if (!confirm(`Delete color "${name}"?`)) return
    await api.deleteColor(id)
    await loadColors()
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'bases', label: 'Bases' },
    { id: 'fragrances', label: 'Fragrances' },
    { id: 'colors', label: 'Colors' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold text-warm-900">Catalog</h1>
        <p className="text-warm-500 mt-1">Manage bases, fragrances, and colors used in your products.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-warm-100 rounded-xl p-1 w-fit mb-8">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-white text-warm-900 shadow-sm'
                : 'text-warm-500 hover:text-warm-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'bases' && <BasesPanel />}

      {tab === 'fragrances' && (
        <SimpleListPanel
          items={fragrances}
          isLoading={isLoadingFragrances}
          onAdd={addFragrance}
          onDelete={deleteFragrance}
          namePlaceholder="e.g. Lavender, Rose, Vanilla…"
        />
      )}

      {tab === 'colors' && (
        <SimpleListPanel
          items={colors}
          isLoading={isLoadingColors}
          onAdd={addColor}
          onDelete={deleteColor}
          namePlaceholder="e.g. White, Ivory, Blush…"
          withHex
        />
      )}
    </div>
  )
}
