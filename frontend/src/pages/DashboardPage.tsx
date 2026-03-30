import Navbar from '../components/Navbar'
import { useAuthStore } from '../store/authStore'

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Welcome back, {user?.displayName}! 👋
          </h1>
          <p className="text-gray-500 mb-8">Your financial dashboard is on its way.</p>

          {/* Summary cards — placeholder */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {['Total Balance', 'This Month', 'Savings'].map((label) => (
              <div key={label} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">{label}</p>
                <p className="text-2xl font-bold text-gray-300">—</p>
              </div>
            ))}
          </div>

          <div className="p-5 bg-indigo-50 rounded-xl border border-indigo-100">
            <p className="text-indigo-700 text-sm font-medium">
              🚧 Transactions, budgets and analytics will appear here in Phase 3.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
