import type { InventoryCategory, InventoryType, InventoryEntry } from '../../types'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n)

export default function InventoryPicker({ label, categories, types, entries, selectedCategoryId, selectedTypeId, onCategoryChange, onTypeChange }: {
  label: string
  categories: InventoryCategory[]
  types: InventoryType[]
  entries: InventoryEntry[]
  selectedCategoryId: string
  selectedTypeId: string
  onCategoryChange: (id: string) => void
  onTypeChange: (id: string) => void
}) {
  const filteredTypes = types.filter((t) => t.categoryId === selectedCategoryId)
  const latestEntry = entries
    .filter((e) => e.typeId === selectedTypeId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-1">{label} — Category</label>
        <select
          value={selectedCategoryId}
          onChange={(e) => { onCategoryChange(e.target.value); onTypeChange('') }}
          className="w-full px-3 py-2 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white text-warm-900"
        >
          <option value="">Select category...</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      {selectedCategoryId && (
        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1">{label} — Type</label>
          {filteredTypes.length === 0 ? (
            <p className="text-xs text-warm-400 py-2">No types in this category</p>
          ) : (
            <select
              value={selectedTypeId}
              onChange={(e) => onTypeChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white text-warm-900"
            >
              <option value="">Select type...</option>
              {filteredTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}{t.unit ? ` (${t.unit})` : ''}</option>
              ))}
            </select>
          )}
        </div>
      )}
      {selectedTypeId && (
        <div className="text-xs rounded-lg px-3 py-2 bg-warm-50 border border-warm-200">
          {latestEntry
            ? <span className="text-warm-700">Last price: <strong className="text-warm-900">{fmt(Number(latestEntry.pricePerUnit))}</strong> / unit</span>
            : <span className="text-amber-600">No price data — add an inventory entry first</span>
          }
        </div>
      )}
    </div>
  )
}
