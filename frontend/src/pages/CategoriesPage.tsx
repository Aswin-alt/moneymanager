import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, Lock, Tag } from 'lucide-react'
import toast from 'react-hot-toast'

import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/categoryApi'
import type { CategoryResponse, CategoryRequest, CategoryType } from '../types/category'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Badge from '../components/ui/Badge'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'

const COLOR_PALETTE = [
  '#EF4444','#F97316','#EAB308','#22C55E','#14B8A6','#3B82F6',
  '#8B5CF6','#EC4899','#6B7280','#0EA5E9','#84CC16','#F43F5E',
]

const emptyForm: CategoryRequest = { name: '', icon: '📦', color: '#6B7280', categoryType: 'EXPENSE' }

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [activeTab, setActiveTab] = useState<CategoryType>('EXPENSE')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CategoryResponse | null>(null)
  const [form, setForm] = useState<CategoryRequest>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CategoryResponse | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setCategories(await getCategories())
    } catch {
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = categories.filter(c => c.categoryType === activeTab)

  const openAdd = () => {
    setEditing(null)
    setForm({ ...emptyForm, categoryType: activeTab })
    setModalOpen(true)
  }

  const openEdit = (c: CategoryResponse) => {
    setEditing(c)
    setForm({ name: c.name, icon: c.icon, color: c.color, categoryType: c.categoryType, parentId: c.parentId ?? undefined })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Category name is required'); return }
    try {
      setSaving(true)
      if (editing) {
        const updated = await updateCategory(editing.id, form)
        setCategories(prev => prev.map(c => c.id === updated.id ? updated : c))
        toast.success('Category updated')
      } else {
        const created = await createCategory(form)
        setCategories(prev => [...prev, created])
        toast.success('Category created')
      }
      setModalOpen(false)
    } catch {
      toast.error('Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await deleteCategory(deleteTarget.id)
      setCategories(prev => prev.filter(c => c.id !== deleteTarget.id))
      toast.success('Category deleted')
      setDeleteTarget(null)
    } catch {
      toast.error('Failed to delete category')
    } finally {
      setDeleting(false)
    }
  }

  const parentOptions = categories.filter(c => c.categoryType === activeTab && !c.parentId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-0.5">Organize your transactions by category</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['EXPENSE', 'INCOME'] as CategoryType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'EXPENSE' ? '💸 Expenses' : '💰 Income'}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner fullPage />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Tag}
          title={`No ${activeTab.toLowerCase()} categories`}
          message="Add a category to organize your transactions."
          action={{ label: '+ Add Category', onClick: openAdd }}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {filtered.map(cat => (
            <div key={cat.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors group">
              <span className="text-2xl w-8 text-center">{cat.icon}</span>
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                {cat.parentName && (
                  <p className="text-xs text-gray-400">Sub-category of {cat.parentName}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {cat.isSystem && <Badge variant="system" label="System" />}
                <Badge variant={activeTab === 'EXPENSE' ? 'expense' : 'income'} label={cat.categoryType} />
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {cat.isSystem ? (
                  <div className="p-1.5 text-gray-300"><Lock size={14} /></div>
                ) : (
                  <>
                    <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeleteTarget(cat)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Category' : 'Add Category'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Groceries" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Icon (emoji)</label>
            <input type="text" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="🛒" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Color</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {COLOR_PALETTE.map(c => (
                <button
                  key={c}
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${form.color === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full border border-gray-200" style={{ backgroundColor: form.color }} />
              <span className="text-xs text-gray-500 font-mono">{form.color}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <input type="text" value={form.categoryType} readOnly
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" />
          </div>
          {parentOptions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category (optional)</label>
              <select value={form.parentId ?? ''} onChange={e => setForm(f => ({ ...f, parentId: e.target.value ? parseInt(e.target.value) : undefined }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">None (top-level)</option>
                {parentOptions.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
              </select>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message={`Delete "${deleteTarget?.name}"? Any transactions using this category will be uncategorized.`}
        isLoading={deleting}
      />
    </div>
  )
}
