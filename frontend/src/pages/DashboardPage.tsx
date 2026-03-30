import { useEffect, useState, useCallback } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Wallet, TrendingUp, TrendingDown, Target, Plus, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { useAuthStore } from '../store/authStore'
import { getAccounts } from '../api/accountApi'
import { getTransactions } from '../api/transactionApi'
import { getBudgets } from '../api/budgetApi'
import type { AccountResponse } from '../types/account'
import type { TransactionResponse } from '../types/transaction'
import type { BudgetSummaryResponse } from '../types/budget'
import StatsCard from '../components/ui/StatsCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const CATEGORY_COLORS = ['#6366f1','#22c55e','#f97316','#ec4899','#14b8a6','#8b5cf6','#eab308','#ef4444']

function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount)
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  const [accounts, setAccounts] = useState<AccountResponse[]>([])
  const [transactions, setTransactions] = useState<TransactionResponse[]>([])
  const [budgets, setBudgets] = useState<BudgetSummaryResponse[]>([])
  const [loading, setLoading] = useState(true)

  const today = new Date()
  const monthStart = format(startOfMonth(today), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd')
  const currentMonth = format(today, 'yyyy-MM')

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [accs, txPage, buds] = await Promise.all([
        getAccounts(),
        getTransactions({ from: monthStart, to: monthEnd, size: 100 }),
        getBudgets(currentMonth),
      ])
      setAccounts(accs)
      setTransactions(txPage.content)
      setBudgets(buds)
    } catch {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [monthStart, monthEnd, currentMonth])

  useEffect(() => { load() }, [load])

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)
  const monthIncome = transactions.filter(t => t.transactionType === 'INCOME').reduce((sum, t) => sum + t.amount, 0)
  const monthExpenses = transactions.filter(t => t.transactionType === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0)

  const categoryMap = new Map<string, { name: string; value: number; color: string }>()
  transactions.filter(t => t.transactionType === 'EXPENSE').forEach(t => {
    const key = t.categoryName ?? 'Uncategorized'
    const existing = categoryMap.get(key)
    if (existing) { existing.value += t.amount } else {
      categoryMap.set(key, { name: key, value: t.amount, color: t.categoryColor ?? '#6b7280' })
    }
  })
  const sorted = Array.from(categoryMap.values()).sort((a, b) => b.value - a.value)
  const top5 = sorted.slice(0, 5)
  const otherTotal = sorted.slice(5).reduce((sum, c) => sum + c.value, 0)
  if (otherTotal > 0) top5.push({ name: 'Other', value: otherTotal, color: '#9ca3af' })

  const recentTx = [...transactions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)
  const topBudgets = [...budgets].sort((a, b) => b.percentUsed - a.percentUsed).slice(0, 3)

  if (loading) return <LoadingSpinner fullPage />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.displayName}! 👋</h1>
          <p className="text-sm text-gray-500 mt-0.5">{format(today, 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/transactions')} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
            <Plus size={15} /> Add Transaction
          </button>
          <button onClick={() => navigate('/accounts')} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Plus size={15} /> Add Account
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={Wallet} iconColor="text-indigo-600" iconBg="bg-indigo-50" label="Total Balance" value={formatCurrency(totalBalance)} />
        <StatsCard icon={TrendingUp} iconColor="text-green-600" iconBg="bg-green-50" label="Month Income" value={formatCurrency(monthIncome)} />
        <StatsCard icon={TrendingDown} iconColor="text-red-500" iconBg="bg-red-50" label="Month Expenses" value={formatCurrency(monthExpenses)} />
        <StatsCard icon={Target} iconColor="text-purple-600" iconBg="bg-purple-50" label="Active Budgets" value={String(budgets.length)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Spending This Month</h2>
          {top5.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-gray-400">No expense data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={top5} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                  {top5.map((entry, i) => (
                    <Cell key={entry.name} fill={entry.color || CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Recent Transactions</h2>
            <button onClick={() => navigate('/transactions')} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              View all <ArrowRight size={13} />
            </button>
          </div>
          {recentTx.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-gray-400">No transactions yet</div>
          ) : (
            <div className="space-y-3">
              {recentTx.map(tx => (
                <div key={tx.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: tx.categoryColor ? `${tx.categoryColor}20` : '#f3f4f6' }}>
                    {tx.categoryIcon ?? '💳'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{tx.merchant ?? tx.description ?? 'Transaction'}</p>
                    <p className="text-xs text-gray-400">{tx.categoryName ?? 'Uncategorized'} · {tx.accountName}</p>
                  </div>
                  <span className={`text-sm font-semibold flex-shrink-0 ${tx.transactionType === 'INCOME' ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.transactionType === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount, tx.currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {topBudgets.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Budget Overview — {format(today, 'MMMM yyyy')}</h2>
            <button onClick={() => navigate('/budgets')} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              Manage <ArrowRight size={13} />
            </button>
          </div>
          <div className="space-y-4">
            {topBudgets.map(b => {
              const pct = Math.min(b.percentUsed, 100)
              const barColor = b.percentUsed >= 100 ? 'bg-red-500' : b.percentUsed >= 80 ? 'bg-yellow-500' : 'bg-green-500'
              return (
                <div key={b.budgetId}>
                  <div className="flex items-center justify-between mb-1.5 text-sm">
                    <span className="font-medium text-gray-800">{b.categoryIcon} {b.categoryName}</span>
                    <span className={`text-xs font-medium ${b.percentUsed >= 100 ? 'text-red-600' : b.percentUsed >= 80 ? 'text-yellow-600' : 'text-gray-500'}`}>
                      {formatCurrency(b.spentAmount)} / {formatCurrency(b.limitAmount)} · {b.percentUsed.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
