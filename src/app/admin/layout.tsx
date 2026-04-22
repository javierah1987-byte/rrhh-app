// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CommandPalette } from '@/components/CommandPalette'
import {
  LayoutDashboard, Users, Clock, CalendarDays, FileText,
  DollarSign, BarChart2, Bell, MessageSquare, Calendar,
  Briefcase, ClipboardList, Star, Gift, LogOut,
  ChevronDown, Sun, Moon, Search, Menu, X, Wifi, Monitor,
  AlertCircle, Receipt, Shield, Building2,
  Timer, UserCheck, Wallet, Megaphone, Lock, PenLine, Target,
  ChevronRight, Settings, CalendarRange, AlertTriangle, Mail, Heart
, UserPlus } from 'lucide-react'

type NavItem = { icon: any; label: string; href: string; badge?: boolean; feature?: string }
type NavGroup = { id: string; label: string; icon: any; color: string; items: NavItem[] }

const GROUPS: NavGroup[] = [
  { id:'tiempo', label:'Tiempo', icon:Timer, color:'#6366f1', items:[
    { icon:Clock,         label:'Control horas', href:'/admin/control-horas' , feature:'control_horario'},
    { icon:Wifi,          label:"Who's In",       href:'/admin/whois' , feature:'control_horario'},
    { icon:Monitor,      label:'Kiosko',          href:'/kiosko' , feature:'kiosko'},
    { icon:ClipboardList, label:'Horarios',       href:'/admin/horarios' , feature:'turnos'},
    { icon:AlertCircle,   label:'Correcciones',   href:'/admin/correcciones' , feature:'correcciones'},
    { icon:Clock,         label:'Bolsa de horas',  href:'/admin/bolsa-horas' , feature:'bolsa_horas'},
  ]},
  { id:'equipo', label:'Equipo', icon:UserCheck, color:'#10b981', items:[
    { icon:Users,     label:'Empleados',   href:'/admin/empleados' },
    { icon:Building2, label:'Centros',     href:'/admin/centros' },
    { icon:Star,      label:'Evaluaciones',href:'/admin/evaluaciones' , feature:'evaluaciones'},
    { icon:UserPlus,  label:'Onboarding',   href:'/admin/onboarding' , feature:'onboarding'},
    { icon:UserCheck, label:'Organigrama',      href:'/admin/organigrama' },
    { icon:BarChart2, label:'People Analytics', href:'/admin/analytics' },
  ]},
  { id:'reclutamiento', label:'Reclutamiento', icon:Briefcase, color:'#8b5cf6', items:[
    { icon:Briefcase, label:'Vacantes',    href:'/admin/reclutamiento' , feature:'reclutamiento'},
  ]},
  { id:'ausencias', label:'Ausencias', icon:CalendarRange, color:'#f59e0b', items:[
    { icon:CalendarDays, label:'Solicitudes', href:'/admin/vacaciones', badge:true , feature:'vacaciones'},
    { icon:FileText,     label:'Bajas',        href:'/admin/bajas' , feature:'bajas'},
    { icon:Calendar,     label:'Calendario',   href:'/admin/calendario' , feature:'vacaciones'},
    { icon:CalendarDays, label:'Festivos',      href:'/admin/festivos' , feature:'vacaciones'},
  ]},
  { id:'administracion', label:'Administración', icon:Wallet, color:'#0891b2', items:[
    { icon:DollarSign, label:'Nóminas',       href:'/admin/nominas' , feature:'nominas'},
    { icon:Receipt,    label:'Gastos',          href:'/admin/gastos' , feature:'gastos'},
    { icon:FileText,   label:'Documentos',      href:'/admin/documentos' , feature:'documentos'},
    { icon:Briefcase,  label:'Petición docs', href:'/admin/solicitudes-documentos' },
      { icon:PenLine,    label:'Firmas',         href:'/admin/firmas' , feature:'firmas'},
    { icon:BarChart2,  label:'Informes',        href:'/admin/informes' , feature:'informes'},
    { icon:Mail,         label:'Cola emails',   href:'/admin/email-queue' , feature:'avisos'},
      { icon:Target,      label:'OKR',             href:'/admin/okr' , feature:'okr'},
      { icon:Building2,  label:'Mi empresa',      href:'/admin/empresa' },
  ]},
  { id:'comunicacion', label:'Comunicación', icon:Megaphone, color:'#ec4899', items:[
    { icon:Bell,          label:'Avisos',       href:'/admin/avisos' , feature:'avisos'},
    { icon:Heart,        label:'Clima laboral', href:'/admin/encuestas' , feature:'clima_laboral'},
    { icon:MessageSquare, label:'Mensajes',     href:'/admin/mensajes' , feature:'mensajes'},
    { icon:Gift,          label:'Recordatorios',href:'/admin/recordatorios' , feature:'recordatorios'},
  ]},
  { id:'cumplimiento', label:'Cumplimiento', icon:Lock, color:'#8b5cf6', items:[
    { icon:Shield,         label:'RGPD',           href:'/admin/rgpd' , feature:'rgpd'},
    { icon:PenLine,        label:'Firmas',          href:'/admin/firmas' },
    { icon:AlertTriangle, label:'Denuncias', href:'/admin/denuncias' , feature:'denuncias'},
  ]},
]

function Sidebar({ onClose, pendientes }: { onClose?:()=>void; pendientes:number }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [dark, setDark]     = useState(false)
  const [name, setName]     = useState('Admin')
  const [avatar, setAvatar] = useState('#6366f1')
  const activeGroup = GROUPS.find(g => g.items.some(i => pathname===i.href||(i.href!=='/admin'&&pathname.startsWith(i.href))))
  const [openGroups, setOpenGroups] = useState<Record<string,boolean>>(activeGroup?{[activeGroup.id]:true}:{tiempo:true})

  useEffect(()=>{
    setDark(localStorage.getItem('nexohr-dark')==='true')
    supabase.auth.getUser().then(({data:{user}})=>{
      if(user) supabase.from('empleados').select('nombre,avatar_color').eq('user_id',user.id).single().then(({data})=>{
        if(data){setName((data as any).nombre.split(' ')[0]);setAvatar((data as any).avatar_color||'#6366f1')}
      })
    })
  },[])

  const toggleDark=()=>{const n=!dark;setDark(n);document.documentElement.classList.toggle('dark',n);localStorage.setItem('nexohr-dark',String(n))}
  const logout=async()=>{await supabase.auth.signOut();router.push('/')}
  const toggleGroup=(id:string)=>setOpenGroups(prev=>({...prev,[id]:!prev[id]}))
  const isActive=(item:NavItem)=>pathname===item.href||(item.href!=='/admin'&&pathname.startsWith(item.href))

  return(
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 select-none">
      <div className="flex items-center justify-between px-4 pt-5 pb-4 flex-shrink-0 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0"><span className="text-white font-black text-sm">N</span></div>
          <div><p className="font-bold text-sm text-slate-800 dark:text-slate-200 leading-none">Nexo HR</p><p className="text-[10px] text-slate-400 mt-0.5 leading-none">by Tryvor</p></div>
        </div>
        {onClose&&<button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 lg:hidden"><X className="w-4 h-4 text-slate-500"/></button>}
      </div>
      <div className="px-3 py-2.5 flex-shrink-0">
        <button onClick={()=>window.dispatchEvent(new CustomEvent('nexohr-cmdk'))}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-400 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
          <Search className="w-3.5 h-3.5 flex-shrink-0"/><span className="flex-1 text-left">Buscar...</span>
          <kbd className="font-mono text-[10px] bg-slate-200 dark:bg-slate-600 px-1 rounded">⌘K</kbd>
        </button>
      </div>
      <div className="px-3 mb-1 flex-shrink-0">
        <button onClick={()=>{router.push('/admin');onClose?.()}}
          className={"nav-item w-full "+(pathname==='/admin'?'nav-item-active':'nav-item-inactive')}>
          <LayoutDashboard className="w-4 h-4 flex-shrink-0"/><span className="flex-1 text-left text-sm">Dashboard</span>
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-2 space-y-0.5">
        {GROUPS.map(group=>{
          const isOpen=openGroups[group.id]
          const GroupIcon=group.icon
          const hasActive=group.items.some(isActive)
          return(
            <div key={group.id}>
              <button onClick={()=>toggleGroup(group.id)}
                className={"w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 mt-1 "+(hasActive?'text-slate-800 dark:text-slate-200':'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50')}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all" style={{background:(hasActive||isOpen)?group.color+'20':'transparent'}}>
                  <GroupIcon className="w-3.5 h-3.5 flex-shrink-0" style={{color:(hasActive||isOpen)?group.color:undefined}}/>
                </div>
                <span className="flex-1 text-left uppercase tracking-wider text-[10px]">{group.label}</span>
                {hasActive&&<div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background:group.color}}/>}
                <ChevronRight className={"w-3 h-3 flex-shrink-0 transition-transform duration-200 "+(isOpen?'rotate-90':'')}/>
              </button>
              {isOpen&&(
                <div className="ml-3 pl-3 border-l-2 border-slate-100 dark:border-slate-700 mt-0.5 mb-1 space-y-0.5">
                  {group.items.filter((item: any) => !item.feature || typeof featuresActivas === "undefined" || featuresActivas.size === 0 || featuresActivas.has(item.feature)).map(item=>{
                    const active=isActive(item)
                    const Icon=item.icon
                    return(
                      <button key={item.href} onClick={()=>{router.push(item.href);onClose?.()}}
                        className={"nav-item w-full "+(active?'nav-item-active':'nav-item-inactive')}>
                        <Icon className="w-3.5 h-3.5 flex-shrink-0"/>
                        <span className="flex-1 text-left text-[13px]">{item.label}</span>
                        {item.badge&&pendientes>0&&<span className="ml-auto text-[10px] font-bold bg-red-500 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">{pendientes}</span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>
      <div className="px-3 pb-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 mb-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{backgroundColor:avatar}}>{name.charAt(0).toUpperCase()}</div>
          <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{name}</p><p className="text-[10px] text-slate-400">Administrador</p></div>
        </div>
        <div className="flex items-center justify-between px-1">
          <button onClick={()=>{router.push('/admin/centros');onClose?.()}} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors" title="Configuración"><Settings className="w-4 h-4"/></button>
          <button onClick={toggleDark} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors">{dark?<Sun className="w-4 h-4"/>:<Moon className="w-4 h-4"/>}</button>
          <button onClick={logout} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"><LogOut className="w-4 h-4"/></button>
        </div>
      </div>
    </div>
  )
}

export default function AdminLayout({children}:{children:React.ReactNode}){
  const [featuresActivas, setFeaturesActivas] = useState<Set<string>>(new Set())
  const [pendientes,setPendientes]=useState(0)
  const [mobileOpen,setMobileOpen]=useState(false)
  const router=useRouter()
  const pathname=usePathname()

  useEffect(()=>{
    supabase.auth.getUser().then(async({data:{user}})=>{
      if(!user){router.push('/');return}
      const{data:emp}=await supabase.from('empleados').select('rol').eq('user_id',user.id).single()
      if(!emp||!['owner','admin','manager'].includes(emp.rol)){router.push('/empleado');return}
    })
    supabase.from('solicitudes').select('id',{count:'exact',head:true}).eq('estado','pendiente').then(({count})=>setPendientes(count||0))
    const ch=supabase.channel('sol-count').on('postgres_changes',{event:'*',schema:'public',table:'solicitudes'},()=>{
      supabase.from('solicitudes').select('id',{count:'exact',head:true}).eq('estado','pendiente').then(({count})=>setPendientes(count||0))
    }).subscribe()
    return()=>{supabase.removeChannel(ch)}
  },[router])

  useEffect(()=>{setMobileOpen(false)},[pathname])

  return(
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <CommandPalette/>
      <aside className="hidden lg:flex w-56 flex-shrink-0 flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <Sidebar pendientes={pendientes}/>
      </aside>
      {mobileOpen&&(
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setMobileOpen(false)}/>
          <aside className="absolute left-0 top-0 bottom-0 w-64 shadow-2xl"><Sidebar onClose={()=>setMobileOpen(false)} pendientes={pendientes}/></aside>
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <button onClick={()=>setMobileOpen(true)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"><Menu className="w-5 h-5 text-slate-600 dark:text-slate-400"/></button>
          <div className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center"><span className="text-white font-black text-xs">N</span></div>
          <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Nexo HR</span>
          {pendientes>0&&<span className="ml-auto text-xs font-bold bg-red-500 text-white rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">{pendientes}</span>}
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}