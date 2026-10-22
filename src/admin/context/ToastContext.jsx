import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { CircleCheck, CircleAlert, Info, X } from 'lucide-react'

const ToastCtx = createContext(null)

const STYLES = {
  success: { cls: 'border-green-200 bg-green-50 text-green-800', Icon: CircleCheck },
  error: { cls: 'border-red-200 bg-red-50 text-red-800', Icon: CircleAlert },
  info: { cls: 'border-blue-200 bg-blue-50 text-blue-800', Icon: Info },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const notify = useCallback(
    (message, type = 'success') => {
      const id = ++idRef.current
      setToasts((t) => [...t, { id, message, type }])
      setTimeout(() => dismiss(id), 4000)
    },
    [dismiss],
  )

  return (
    <ToastCtx.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[2000] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2" aria-live="polite">
        {toasts.map((t) => {
          const { cls, Icon } = STYLES[t.type] || STYLES.info
          return (
            <div key={t.id} className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${cls}`}>
              <Icon size={18} className="mt-0.5 shrink-0" />
              <p className="flex-1">{t.message}</p>
              <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss">
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  return useContext(ToastCtx)
}
