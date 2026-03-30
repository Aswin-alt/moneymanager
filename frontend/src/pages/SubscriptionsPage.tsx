export default function SubscriptionsPage() {
  const mockSubs = [
    { merchant: 'Netflix', amount: 15.99, frequency: 'Monthly', nextDue: 'Jul 15, 2025', category: 'Entertainment', color: '#ef4444' },
    { merchant: 'Spotify', amount: 9.99, frequency: 'Monthly', nextDue: 'Jul 12, 2025', category: 'Entertainment', color: '#22c55e' },
    { merchant: 'iCloud', amount: 2.99, frequency: 'Monthly', nextDue: 'Jul 18, 2025', category: 'Technology', color: '#3b82f6' },
    { merchant: 'Adobe CC', amount: 54.99, frequency: 'Monthly', nextDue: 'Jul 22, 2025', category: 'Technology', color: '#f97316' },
    { merchant: 'AWS', amount: 12.50, frequency: 'Monthly', nextDue: 'Jul 31, 2025', category: 'Technology', color: '#f59e0b' },
    { merchant: 'Gym', amount: 49.99, frequency: 'Monthly', nextDue: 'Aug 1, 2025', category: 'Health', color: '#8b5cf6' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
        <p className="text-sm text-gray-500 mt-0.5">Track recurring payments</p>
      </div>

      <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 flex items-center gap-3">
        <span className="text-yellow-600 text-xl">🚧</span>
        <div>
          <p className="text-sm font-medium text-yellow-800">Coming Soon</p>
          <p className="text-xs text-yellow-600">Automatic subscription detection and renewal alerts are under development. Preview below.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockSubs.map(sub => (
          <div key={sub.merchant} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base" style={{ backgroundColor: sub.color }}>
                  {sub.merchant[0]}
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{sub.merchant}</p>
                  <p className="text-xs text-gray-400">{sub.frequency}</p>
                </div>
              </div>
              <span className="text-base font-semibold text-gray-900">${sub.amount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{sub.category}</span>
              <span>Next: {sub.nextDue}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
