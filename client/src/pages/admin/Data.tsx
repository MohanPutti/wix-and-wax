import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Bar,
} from 'recharts'
import { api } from '../../services/api'
import Spinner from '../../components/ui/Spinner'
import type { Expense, ExpenseType } from '../../types'
import { TYPE_COLORS, DEFAULT_EXPENSE_TYPES } from './Expenses'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

function getMonthKey(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function last12MonthKeys() {
  const keys: string[] = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return keys
}

function monthLabel(key: string) {
  const [y, m] = key.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_EXPENSE_TYPES: ExpenseType[] = DEFAULT_EXPENSE_TYPES.map((name, i) => ({
  id: `mock-${i}`, name, createdAt: '',
}))

function buildMockExpenses(): Expense[] {
  const monthly: Record<string, number>[] = [
    { 'Raw Materials': 12000, Packaging: 2000, Shipping: 3200, Marketing: 5000, Labour: 8000 },
    { 'Raw Materials': 14500, Packaging: 2200, Shipping: 2800, Marketing: 4500, Labour: 8000 },
    { 'Raw Materials': 13000, Packaging: 1800, Shipping: 3500, Marketing: 6000, Labour: 8500 },
    { 'Raw Materials': 16000, Packaging: 2400, Shipping: 4100, Marketing: 5500, Labour: 8500 },
    { 'Raw Materials': 15000, Packaging: 2100, Shipping: 3800, Marketing: 7000, Labour: 9000 },
    { 'Raw Materials': 18000, Packaging: 2600, Shipping: 4500, Marketing: 6500, Labour: 9000 },
    { 'Raw Materials': 17500, Packaging: 2300, Shipping: 4200, Marketing: 8000, Labour: 9500 },
    { 'Raw Materials': 20000, Packaging: 2800, Shipping: 5000, Marketing: 7500, Labour: 9500 },
    { 'Raw Materials': 19000, Packaging: 2500, Shipping: 4800, Marketing: 9000, Labour: 10000 },
    { 'Raw Materials': 22000, Packaging: 3000, Shipping: 5500, Marketing: 8500, Labour: 10000 },
    { 'Raw Materials': 21000, Packaging: 2700, Shipping: 5200, Marketing: 10000, Labour: 10500 },
    { 'Raw Materials': 24000, Packaging: 3200, Shipping: 6000, Marketing: 11000, Labour: 10500 },
  ]
  const expenses: Expense[] = []
  let idx = 0
  monthly.forEach((row, offset) => {
    const d = new Date()
    d.setDate(15)
    d.setMonth(d.getMonth() - (11 - offset))
    const date = d.toISOString()
    Object.entries(row).forEach(([name, amount]) => {
      const t = MOCK_EXPENSE_TYPES.find((x) => x.name === name)!
      expenses.push({ id: `me-${idx++}`, name: `${name} test`, amount, typeId: t.id, date, createdAt: date, updatedAt: date, type: { id: t.id, name } })
    })
  })
  return expenses
}

const MOCK_ORDERS = last12MonthKeys().map((key, i) => {
  const total    = [24000, 36000, 31000, 44000, 41000, 57000, 52000, 71000, 62000, 83000, 79000, 95000][i]
  const pending  = [4000,   6000,  5000,  7000,  6500,  9000,  8000, 11000,  9500, 13000, 12000, 15000][i]
  return {
    key, label: monthLabel(key),
    count:    [12, 18, 15, 22, 20, 28, 25, 35, 30, 40, 38, 45][i],
    total,
    received: total - pending,
    pending,
  }
})

// ─── Revenue vs Expense % Cards ───────────────────────────────────────────────

function RevenueRatioCards({
  expenses, types, totalRevenue,
}: {
  expenses: Expense[]
  types: ExpenseType[]
  totalRevenue: number
}) {
  const typeTotal = (names: string[]) => {
    const ids = types.filter((t) => names.includes(t.name)).map((t) => t.id)
    return expenses.filter((e) => ids.includes(e.typeId)).reduce((s, e) => s + Number(e.amount), 0)
  }

  const cards = [
    { label: 'Raw Materials & Packaging', names: ['Raw Materials', 'Packaging'], color: '#f59e0b' },
    { label: 'Shipping',                  names: ['Shipping'],                   color: '#3b82f6' },
    { label: 'Marketing',                 names: ['Marketing'],                  color: '#ef4444' },
    { label: 'Labour',                    names: ['Labour'],                     color: '#10b981' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {cards.map(({ label, names, color }) => {
        const spent = typeTotal(names)
        const pct = totalRevenue > 0 ? (spent / totalRevenue) * 100 : 0
        return (
          <div key={label} className="bg-white rounded-xl p-5 shadow-soft border-t-2" style={{ borderColor: color }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2 leading-tight" style={{ color }}>
              {label}
            </p>
            <p className="text-3xl font-bold text-warm-900">{pct.toFixed(1)}<span className="text-lg font-semibold text-warm-400">%</span></p>
            <p className="text-xs text-warm-400 mt-1">of total revenue</p>
            <p className="text-sm font-semibold text-warm-600 mt-2">{formatCurrency(spent)} spent</p>
          </div>
        )
      })}

      {/* Left card */}
      {(() => {
        const totalSpent = cards.reduce((s, { names }) => s + typeTotal(names), 0)
        const left = totalRevenue - totalSpent
        const leftPct = totalRevenue > 0 ? (left / totalRevenue) * 100 : 0
        return (
          <div className="bg-white rounded-xl p-5 shadow-soft border-t-2 border-warm-300">
            <p className="text-xs font-semibold uppercase tracking-wide mb-2 text-warm-500">Left</p>
            <p className={`text-3xl font-bold ${leftPct >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {leftPct.toFixed(1)}<span className="text-lg font-semibold text-warm-400">%</span>
            </p>
            <p className="text-xs text-warm-400 mt-1">after all expenses</p>
            <p className={`text-sm font-semibold mt-2 ${left >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {formatCurrency(left)}
            </p>
          </div>
        )
      })()}
    </div>
  )
}

// ─── Expense Trend Chart ──────────────────────────────────────────────────────

function ExpenseTrendChart({ expenses, types }: { expenses: Expense[]; types: ExpenseType[] }) {
  const months = last12MonthKeys()
  const chartData = months.map((key) => {
    const row: Record<string, string | number> = { month: monthLabel(key) }
    let total = 0
    for (const t of types) {
      const amt = expenses
        .filter((e) => e.typeId === t.id && getMonthKey(e.date) === key)
        .reduce((s, e) => s + Number(e.amount), 0)
      row[t.name] = amt
      total += amt
    }
    row['Total'] = total
    return row
  })

  const hasData = chartData.some((r) => types.some((t) => (r[t.name] as number) > 0))

  return (
    <div className="bg-white rounded-xl shadow-soft p-6 mb-8">
      <h2 className="font-semibold text-warm-900 mb-1">Expense Trends by Category</h2>
      <p className="text-xs text-warm-400 mb-6">Monthly spend per category — last 12 months</p>
      {!hasData ? (
        <div className="flex items-center justify-center h-64 text-warm-400 text-sm">
          No expense data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f0eb" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9c8c7a' }} axisLine={{ stroke: '#e8e0d5' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9c8c7a' }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
            <Tooltip formatter={(v, name) => [formatCurrency(Number(v)), String(name)]}
              contentStyle={{ borderRadius: '10px', border: '1px solid #e8e0d5', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            {types.map((t) => (
              <Line key={t.id} type="monotone" dataKey={t.name}
                stroke={TYPE_COLORS[t.name] || '#9c8c7a'} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            ))}
            <Line type="monotone" dataKey="Total" stroke="#1e293b" strokeWidth={3}
              strokeDasharray="6 3" dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// ─── Orders Chart ─────────────────────────────────────────────────────────────

function OrdersChart({ data }: { data: { label: string; count: number; total: number; received: number; pending: number }[] }) {
  const hasData = data.some((d) => d.count > 0)

  return (
    <div className="bg-white rounded-xl shadow-soft p-6 mb-8">
      <h2 className="font-semibold text-warm-900 mb-1">Order Trends</h2>
      <p className="text-xs text-warm-400 mb-6">Monthly total, received, pending amounts and order count — last 12 months</p>
      {!hasData ? (
        <div className="flex items-center justify-center h-64 text-warm-400 text-sm">
          No order data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f0eb" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9c8c7a' }} axisLine={{ stroke: '#e8e0d5' }} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9c8c7a' }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#9c8c7a' }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(v, name) =>
                String(name) === 'Orders' ? [Number(v), String(name)] : [formatCurrency(Number(v)), String(name)]
              }
              contentStyle={{ borderRadius: '10px', border: '1px solid #e8e0d5', fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            <Bar yAxisId="left" dataKey="total" name="Total" fill="#d1c4b0" opacity={0.9} radius={[4, 4, 0, 0]} />
            <Bar yAxisId="left" dataKey="received" name="Received" fill="#f59e0b" opacity={0.85} radius={[4, 4, 0, 0]} />
            <Line yAxisId="left" type="monotone" dataKey="pending" name="Pending"
              stroke="#ef4444" strokeWidth={2.5} strokeDasharray="5 3" dot={{ r: 3 }} activeDot={{ r: 5 }} />
            <Line yAxisId="right" type="monotone" dataKey="count" name="Orders" stroke="#3b82f6"
              strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// ─── Revenue vs Expenses Chart ────────────────────────────────────────────────

function RevenueVsExpensesChart({
  expenses,
  orderData,
}: {
  expenses: Expense[]
  orderData: { key: string; label: string; received: number }[]
}) {
  const chartData = orderData.map(({ key, label, received }) => {
    const totalExpenses = expenses
      .filter((e) => getMonthKey(e.date) === key)
      .reduce((s, e) => s + Number(e.amount), 0)
    return { month: label, Revenue: received, Expenses: totalExpenses, Profit: received - totalExpenses }
  })

  const hasData = chartData.some((r) => r.Revenue > 0 || r.Expenses > 0)

  return (
    <div className="bg-white rounded-xl shadow-soft p-6">
      <h2 className="font-semibold text-warm-900 mb-1">Revenue vs Expenses</h2>
      <p className="text-xs text-warm-400 mb-6">Monthly revenue, total expenses, and net profit — last 12 months</p>
      {!hasData ? (
        <div className="flex items-center justify-center h-64 text-warm-400 text-sm">
          No data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f0eb" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9c8c7a' }} axisLine={{ stroke: '#e8e0d5' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9c8c7a' }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
            <Tooltip formatter={(v, name) => [formatCurrency(Number(v)), String(name)]}
              contentStyle={{ borderRadius: '10px', border: '1px solid #e8e0d5', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            <Bar dataKey="Revenue" fill="#f59e0b" opacity={0.85} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Expenses" fill="#ef4444" opacity={0.75} radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="Profit" stroke="#10b981" strokeWidth={2.5}
              dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AdminData() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([])
  const [orderData, setOrderData] = useState<{ key: string; label: string; count: number; total: number; received: number; pending: number }[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [pendingOrders, setPendingOrders] = useState(0)
  const [totalProducts, setTotalProducts] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isMockMode, setIsMockMode] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [expRes, typeRes, ordRes, metricsRes, productsRes, ordersRes] = await Promise.all([
          api.getExpenses(),
          api.getExpenseTypes(),
          api.getMonthlyOrders(),
          api.getOrderMetrics(),
          api.getProducts({ limit: 1 }),
          api.getOrders({ limit: 100, status: 'pending' }),
        ])
        if (expRes.success) setExpenses(expRes.data)
        if (typeRes.success && typeRes.data.length > 0) setExpenseTypes(typeRes.data)
        if (ordRes.success) setOrderData(ordRes.data)
        if (metricsRes.success) {
          setTotalRevenue(metricsRes.data.totalPaid)
          setTotalOrders(metricsRes.data.count)
        }
        if (productsRes.success) setTotalProducts(productsRes.meta.total)
        if (ordersRes.success) setPendingOrders(ordersRes.meta.total)
      } catch {
        // ignore — production may not have new endpoints yet
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const mockRevenue = MOCK_ORDERS.reduce((s, m) => s + m.received, 0)
  const mockOrderCount = MOCK_ORDERS.reduce((s, m) => s + m.count, 0)

  const displayExpenses     = isMockMode ? buildMockExpenses() : expenses
  const displayTypes        = isMockMode ? MOCK_EXPENSE_TYPES  : expenseTypes
  const displayOrders       = isMockMode ? MOCK_ORDERS         : orderData
  const displayRevenue      = isMockMode ? mockRevenue         : totalRevenue
  const displayTotalOrders  = isMockMode ? mockOrderCount      : totalOrders
  const displayPending      = isMockMode ? 8                   : pendingOrders
  const displayProducts     = isMockMode ? 32                  : totalProducts

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
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-serif text-3xl font-semibold text-warm-900">Dashboard</h1>
        <button
          onClick={() => setIsMockMode((v) => !v)}
          className="text-xs text-warm-400 hover:text-warm-600 underline underline-offset-2"
        >
          {isMockMode ? 'Hide test data' : 'Load test data'}
        </button>
      </div>

      {isMockMode && (
        <div className="mb-6 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 font-medium">
          Showing test data — not saved to database
        </div>
      )}

      {/* Top stat cards (from old dashboard) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-soft">
          <p className="text-warm-500 text-sm mb-1">Total Revenue</p>
          <p className="font-serif text-2xl font-bold text-warm-900">{formatCurrency(displayRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-soft">
          <p className="text-warm-500 text-sm mb-1">Total Orders</p>
          <p className="font-serif text-2xl font-bold text-warm-900">{displayTotalOrders}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-soft">
          <p className="text-warm-500 text-sm mb-1">Pending Orders</p>
          <p className="font-serif text-2xl font-bold text-amber-600">{displayPending}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-soft">
          <p className="text-warm-500 text-sm mb-1">Total Products</p>
          <p className="font-serif text-2xl font-bold text-warm-900">{displayProducts}</p>
        </div>
      </div>

      {/* Revenue ratio cards */}
      <RevenueRatioCards expenses={displayExpenses} types={displayTypes} totalRevenue={displayRevenue} />

      {/* Expense trends */}
      <ExpenseTrendChart expenses={displayExpenses} types={displayTypes} />

      {/* Orders */}
      <OrdersChart data={displayOrders} />

      {/* Revenue vs Expenses */}
      <RevenueVsExpensesChart expenses={displayExpenses} orderData={displayOrders} />
    </div>
  )
}
