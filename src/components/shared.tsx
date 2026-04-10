import React from 'react'

const ILLUSTRATIONS: Record<string,React.ReactNode> = {
  employees: (
    <svg width="120" height="100" viewBox="0 0 120 100" fill="none" aria-hidden="true">
      <circle cx="45" cy="30" r="18" fill="currentColor" className="text-indigo-100 dark:text-indigo-900/40"/>
      <circle cx="45" cy="30" r="12" fill="currentColor" className="text-indigo-200 dark:text-indigo-800/60"/>
      <path d="M15 80 C15 60 30 52 45 52 C60 52 75 60 75 80" fill="currentColor" className="text-indigo-100 dark:text-indigo-900/40"/>
      <circle cx="80" cy="35" r="14" fill="currentColor" className="text-emerald-100 dark:text-emerald-900/40"/>
      <circle cx="80" cy="35" r="9" fill="currentColor" className="text-emerald-200 dark:text-emerald-800/60"/>
      <path d="M56 82 C56 65 68 58 80 58 C92 58 104 65 104 82" fill="currentColor" className="text-emerald-100 dark:text-emerald-900/40"/>
    </svg>
  ),
  calendar: (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <rect x="10" y="20" width="80" height="70" rx="10" fill="currentColor" className="text-indigo-100 dark:text-indigo-900/40"/>
      <rect x="10" y="20" width="80" height="24" rx="10" fill="currentColor" className="text-indigo-200 dark:text-indigo-800/60"/>
      <rect x="22" y="8" width="8" height="18" rx="4" fill="currentColor" className="text-indigo-300 dark:text-indigo-700"/>
      <rect x="70" y="8" width="8" height="18" rx="4" fill="currentColor" className="text-indigo-300 dark:text-indigo-700"/>
    </svg>
  ),
  document: (
    <svg width="100" height="110" viewBox="0 0 100 110" fill="none" aria-hidden="true">
      <rect x="15" y="10" width="70" height="90" rx="8" fill="currentColor" className="text-indigo-100 dark:text-indigo-900/40"/>
      <path d="M55 10 L55 35 L80 35" fill="currentColor" className="text-indigo-200 dark:text-indigo-800/60"/>
      <path d="M55 10 L80 35" stroke="currentColor" strokeWidth="2" className="text-indigo-200 dark:text-indigo-700" fill="none"/>
      {[50,62,74,86].map((y,i)=>(
        <rect key={i} x="25" y={y} width={i%2===0?40:28} height="6" rx="3" fill="currentColor" className="text-indigo-200 dark:text-indigo-800/40"/>
      ))}
    </svg>
  ),
  chart: (
    <svg width="110" height="100" viewBox="0 0 110 100" fill="none" aria-hidden="true">
      <rect x="10" y="10" width="90" height="70" rx="8" fill="currentColor" className="text-indigo-100 dark:text-indigo-900/40"/>
      {[{x:22,h:30,c:'text-indigo-300 dark:text-indigo-700'},{x:38,h:50,c:'text-emerald-300 dark:text-emerald-700'},{x:54,h:20,c:'text-indigo-300 dark:text-indigo-700'},{x:70,h:45,c:'text-amber-300 dark:text-amber-700'},{x:86,h:35,c:'text-emerald-300 dark:text-emerald-700'}].map((b,i)=>(
        <rect key={i} x={b.x} y={70-b.h} width="12" height={b.h} rx="4" fill="currentColor" className={b.c}/>
      ))}
    </svg>
  ),
  inbox: (
    <svg width="110" height="90" viewBox="0 0 110 90" fill="none" aria-hidden="true">
      <rect x="10" y="25" width="90" height="60" rx="8" fill="currentColor" className="text-indigo-100 dark:text-indigo-900/40"/>
      <path d="M10 35 L55 58 L100 35" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" className="text-indigo-300 dark:text-indigo-600"/>
      <circle cx="55" cy="20" r="14" fill="currentColor" className="text-emerald-100 dark:text-emerald-900/40"/>
      <path d="M48 20 L53 25 L63 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" className="text-emerald-500"/>
    </svg>
  ),
  checkmark: (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <circle cx="50" cy="50" r="40" fill="currentColor" className="text-emerald-100 dark:text-emerald-900/40"/>
      <circle cx="50" cy="50" r="30" fill="currentColor" className="text-emerald-200 dark:text-emerald-800/50"/>
      <path d="M33 50 L44 62 L67 38" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" className="text-emerald-600 dark:text-emerald-400"/>
    </svg>
  ),
}

type EmptyStateProps = { icon?:keyof typeof ILLUSTRATIONS; title:string; description?:string; action?:React.ReactNode }

export function EmptyState({ icon='inbox', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center animate-fade-in" role="status">
      <div className="mb-5 opacity-80">{ILLUSTRATIONS[icon]}</div>
      <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs mb-4">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3" role="status" aria-label="Cargando...">
      <div className="flex items-center gap-3">
        <div className="skeleton w-10 h-10 rounded-full flex-shrink-0"/>
        <div className="flex-1 space-y-2"><div className="skeleton h-4 w-1/2"/><div className="skeleton h-3 w-1/3"/></div>
      </div>
      <div className="skeleton h-3 w-full"/><div className="skeleton h-3 w-3/4"/>
      <span className="sr-only">Cargando...</span>
    </div>
  )
}

export function SkeletonTable({ rows=5 }: { rows?:number }) {
  return (
    <div className="card overflow-hidden" role="status" aria-label="Cargando tabla...">
      <div className="bg-slate-50 dark:bg-slate-700/50 px-4 py-3 flex gap-6">
        {[140,100,80,100,60].map((w,i)=><div key={i} className="skeleton h-3" style={{width:w}}/>)}
      </div>
      {Array.from({length:rows}).map((_,i)=>(
        <div key={i} className="px-4 py-3.5 flex gap-6 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
          <div className="flex items-center gap-2 w-[140px]"><div className="skeleton w-7 h-7 rounded-full flex-shrink-0"/><div className="skeleton h-3 flex-1"/></div>
          {[100,80,100,60].map((w,j)=><div key={j} className="skeleton h-3" style={{width:w}}/>)}
        </div>
      ))}
      <span className="sr-only">Cargando...</span>
    </div>
  )
}

export function SkeletonStats({ cols=4 }: { cols?:number }) {
  return (
    <div className={`grid grid-cols-2 xl:grid-cols-${cols} gap-4`} role="status" aria-label="Cargando estadísticas...">
      {Array.from({length:cols}).map((_,i)=>(
        <div key={i} className="card p-5 space-y-3">
          <div className="skeleton w-10 h-10 rounded-xl"/><div className="skeleton h-8 w-16"/><div className="skeleton h-3 w-24"/>
        </div>
      ))}
      <span className="sr-only">Cargando...</span>
    </div>
  )
}

export function LoadingSpinner({ text='Cargando…' }: { text?:string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 animate-fade-in" role="status" aria-label={text}>
      <div className="w-8 h-8 rounded-full border-4 border-indigo-100 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 animate-spin" aria-hidden="true"/>
      <p className="text-sm text-slate-400 dark:text-slate-500">{text}</p>
    </div>
  )
}
