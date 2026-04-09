import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import type { SortDir, SortState } from '@/lib/useSort'

type Props<T> = {
  label: string
  sortKey: keyof T
  sort: SortState<T>
  onToggle: (key: keyof T) => void
  className?: string
}

export function SortableHeader<T>({ label, sortKey, sort, onToggle, className = '' }: Props<T>) {
  const active = sort.key === sortKey
  return (
    <th className={`table-header cursor-pointer select-none group ${className}`}
      onClick={() => onToggle(sortKey)}>
      <div className="flex items-center gap-1">
        <span>{label}</span>
        <span className={`transition-colors ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-300 dark:text-slate-600 group-hover:text-slate-400'}`}>
          {active ? (
            sort.dir === 'asc'
              ? <ChevronUp className="w-3.5 h-3.5"/>
              : <ChevronDown className="w-3.5 h-3.5"/>
          ) : (
            <ChevronsUpDown className="w-3.5 h-3.5"/>
          )}
        </span>
      </div>
    </th>
  )
}