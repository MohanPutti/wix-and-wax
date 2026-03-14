import { useState, useEffect } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { api } from '../../services/api'
import Spinner from '../../components/ui/Spinner'
import type { InventoryCategory, InventoryType, InventoryEntry } from '../../types'

// ─── Types ────────────────────────────────────────────────────────────────────

const WAX_TYPES = ['Soy', 'Gel', 'Mix'] as const
type WaxType = (typeof WAX_TYPES)[number]

interface Config {
  waxPrices: Record<WaxType, number>
  fragrancePricePerGram: number
  colourPricePerGram: number
  wickCost: number
}

const DEFAULT_CONFIG: Config = {
  waxPrices: { Soy: 0.3, Gel: 0.25, Mix: 0.28 },
  fragrancePricePerGram: 1.5,
  colourPricePerGram: 0.5,
  wickCost: 1,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n)

function loadConfig(): Config {
  try {
    const saved = localStorage.getItem('candle-calculator-config')
    if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) }
  } catch {}
  return DEFAULT_CONFIG
}

// ─── Slider ───────────────────────────────────────────────────────────────────

function Slider({
  label, value, min, max, step, onChange, format,
}: {
  label: string; value: number; min: number; max: number; step: number
  onChange: (v: number) => void; format: (v: number) => string
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-sm font-medium text-warm-700">{label}</label>
        <span className="text-sm font-bold text-amber-600">{format(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-warm-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
      />
      <div className="flex justify-between text-xs text-warm-400 mt-1">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  )
}

// ─── Inventory Picker ─────────────────────────────────────────────────────────

function InventoryPicker({
  label, categories, types, entries,
  selectedCategoryId, selectedTypeId,
  onCategoryChange, onTypeChange,
}: {
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
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
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
            ? <span className="text-warm-700">Last price: <strong className="text-warm-900">{formatCurrency(latestEntry.pricePerUnit)}</strong> / unit</span>
            : <span className="text-amber-600">No price data — add an inventory entry first</span>
          }
        </div>
      )}
    </div>
  )
}

// ─── Cost Row ─────────────────────────────────────────────────────────────────

function CostRow({ label, value, sub, highlight }: { label: string; value: number | null; sub?: string; highlight?: boolean }) {
  return (
    <div className={`flex justify-between items-start py-2.5 ${highlight ? 'border-t-2 border-warm-200 mt-1' : 'border-b border-warm-100'}`}>
      <div>
        <p className={`text-sm ${highlight ? 'font-bold text-warm-900' : 'text-warm-700'}`}>{label}</p>
        {sub && <p className="text-xs text-warm-400">{sub}</p>}
      </div>
      <p className={`text-sm font-semibold ${highlight ? 'text-lg font-bold text-warm-900' : value === null ? 'text-amber-500' : 'text-warm-900'}`}>
        {value === null ? 'No price' : formatCurrency(value)}
      </p>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AdminCalculator() {
  const [config, setConfig] = useState<Config>(loadConfig)
  const [showConfig, setShowConfig] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Inventory data
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [types, setTypes] = useState<InventoryType[]>([])
  const [entries, setEntries] = useState<InventoryEntry[]>([])

  // Calculator inputs
  const [includeContainer, setIncludeContainer] = useState(false)
  const [containerCategoryId, setContainerCategoryId] = useState('')
  const [containerTypeId, setContainerTypeId] = useState('')
  const [weight, setWeight] = useState(200)
  const [waxType, setWaxType] = useState<WaxType>('Soy')
  const [fragrancePct, setFragrancePct] = useState(2)
  const [colourPct, setColourPct] = useState(2)
  const [includeWick, setIncludeWick] = useState(true)
  const [includePackaging, setIncludePackaging] = useState(false)
  const [packagingCategoryId, setPackagingCategoryId] = useState('')
  const [packagingTypeId, setPackagingTypeId] = useState('')
  const [multiplier, setMultiplier] = useState(2.5)

  useEffect(() => {
    Promise.all([
      api.getInventoryCategories(),
      api.getInventoryTypes(),
      api.getInventoryEntries(),
    ])
      .then(([catRes, typRes, entRes]) => {
        if (catRes.success) setCategories(catRes.data)
        if (typRes.success) setTypes(typRes.data)
        if (entRes.success) setEntries(entRes.data)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    localStorage.setItem('candle-calculator-config', JSON.stringify(config))
  }, [config])

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const latestPrice = (typeId: string): number | null => {
    if (!typeId) return null
    const sorted = entries
      .filter((e) => e.typeId === typeId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return sorted.length > 0 ? sorted[0].pricePerUnit : null
  }

  // ─── Calculations ────────────────────────────────────────────────────────────

  const containerCost = includeContainer ? latestPrice(containerTypeId) : 0
  const waxCost       = weight * (config.waxPrices[waxType] ?? 0)
  const fragranceCost = (fragrancePct / 100) * weight * config.fragrancePricePerGram
  const colourCost    = (colourPct / 100) * weight * config.colourPricePerGram
  const wickCost      = includeWick ? config.wickCost : 0
  const packagingCost = includePackaging ? latestPrice(packagingTypeId) : 0

  const hasMissingPrice =
    (includeContainer && containerCost === null) ||
    (includePackaging && packagingCost === null)

  const totalCost = hasMissingPrice
    ? null
    : (containerCost ?? 0) + waxCost + fragranceCost + colourCost + wickCost + (packagingCost ?? 0)

  const sellingPrice = totalCost !== null ? totalCost * multiplier : null
  const profit       = sellingPrice !== null && totalCost !== null ? sellingPrice - totalCost : null
  const marginPct    = sellingPrice !== null && sellingPrice > 0 && profit !== null
    ? (profit / sellingPrice) * 100
    : null

  // ─── Config update helpers ───────────────────────────────────────────────────

  const updateWaxPrice = (type: WaxType, val: string) =>
    setConfig((c) => ({ ...c, waxPrices: { ...c.waxPrices, [type]: parseFloat(val) || 0 } }))

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold text-warm-900">Candle Cost Calculator</h1>
        <p className="text-warm-500 text-sm mt-1">Calculate production cost and ideal selling price for a candle</p>
      </div>

      {/* Config Panel */}
      <div className="bg-white rounded-xl shadow-soft mb-6">
        <button
          onClick={() => setShowConfig((v) => !v)}
          className="w-full flex justify-between items-center px-6 py-4 text-left"
        >
          <div>
            <p className="font-semibold text-warm-900">Configure Ingredient Prices</p>
            <p className="text-xs text-warm-400 mt-0.5">Set price per gram for wax types, fragrance, and colour</p>
          </div>
          {showConfig
            ? <ChevronUpIcon className="h-5 w-5 text-warm-400" />
            : <ChevronDownIcon className="h-5 w-5 text-warm-400" />
          }
        </button>

        {showConfig && (
          <div className="px-6 pb-6 border-t border-warm-100">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              {/* Wax prices */}
              {WAX_TYPES.map((wt) => (
                <div key={wt}>
                  <label className="block text-sm font-medium text-warm-700 mb-1">
                    {wt} Wax — ₹ per gram
                  </label>
                  <input
                    type="number" min="0" step="0.01"
                    value={config.waxPrices[wt]}
                    onChange={(e) => updateWaxPrice(wt, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">Fragrance — ₹ per gram</label>
                <input
                  type="number" min="0" step="0.01"
                  value={config.fragrancePricePerGram}
                  onChange={(e) => setConfig((c) => ({ ...c, fragrancePricePerGram: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">Colour — ₹ per gram</label>
                <input
                  type="number" min="0" step="0.01"
                  value={config.colourPricePerGram}
                  onChange={(e) => setConfig((c) => ({ ...c, colourPricePerGram: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">Wick cost — ₹ per piece</label>
                <input
                  type="number" min="0" step="0.5"
                  value={config.wickCost}
                  onChange={(e) => setConfig((c) => ({ ...c, wickCost: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-warm-400 mt-4">Prices are saved automatically in your browser.</p>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ── Left: Inputs ── */}
        <div className="space-y-4">

          {/* Container */}
          <div className="bg-white rounded-xl shadow-soft p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-warm-900">Container</p>
                <p className="text-xs text-warm-400">Optional — e.g. glass jar, tin</p>
              </div>
              <button
                onClick={() => { setIncludeContainer((v) => !v); setContainerCategoryId(''); setContainerTypeId('') }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${includeContainer ? 'bg-amber-500' : 'bg-warm-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${includeContainer ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            {includeContainer && (
              <InventoryPicker
                label="Container"
                categories={categories} types={types} entries={entries}
                selectedCategoryId={containerCategoryId}
                selectedTypeId={containerTypeId}
                onCategoryChange={setContainerCategoryId}
                onTypeChange={setContainerTypeId}
              />
            )}
          </div>

          {/* Wax */}
          <div className="bg-white rounded-xl shadow-soft p-6 space-y-4">
            <p className="font-semibold text-warm-900">Wax</p>
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-2">Weight (grams)</label>
              <input
                type="number" min="1" step="1" value={weight}
                onChange={(e) => setWeight(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-2">Wax Type</label>
              <div className="grid grid-cols-3 gap-2">
                {WAX_TYPES.map((wt) => (
                  <button
                    key={wt}
                    onClick={() => setWaxType(wt)}
                    className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                      waxType === wt
                        ? 'bg-amber-500 text-white'
                        : 'bg-warm-100 text-warm-700 hover:bg-warm-200'
                    }`}
                  >
                    {wt}
                  </button>
                ))}
              </div>
              <p className="text-xs text-warm-400 mt-1">
                Price: {formatCurrency(config.waxPrices[waxType])}/g → cost for {weight}g: {formatCurrency(waxCost)}
              </p>
            </div>
          </div>

          {/* Fragrance & Colour */}
          <div className="bg-white rounded-xl shadow-soft p-6 space-y-5">
            <p className="font-semibold text-warm-900">Fragrance &amp; Colour</p>
            <Slider
              label="Fragrance %"
              value={fragrancePct} min={1} max={5} step={0.5}
              onChange={setFragrancePct}
              format={(v) => `${v}%`}
            />
            <p className="text-xs text-warm-400 -mt-2">
              {fragrancePct}% of {weight}g = {(fragrancePct / 100 * weight).toFixed(1)}g @ {formatCurrency(config.fragrancePricePerGram)}/g = {formatCurrency(fragranceCost)}
            </p>
            <Slider
              label="Colour %"
              value={colourPct} min={1} max={5} step={0.5}
              onChange={setColourPct}
              format={(v) => `${v}%`}
            />
            <p className="text-xs text-warm-400 -mt-2">
              {colourPct}% of {weight}g = {(colourPct / 100 * weight).toFixed(1)}g @ {formatCurrency(config.colourPricePerGram)}/g = {formatCurrency(colourCost)}
            </p>
          </div>

          {/* Wick */}
          <div className="bg-white rounded-xl shadow-soft p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-warm-900">Wick</p>
                <p className="text-xs text-warm-400">{formatCurrency(config.wickCost)} per piece</p>
              </div>
              <button
                onClick={() => setIncludeWick((v) => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${includeWick ? 'bg-amber-500' : 'bg-warm-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${includeWick ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          {/* Packaging */}
          <div className="bg-white rounded-xl shadow-soft p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-warm-900">Packaging</p>
                <p className="text-xs text-warm-400">Box, wrap, label, etc.</p>
              </div>
              <button
                onClick={() => { setIncludePackaging((v) => !v); setPackagingCategoryId(''); setPackagingTypeId('') }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${includePackaging ? 'bg-amber-500' : 'bg-warm-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${includePackaging ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            {includePackaging && (
              <InventoryPicker
                label="Packaging"
                categories={categories} types={types} entries={entries}
                selectedCategoryId={packagingCategoryId}
                selectedTypeId={packagingTypeId}
                onCategoryChange={setPackagingCategoryId}
                onTypeChange={setPackagingTypeId}
              />
            )}
          </div>
        </div>

        {/* ── Right: Results ── */}
        <div className="space-y-4">

          {/* Cost Breakdown */}
          <div className="bg-white rounded-xl shadow-soft p-6">
            <p className="font-semibold text-warm-900 mb-4">Cost Breakdown</p>
            <div className="space-y-0">
              {includeContainer && (
                <CostRow
                  label="Container"
                  value={containerCost as number | null}
                  sub={containerTypeId ? types.find((t) => t.id === containerTypeId)?.name : undefined}
                />
              )}
              <CostRow
                label={`Wax (${waxType})`}
                value={waxCost}
                sub={`${weight}g @ ${formatCurrency(config.waxPrices[waxType])}/g`}
              />
              <CostRow
                label="Fragrance"
                value={fragranceCost}
                sub={`${fragrancePct}% of ${weight}g @ ${formatCurrency(config.fragrancePricePerGram)}/g`}
              />
              <CostRow
                label="Colour"
                value={colourCost}
                sub={`${colourPct}% of ${weight}g @ ${formatCurrency(config.colourPricePerGram)}/g`}
              />
              {includeWick && (
                <CostRow label="Wick" value={config.wickCost} />
              )}
              {includePackaging && (
                <CostRow
                  label="Packaging"
                  value={packagingCost as number | null}
                  sub={packagingTypeId ? types.find((t) => t.id === packagingTypeId)?.name : undefined}
                />
              )}
              <CostRow label="Total Cost" value={totalCost} highlight />
            </div>
            {hasMissingPrice && (
              <p className="text-xs text-amber-600 mt-3">
                Some items have no price data in inventory. Add entries to the inventory module first.
              </p>
            )}
          </div>

          {/* Selling Price */}
          <div className="bg-white rounded-xl shadow-soft p-6 space-y-5">
            <p className="font-semibold text-warm-900">Selling Price</p>
            <Slider
              label="Price Multiplier"
              value={multiplier} min={1} max={5} step={0.5}
              onChange={setMultiplier}
              format={(v) => `${v}×`}
            />

            {totalCost !== null ? (
              <div className="space-y-3 mt-2">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                  <p className="text-xs text-amber-700 font-medium uppercase tracking-wide mb-1">Selling Price</p>
                  <p className="text-4xl font-bold text-amber-600">{formatCurrency(sellingPrice!)}</p>
                  <p className="text-xs text-amber-700 mt-1">{multiplier}× cost of {formatCurrency(totalCost)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-xs text-green-700 font-medium uppercase tracking-wide mb-1">Profit</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(profit!)}</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-xs text-green-700 font-medium uppercase tracking-wide mb-1">Margin</p>
                    <p className="text-2xl font-bold text-green-600">{marginPct!.toFixed(1)}%</p>
                  </div>
                </div>

                {/* Quick multiplier buttons */}
                <div>
                  <p className="text-xs text-warm-400 mb-2">Quick select</p>
                  <div className="grid grid-cols-5 gap-2">
                    {[1.5, 2, 2.5, 3, 4].map((m) => (
                      <button
                        key={m}
                        onClick={() => setMultiplier(m)}
                        className={`py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          multiplier === m
                            ? 'bg-amber-500 text-white'
                            : 'bg-warm-100 text-warm-700 hover:bg-warm-200'
                        }`}
                      >
                        {m}×
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-warm-50 rounded-xl p-5 text-center text-warm-400 text-sm">
                Fix missing inventory prices above to see selling price
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
