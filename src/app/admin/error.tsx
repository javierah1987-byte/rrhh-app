'use client'
import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error('Admin error:', error) }, [error])
  return (
    <div className="flex flex-col items-center justify-center h-full py-16" role="alert" aria-live="assertive">
      <div className="card p-8 max-w-sm w-full text-center animate-scale-in">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" aria-hidden="true"/>
        <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-2">Error al cargar</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
          No se pudo cargar esta sección. Comprueba tu conexión e inténtalo de nuevo.
        </p>
        <button onClick={reset} className="btn-primary w-full">
          <RefreshCw className="w-4 h-4" aria-hidden="true"/> Reintentar
        </button>
      </div>
    </div>
  )
}
