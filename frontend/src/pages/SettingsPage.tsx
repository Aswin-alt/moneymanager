import { useEffect, useState } from 'react'
import { Eye, EyeOff, User, Lock, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

import { getProfile, updateProfile, changePassword, deleteMyAccount } from '../api/userApi'
import { useAuthStore } from '../store/authStore'
import type { UserResponse } from '../types/auth'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'JPY', 'SGD']

export default function SettingsPage() {
  const logout = useAuthStore(s => s.logout)
  const navigate = useNavigate()

  const [profile, setProfile] = useState<UserResponse | null>(null)
  const [loading, setLoading] = useState(true)

  // Profile form
  const [displayName, setDisplayName] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)

  // Password form
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [pwdSaving, setPwdSaving] = useState(false)

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    getProfile().then(p => {
      setProfile(p)
      setDisplayName(p.displayName)
      setCurrency(p.defaultCurrency)
      setAvatarUrl(p.avatarUrl ?? '')
    }).catch(() => toast.error('Failed to load profile')).finally(() => setLoading(false))
  }, [])

  const handleSaveProfile = async () => {
    if (!displayName.trim()) { toast.error('Display name is required'); return }
    try {
      setProfileSaving(true)
      const updated = await updateProfile({ displayName, defaultCurrency: currency, avatarUrl: avatarUrl || undefined })
      setProfile(updated)
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setProfileSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPwd || !newPwd) { toast.error('All fields are required'); return }
    if (newPwd !== confirmPwd) { toast.error('New passwords do not match'); return }
    if (newPwd.length < 8) { toast.error('New password must be at least 8 characters'); return }
    try {
      setPwdSaving(true)
      await changePassword({ currentPassword: currentPwd, newPassword: newPwd })
      toast.success('Password updated')
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
    } catch {
      toast.error('Failed to change password. Check your current password.')
    } finally {
      setPwdSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true)
      await deleteMyAccount()
      logout()
      navigate('/')
    } catch {
      toast.error('Failed to delete account')
      setDeleting(false)
    }
  }

  const initials = profile?.displayName?.slice(0, 2).toUpperCase() ?? '??'

  if (loading) return <LoadingSpinner fullPage />

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account preferences</p>
      </div>

      {/* Profile section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <User size={16} className="text-indigo-600" />
          </div>
          <h2 className="text-base font-semibold text-gray-900">Profile</h2>
        </div>

        {/* Avatar preview */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" onError={() => setAvatarUrl('')} />
            ) : (
              <span className="text-xl font-bold text-indigo-700">{initials}</span>
            )}
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
            <input type="url" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="https://..." />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
          <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={profile?.email ?? ''} readOnly
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
          <select value={currency} onChange={e => setCurrency(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <button onClick={handleSaveProfile} disabled={profileSaving}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {profileSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Lock size={16} className="text-indigo-600" />
          </div>
          <h2 className="text-base font-semibold text-gray-900">Security</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
          <div className="relative">
            <input type={showCurrent ? 'text' : 'password'} value={currentPwd} onChange={e => setCurrentPwd(e.target.value)}
              className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <button onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <div className="relative">
            <input type={showNew ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)}
              className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <button onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {newPwd.length > 0 && (
            <p className={`text-xs mt-1 ${newPwd.length < 8 ? 'text-red-500' : 'text-green-600'}`}>
              {newPwd.length < 8 ? 'At least 8 characters required' : '✓ Good length'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
          <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          {confirmPwd.length > 0 && newPwd !== confirmPwd && (
            <p className="text-xs mt-1 text-red-500">Passwords do not match</p>
          )}
        </div>

        <button onClick={handleChangePassword} disabled={pwdSaving}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {pwdSaving ? 'Updating...' : 'Update Password'}
        </button>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-red-100">
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
            <AlertTriangle size={16} className="text-red-600" />
          </div>
          <h2 className="text-base font-semibold text-red-700">Danger Zone</h2>
        </div>
        <p className="text-sm text-gray-600">
          Permanently delete your account and all your financial data. This action cannot be undone.
        </p>
        <button onClick={() => setDeleteOpen(true)}
          className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors">
          Delete My Account
        </button>
      </div>

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="This action is permanent and cannot be undone. All your financial data will be deleted."
        confirmLabel="Delete Account"
        requireTyping="DELETE"
        isLoading={deleting}
      />
    </div>
  )
}
