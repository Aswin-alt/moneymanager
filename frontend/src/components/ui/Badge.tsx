type BadgeVariant =
  | 'income'
  | 'expense'
  | 'transfer'
  | 'under'
  | 'near'
  | 'over'
  | 'checking'
  | 'savings'
  | 'credit'
  | 'investment'
  | 'crypto'
  | 'cash'
  | 'system'
  | 'custom'

interface BadgeProps {
  variant: BadgeVariant
  label: string
  bg?: string
  color?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  income:     'bg-green-100 text-green-700',
  expense:    'bg-red-100 text-red-700',
  transfer:   'bg-blue-100 text-blue-700',
  under:      'bg-green-100 text-green-700',
  near:       'bg-yellow-100 text-yellow-700',
  over:       'bg-red-100 text-red-700',
  checking:   'bg-indigo-100 text-indigo-700',
  savings:    'bg-green-100 text-green-700',
  credit:     'bg-red-100 text-red-700',
  investment: 'bg-purple-100 text-purple-700',
  crypto:     'bg-orange-100 text-orange-700',
  cash:       'bg-gray-100 text-gray-700',
  system:     'bg-gray-100 text-gray-600',
  custom:     '',
}

export default function Badge({ variant, label, bg, color }: BadgeProps) {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap'
  if (variant === 'custom' && bg && color) {
    return (
      <span className={base} style={{ backgroundColor: bg, color }}>
        {label}
      </span>
    )
  }
  return <span className={`${base} ${variantStyles[variant]}`}>{label}</span>
}
