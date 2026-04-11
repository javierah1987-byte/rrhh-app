'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Empleado } from '@/lib/supabase'
import {
  LayoutDashboard, Clock, Calendar, FileText, FolderOpen,
  CreditCard, CalendarDays, Heart, Receipt, AlertCircle, Shield, MessageSquare, BellRing,
  User, LogOut, ChevronRight, ChevronDown, Menu, Sun, Moon
} from 'lucide-react'
import { ToastProvider } from '@/components/ToastProvider'

const NexoLogo = () => (
  <svg width="22" height="22" viewBox="0 0 80 80" fill="none">
    <circle cx="28" cy="28" r="10" fill="white"/>
    <circle cx="52" cy="28" r="10" fill="white" fillOpacity="0.7"/>
    <path d="M18 52 C18 44 22 40 28 40 C34 40 38 44 38 52" stroke="white" strokeWidth="5" strokeLinecap="round" fill="none"/>
    <path d="M42 52 C42 44 46 40 52 40 C58 40 62 44 62 52" stroke="white" strokeWidth="5" strokeLinecap="round" fill="none" strokeOpacity="0.7"/>
  </svg>
)

type NavItem = { href: string; label: string; icon: any; badge?: number }
type NavGroup = { key: string; label: string; icon: any; items: NavItem[] }

export default function EmpleadoLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [empleado, setEmpleado] = useState<Empleado | null>(null)
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const [notifCount, setNotifCount] = useState(0)
  const [openGroup, setOpenGroup] = useState<string | null>(null)

  function getGroupForPath(p: string): string | null {
    if (['/empleado/solicitudes','/empleado/bajas','/empleado/solicitar-documentos'].some(h=>p.startsWith(h))) return 'solicitudes'
    if (p.startsWith('/empleado/nominas')) return 'docs'
    if (['/empleado/mensajes','/empleado/notificaciones'].some(h=>p.startsWith(h))) return 'comunicacion'
    return null
  }

  useEffect(() => {
    const saved = localStorage.getItem('nexohr-dark')
    if (saved==='true') { setDark(true); document.documentElement.classList.add('dark') }
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/'); return }
      supabase.from('empleados').select('*').eq('user_id',data.user.id).single()
        .then(({ data: emp }) => {
          if (!emp) { router.push('/'); return }
          setEmpleado(emp)
          supabase.from('notificaciones').select('id',{count:'exact',head:true}).eq('empleado_id',emp.id).eq('leida',false)
            .then(({ count }) => setNotifCount(count||0))
          const ch = supabase.channel('notif-emp-nav')
            .on('postgres_changes',{event:'INSERT',schema:'public',table:'notificaciones'},()=>{setNotifCount(c=>c+1)}).subscribe()
          return () => { supabase.removeChannel(ch) }
        })
    })
  }, [router])

  useEffect(() => { const g=getGroupForPath(pathname); if(g) setOpenGroup(g) }, [pathname])

  function toggleDark() {
    const next=!dark; setDark(next)
    if(next){document.documentElement.classList.add('dark');localStorage.setItem('nexohr-dark','true')}
    else{document.documentElement.classList.remove('dark');localStorage.setItem('nexohr-dark','false')}
  }

  const GROUPS: NavGroup[] = [
    { key:'solicitudes', label:'Mis solicitudes', icon:Calendar, items:[
      {href:'/empleado/solicitudes',label:'Vacaciones y permisos',icon:Calendar},
      {href:'/empleado/bajas',label:'Mis bajas',icon:FileText},
      {href:'/empleado/solicitar-documentos',label:'Pedir documentos',icon:FolderOpen},
    ]},
    { key:'docs', label:'Nóminas y docs', icon:CreditCard, items:[
      {href:'/empleado/nominas',label:'Nóminas y documentos',icon:CreditCard},
    ]},
    { key:'comunicacion', label:'Comunicación', icon:MessageSquare, items:[
      {href:'/empleado/mensajes',label:'Mensajes',icon:MessageSquare},
      {href:'/empleado/notificaciones',label:'Notificaciones',icon:BellRing,badge:notifCount},
    ]},
  ]

  if (!empleado) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'linear-gradient(135deg,#EEF2FF,#F0FDF4)'}}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl animate-spin border-4 border-indigo-200 border-t-indigo-600"/>
        <p className="text-sm text-slate-500">Cargando...</p>
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
          <p className="text-xs text-slate-500 dark:text-slate-400">Portal empleado</p>
        </div>
        <button onClick={toggleDark} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          {dark?<Sun className="w-4 h-4 text-amber-400"/>:<Moon className="w-4 h-4 text-slate-400"/>}
        </button>
      </div>

      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {/* Items simples: Inicio y Fichaje */}
        {[
          {href:'/empleado',label:'Inicio',icon:LayoutDashboard},
          {href:'/empleado/fichaje',label:'Fichaje',icon:Clock},
        ].map(item=>(
          <button key={item.href} onClick={()=>{router.push(item.href);setOpen(false)}}
            className={`nav-item w-full ${pathname===item.href?'nav-item-active':'nav-item-inactive'}`}>
            <item.icon className="w-4 h-4 flex-shrink-0"/>
            <span className="flex-1 text-left">{item.label}</span>
            {pathname===item.href&&<ChevronRight className="w-3 h-3 opacity-40"/>}
          </button>
        ))}

        {/* Calendario standalone */}
        <button onClick={()=>{router.push('/empleado/calendario');setOpen(false)}}
          className={`nav-item w-full ${pathname.startsWith('/empleado/calendario')?'nav-item-active':'nav-item-inactive'}`}>
          <CalendarDays className="w-4 h-4 flex-shrink-0"/>
          <span className="flex-1 text-left">Mi calendario</span>
          {pathname.startsWith('/empleado/calendario')&&<ChevronRight className="w-3 h-3 opacity-40"/>}
        </button>

        {/* Grupos colapsables */}
        {GROUPS.map(group=>{
          const isOpen=openGroup===group.key
          const hasActive=group.items.some(item=>pathname.startsWith(item.href))
          const Icon=group.icon
          const groupBadge=group.items.reduce((s,i)=>s+(i.badge||0),0)
          return (
            <div key={group.key}>
              <button onClick={()=>setOpenGroup(isOpen?null:group.key)}
                className={`nav-item w-full ${hasActive?'nav-item-active':'nav-item-inactive'}`}>
                <Icon className="w-4 h-4 flex-shrink-0"/>
                <span className="flex-1 text-left text-sm">{group.label}</span>
                {groupBadge>0&&!isOpen&&<span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full mr-1">{groupBadge}</span>}
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
                        {(item.badge||0)>0&&<span className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{item.badge}</span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* Extras */}
        <div className="mt-3 px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Extras</div>
        <button onClick={()=>{router.push('/empleado/correcciones');setOpen(false)}}
          className={`nav-item w-full ${pathname==='/empleado/correcciones'?'nav-item-active':'nav-item-inactive'}`}>
          <AlertCircle className="w-4 h-4 flex-shrink-0"/>
          <span className="flex-1 text-left">Correcciones fichaje</span>
        </button>
        <button onClick={()=>{router.push('/empleado/gastos');setOpen(false)}}
          className={`nav-item w-full ${pathname==='/empleado/gastos'?'nav-item-active':'nav-item-inactive'}`}>
          <Receipt className="w-4 h-4 flex-shrink-0"/>
          <span className="flex-1 text-left">Gastos</span>
        </button>
        <button onClick={()=>{router.push('/empleado/encuestas');setOpen(false)}}
          className={`nav-item w-full ${pathname==='/empleado/encuestas'?'nav-item-active':'nav-item-inactive'}`}>
          <Heart className="w-4 h-4 flex-shrink-0"/>
          <span className="flex-1 text-left">Clima laboral</span>
        </button>
        <button onClick={()=>{router.push('/empleado/privacidad');setOpen(false)}}
          className={`nav-item w-full ${pathname==='/empleado/privacidad'?'nav-item-active':'nav-item-inactive'}`}>
          <Shield className="w-4 h-4 flex-shrink-0"/>
          <span className="flex-1 text-left">Privacidad</span>
        </button>
                {/* Mi perfil */}
        <button onClick={()=>{router.push('/empleado/perfil');setOpen(false)}}
          className={`nav-item w-full ${pathname==='/empleado/perfil'?'nav-item-active':'nav-item-inactive'}`}>
          <User className="w-4 h-4 flex-shrink-0"/>
          <span className="flex-1 text-left">Mi perfil</span>
          {pathname==='/empleado/perfil'&&<ChevronRight className="w-3 h-3 opacity-40"/>}
        </button>
      </nav>

      <div className="px-3 py-3 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl mb-1">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{backgroundColor:empleado.avatar_color||'#10B981'}}>
            {empleado.nombre.split(' ').map((n:string)=>n[0]).join('').substring(0,2)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{empleado.nombre}</p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium capitalize">{empleado.puesto}</p>
          </div>
        </div>
        <button onClick={async()=>{ await supabase.auth.signOut(); router.push('/') }}
          className="nav-item nav-item-inactive w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 text-xs py-1.5">
          <LogOut className="w-3.5 h-3.5"/>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  )

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden" style={{backgroundColor:'var(--bg)'}}>
        <aside className="hidden lg:flex w-52 flex-col border-r border-slate-200 dark:border-slate-700 flex-shrink-0"><Sidebar/></aside>
        {open&&(
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={()=>setOpen(false)}/>
            <aside className="absolute left-0 top-0 h-full w-52 shadow-xl"><Sidebar/></aside>
          </div>
        )}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <button onClick={()=>setOpen(true)} className="relative p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
              <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300"/>
              {notifCount>0&&<span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{notifCount}</span>}
            </button>
            <span className="font-bold text-slate-900 dark:text-slate-100 flex-1">Nexo HR</span>
            <button onClick={toggleDark} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
              {dark?<Sun className="w-4 h-4 text-amber-400"/>:<Moon className="w-4 h-4 text-slate-400"/>}
            </button>
          </div>
          <main id="main-content" className="flex-1 overflow-y-auto p-6 pb-24 lg:pb-6 bg-slate-50 dark:bg-slate-900">{children}</main>
          {/* Bottom nav móvil */}
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-stretch h-16">
            {([
              {href:'/empleado',label:'Inicio',d:'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'},
              {href:'/empleado/fichaje',label:'Fichaje',d:'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'},
              {href:'/empleado/solicitudes',label:'Solicitudes',d:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'},
              {href:'/empleado/calendario',label:'Calendario',d:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'},
              {href:'/empleado/nominas',label:'Nóminas',d:'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'},
            ] as {href:string;label:string;d:string}[]).map(item=>{
              const active = item.href==='/empleado' ? pathname==='/empleado' : pathname.startsWith(item.href)
              return(
                <button key={item.href} onClick={()=>router.push(item.href)}
                  className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${active?'text-indigo-600 dark:text-indigo-400':'text-slate-400 dark:text-slate-500'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d={item.d}/>
                  </svg>
                  <span className="text-[10px] font-medium leading-none">{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>
    </ToastProvider>
  )
}