import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Target } from 'lucide-react'
import { format, addMonths, subMonths, parseISO } from 'date-fns'
import toast from 'react-hot-toast'

import { getBudgets, createBudget, updateBudget, deleteBudget } from '../api/budgetApi'
import { getCategories } from '../api/categoryApi'
import type { BudgetSummaryResponse, BudgetRequest } from '../types/budget'
import type { CategoryResponse } from '../types/category'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Badge from '../components/ui/Badge'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'

function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount)
}

export default function BudgetsPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [budgets, setBudgets] = useState<BudgetSummaryResponse[]>([])
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<BudgetSummaryResponse | null>(null)
  const [form, setForm] = useState<BudgetRequest>({ categoryId: 0, monthYear: '', limitAmount: 0, currency: 'USD', alertAt80: true, alertAt100: true })
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<BudgetSummaryResponse | null>(null)
  const [deleting, setDeleting] = useState(false)

  const monthStr = format(currentMonth, 'yyyy-MM')
  const monthLabel = format(currentMonth, 'MMMM yyyy')

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setBudgets(await getBudgets(monthStr))
    } catch {
      toast.error('Failed to load budgets')
    } finally {
      setLoading(false)
    }
  }, [monthStr])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    getCategories('EXPENSE').then(setCategories).catch(() => {})
  }, [])

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.limitAmount, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0)
  const overallPct = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0

  const openAdd = () => {
    setEditing(null)
    setForm({ categoryId: categories[0]?.id ?? 0, monthYear: monthStr, limitAmount: 0, currency: 'USD', alertAt80: true, alertAt100: true })
    setModalOpen(true)
  }

  const openEdit = (b: BudgetSummaryResponse) => {
    setEditing(b)
    setForm({ categoryId: b.categoryId, monthYear: b.monthYear, limitAmount: b.limitAmount, currency: b.currency, alertAt80: true, alertAt100: true })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.categoryId) { toast.error('Category is required'); return }
    if (!form.limitAmount || form.limitAmount <= 0) { toast.error('Limit must be positive'); return }
    try {
      setSaving(true)
      if (editing) {
        const updated = await updateBudget(editing.budgetId, form)
        setBudgets(prev => prev.map(b => b.budgetId === updated.budgetId ? updated : b))
        toast.success('Budget updated')
      } else {
        const created = await createBudget(form)
        setBudgets(prev => [...prev, created])
        toast.success('Budget created')
      }
      setModalOpen(false)
    } catch {
      toast.error('Failed to save budget')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await deleteBudget(deleteTarget.budgetId)
      setBudgets(prev => prev.filter(b => b.budgetId !== deleteTarget.budgetId))
      toast.success('Budget deleted')
      setDeleteTarget(null)
    } catch {
      toast.error('Failed to delete budget')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
          <p className="text-sm text-gray-500 mt-0.5">Set spending limits and track your progress</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
          <Plus size={16} /> Add Budget
        </button>
      </div>

      {/* Month navigator */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-3">
        <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <ChevronLeft size={18} />
        </button>
        <span className="text-base font-semibold text-gray-900">{monthLabel}</span>
        <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Summary bar */}
      {budgets.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Budgeted', value: formatCurrency(totalBudgeted) },
            { label: 'Total Spent', value: formatCurrency(totalSpent) },
            { label: 'Overall Usage', value: `${overallPct.toFixed(0)}%` },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Budget cards */}
      {loading ? (
        <LoadingSpinner fullPage />
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={Target}
          title={`No budgets for ${monthLabel}`}
          message="Add a budget to start tracking your spending limits."
          action={{ label: '+ Add Budget', onClick: openAdd }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map(b => {
            const pct = Math.min(b.percentUsed, 100)
            const barColor = b.percentUsed >= 100 ? 'bg-red-500' : b.percentUsed >= 80 ? 'bg-yellow-500' : 'bg-green-500'
            return (
              <div key={b.budgetId} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 group relative">
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => setDeleteTarget(b)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{b.categoryIcon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{b.categoryName}</p>
                    <p className="text-xs text-gray-400">{format(parseISO(`${b.monthYear}-01`), 'MMMM yyyy')}</p>
                  </div>
                  <Badge
                    variant={b.status === 'OVER' ? 'over' : b.status === 'NEAR' ? 'near' : 'under'}
                    label={b.status}
                  />
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>{formatCurrency(b.spentAmount, b.currency)} spent</span>
                    <span>{b.percentUsed.toFixed(0)}%</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Limit: <span className="font-medium text-gray-900">{formatCurrency(b.limitAmount, b.currency)}</span></span>
                  <span className={b.remainingAmount <= 0 ? 'text-red-500 font-medium' : 'text-gray-500'}>
                    {b.remainingAmount > 0 ? `${formatCurrency(b.remainingAmount, b.currency)} left` : `${formatCurrency(Math.abs(b.remainingAmount), b.currency)} over`}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Budget' : 'Add Budget'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Budget'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select value={form.categoryId || ''} onChange={e => setForm(f => ({ ...f, categoryId: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select expense category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month *</label>
            <input type="month" value={form.monthYear} onChange={e => setForm(f => ({ ...f, monthYear: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget Limit *</label>
              <input type="number" min="0.01" step="0.01" value={form.limitAmount || ''} onChange={e => setForm(f => ({ ...f, limitAmount: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <input type="text" maxLength={3} value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="USD" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.alertAt80} onChange={e => setForm(f => ({ ...f, alertAt80: e.target.checked }))} className="w-4 h-4 text-indigo-600 rounded" />
              Alert when 80% of budget is used
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.alertAt100} onChange={e => setForm(f => ({ ...f, alertAt100: e.target.checked }))} className="w-4 h-4 text-indigo-600 rounded" />
              Alert when 100% of budget is used
            </label>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Budget"
        message={`Delete the ${deleteTarget?.categoryName} budget for ${deleteTarget?.monthYear}? This won't affect your transactions.`}
        isLoading={deleting}
      />
    </div>
  )
}
