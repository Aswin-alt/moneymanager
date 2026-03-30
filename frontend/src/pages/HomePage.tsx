import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

const features = [
  {
    icon: '📊',
    title: 'Smart Dashboard',
    description: 'Real-time overview of your finances — balances, spending, and trends at a glance.',
  },
  {
    icon: '🤖',
    title: 'AI Categorization',
    description: 'Transactions are categorized automatically. Correct once, and the AI learns your patterns.',
  },
  {
    icon: '📈',
    title: 'Cash Flow Forecast',
    description: 'Predict your balance weeks ahead using spending trends and known recurring bills.',
  },
  {
    icon: '🔔',
    title: 'Budget Alerts',
    description: 'Get notified before you overspend — warnings at 80% and again when you hit the limit.',
  },
  {
    icon: '🔍',
    title: 'Anomaly Detection',
    description: 'Unusual charges are flagged automatically so nothing slips through unnoticed.',
  },
  {
    icon: '👥',
    title: 'Shared Wallets',
    description: 'Split expenses with a partner, family, or roommates with a shared transaction feed.',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <span>✨</span>
            Intelligent Financial Assistant
          </div>
          <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-6">
            Take control of your{' '}
            <span className="text-indigo-600">finances</span>{' '}
            intelligently
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
            Track spending, predict cash flow, detect anomalies, and get AI-powered insights —
            all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-semibold px-8 py-4 rounded-xl transition-colors shadow-lg shadow-indigo-200"
            >
              Get Started Free
            </Link>
            <Link
              to="/login"
              className="border-2 border-gray-300 hover:border-indigo-400 text-gray-700 text-lg font-semibold px-8 py-4 rounded-xl transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Everything you need to manage money smarter
            </h2>
            <p className="text-gray-500 text-lg">
              Built for people who want more than just a spreadsheet
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-indigo-100 text-lg mb-8">
            Create your free account and take charge of your finances today.
          </p>
          <Link
            to="/register"
            className="inline-block bg-white text-indigo-600 hover:bg-indigo-50 font-semibold text-lg px-8 py-4 rounded-xl transition-colors"
          >
            Create your free account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center text-gray-400 text-sm">
          © 2026 Money Manager — Intelligent Financial Assistant
        </div>
      </footer>
    </div>
  )
}
