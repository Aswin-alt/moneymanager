import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

import { getAccounts, createAccount, updateAccount, deleteAccount } from '../api/accountApi'
import type { AccountResponse, AccountRequest, AccountType } from '../types/account'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Badge from '../components/ui/Badge'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'

const ACCOUNT_TYPES: AccountType[] = ['CHECKING', 'SAVINGS', 'CREDIT', 'INVESTMENT', 'CRYPTO', 'CASH']

const badgeVariantMap: Record<AccountType, 'checking' | 'savings' | 'credit' | 'investment' | 'crypto' | 'cash'> = {
  CHECKING: 'checking', SAVINGS: 'savings', CREDIT: 'credit',
  INVESTMENT: 'investment', CRYPTO: 'crypto', CASH: 'cash',
}

function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount)
}

const emptyForm: AccountRequest = { name: '', accountType: 'CHECKING', currency: 'USD', initialBalance: 0 }

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AccountResponse | null>(null)
  const [form, setForm] = useState<AccountRequest>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AccountResponse | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setAccounts(await getAccounts())
    } catch {
      toast.error('Failed to load accounts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (a: AccountResponse) => {
    setEditing(a)
    setForm({ name: a.name, accountType: a.accountType, currency: a.currency, initialBalance: a.balance, institution: a.institution ?? '', accountNumberMasked: a.accountNumberMasked ?? '' })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Account name is required'); return }
    try {
      setSaving(true)
      if (editing) {
        const updated = await updateAccount(editing.id, form)
        setAccounts(prev => prev.map(a => a.id === updated.id ? updated : a))
        toast.success('Account updated')
      } else {
        const created = await createAccount(form)
        setAccounts(prev => [...prev, created])
        toast.success('Account created')
      }
      setModalOpen(false)
    } catch {
      toast.error('Failed to save account')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await deleteAccount(deleteTarget.id)
      setAccounts(prev => prev.filter(a => a.id !== deleteTarget.id))
      toast.success('Account deleted')
      setDeleteTarget(null)
    } catch {
      toast.error('Failed to delete account')
    } finally {
      setDeleting(false)
    }
  }

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your financial accounts</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
          <Plus size={16} /> Add Account
        </button>
      </div>

      {/* Total balance bar */}
      {accounts.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-xl p-5 text-white">
          <p className="text-sm text-indigo-200">Total Balance</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(totalBalance)}</p>
          <p className="text-sm text-indigo-200 mt-1">across {accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
        </div>
      )}

      {loading ? (
        <LoadingSpinner fullPage />
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No accounts yet"
          message="Add your first account to start tracking your finances."
          action={{ label: '+ Add Account', onClick: openAdd }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(a => (
            <div key={a.id} className="group bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow relative">
              {/* Action buttons */}
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => setDeleteTarget(a)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <CreditCard size={18} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{a.name}</p>
                  {a.institution && <p className="text-xs text-gray-400 truncate">{a.institution}</p>}
                </div>
              </div>

              <p className={`text-2xl font-bold mb-2 ${a.balance < 0 ? 'text-red-500' : 'text-gray-900'}`}>
                {formatCurrency(a.balance, a.currency)}
              </p>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={badgeVariantMap[a.accountType]} label={a.accountType} />
                <span className="text-xs text-gray-400">{a.currency}</span>
                {!a.isActive && <Badge variant="system" label="Inactive" />}
              </div>

              <p className="text-xs text-gray-400 mt-3">
                Added {format(new Date(a.createdAt), 'MMM d, yyyy')}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Account' : 'Add Account'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Account'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Name *</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. HDFC Savings" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Type *</label>
            <select value={form.accountType} onChange={e => setForm(f => ({ ...f, accountType: e.target.value as AccountType }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <input type="text" maxLength={3} value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="USD" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{editing ? 'Balance' : 'Initial Balance'}</label>
              <input type="number" value={form.initialBalance} onChange={e => setForm(f => ({ ...f, initialBalance: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Institution (optional)</label>
            <input type="text" value={form.institution ?? ''} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. HDFC Bank" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Number (masked, optional)</label>
            <input type="text" maxLength={20} value={form.accountNumberMasked ?? ''} onChange={e => setForm(f => ({ ...f, accountNumberMasked: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. ••••4321" />
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Account"
        message={`Delete "${deleteTarget?.name}"? This will permanently delete the account and all associated transactions.`}
        isLoading={deleting}
      />
    </div>
  )
}
