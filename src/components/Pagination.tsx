'use client'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = { page: number; total: number; perPage: number; onChange: (p: number) => void }

export function Pagination({ page, total, perPage, onChange }: Props) {
  const pages = Math.ceil(total / perPage)
  if (pages <= 1) return null
  const start = (page - 1) * perPage + 1
  const end = Math.min(page * perPage, total)
  const range = Array.from({ length: Math.min(5, pages) }, (_, i) => {
    if (pages <= 5) return i + 1
    if (page <= 3) return i + 1
    if (page >= pages - 2) return pages - 4 + i
    return page - 2 + i
  })
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700">
      <p className="text-xs text-slate-500 dark:text-slate-400">{start}–{end} de {total}</p>
      <div className="flex items-center gap-1">
        <button onClick={()=>onChange(page-1)} disabled={page===1}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors">
          <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400"/>
        </button>
        {range[0] > 1 && <><span className="px-2 text-xs text-slate-400">1</span><span className="text-slate-300">…</span></>}
        {range.map(p => (
          <button key={p} onClick={()=>onChange(p)}
            className={`w-8 h-8 text-xs rounded-lg font-medium transition-colors ${p===page?'bg-indigo-600 text-white':'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
            {p}
          </button>
        ))}
        {range[range.length-1] < pages && <><span className="text-slate-300">…</span><span className="px-2 text-xs text-slate-400">{pages}</span></>}
        <button onClick={()=>onChange(page+1)} disabled={page===pages}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors">
          <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400"/>
        </button>
      </div>
    </div>
  )
}
