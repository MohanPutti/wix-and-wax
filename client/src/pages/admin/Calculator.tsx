import { useState, useEffect } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { api } from '../../services/api'
import Spinner from '../../components/ui/Spinner'
import Slider from '../../components/ui/Slider'
import InventoryPicker from '../../components/ui/InventoryPicker'
import type { InventoryCategory, InventoryType, InventoryEntry } from '../../types'

// ─── Types ────────────────────────────────────────────────────────────────────

const WAX_TYPES = ['Soy', 'Gel', 'Mix'] as const
type WaxType = (typeof WAX_TYPES)[number]

interface Config {
  waxPrices: Record<WaxType, number>   // ₹ per kg
  fragrancePricePer100ml: number        // ₹ per 100ml bottle
  colourPricePer100ml: number           // ₹ per 100ml bottle
  wickCost: number                      // ₹ per piece
}

const DEFAULT_CONFIG: Config = {
  waxPrices: { Soy: 300, Gel: 250, Mix: 280 },
  fragrancePricePer100ml: 150,
  colourPricePer100ml: 50,
  wickCost: 1,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n)

// ─── Cost Row ─────────────────────────────────────────────────────────────────

function CostRow({ label, value, sub, highlight, dimmed }: {
  label: string; value: number | null; sub?: string; highlight?: boolean; dimmed?: boolean
}) {
  return (
    <div className={`flex justify-between items-start py-2.5 ${highlight ? 'border-t-2 border-warm-200 mt-1 pt-3' : 'border-b border-warm-100'} ${dimmed ? 'opacity-50' : ''}`}>
      <div>
        <p className={`text-sm ${highlight ? 'font-bold text-warm-900 text-base' : 'text-warm-700'}`}>{label}</p>
        {sub && <p className="text-xs text-warm-400 mt-0.5">{sub}</p>}
      </div>
      <p className={`font-semibold ${highlight ? 'text-lg font-bold text-warm-900' : value === null ? 'text-amber-500 text-sm' : 'text-warm-900 text-sm'}`}>
        {value === null ? 'No price' : fmt(value)}
      </p>
    </div>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-amber-500' : 'bg-warm-300'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AdminCalculator() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG)
  const [showConfig, setShowConfig] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [types, setTypes] = useState<InventoryType[]>([])
  const [entries, setEntries] = useState<InventoryEntry[]>([])

  // Inputs
  const [includeContainer, setIncludeContainer] = useState(false)
  const [containerCategoryId, setContainerCategoryId] = useState('')
  const [containerTypeId, setContainerTypeId] = useState('')
  const [weight, setWeight] = useState(200)
  const [waxType, setWaxType] = useState<WaxType>('Soy')
  const [fragrancePct, setFragrancePct] = useState(2)
  const [colourPct, setColourPct] = useState(2)
  const [includeWick, setIncludeWick] = useState(true)
  const [labourCost, setLabourCost] = useState(0)
  const [includePackaging, setIncludePackaging] = useState(false)
  const [packagingCategoryId, setPackagingCategoryId] = useState('')
  const [packagingTypeId, setPackagingTypeId] = useState('')
  const [multiplier, setMultiplier] = useState(2.5)

  useEffect(() => {
    Promise.all([api.getInventoryCategories(), api.getInventoryTypes(), api.getInventoryEntries()])
      .then(([catRes, typRes, entRes]) => {
        if (catRes.success) setCategories(catRes.data)
        if (typRes.success) setTypes(typRes.data)
        if (entRes.success) setEntries(entRes.data)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  // ─── Derived ─────────────────────────────────────────────────────────────────

  const packagingCatId = categories.find((c) => c.name.toLowerCase() === 'packaging')?.id ?? ''
  const containerCategories = categories.filter((c) => c.id !== packagingCatId)
  const packagingCategories = categories.filter((c) => c.id === packagingCatId)

  const latestPrice = (typeId: string): number | null => {
    if (!typeId) return null
    const sorted = entries
      .filter((e) => e.typeId === typeId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return sorted.length > 0 ? Number(sorted[0].pricePerUnit) : null
  }

  // ─── Calculations ─────────────────────────────────────────────────────────────
  const waxCost = weight * (config.waxPrices[waxType] / 1000)

  const fragranceGrams = (fragrancePct / 100) * weight
  const fragranceCost  = (fragranceGrams / 100) * config.fragrancePricePer100ml

  const colourGrams = (colourPct / 100) * weight
  const colourCost  = (colourGrams / 100) * config.colourPricePer100ml

  const wickCostVal   = includeWick ? config.wickCost : 0
  const containerCost = includeContainer ? latestPrice(containerTypeId) : 0
  const packagingCost = includePackaging ? latestPrice(packagingTypeId) : 0

  const hasMissingPrice =
    (includeContainer && containerCost === null) ||
    (includePackaging && packagingCost === null)

  const baseCost = hasMissingPrice ? null :
    (containerCost ?? 0) + waxCost + fragranceCost + colourCost + wickCostVal

  const sellingPrice = baseCost !== null
    ? baseCost * multiplier + labourCost + (packagingCost ?? 0)
    : null

  const totalCost = baseCost !== null
    ? baseCost + labourCost + (packagingCost ?? 0)
    : null

  const profit    = sellingPrice !== null && totalCost !== null ? sellingPrice - totalCost : null
  const marginPct = sellingPrice !== null && sellingPrice > 0 && profit !== null
    ? (profit / sellingPrice) * 100 : null

  const updateWaxPrice = (wt: WaxType, val: string) =>
    setConfig((c) => ({ ...c, waxPrices: { ...c.waxPrices, [wt]: parseFloat(val) || 0 } }))

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[60vh]"><Spinner size="lg" /></div>
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="font-serif text-2xl md:text-3xl font-semibold text-warm-900">Candle Cost Calculator</h1>
        <p className="text-warm-500 text-sm mt-1">Calculate production cost and ideal selling price for a candle</p>
      </div>

      {/* ── Config Panel ── */}
      <div className="bg-white rounded-xl shadow-soft mb-6">
        <button
          onClick={() => setShowConfig((v) => !v)}
          className="w-full flex justify-between items-center px-6 py-4 text-left"
        >
          <div>
            <p className="font-semibold text-warm-900">Configure Ingredient Prices</p>
            <p className="text-xs text-warm-400 mt-0.5">Wax ₹/kg · Fragrance &amp; Colour ₹/100ml · Wick ₹/piece</p>
          </div>
          {showConfig ? <ChevronUpIcon className="h-5 w-5 text-warm-400" /> : <ChevronDownIcon className="h-5 w-5 text-warm-400" />}
        </button>

        {showConfig && (
          <div className="px-6 pb-6 border-t border-warm-100">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
              {WAX_TYPES.map((wt) => (
                <div key={wt}>
                  <label className="block text-sm font-medium text-warm-700 mb-1">{wt} Wax — ₹ per kg</label>
                  <input type="number" min="0" step="1" value={config.waxPrices[wt]}
                    onChange={(e) => updateWaxPrice(wt, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">Fragrance — ₹ per 100ml</label>
                <input type="number" min="0" step="1" value={config.fragrancePricePer100ml}
                  onChange={(e) => setConfig((c) => ({ ...c, fragrancePricePer100ml: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">Colour — ₹ per 100ml</label>
                <input type="number" min="0" step="1" value={config.colourPricePer100ml}
                  onChange={(e) => setConfig((c) => ({ ...c, colourPricePer100ml: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">Wick — ₹ per piece</label>
                <input type="number" min="0" step="0.5" value={config.wickCost}
                  onChange={(e) => setConfig((c) => ({ ...c, wickCost: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
              </div>
            </div>
            <p className="text-xs text-warm-400 mt-4">Prices reset on page reload. Adjust before each session.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left: Inputs ── */}
        <div className="space-y-4">

          {/* Container */}
          <div className="bg-white rounded-xl shadow-soft p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-warm-900">Container</p>
                <p className="text-xs text-warm-400">Optional — glass, urli, etc.</p>
              </div>
              <Toggle value={includeContainer} onChange={(v) => { setIncludeContainer(v); setContainerCategoryId(''); setContainerTypeId('') }} />
            </div>
            {includeContainer && (
              <InventoryPicker label="Container"
                categories={containerCategories} types={types} entries={entries}
                selectedCategoryId={containerCategoryId} selectedTypeId={containerTypeId}
                onCategoryChange={setContainerCategoryId} onTypeChange={setContainerTypeId} />
            )}
          </div>

          {/* Wax */}
          <div className="bg-white rounded-xl shadow-soft p-6 space-y-4">
            <p className="font-semibold text-warm-900">Wax</p>
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">Weight (grams)</label>
              <input type="number" min="1" step="1" value={weight || ''}
                onChange={(e) => setWeight(Number(e.target.value))}
                onBlur={() => setWeight((w) => Math.max(1, w || 1))}
                className="w-full px-3 py-2 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-2">Wax Type</label>
              <div className="grid grid-cols-3 gap-2">
                {WAX_TYPES.map((wt) => (
                  <button key={wt} onClick={() => setWaxType(wt)}
                    className={`py-2 rounded-lg text-sm font-medium transition-colors ${waxType === wt ? 'bg-amber-500 text-white' : 'bg-warm-100 text-warm-700 hover:bg-warm-200'}`}>
                    {wt}
                  </button>
                ))}
              </div>
              <p className="text-xs text-warm-400 mt-2">
                {fmt(config.waxPrices[waxType])}/kg → {weight}g costs <strong className="text-warm-700">{fmt(waxCost)}</strong>
              </p>
            </div>
          </div>

          {/* Fragrance & Colour */}
          <div className="bg-white rounded-xl shadow-soft p-6 space-y-5">
            <p className="font-semibold text-warm-900">Fragrance &amp; Colour</p>
            <div className="space-y-1">
              <Slider label="Fragrance %" value={fragrancePct} min={1} max={5} step={0.5}
                onChange={setFragrancePct} format={(v) => `${v}%`} />
              <p className="text-xs text-warm-400">
                {fragrancePct}% × {weight}g = {fragranceGrams.toFixed(1)}ml @ {fmt(config.fragrancePricePer100ml)}/100ml = <strong className="text-warm-700">{fmt(fragranceCost)}</strong>
              </p>
            </div>
            <div className="space-y-1">
              <Slider label="Colour %" value={colourPct} min={1} max={5} step={0.5}
                onChange={setColourPct} format={(v) => `${v}%`} />
              <p className="text-xs text-warm-400">
                {colourPct}% × {weight}g = {colourGrams.toFixed(1)}ml @ {fmt(config.colourPricePer100ml)}/100ml = <strong className="text-warm-700">{fmt(colourCost)}</strong>
              </p>
            </div>
          </div>

          {/* Wick */}
          <div className="bg-white rounded-xl shadow-soft p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-warm-900">Wick</p>
                <p className="text-xs text-warm-400">{fmt(config.wickCost)} per piece</p>
              </div>
              <Toggle value={includeWick} onChange={setIncludeWick} />
            </div>
          </div>

          {/* Labour */}
          <div className="bg-white rounded-xl shadow-soft p-6">
            <p className="font-semibold text-warm-900 mb-1">Labour Cost</p>
            <p className="text-xs text-warm-400 mb-3">Added after multiplier — not marked up</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-warm-500">₹</span>
              <input type="number" min="0" step="1" value={labourCost || ''}
                placeholder="0"
                onChange={(e) => setLabourCost(parseFloat(e.target.value) || 0)}
                className="w-full pl-7 pr-3 py-2 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
            </div>
          </div>

          {/* Packaging */}
          <div className="bg-white rounded-xl shadow-soft p-6">
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="font-semibold text-warm-900">Packaging</p>
                <p className="text-xs text-warm-400">Added after multiplier — not marked up</p>
              </div>
              <Toggle value={includePackaging} onChange={(v) => { setIncludePackaging(v); setPackagingCategoryId(''); setPackagingTypeId('') }} />
            </div>
            {includePackaging && (
              <div className="mt-4">
                <InventoryPicker label="Packaging"
                  categories={packagingCategories.length > 0 ? packagingCategories : categories} types={types} entries={entries}
                  selectedCategoryId={packagingCategoryId} selectedTypeId={packagingTypeId}
                  onCategoryChange={setPackagingCategoryId} onTypeChange={setPackagingTypeId} />
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Results ── */}
        <div className="space-y-4">

          {/* Cost Breakdown */}
          <div className="bg-white rounded-xl shadow-soft p-6">
            <p className="font-semibold text-warm-900 mb-2">Cost Breakdown</p>
            <p className="text-xs text-warm-400 mb-4">
              Base × multiplier, then labour &amp; packaging added at cost.
            </p>

            {includeContainer && (
              <CostRow label="Container" value={containerCost as number | null}
                sub={containerTypeId ? types.find((t) => t.id === containerTypeId)?.name : undefined} />
            )}
            <CostRow label={`Wax (${waxType})`} value={waxCost}
              sub={`${weight}g @ ${fmt(config.waxPrices[waxType])}/kg`} />
            <CostRow label="Fragrance" value={fragranceCost}
              sub={`${fragrancePct}% × ${weight}g = ${fragranceGrams.toFixed(1)}ml`} />
            <CostRow label="Colour" value={colourCost}
              sub={`${colourPct}% × ${weight}g = ${colourGrams.toFixed(1)}ml`} />
            {includeWick && <CostRow label="Wick" value={config.wickCost} />}

            <CostRow label={`Base Cost × ${multiplier}`} value={baseCost} highlight />

            {(labourCost > 0 || includePackaging) && (
              <div className="mt-3 space-y-0">
                <p className="text-xs text-warm-400 mb-1 pt-1">Added at cost (no markup)</p>
                {labourCost > 0 && <CostRow label="Labour" value={labourCost} />}
                {includePackaging && (
                  <CostRow label="Packaging" value={packagingCost as number | null}
                    sub={packagingTypeId ? types.find((t) => t.id === packagingTypeId)?.name : undefined} />
                )}
              </div>
            )}

            <CostRow label="Total Cost" value={totalCost} highlight />

            {hasMissingPrice && (
              <p className="text-xs text-amber-600 mt-3">
                Some items have no price data in inventory. Add entries to the Inventory module first.
              </p>
            )}
          </div>

          {/* Selling Price */}
          <div className="bg-white rounded-xl shadow-soft p-6 space-y-5">
            <div>
              <p className="font-semibold text-warm-900">Selling Price</p>
              <p className="text-xs text-warm-400 mt-0.5">
                (Base × multiplier) + labour + packaging
              </p>
            </div>

            <Slider label="Price Multiplier" value={multiplier} min={1} max={5} step={0.5}
              onChange={setMultiplier} format={(v) => `${v}×`} />

            {baseCost !== null ? (
              <div className="space-y-3">
                {baseCost > 0 && (
                  <div className="text-xs text-warm-400 bg-warm-50 rounded-lg px-3 py-2">
                    {fmt(baseCost)} × {multiplier}
                    {labourCost > 0 ? ` + ${fmt(labourCost)} labour` : ''}
                    {includePackaging && packagingCost !== null ? ` + ${fmt(packagingCost)} packaging` : ''}
                    {' '}= <strong className="text-warm-700">{fmt(sellingPrice!)}</strong>
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                  <p className="text-xs text-amber-700 font-medium uppercase tracking-wide mb-1">Selling Price</p>
                  <p className="text-4xl font-bold text-amber-600">{fmt(sellingPrice!)}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-xs text-green-700 font-medium uppercase tracking-wide mb-1">Profit</p>
                    <p className="text-2xl font-bold text-green-600">{fmt(profit!)}</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-xs text-green-700 font-medium uppercase tracking-wide mb-1">Margin</p>
                    <p className="text-2xl font-bold text-green-600">{marginPct!.toFixed(1)}%</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-warm-400 mb-2">Quick select</p>
                  <div className="grid grid-cols-5 sm:grid-cols-5 gap-2">
                    {[1.5, 2, 2.5, 3, 4].map((m) => (
                      <button key={m} onClick={() => setMultiplier(m)}
                        className={`py-1.5 rounded-lg text-sm font-medium transition-colors ${multiplier === m ? 'bg-amber-500 text-white' : 'bg-warm-100 text-warm-700 hover:bg-warm-200'}`}>
                        {m}×
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-warm-50 rounded-xl p-5 text-center text-warm-400 text-sm">
                Fix missing inventory prices to see selling price
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
