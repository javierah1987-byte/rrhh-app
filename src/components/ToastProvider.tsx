'use client'
import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

type Toast = { id: number; tipo: 'ok'|'err'|'info'; msg: string }
type ToastCtx = { toast: (tipo: Toast['tipo'], msg: string) => void }

const Ctx = createContext<ToastCtx>({ toast: () => {} })

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const toast = useCallback((tipo: Toast['tipo'], msg: string) => {
    const id = Date.now()
    setToasts(t => [...t, { id, tipo, msg }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000)
  }, [])
  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
        {toasts.map(t => {
          const cfg = t.tipo === 'ok'
            ? { bg: 'bg-emerald-50 dark:bg-emerald-900/90 border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200', Icon: CheckCircle }
            : t.tipo === 'err'
            ? { bg: 'bg-red-50 dark:bg-red-900/90 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200', Icon: AlertCircle }
            : { bg: 'bg-indigo-50 dark:bg-indigo-900/90 border-indigo-200 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200', Icon: Info }
          return (
            <div key={t.id} className={`flex items-center gap-2 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium animate-scale-in pointer-events-auto ${cfg.bg}`}>
              <cfg.Icon className="w-4 h-4 flex-shrink-0"/>
              <span>{t.msg}</span>
              <button onClick={()=>setToasts(ts=>ts.filter(x=>x.id!==t.id))} className="ml-1 opacity-60 hover:opacity-100">
                <X className="w-3.5 h-3.5"/>
              </button>
            </div>
          )
        })}
      </div>
    </Ctx.Provider>
  )
}

export function useToast() { return useContext(Ctx) }
