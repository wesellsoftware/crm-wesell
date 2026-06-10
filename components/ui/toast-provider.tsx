'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Undo2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToastAction {
  label: string
  onClick: () => void | Promise<void>
}

interface ToastOptions {
  message: string
  action?: ToastAction
  duration?: number
}

interface ToastState extends ToastOptions {
  id: number
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void
  dismissToast: () => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null)
  const [actionPending, setActionPending] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const idRef = useRef(0)

  const dismissToast = useCallback(() => {
    clearTimeout(timerRef.current)
    setToast(null)
    setActionPending(false)
  }, [])

  const showToast = useCallback(
    ({ message, action, duration = action ? 8000 : 4000 }: ToastOptions) => {
      clearTimeout(timerRef.current)
      idRef.current += 1
      const id = idRef.current
      setToast({ id, message, action, duration })
      setActionPending(false)

      timerRef.current = setTimeout(() => {
        setToast(current => (current?.id === id ? null : current))
        setActionPending(false)
      }, duration)
    },
    []
  )

  useEffect(() => () => clearTimeout(timerRef.current), [])

  async function handleAction() {
    if (!toast?.action || actionPending) return
    setActionPending(true)
    try {
      await toast.action.onClick()
      dismissToast()
    } catch {
      setActionPending(false)
    }
  }

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      {toast && (
        <div
          key={toast.id}
          className="fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 justify-center px-4 pointer-events-none"
          role="status"
          aria-live="polite"
        >
          <div className="app-toast pointer-events-auto flex items-center gap-3 rounded-full border border-we-red/40 bg-we-red px-4 py-2.5 text-white shadow-xl shadow-we-red/25">
            <span className="font-body text-sm text-white/95">{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                onClick={() => void handleAction()}
                disabled={actionPending}
                className={cn(
                  'flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-body text-xs font-medium text-we-red transition-colors hover:bg-white/90',
                  actionPending && 'opacity-60 cursor-not-allowed'
                )}
              >
                <Undo2 className="size-3.5 shrink-0" strokeWidth={2.25} />
                {toast.action.label}
              </button>
            )}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  )
}
