import { useState, useEffect } from 'react'
import { PencilIcon, TrashIcon, PlusIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'
import { api } from '../../services/api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import type { Expense, ExpenseType } from '../../types'

export const DEFAULT_EXPENSE_TYPES = ['Raw Materials', 'Packaging', 'Shipping', 'Marketing', 'Labour']

export const TYPE_COLORS: Record<string, string> = {
  'Raw Materials': '#f59e0b',
  'Packaging':     '#8b5cf6',
  'Shipping':      '#3b82f6',
  'Marketing':     '#ef4444',
  'Labour':        '#10b981',
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

function getMonthKey(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function MoMBadge({ current, previous, label = 'vs last month' }: { current: number; previous: number; label?: string }) {
  if (previous === 0) return <p className="text-xs text-warm-400 mt-1">No prior data</p>
  const pct = ((current - previous) / previous) * 100
  const up = pct > 0
  return (
    <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${up ? 'text-red-500' : 'text-green-600'}`}>
      {up ? <ArrowTrendingUpIcon className="h-3.5 w-3.5" /> : <ArrowTrendingDownIcon className="h-3.5 w-3.5" />}
      {Math.abs(pct).toFixed(1)}% {label}
    </div>
  )
}

// ─── Stats Cards ──────────────────────────────────────────────────────────────

function ExpenseStats({ expenses, types }: { expenses: Expense[]; types: ExpenseType[] }) {
  const now = new Date()
  const thisMonthKey = getMonthKey(now.toISOString())
  const lastMonthKey = getMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString())

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const monthKeys = [...new Set(expenses.map((e) => getMonthKey(e.date)))]
  const avgMonthly = monthKeys.length > 0 ? total / monthKeys.length : 0

  // Last 3 months avg vs previous 3 months avg — meaningful trend for average
  const last3Keys = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return getMonthKey(d.toISOString())
  })
  const prev3Keys = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 3 - i, 1)
    return getMonthKey(d.toISOString())
  })
  const avg3 = (keys: string[]) => {
    const totals = keys.map((k) => expenses.filter((e) => getMonthKey(e.date) === k).reduce((s, e) => s + Number(e.amount), 0))
    const nonZero = totals.filter((v) => v > 0)
    return nonZero.length > 0 ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length : 0
  }
  const last3Avg = avg3(last3Keys)
  const prev3Avg = avg3(prev3Keys)

  const thisMonthTotal = expenses.filter((e) => getMonthKey(e.date) === thisMonthKey).reduce((s, e) => s + Number(e.amount), 0)
  const lastMonthTotal = expenses.filter((e) => getMonthKey(e.date) === lastMonthKey).reduce((s, e) => s + Number(e.amount), 0)

  // Per-type this month vs last month
  const typeStats = types.map((t) => {
    const thisMo = expenses.filter((e) => e.typeId === t.id && getMonthKey(e.date) === thisMonthKey).reduce((s, e) => s + Number(e.amount), 0)
    const lastMo = expenses.filter((e) => e.typeId === t.id && getMonthKey(e.date) === lastMonthKey).reduce((s, e) => s + Number(e.amount), 0)
    return { type: t, thisMo, lastMo }
  })

  return (
    <div className="mb-8 space-y-4">
      {/* Row 1 — summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-soft">
          <p className="text-xs font-semibold text-warm-500 uppercase tracking-wide mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-warm-900">{formatCurrency(total)}</p>
          <p className="text-xs text-warm-400 mt-1">All time</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-soft">
          <p className="text-xs font-semibold text-warm-500 uppercase tracking-wide mb-1">This Month</p>
          <p className="text-2xl font-bold text-warm-900">{formatCurrency(thisMonthTotal)}</p>
          <MoMBadge current={thisMonthTotal} previous={lastMonthTotal} />
        </div>
        <div className="bg-white rounded-xl p-5 shadow-soft">
          <p className="text-xs font-semibold text-warm-500 uppercase tracking-wide mb-1">Monthly Average</p>
          <p className="text-2xl font-bold text-warm-900">{formatCurrency(avgMonthly)}</p>
          {prev3Avg > 0
            ? <MoMBadge current={last3Avg} previous={prev3Avg} label="last 3m vs prev 3m" />
            : <p className="text-xs text-warm-400 mt-1">Over {monthKeys.length} month{monthKeys.length !== 1 ? 's' : ''}</p>
          }
        </div>
      </div>

      {/* Row 2 — per-type cards */}
      {typeStats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {typeStats.map(({ type, thisMo, lastMo }) => (
            <div key={type.id} className="bg-white rounded-xl p-4 shadow-soft border-t-2" style={{ borderColor: TYPE_COLORS[type.name] || '#e8e0d5' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1 truncate" style={{ color: TYPE_COLORS[type.name] || '#9c8c7a' }}>
                {type.name}
              </p>
              <p className="text-lg font-bold text-warm-900">{formatCurrency(thisMo)}</p>
              <MoMBadge current={thisMo} previous={lastMo} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AdminExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [types, setTypes] = useState<ExpenseType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [typesSeeded, setTypesSeeded] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ name: '', amount: '', typeId: '', date: today, note: '' })

  // Fallback types used when the API isn't available yet (pre-deployment)
  const fallbackTypes: ExpenseType[] = DEFAULT_EXPENSE_TYPES.map((name, i) => ({
    id: `local-${i}`,
    name,
    createdAt: '',
  }))

  const fetchData = async () => {
    try {
      const [expRes, typeRes] = await Promise.all([api.getExpenses(), api.getExpenseTypes()])
      if (expRes.success) setExpenses(expRes.data)
      if (typeRes.success && typeRes.data.length > 0) {
        setTypes(typeRes.data)
      } else {
        setTypes(fallbackTypes)
      }
    } catch {
      setTypes(fallbackTypes)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    if (!isLoading && types.length > 0 && !typesSeeded) {
      setTypesSeeded(true)
      // Try to seed default types in DB — silently ignore if API not available yet
      DEFAULT_EXPENSE_TYPES.forEach((name) => api.createExpenseType(name).catch(() => null))
    }
  }, [isLoading, types.length, typesSeeded])

  useEffect(() => {
    if (types.length > 0 && !form.typeId) {
      setForm((f) => ({ ...f, typeId: types[0].id }))
    }
  }, [types])

  const resetForm = () => {
    setForm({ name: '', amount: '', typeId: types[0]?.id || '', date: today, note: '' })
    setEditingId(null)
    setIsAdding(false)
  }

  const handleEdit = (expense: Expense) => {
    setEditingId(expense.id)
    setForm({
      name: expense.name,
      amount: String(expense.amount),
      typeId: expense.typeId,
      date: expense.date.split('T')[0],
      note: expense.note || '',
    })
    setIsAdding(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.typeId) { alert('Please select an expense type'); return }
    setIsSubmitting(true)
    try {
      const payload = {
        name: form.name,
        amount: parseFloat(form.amount),
        typeId: form.typeId,
        date: form.date,
        note: form.note || undefined,
      }
      if (editingId) {
        await api.updateExpense(editingId, payload)
      } else {
        await api.createExpense(payload)
      }
      resetForm()
      fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save expense')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return
    try {
      await api.deleteExpense(id)
      setExpenses((prev) => prev.filter((e) => e.id !== id))
    } catch {
      alert('Failed to delete expense')
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
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-serif text-3xl font-semibold text-warm-900">Expenses</h1>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Expense
          </Button>
        )}
      </div>

      {/* Stats */}
      <ExpenseStats expenses={expenses} types={types} />

      {/* Add / Edit Form */}
      {isAdding && (
        <div className="bg-white rounded-xl p-6 shadow-soft mb-6">
          <h2 className="font-semibold text-warm-900 mb-4">
            {editingId ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Expense Name"
                placeholder="e.g. Soy wax 5kg"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                label="Amount (₹)"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">Type</label>
                <select
                  value={form.typeId}
                  onChange={(e) => setForm({ ...form, typeId: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-warm-900 bg-white"
                >
                  <option value="">Select type...</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-warm-900 bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">
                Note <span className="text-warm-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="Any additional details..."
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-4">
              <Button type="submit" isLoading={isSubmitting}>
                {editingId ? 'Update' : 'Add'} Expense
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Expenses Table */}
      <div className="bg-white rounded-xl shadow-soft overflow-hidden">
        <table className="w-full">
          <thead className="bg-warm-50 border-b border-warm-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-warm-700">Date</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-warm-700">Name</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-warm-700">Type</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-warm-700">Amount</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-warm-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id} className="border-b border-warm-100 hover:bg-warm-50">
                <td className="px-6 py-4 text-sm text-warm-600 whitespace-nowrap">
                  {formatDate(expense.date)}
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-warm-900">{expense.name}</p>
                    {expense.note && <p className="text-xs text-warm-400 mt-0.5">{expense.note}</p>}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{
                      background: `${TYPE_COLORS[expense.type.name] || '#9c8c7a'}20`,
                      color: TYPE_COLORS[expense.type.name] || '#9c8c7a',
                    }}
                  >
                    {expense.type.name}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-semibold text-warm-900">
                  {formatCurrency(Number(expense.amount))}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(expense)}
                      className="p-2 text-warm-500 hover:text-amber-600 transition-colors"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="p-2 text-warm-500 hover:text-red-600 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {expenses.length === 0 && (
          <div className="text-center py-16">
            <p className="text-warm-500 mb-2">No expenses recorded yet</p>
            <p className="text-warm-400 text-sm">Click "Add Expense" to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}
