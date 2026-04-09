'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Empleado } from '@/lib/supabase'
import {
  LayoutDashboard, Users, Clock, BarChart2, Award,
  Calendar, FileText, CreditCard, TrendingUp,
  MessageSquare, Bell, AlarmClock, FolderOpen, CalendarDays,
  LogOut, ChevronRight, ChevronDown, Menu, Sun, Moon, Search, X
} from 'lucide-react'

const NexoLogo = () => (
  <svg width="22" height="22" viewBox="0 0 80 80" fill="none">
    <circle cx="28" cy="28" r="10" fill="white"/>
    <circle cx="52" cy="28" r="10" fill="white" fillOpacity="0.7"/>
    <path d="M18 52 C18 44 22 40 28 40 C34 40 38 44 38 52" stroke="white" strokeWidth="5" strokeLinecap="round" fill="none"/>
    <path d="M42 52 C42 44 46 40 52 40 C58 40 62 44 62 52" stroke="white" strokeWidth="5" strokeLinecap="round" fill="none" strokeOpacity="0.7"/>
  </svg>
)

type NavItem = { href: string; label: string; icon: any; badge?: number }
type NavGroup = { key: string; label: string; icon: any; items: NavItem[]; badge?: number }
type SearchResult = { type: string; label: string; sub: string; href: string }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [empleado, setEmpleado] = useState<Empleado | null>(null)
  const [open, setOpen] = useState(false)
  const [pendientes, setPendientes] = useState(0)
  const [dark, setDark] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  function getGroupForPath(p: string): string | null {
    if (['/admin/empleados','/admin/horarios','/admin/control-horas','/admin/evaluaciones'].some(h => p.startsWith(h))) return 'equipo'
    if (['/admin/vacaciones','/admin/bajas','/admin/solicitudes-documentos'].some(h => p.startsWith(h))) return 'solicitudes'
    if (['/admin/nominas','/admin/documentos','/admin/informes'].some(h => p.startsWith(h))) return 'nominas'
    if (['/admin/mensajes','/admin/avisos','/admin/recordatorios'].some(h => p.startsWith(h))) return 'comunicacion'
    if (['/admin/festivos','/admin/calendario'].some(h => p.startsWith(h))) return 'config'
    return null
  }

  useEffect(() => {
    const saved = localStorage.getItem('nexohr-dark')
    if (saved === 'true') { setDark(true); document.documentElement.classList.add('dark') }
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      supabase.from('empleados').select('*').eq('user_id', data.user.id).single()
        .then(({ data: emp }) => {
          if (!emp || emp.rol !== 'admin') { router.push('/login'); return }
          setEmpleado(emp)
        })
    })
    supabase.from('solicitudes').select('id', { count: 'exact' }).eq('estado', 'pendiente')
      .then(({ count }) => setPendientes(count || 0))
    const ch = supabase.channel('nav-sol')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'solicitudes' }, () => {
        supabase.from('solicitudes').select('id', { count: 'exact' }).eq('estado', 'pendiente')
          .then(({ count }) => setPendientes(count || 0))
      }).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [router])

  useEffect(() => {
    const g = getGroupForPath(pathname)
    if (g) setOpenGroup(g)
  }, [pathname])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const timer = setTimeout(async () => {
      const [{ data: emps }, { data: avs }] = await Promise.all([
        supabase.from('empleados').select('id,nombre,puesto,departamento').ilike('nombre', `%${query}%`).limit(4),
        supabase.from('avisos').select('id,titulo').ilike('titulo', `%${query}%`).limit(3),
      ])
      setResults([
        ...(emps || []).map((e: any) => ({ type: 'Empleado', label: e.nombre, sub: `${e.puesto} · ${e.departamento}`, href: `/admin/empleados/${e.id}` })),
        ...(avs || []).map((a: any) => ({ type: 'Aviso', label: a.titulo, sub: 'Comunicación', href: '/admin/avisos' })),
      ])
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setQuery('')
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function toggleDark() {
    const next = !dark
    setDark(next)
    if (next) { document.documentElement.classList.add('dark'); localStorage.setItem('nexohr-dark','true') }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('nexohr-dark','false') }
  }

  const GROUPS: NavGroup[] = [
    { key:'equipo', label:'Equipo', icon:Users, items:[
      {href:'/admin/empleados',label:'Empleados',icon:Users},
      {href:'/admin/horarios',label:'Horarios y turnos',icon:Clock},
      {href:'/admin/control-horas',label:'Control de horas',icon:BarChart2},
      {href:'/admin/evaluaciones',label:'Evaluaciones',icon:Award},
    ]},
    { key:'solicitudes', label:'Solicitudes', icon:Calendar, badge:pendientes, items:[
      {href:'/admin/vacaciones',label:'Vacaciones y permisos',icon:Calendar,badge:pendientes},
      {href:'/admin/bajas',label:'Bajas',icon:FileText},
      {href:'/admin/solicitudes-documentos',label:'Petición docs',icon:FolderOpen},
    ]},
    { key:'nominas', label:'Nóminas y docs', icon:CreditCard, items:[
      {href:'/admin/nominas',label:'Nóminas',icon:CreditCard},
      {href:'/admin/documentos',label:'Documentos',icon:FolderOpen},
      {href:'/admin/informes',label:'Informes',icon:TrendingUp},
    ]},
    { key:'comunicacion', label:'Comunicación', icon:MessageSquare, items:[
      {href:'/admin/mensajes',label:'Mensajes',icon:MessageSquare},
      {href:'/admin/avisos',label:'Avisos',icon:Bell},
      {href:'/admin/recordatorios',label:'Recordatorios',icon:AlarmClock},
    ]},
    { key:'config', label:'Configuración', icon:CalendarDays, items:[
      {href:'/admin/festivos',label:'Festivos',icon:CalendarDays},
      {href:'/admin/calendario',label:'Calendario',icon:CalendarDays},
    ]},
  ]

  if (!empleado) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'linear-gradient(135deg,#EEF2FF,#F0FDF4)'}}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl animate-spin border-4 border-indigo-200 border-t-indigo-600"/>
        <p className="text-sm text-slate-500">Cargando Nexo HR…</p>
      </div>
    </div>
  )

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100 dark:border-slate-700">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:'linear-gradient(135deg,#4F46E5,#10B981)'}}>
          <NexoLogo/>
        </div>
        <div className="flex-1">
          <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">Nexo HR</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Panel Admin</p>
        </div>
        <button onClick={toggleDark} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          {dark?<Sun className="w-4 h-4 text-amber-400"/>:<Moon className="w-4 h-4 text-slate-400"/>}
        </button>
      </div>

      <div className="px-3 pt-3 pb-1 relative" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400"/>
          <input value={query} onChange={e=>setQuery(e.target.value)} className="input pl-8 pr-8 py-2 text-xs" placeholder="Buscar…"/>
          {query&&<button onClick={()=>setQuery('')} className="absolute right-2 top-2.5"><X className="w-3.5 h-3.5 text-slate-400"/></button>}
        </div>
        {results.length>0&&(
          <div className="absolute left-3 right-3 mt-1 z-50 card shadow-lg overflow-hidden">
            {results.map((r,i)=>(
              <button key={i} onClick={()=>{router.push(r.href);setQuery('');setOpen(false)}}
                className="w-full text-left px-3 py-2 hover:bg-indigo-50 dark:hover:bg-slate-700 flex items-start gap-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                <span className="badge badge-indigo flex-shrink-0 mt-0.5 text-[10px]">{r.type}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{r.label}</p>
                  <p className="text-xs text-slate-400 truncate">{r.sub}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        <button onClick={()=>{router.push('/admin');setOpen(false)}}
          className={`nav-item w-full ${pathname==='/admin'?'nav-item-active':'nav-item-inactive'}`}>
          <LayoutDashboard className="w-4 h-4 flex-shrink-0"/>
          <span className="flex-1 text-left">Dashboard</span>
          {pathname==='/admin'&&<ChevronRight className="w-3 h-3 opacity-40"/>}
        </button>

        {GROUPS.map(group=>{
          const isOpen=openGroup===group.key
          const hasActive=group.items.some(item=>pathname.startsWith(item.href))
          const Icon=group.icon
          return (
            <div key={group.key}>
              <button onClick={()=>setOpenGroup(isOpen?null:group.key)}
                className={`nav-item w-full ${hasActive?'nav-item-active':'nav-item-inactive'}`}>
                <Icon className="w-4 h-4 flex-shrink-0"/>
                <span className="flex-1 text-left text-sm">{group.label}</span>
                {(group.badge||0)>0&&!isOpen&&(
                  <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full mr-1">{group.badge}</span>
                )}
                {isOpen?<ChevronDown className="w-3.5 h-3.5 opacity-50 flex-shrink-0"/>:<ChevronRight className="w-3.5 h-3.5 opacity-30 flex-shrink-0"/>}
              </button>
              {isOpen&&(
                <div className="ml-3 mt-0.5 space-y-0.5 pl-3 border-l-2 border-slate-100 dark:border-slate-700">
                  {group.items.map(item=>{
                    const active=pathname.startsWith(item.href)
                    const ItemIcon=item.icon
                    return (
                      <button key={item.href} onClick={()=>{router.push(item.href);setOpen(false)}}
                        className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl text-xs font-medium transition-all
                          ${active?'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300':'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'}`}>
                        <ItemIcon className="w-3.5 h-3.5 flex-shrink-0"/>
                        <span className="flex-1 text-left">{item.label}</span>
                        {(item.badge||0)>0&&<span className="bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{item.badge}</span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="px-3 py-3 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl mb-1">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{backgroundColor:empleado.avatar_color||'#4F46E5'}}>
            {empleado.nombre.split(' ').map((n:string)=>n[0]).join('').substring(0,2)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{empleado.nombre}</p>
            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">Administrador</p>
          </div>
        </div>
        <button onClick={async()=>{await supabase.auth.signOut();router.push('/login')}}
          className="nav-item nav-item-inactive w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 text-xs py-1.5">
          <LogOut className="w-3.5 h-3.5"/><span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{backgroundColor:'var(--bg)'}}>
      <aside className="hidden lg:flex w-52 flex-col border-r border-slate-200 dark:border-slate-700 flex-shrink-0 relative"><Sidebar/></aside>
      {open&&(
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setOpen(false)}/>
          <aside className="absolute left-0 top-0 h-full w-52 shadow-xl relative"><Sidebar/></aside>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <button onClick={()=>setOpen(true)} className="relative p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
            <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300"/>
            {pendientes>0&&<span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{pendientes}</span>}
          </button>
          <span className="font-bold text-slate-900 dark:text-slate-100 flex-1">Nexo HR</span>
          <button onClick={toggleDark} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
            {dark?<Sun className="w-4 h-4 text-amber-400"/>:<Moon className="w-4 h-4 text-slate-400"/>}
          </button>
        </div>
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900">{children}</main>
      </div>
    </div>
  )
}