import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatsCardProps {
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  label: string
  value: string
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    label: string
  }
}

export default function StatsCard({
  icon: Icon,
  iconColor = 'text-indigo-600',
  iconBg = 'bg-indigo-50',
  label,
  value,
  trend,
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon size={20} className={iconColor} />
        </div>
        {trend && (
          <span
            className={`flex items-center gap-1 text-xs font-medium ${
              trend.direction === 'up'
                ? 'text-green-600'
                : trend.direction === 'down'
                ? 'text-red-600'
                : 'text-gray-500'
            }`}
          >
            {trend.direction === 'up' ? <TrendingUp size={14} /> : trend.direction === 'down' ? <TrendingDown size={14} /> : null}
            {trend.label}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-0.5">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  )
}
