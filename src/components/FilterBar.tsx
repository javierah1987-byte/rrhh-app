'use client'
import { useState } from 'react'
import { Filter, X, ChevronDown } from 'lucide-react'

export type FilterDef = {
  key: string
  label: string
  options: { value: string; label: string }[]
}

type Props = {
  filters: FilterDef[]
  values: Record<string, string>
  onChange: (key: string, val: string) => void
  onReset?: () => void
}

export function FilterBar({ filters, values, onChange, onReset }: Props) {
  const active = Object.values(values).filter(Boolean).length
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
        <Filter className="w-3.5 h-3.5"/> Filtros
      </span>
      {filters.map(f => (
        <div key={f.key} className="relative">
          <select value={values[f.key]||''} onChange={e=>onChange(f.key, e.target.value)}
            className={`text-xs pr-6 pl-3 py-1.5 rounded-lg border appearance-none cursor-pointer transition-colors font-medium
              ${values[f.key]
                ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'}`}>
            <option value="">{f.label}</option>
            {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown className="absolute right-1.5 top-2 w-3 h-3 text-slate-400 pointer-events-none"/>
        </div>
      ))}
      {active > 0 && onReset && (
        <button onClick={onReset} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
          <X className="w-3 h-3"/> Limpiar
        </button>
      )}
    </div>
  )
}
