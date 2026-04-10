'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('Error:', error) }, [error])
  const router = useRouter()
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-8" role="alert" aria-live="assertive">
      <div className="card p-8 max-w-md w-full text-center animate-scale-in">
        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-8 h-8 text-red-500" aria-hidden="true"/>
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Algo ha ido mal</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Se ha producido un error inesperado. Puedes intentarlo de nuevo o volver al inicio.
        </p>
        {error.digest && (
          <p className="text-xs text-slate-300 dark:text-slate-600 font-mono mb-6">Ref: {error.digest}</p>
        )}
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-primary">
            <RefreshCw className="w-4 h-4" aria-hidden="true"/> Reintentar
          </button>
          <button onClick={()=>router.push('/')} className="btn-secondary">
            <Home className="w-4 h-4" aria-hidden="true"/> Inicio
          </button>
        </div>
      </div>
    </div>
  )
}
