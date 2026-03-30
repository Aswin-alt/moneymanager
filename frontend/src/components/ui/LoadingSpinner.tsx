interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  fullPage?: boolean
}

export default function LoadingSpinner({ size = 'md', fullPage = false }: LoadingSpinnerProps) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-7 h-7'
  const spinner = (
    <div className={`${sizeClass} animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600`} />
  )
  if (fullPage) {
    return (
      <div className="flex items-center justify-center h-64">{spinner}</div>
    )
  }
  return spinner
}
