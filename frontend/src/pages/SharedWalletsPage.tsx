export default function SharedWalletsPage() {
  const mockWallets = [
    {
      name: 'House Expenses',
      description: 'Shared rent, utilities & groceries',
      balance: 1240.00,
      members: ['Alice', 'Bob', 'Carol'],
      colors: ['#6366f1', '#22c55e', '#f97316'],
    },
    {
      name: 'Trip to Japan',
      description: 'Travel fund for August',
      balance: 3800.00,
      members: ['Alice', 'Dave'],
      colors: ['#6366f1', '#ec4899'],
    },
    {
      name: 'Office Supplies',
      description: 'Team shared costs',
      balance: 430.50,
      members: ['Eve', 'Frank', 'Grace', 'Hank'],
      colors: ['#14b8a6', '#8b5cf6', '#eab308', '#ef4444'],
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Shared Wallets</h1>
        <p className="text-sm text-gray-500 mt-0.5">Collaborate on expenses with others</p>
      </div>

      <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 flex items-center gap-3">
        <span className="text-yellow-600 text-xl">🚧</span>
        <div>
          <p className="text-sm font-medium text-yellow-800">Coming Soon</p>
          <p className="text-xs text-yellow-600">Shared wallets with real-time sync and expense splitting are under development. Preview below.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockWallets.map(wallet => (
          <div key={wallet.name} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
            <div>
              <p className="font-semibold text-gray-900 text-sm">{wallet.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{wallet.description}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Balance</p>
              <p className="text-xl font-bold text-indigo-600">${wallet.balance.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">Members</p>
              <div className="flex items-center gap-1">
                {wallet.members.map((m, i) => (
                  <div key={m} className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold ring-2 ring-white" style={{ backgroundColor: wallet.colors[i] }}>
                    {m[0]}
                  </div>
                ))}
                <span className="text-xs text-gray-400 ml-1">{wallet.members.length} members</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
