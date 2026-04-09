'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Empleado } from '@/lib/supabase'
import {
  LayoutDashboard,Users,Clock,Calendar,CalendarDays,FileText,
  TrendingUp,Bell,FolderOpen,CreditCard,LogOut,ChevronRight,
  Menu,Sun,Moon,Search,X,BarChart2,Award,MessageSquare,AlarmClock
} from 'lucide-react'

const NexoLogo = () => (
  <svg width="22" height="22" viewBox="0 0 80 80" fill="none">
    <circle cx="28" cy="28" r="10" fill="white"/>
    <circle cx="52" cy="28" r="10" fill="white" fillOpacity="0.7"/>
    <path d="M18 52 C18 44 22 40 28 40 C34 40 38 44 38 52" stroke="white" strokeWidth="5" strokeLinecap="round" fill="none"/>
    <path d="M42 52 C42 44 46 40 52 40 C58 40 62 44 62 52" stroke="white" strokeWidth="5" strokeLinecap="round" fill="none" strokeOpacity="0.7"/>
  </svg>
)

type SearchResult = { type: string; label: string; sub: string; href: string }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [empleado, setEmpleado] = useState<Empleado|null>(null)
  const [open, setOpen] = useState(false)
  const [pendientes, setPendientes] = useState(0)
  const [dark, setDark] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Dark mode
  useEffect(() => {
    const saved = localStorage.getItem('nexohr-dark')
    if (saved === 'true') { setDark(true); document.documentElement.classList.add('dark') }
  }, [])

  function toggleDark() {
    const next = !dark
    setDark(next)
    if (next) { document.documentElement.classList.add('dark'); localStorage.setItem('nexohr-dark','true') }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('nexohr-dark','false') }
  }

  // Auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      supabase.from('empleados').select('*').eq('user_id', data.user.id).single()
        .then(({ data: emp }) => { if (!emp || emp.rol !== 'admin') { router.push('/login'); return }; setEmpleado(emp) })
    })
    supabase.from('solicitudes').select('id',{count:'exact'}).eq('estado','pendiente')
      .then(({ count }) => setPendientes(count||0))
    const ch = supabase.channel('sol-admin').on('postgres_changes',{event:'*',schema:'public',table:'solicitudes'},()=>{
      supabase.from('solicitudes').select('id',{count:'exact'}).eq('estado','pendiente').then(({count})=>setPendientes(count||0))
    }).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [router])

  // BÃÂÃÂºsqueda global
  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      const q = query.toLowerCase()
      const [{ data: emps }, { data: sols }, { data: avs }] = await Promise.all([
        supabase.from('empleados').select('id,nombre,puesto,departamento').ilike('nombre', `%${query}%`).limit(4),
        supabase.from('solicitudes').select('id,tipo,estado,empleados(nombre)').ilike('empleados.nombre', `%${query}%`).limit(3),
        supabase.from('avisos').select('id,titulo').ilike('titulo', `%${query}%`).limit(3),
      ])
      const r: SearchResult[] = [
        ...(emps||[]).map((e:any) => ({ type:'Empleado', label:e.nombre, sub:`${e.puesto} ÃÂÃÂ· ${e.departamento}`, href:`/admin/empleados/${e.id}` })),
        ...(avs||[]).map((a:any) => ({ type:'Aviso', label:a.titulo, sub:'ComunicaciÃÂÃÂ³n interna', href:'/admin/avisos' })),
        ...(sols||[]).map((s:any) => ({ type:'Solicitud', label:(s.empleados as any)?.nombre||'ÃÂ¢ÃÂÃÂ', sub:`${s.tipo.replace(/_/g,' ')} ÃÂÃÂ· ${s.estado}`, href:'/admin/vacaciones' })),
      ]
      setResults(r)
      setSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // Cerrar bÃÂÃÂºsqueda al click fuera
  useEffect(() => {
    function handle(e: MouseEvent) { if (searchRef.current && !searchRef.current.contains(e.target as Node)) setQuery('') }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const NAV = [
    { href:'/admin', label:'Dashboard', icon:LayoutDashboard, badge:0 },
    { href:'/admin/empleados', label:'Empleados', icon:Users, badge:0 },
    { href:'/admin/horarios', label:'Horarios', icon:Clock, badge:0 },
    { href:'/admin/control-horas', label:'Control horas', icon:BarChart2, badge:0 },
    { href:'/admin/evaluaciones', label:'Evaluaciones', icon:Award, badge:0 },
    { href:'/admin/vacaciones', label:'Solicitudes', icon:Calendar, badge:pendientes },
    { href:'/admin/bajas', label:'Bajas', icon:FileText, badge:0 },
    { href:'/admin/nominas', label:'NÃÂÃÂ³minas', icon:CreditCard, badge:0 },
    { href:'/admin/informes', label:'Informes', icon:TrendingUp, badge:0 },
    { href:'/admin/mensajes', label:'Mensajes', icon:MessageSquare, badge:0 },{ href:'/admin/recordatorios', label:'Recordatorios', icon:AlarmClock, badge:0 },{ href:'/admin/avisos', label:'Avisos', icon:Bell, badge:0 },
    { href:'/admin/documentos', label:'Documentos', icon:FolderOpen, badge:0 },
    { href:'/admin/calendario', label:'Calendario', icon:CalendarDays, badge:0 },
  ]

  if (!empleado) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'linear-gradient(135deg,#EEF2FF,#F0FDF4)'}}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl animate-spin border-4 border-indigo-200 border-t-indigo-600"/>
        <p className="text-sm text-slate-500">Cargando Nexo HRÃÂ¢ÃÂÃÂ¦</p>
      </div>
    </div>
  )

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-100 dark:border-slate-700">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:'linear-gradient(135deg,#4F46E5,#10B981)'}}>
          <NexoLogo/>
        </div>
        <div className="flex-1">
          <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">Nexo HR</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Panel Admin</p>
        </div>
        <button onClick={toggleDark} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          {dark ? <Sun className="w-4 h-4 text-amber-400"/> : <Moon className="w-4 h-4 text-slate-400"/>}
        </button>
      </div>

      {/* BÃÂÃÂºsqueda */}
      <div className="px-3 pt-3 pb-1" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400"/>
          <input value={query} onChange={e=>setQuery(e.target.value)}
            className="input pl-8 pr-8 py-2 text-xs"
            placeholder="Buscar empleados, avisosÃÂ¢ÃÂÃÂ¦"/>
          {query && <button onClick={()=>setQuery('')} className="absolute right-2 top-2.5"><X className="w-3.5 h-3.5 text-slate-400"/></button>}
        </div>
        {results.length > 0 && (
          <div className="absolute left-3 right-3 mt-1 z-50 card shadow-lg overflow-hidden">
            {results.map((r,i) => (
              <button key={i} onClick={()=>{ router.push(r.href); setQuery(''); setOpen(false) }}
                className="w-full text-left px-3 py-2 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors flex items-start gap-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                <span className="badge badge-indigo flex-shrink-0 mt-0.5">{r.type}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{r.label}</p>
                  <p className="text-xs text-slate-400 truncate capitalize">{r.sub}</p>
                </div>
              </button>
            ))}
          </div>
        )}
        {query && results.length === 0 && !searching && (
          <div className="absolute left-3 right-3 mt-1 z-50 card shadow-lg p-3 text-xs text-slate-400 text-center">Sin resultados</div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href
          return (
            <button key={href} onClick={()=>{ router.push(href); setOpen(false) }}
              className={`nav-item w-full ${active ? 'nav-item-active' : 'nav-item-inactive'}`}>
              <Icon className="w-4 h-4 flex-shrink-0"/>
              <span className="flex-1 text-left">{label}</span>
              {badge > 0 && <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{badge}</span>}
              {active && badge===0 && <ChevronRight className="w-3 h-3 opacity-40"/>}
            </button>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl mb-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{backgroundColor:empleado.avatar_color||'#4F46E5'}}>
            {empleado.nombre.split(' ').map((n:string)=>n[0]).join('').substring(0,2)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{empleado.nombre}</p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Administrador</p>
          </div>
        </div>
        <button onClick={async()=>{ await supabase.auth.signOut(); router.push('/login') }}
          className="nav-item nav-item-inactive w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 mt-1">
          <LogOut className="w-4 h-4"/><span>Cerrar sesiÃÂÃÂ³n</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{backgroundColor:'var(--bg)'}}>
      <aside className="hidden lg:flex w-56 flex-col border-r border-slate-200 dark:border-slate-700 flex-shrink-0 relative">
        <Sidebar/>
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setOpen(false)}/>
          <aside className="absolute left-0 top-0 h-full w-56 shadow-xl relative"><Sidebar/></aside>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <button onClick={()=>setOpen(true)} className="relative p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
            <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300"/>
            {pendientes>0 && <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{pendientes}</span>}
          </button>
          <span className="font-bold text-slate-900 dark:text-slate-100 flex-1">Nexo HR</span>
          <button onClick={toggleDark} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
            {dark ? <Sun className="w-4 h-4 text-amber-400"/> : <Moon className="w-4 h-4 text-slate-400"/>}
          </button>
        </div>
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900">{children}</main>
      </div>
    </div>
  )
}