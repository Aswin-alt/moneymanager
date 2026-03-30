import { useState, useCallback } from 'react'
import {
  PieChart, Pie, Cell, Tooltip as RTooltip, Legend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from 'recharts'
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns'
import toast from 'react-hot-toast'

import { getTransactions } from '../api/transactionApi'
import { getBudgets } from '../api/budgetApi'
import type { TransactionResponse } from '../types/transaction'
import type { BudgetSummaryResponse } from '../types/budget'
import LoadingSpinner from '../components/ui/LoadingSpinner'

type Tab = 'spending' | 'trends' | 'budgets'

const COLORS = ['#6366f1','#22c55e','#f97316','#ec4899','#14b8a6','#8b5cf6','#eab308','#ef4444','#0ea5e9','#84cc16']

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
}

const today = new Date()
const PRESETS = [
  { label: 'This Month',     from: format(startOfMonth(today), 'yyyy-MM-dd'), to: format(endOfMonth(today), 'yyyy-MM-dd') },
  { label: 'Last Month',     from: format(startOfMonth(subMonths(today, 1)), 'yyyy-MM-dd'), to: format(endOfMonth(subMonths(today, 1)), 'yyyy-MM-dd') },
  { label: 'Last 3 Months',  from: format(startOfMonth(subMonths(today, 2)), 'yyyy-MM-dd'), to: format(endOfMonth(today), 'yyyy-MM-dd') },
]

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('spending')
  const [from, setFrom] = useState(PRESETS[0].from)
  const [to, setTo] = useState(PRESETS[0].to)
  const [loading, setLoading] = useState(false)

  // Data
  const [spendingData, setSpendingData] = useState<{ name: string; value: number; color: string }[]>([])
  const [trendData, setTrendData] = useState<{ month: string; income: number; expense: number }[]>([])
  const [budgetData, setBudgetData] = useState<BudgetSummaryResponse[]>([])
  const [generated, setGenerated] = useState(false)

  const generate = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch transactions for spending + trends
      const txPage = await getTransactions({ from, to, size: 1000 })
      const txs: TransactionResponse[] = txPage.content

      // Spending distribution
      const catMap = new Map<string, { name: string; value: number; color: string }>()
      txs.filter(t => t.transactionType === 'EXPENSE').forEach(t => {
        const key = t.categoryName ?? 'Uncategorized'
        const ex = catMap.get(key)
        if (ex) ex.value += t.amount
        else catMap.set(key, { name: key, value: t.amount, color: t.categoryColor ?? '#6b7280' })
      })
      setSpendingData(Array.from(catMap.values()).sort((a, b) => b.value - a.value))

      // Trends — group by month
      const monthMap = new Map<string, { income: number; expense: number }>()
      txs.forEach(t => {
        const m = format(parseISO(t.transactionDate), 'MMM yyyy')
        const ex = monthMap.get(m) ?? { income: 0, expense: 0 }
        if (t.transactionType === 'INCOME') ex.income += t.amount
        else if (t.transactionType === 'EXPENSE') ex.expense += t.amount
        monthMap.set(m, ex)
      })
      setTrendData(Array.from(monthMap.entries()).map(([month, v]) => ({ month, ...v })))

      // Budget vs actual
      const currentMonthStr = format(today, 'yyyy-MM')
      const buds = await getBudgets(currentMonthStr)
      setBudgetData(buds)

      setGenerated(true)
    } catch {
      toast.error('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }, [from, to])

  const tabs: { key: Tab; label: string }[] = [
    { key: 'spending', label: '📊 Spending' },
    { key: 'trends',   label: '📈 Trends' },
    { key: 'budgets',  label: '🎯 Budgets' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">Visualize your financial patterns</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex gap-3 flex-1 flex-wrap">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Quick Presets</label>
              <div className="flex gap-1.5">
                {PRESETS.map(p => (
                  <button key={p.label} onClick={() => { setFrom(p.from); setTo(p.to) }}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                      from === p.from && to === p.to
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button onClick={generate} disabled={loading}
            className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2">
            {loading ? <><LoadingSpinner size="sm" /> Generating...</> : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {!generated ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="text-center">
            <p className="text-gray-400 text-sm">Select a date range and click "Generate Report" to view your analytics.</p>
          </div>
        </div>
      ) : loading ? (
        <LoadingSpinner fullPage />
      ) : (
        <>
          {/* Spending tab */}
          {tab === 'spending' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-5">Spending Distribution</h2>
              {spendingData.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-sm text-gray-400">No expense data in selected range</div>
              ) : (
                <div className="flex flex-col lg:flex-row gap-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={spendingData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={2} dataKey="value">
                        {spendingData.map((entry, i) => (
                          <Cell key={entry.name} fill={entry.color || COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <RTooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                      <Legend iconType="circle" iconSize={8} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="w-full lg:w-64 space-y-2">
                    {spendingData.map((c, i) => {
                      const total = spendingData.reduce((s, x) => s + x.value, 0)
                      const pct = total > 0 ? (c.value / total * 100).toFixed(1) : '0'
                      return (
                        <div key={c.name} className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color || COLORS[i % COLORS.length] }} />
                          <span className="flex-1 truncate text-gray-700">{c.name}</span>
                          <span className="text-gray-400 text-xs">{pct}%</span>
                          <span className="font-medium text-gray-900">{formatCurrency(c.value)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Trends tab */}
          {tab === 'trends' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-5">Income vs Expense Trend</h2>
              {trendData.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-sm text-gray-400">No data in selected range</div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={trendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                    <RTooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4 }} name="Income" />
                    <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} name="Expense" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {/* Budgets tab */}
          {tab === 'budgets' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Budget vs Actual — {format(today, 'MMMM yyyy')}</h2>
              <p className="text-xs text-gray-400 mb-5">Comparing budget limits to actual spending for the current month</p>
              {budgetData.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-sm text-gray-400">No budgets set for this month</div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={budgetData.map(b => ({ name: `${b.categoryIcon} ${b.categoryName}`, Budget: b.limitAmount, Actual: b.spentAmount }))} margin={{ top: 5, right: 20, left: 10, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" interval={0} />
                    <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 12 }} />
                    <RTooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                    <Legend />
                    <Bar dataKey="Budget" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Actual" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
