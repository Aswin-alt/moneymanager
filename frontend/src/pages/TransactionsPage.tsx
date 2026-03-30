import { useEffect, useState, useCallback, useRef } from 'react'
import { Plus, Pencil, Trash2, Search, X, ArrowLeftRight } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from '../api/transactionApi'
import { getAccounts } from '../api/accountApi'
import { getCategories } from '../api/categoryApi'
import type { TransactionResponse, TransactionRequest, TransactionType, TransactionFilters } from '../types/transaction'
import type { AccountResponse } from '../types/account'
import type { CategoryResponse } from '../types/category'
import type { PageResponse } from '../types/common'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Badge from '../components/ui/Badge'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'

function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount)
}

const today = format(new Date(), 'yyyy-MM-dd')

const emptyForm: TransactionRequest = {
  accountId: 0, amount: 0, currency: 'USD', transactionType: 'EXPENSE', transactionDate: today,
}

const PAGE_SIZES = [10, 20, 50]

export default function TransactionsPage() {
  const [page, setPage] = useState<PageResponse<TransactionResponse> | null>(null)
  const [accounts, setAccounts] = useState<AccountResponse[]>([])
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)

  // Filters
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterAccount, setFilterAccount] = useState('')
  const [filterType, setFilterType] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<TransactionResponse | null>(null)
  const [form, setForm] = useState<TransactionRequest>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<TransactionResponse | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  const buildFilters = useCallback((): TransactionFilters => {
    const f: TransactionFilters = { page: currentPage, size: pageSize }
    if (from) f.from = from
    if (to) f.to = to
    if (filterCategory) f.categoryId = parseInt(filterCategory)
    if (filterAccount) f.accountId = parseInt(filterAccount)
    if (filterType) f.type = filterType as TransactionType
    if (debouncedSearch) f.search = debouncedSearch
    return f
  }, [currentPage, pageSize, from, to, filterCategory, filterAccount, filterType, debouncedSearch])

  const loadTx = useCallback(async () => {
    try {
      setLoading(true)
      setPage(await getTransactions(buildFilters()))
    } catch {
      toast.error('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }, [buildFilters])

  useEffect(() => { loadTx() }, [loadTx])

  // Load accounts + categories once
  useEffect(() => {
    Promise.all([getAccounts(), getCategories()]).then(([accs, cats]) => {
      setAccounts(accs)
      setCategories(cats)
    }).catch(() => {})
  }, [])

  const clearFilters = () => { setFrom(''); setTo(''); setFilterCategory(''); setFilterAccount(''); setFilterType(''); setSearch(''); setCurrentPage(0) }

  const openAdd = () => {
    setEditing(null)
    setForm({ ...emptyForm, accountId: accounts[0]?.id ?? 0 })
    setModalOpen(true)
  }

  const openEdit = (tx: TransactionResponse) => {
    setEditing(tx)
    setForm({
      accountId: tx.accountId, categoryId: tx.categoryId ?? undefined,
      amount: tx.amount, currency: tx.currency, transactionType: tx.transactionType,
      merchant: tx.merchant ?? '', description: tx.description ?? '',
      transactionDate: tx.transactionDate, tags: tx.tags ?? '',
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.accountId) { toast.error('Account is required'); return }
    if (!form.amount || form.amount <= 0) { toast.error('Amount must be positive'); return }
    try {
      setSaving(true)
      const payload = { ...form }
      if (!payload.categoryId) delete payload.categoryId
      if (!payload.tags) delete payload.tags

      if (editing) {
        await updateTransaction(editing.id, payload)
        toast.success('Transaction updated')
      } else {
        await createTransaction(payload)
        toast.success('Transaction added')
      }
      setModalOpen(false)
      setCurrentPage(0)
      loadTx()
    } catch {
      toast.error('Failed to save transaction')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await deleteTransaction(deleteTarget.id)
      toast.success('Transaction deleted')
      setDeleteTarget(null)
      loadTx()
    } catch {
      toast.error('Failed to delete transaction')
    } finally {
      setDeleting(false)
    }
  }

  const totalItems = page?.totalElements ?? 0
  const totalPages = page?.totalPages ?? 0
  const startItem = totalItems === 0 ? 0 : currentPage * pageSize + 1
  const endItem = Math.min((currentPage + 1) * pageSize, totalItems)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track every transaction in detail</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
          <Plus size={16} /> Add Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <input type="date" value={from} onChange={e => { setFrom(e.target.value); setCurrentPage(0) }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="From" />
          <input type="date" value={to} onChange={e => { setTo(e.target.value); setCurrentPage(0) }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="To" />
          <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setCurrentPage(0) }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          <select value={filterAccount} onChange={e => { setFilterAccount(e.target.value); setCurrentPage(0) }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Accounts</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select value={filterType} onChange={e => { setFilterType(e.target.value); setCurrentPage(0) }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
            <option value="TRANSFER">Transfer</option>
          </select>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(0) }}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Search..." />
          </div>
        </div>
        {(from || to || filterCategory || filterAccount || filterType || search) && (
          <button onClick={clearFilters} className="mt-2 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
            <X size={12} /> Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner fullPage />
        ) : !page || page.content.length === 0 ? (
          <EmptyState icon={ArrowLeftRight} title="No transactions found" message="Add your first transaction or adjust your filters." action={{ label: '+ Add Transaction', onClick: openAdd }} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Merchant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Account</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {page.content.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{format(new Date(tx.transactionDate), 'MMM d, yyyy')}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium max-w-[160px] truncate">
                      {tx.merchant || tx.description || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {tx.categoryName ? (
                        <span className="flex items-center gap-1.5">
                          <span>{tx.categoryIcon}</span>
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ backgroundColor: `${tx.categoryColor}20`, color: tx.categoryColor ?? '#6b7280' }}
                          >
                            {tx.categoryName}
                          </span>
                        </span>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{tx.accountName}</td>
                    <td className="px-4 py-3">
                      <Badge variant={tx.transactionType === 'INCOME' ? 'income' : tx.transactionType === 'EXPENSE' ? 'expense' : 'transfer'} label={tx.transactionType} />
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${tx.transactionType === 'INCOME' ? 'text-green-600' : tx.transactionType === 'EXPENSE' ? 'text-red-500' : 'text-gray-700'}`}>
                      {tx.transactionType === 'INCOME' ? '+' : tx.transactionType === 'EXPENSE' ? '-' : ''}{formatCurrency(tx.amount, tx.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(tx)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"><Pencil size={14} /></button>
                        <button onClick={() => setDeleteTarget(tx)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {page && totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <span>Show</span>
            <select value={pageSize} onChange={e => { setPageSize(parseInt(e.target.value)); setCurrentPage(0) }}
              className="px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span>· Showing {startItem}–{endItem} of {totalItems}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0}
              className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              ← Prev
            </button>
            <span className="text-gray-500 text-xs">Page {currentPage + 1} of {totalPages}</span>
            <button onClick={() => setCurrentPage(p => p + 1)} disabled={page.last}
              className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Transaction' : 'Add Transaction'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select value={form.transactionType} onChange={e => setForm(f => ({ ...f, transactionType: e.target.value as TransactionType }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
                <option value="TRANSFER">Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input type="date" value={form.transactionDate} onChange={e => setForm(f => ({ ...f, transactionDate: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account *</label>
            <select value={form.accountId || ''} onChange={e => setForm(f => ({ ...f, accountId: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select account</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
            </select>
          </div>
          {form.transactionType === 'TRANSFER' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Account</label>
              <select value={form.toAccountId ?? ''} onChange={e => setForm(f => ({ ...f, toAccountId: e.target.value ? parseInt(e.target.value) : undefined }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select destination account</option>
                {accounts.filter(a => a.id !== form.accountId).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={form.categoryId ?? ''} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value ? parseInt(e.target.value) : undefined }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Uncategorized</option>
              {categories.filter(c => form.transactionType === 'INCOME' ? c.categoryType === 'INCOME' : c.categoryType === 'EXPENSE').map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
              <input type="number" min="0.01" step="0.01" value={form.amount || ''} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <input type="text" maxLength={3} value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="USD" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Merchant</label>
            <input type="text" value={form.merchant ?? ''} onChange={e => setForm(f => ({ ...f, merchant: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Amazon, Zomato" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="Optional note..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
            <input type="text" value={form.tags ?? ''} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder='e.g. travel, business' />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Transaction"
        message={`Delete this transaction of ${deleteTarget ? formatCurrency(deleteTarget.amount, deleteTarget.currency) : ''}? This action cannot be undone.`}
        isLoading={deleting}
      />
    </div>
  )
}
