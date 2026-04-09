'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Search, Users, Calendar, FileText, Clock, BarChart2, Bell, Settings, Home, ArrowRight } from 'lucide-react'

type Result = { label: string; desc?: string; href: string; icon: React.ReactNode; type: 'nav'|'emp' }

const NAV_ITEMS: Result[] = [
  { label:'Dashboard', href:'/admin', icon:<Home className="w-4 h-4"/>, type:'nav' },
  { label:'Empleados', href:'/admin/empleados', icon:<Users className="w-4 h-4"/>, type:'nav' },
  { label:'Solicitudes', href:'/admin/vacaciones', icon:<Calendar className="w-4 h-4"/>, type:'nav' },
  { label:'Bajas', href:'/admin/bajas', icon:<FileText className="w-4 h-4"/>, type:'nav' },
  { label:'Control de horas', href:'/admin/control-horas', icon:<Clock className="w-4 h-4"/>, type:'nav' },
  { label:'Nóminas', href:'/admin/nominas', icon:<FileText className="w-4 h-4"/>, type:'nav' },
  { label:'Informes', href:'/admin/informes', icon:<BarChart2 className="w-4 h-4"/>, type:'nav' },
  { label:'Avisos', href:'/admin/avisos', icon:<Bell className="w-4 h-4"/>, type:'nav' },
  { label:'Calendario', href:'/admin/calendario', icon:<Calendar className="w-4 h-4"/>, type:'nav' },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [emps, setEmps] = useState<Result[]>([])
  const [sel, setSel] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(o => !o); setQuery(''); setSel(0) }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (!query.trim()) { setEmps([]); return }
    supabase.from('empleados').select('id,nombre,departamento').ilike('nombre', `%${query}%`).limit(5)
      .then(({ data }) => setEmps((data || []).map(e => ({
        label: e.nombre, desc: e.departamento || '', href: `/admin/empleados/${e.id}`,
        icon: <div className="w-4 h-4 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center text-[9px] font-bold text-indigo-700 dark:text-indigo-200">{e.nombre.split(' ').map((n:string)=>n[0]).join('').substring(0,2)}</div>,
        type: 'emp' as const
      }))))
  }, [query])

  const filtered = query.trim()
    ? [...emps, ...NAV_ITEMS.filter(i => i.label.toLowerCase().includes(query.toLowerCase()))]
    : NAV_ITEMS

  useEffect(() => { setSel(0) }, [filtered.length])

  const go = useCallback((href: string) => { router.push(href); setOpen(false); setQuery('') }, [router])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s+1, filtered.length-1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(s-1, 0)) }
      if (e.key === 'Enter' && filtered[sel]) go(filtered[sel].href)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, sel, filtered, go])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4" onClick={()=>setOpen(false)}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"/>
      <div className="relative w-full max-w-lg card shadow-2xl animate-scale-in overflow-hidden" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0"/>
          <input autoFocus value={query} onChange={e=>setQuery(e.target.value)}
            placeholder="Buscar página o empleado..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none"/>
          <kbd className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono">Esc</kbd>
        </div>
        <div className="max-h-72 overflow-y-auto py-1">
          {filtered.length === 0 && <p className="px-4 py-6 text-center text-sm text-slate-400">Sin resultados</p>}
          {filtered.map((item, i) => (
            <button key={item.href+i} onClick={()=>go(item.href)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i===sel?'bg-indigo-50 dark:bg-indigo-900/40':'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
              <span className="text-slate-400">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${i===sel?'text-indigo-700 dark:text-indigo-300':'text-slate-800 dark:text-slate-200'}`}>{item.label}</p>
                {item.desc && <p className="text-xs text-slate-400 truncate">{item.desc}</p>}
              </div>
              {i===sel && <ArrowRight className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0"/>}
            </button>
          ))}
        </div>
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-700 flex items-center gap-4">
          <span className="text-[10px] text-slate-400 flex items-center gap-1"><kbd className="bg-slate-100 dark:bg-slate-700 px-1 rounded font-mono">↑↓</kbd> Navegar</span>
          <span className="text-[10px] text-slate-400 flex items-center gap-1"><kbd className="bg-slate-100 dark:bg-slate-700 px-1 rounded font-mono">↵</kbd> Abrir</span>
          <span className="text-[10px] text-slate-400 flex items-center gap-1"><kbd className="bg-slate-100 dark:bg-slate-700 px-1 rounded font-mono">⌘K</kbd> Cerrar</span>
        </div>
      </div>
    </div>
  )
}
