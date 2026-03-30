import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  requireTyping?: string
  isLoading?: boolean
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  requireTyping,
  isLoading = false,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState('')

  const canConfirm = requireTyping ? typed === requireTyping : true

  const handleClose = () => {
    setTyped('')
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm || isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Deleting...' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
          <AlertTriangle size={20} className="text-red-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600">{message}</p>
          {requireTyping && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-1.5">
                Type <span className="font-mono font-semibold text-gray-700">"{requireTyping}"</span> to confirm
              </p>
              <input
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder={requireTyping}
              />
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
