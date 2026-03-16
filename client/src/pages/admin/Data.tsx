import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Bar,
} from 'recharts'
import { api } from '../../services/api'
import Spinner from '../../components/ui/Spinner'
import type { Expense, ExpenseType } from '../../types'
import { TYPE_COLORS } from './Expenses'
import { formatCurrency, getMonthKey, last12MonthKeys, monthLabel } from '../../utils/chartHelpers'

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
  const [error, setError] = useState<string | null>(null)

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
      } catch (err) {
        setError('Failed to load reports data. Please check your connection.')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-serif text-3xl font-semibold text-warm-900">Reports</h1>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-soft">
          <p className="text-warm-500 text-sm mb-1">Total Revenue</p>
          <p className="font-serif text-2xl font-bold text-warm-900">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-soft">
          <p className="text-warm-500 text-sm mb-1">Total Orders</p>
          <p className="font-serif text-2xl font-bold text-warm-900">{totalOrders}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-soft">
          <p className="text-warm-500 text-sm mb-1">Pending Orders</p>
          <p className="font-serif text-2xl font-bold text-amber-600">{pendingOrders}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-soft">
          <p className="text-warm-500 text-sm mb-1">Total Products</p>
          <p className="font-serif text-2xl font-bold text-warm-900">{totalProducts}</p>
        </div>
      </div>

      {/* Revenue ratio cards */}
      <RevenueRatioCards expenses={expenses} types={expenseTypes} totalRevenue={totalRevenue} />

      {/* Expense trends */}
      <ExpenseTrendChart expenses={expenses} types={expenseTypes} />

      {/* Orders */}
      <OrdersChart data={orderData} />

      {/* Revenue vs Expenses */}
      <RevenueVsExpensesChart expenses={expenses} orderData={orderData} />
    </div>
  )
}
