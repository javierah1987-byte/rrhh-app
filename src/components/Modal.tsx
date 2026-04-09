'use client'
import { useEffect } from 'react'
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react'

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  children?: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm'|'md'|'lg'
}

export function Modal({ open, onClose, title, children, footer, size='md' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])
  if (!open) return null
  const w = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : 'max-w-md'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"/>
      <div className={`relative w-full ${w} card shadow-xl animate-scale-in`} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <X className="w-4 h-4 text-slate-500"/>
          </button>
        </div>
        {children && <div className="px-5 py-4">{children}</div>}
        {footer && <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}

type ConfirmProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  variant?: 'danger'|'warning'|'info'
  loading?: boolean
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmText='Confirmar', variant='danger', loading }: ConfirmProps) {
  const colors = {
    danger: { bg:'bg-red-50 dark:bg-red-900/20', icon:'text-red-500', btn:'btn-danger' },
    warning: { bg:'bg-amber-50 dark:bg-amber-900/20', icon:'text-amber-500', btn:'bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl px-4 py-2 transition-all active:scale-95' },
    info: { bg:'bg-indigo-50 dark:bg-indigo-900/20', icon:'text-indigo-500', btn:'btn-primary' },
  }[variant]
  const Icon = variant === 'danger' ? AlertTriangle : variant === 'warning' ? AlertTriangle : Info
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={<>
        <button onClick={onClose} className="btn-secondary">Cancelar</button>
        <button onClick={onConfirm} disabled={loading} className={colors.btn}>
          {loading ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/> : confirmText}
        </button>
      </>}>
      <div className={`flex gap-3 p-3 rounded-xl ${colors.bg}`}>
        <Icon className={`w-5 h-5 ${colors.icon} flex-shrink-0 mt-0.5`}/>
        <p className="text-sm text-slate-700 dark:text-slate-300">{message}</p>
      </div>
    </Modal>
  )
}
