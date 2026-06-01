import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
  message: string
  type: ToastType
  visible: boolean
  onClose: () => void
  duration?: number
}

const icons = { success: CheckCircle, error: XCircle, info: Info }
const styles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
}
const iconStyles = { success: 'text-green-500', error: 'text-red-500', info: 'text-blue-500' }

export default function Toast({ message, type, visible, onClose, duration = 4000 }: ToastProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (visible) {
      requestAnimationFrame(() => setShow(true))
      const timer = setTimeout(() => { setShow(false); setTimeout(onClose, 300) }, duration)
      return () => clearTimeout(timer)
    } else {
      setShow(false)
    }
  }, [visible, duration, onClose])

  if (!visible) return null

  const Icon = icons[type]

  return (
    <div className="fixed top-4 left-0 right-0 z-[100] flex justify-center px-4 pointer-events-none">
      <div className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg max-w-sm w-full transition-all duration-300 ${styles[type]} ${show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'}`}>
        <Icon className={`w-5 h-5 shrink-0 ${iconStyles[type]}`} />
        <p className="text-sm font-medium flex-1">{message}</p>
        <button onClick={() => { setShow(false); setTimeout(onClose, 300) }} className="shrink-0 opacity-50 hover:opacity-100">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Hook for easy usage
export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '', type: 'info', visible: false,
  })

  const show = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, visible: true })
  }

  const close = () => setToast(prev => ({ ...prev, visible: false }))

  const ToastElement = toast.visible ? (
    <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={close} />
  ) : null

  return { show, ToastElement }
}
