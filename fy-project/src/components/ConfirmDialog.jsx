import { motion } from 'framer-motion'

export default function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  type = 'danger' // 'danger' or 'success'
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-blue-200/30 backdrop-blur-[5px]" onClick={onClose} />
      
      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-300"
        >
          {/* Icon */}
          <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
            type === 'danger' ? 'bg-red-100' : 'bg-green-100'
          } mb-4`}>
            {type === 'danger' ? (
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>

          {/* Content */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {message}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-300 border border-gray-300 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors"
            >
              {cancelText}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                type === 'danger' 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {confirmText}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
