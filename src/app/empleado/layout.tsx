'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard, Clock, Calendar, FileText, FolderOpen,
  CreditCard, CalendarDays, Heart, Receipt, AlertCircle,
  Shield, Users, LogOut, Sun, Moon, Menu, X, Bell,
  MessageSquare, ChevronRight, Timer, Briefcase, Wallet,
  Megaphone, Lock, PenLine
} from 'lucide-react'

type NavGroup = { id:string; label:string; icon:any; color:string; items:{icon:any;label:string;href:string;badge?:boolean;onlyManager?:boolean}[] }

const GROUPS: NavGroup[] = [
  { id:'tiempo', label:'Tiempo', icon:Timer, color:'#6366f1', items:[
    { icon:Clock,       label:'Fichar',       href:'/empleado/fichaje' },
    { icon:AlertCircle, label:'Correcciones', href:'/empleado/correcciones' },
  ]},
  { id:'ausencias', label:'Ausencias', icon:CalendarDays, color:'#f59e0b', items:[
    { icon:CalendarDays, label:'Solicitudes', href:'/empleado/solicitudes' },
    { icon:Heart,        label:'Bajas',        href:'/empleado/bajas' },
    { icon:Calendar,     label:'Calendario',   href:'/empleado/calendario' },
  ]},
  { id:'administracion', label:'Administración', icon:Wallet, color:'#0891b2', items:[
    { icon:CreditCard, label:'Nóminas',     href:'/empleado/nominas' },
    { icon:FolderOpen, label:'Mis documentos', href:'/empleado/documentos' },
    { icon:Receipt,    label:'Gastos',         href:'/empleado/gastos' },
    { icon:FolderOpen, label:'Documentos',     href:'/empleado/solicitar-documentos' },
  ]},
  { id:'comunicacion', label:'Comunicación', icon:Megaphone, color:'#ec4899', items:[
    { icon:Bell,          label:'Notificaciones', href:'/empleado/notificaciones', badge:true },
    { icon:MessageSquare, label:'Mensajes',       href:'/empleado/mensajes' },
  ]},
  { id:'yo', label:'Mi espacio', icon:Briefcase, color:'#10b981', items:[
    { icon:FileText, label:'Mi perfil',     href:'/empleado/perfil' },
    { icon:Heart,    label:'Clima laboral', href:'/empleado/encuestas' },
    { icon:Shield,   label:'Privacidad',    href:'/empleado/privacidad' },
    { icon:Users,    label:'Mi Equipo',     href:'/empleado/equipo', onlyManager:true },
        { icon:Lock,     label:'Denuncias',     href:'/empleado/denuncias' },
    { icon:FileText, label:'Mi jornada',    href:'/empleado/jornada' },
    { icon:PenLine,  label:'Mis firmas',    href:'/empleado/firmas' },
  ]},
]

export default function EmpleadoLayout({children}:{children:React.ReactNode}){
  const router=useRouter()
  const pathname=usePathname()
  const [empleado,setEmpleado]=useState<any>(null)
  const [dark,setDark]=useState(false)
  const [mobileOpen,setMobileOpen]=useState(false)
  const [openGroups,setOpenGroups]=useState<Record<string,boolean>>({})
  const [notifCount,setNotifCount]=useState(0)

  useEffect(()=>{
    const isDark=localStorage.getItem('nexohr-dark')==='true'
    setDark(isDark)
    if(isDark)document.documentElement.classList.add('dark')
    supabase.auth.getUser().then(async({data:{user}})=>{
      if(!user){router.push('/');return}
      const{data:emp}=await supabase.from('empleados').select('*').eq('user_id',user.id).single()
      if(!emp){router.push('/');return}
      if(['admin','owner'].includes(emp.rol)){router.push('/admin');return}
      setEmpleado(emp)
      const activeGroup=GROUPS.find(g=>g.items.filter(i=>!i.onlyManager||emp.rol==='manager').some(i=>pathname===i.href||pathname.startsWith(i.href)))
      setOpenGroups(activeGroup?{[activeGroup.id]:true}:{tiempo:true})
      supabase.from('notificaciones').select('id',{count:'exact',head:true}).eq('empleado_id',emp.id).eq('leida',false).then(({count})=>setNotifCount(count||0))
    })
  },[router,pathname])

  useEffect(()=>{setMobileOpen(false)},[pathname])

  const toggleDark=()=>{const n=!dark;setDark(n);document.documentElement.classList.toggle('dark',n);localStorage.setItem('nexohr-dark',String(n))}
  const logout=async()=>{await supabase.auth.signOut();router.push('/')}
  const toggleGroup=(id:string)=>setOpenGroups(prev=>({...prev,[id]:!prev[id]}))
  const isActive=(href:string)=>pathname===href||(href!=='/empleado'&&pathname.startsWith(href))

  const SidebarContent=({onClose}:{onClose?:()=>void})=>(
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 select-none">
      <div className="flex items-center justify-between px-4 pt-5 pb-4 flex-shrink-0 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0"><span className="text-white font-black text-sm">N</span></div>
          <div><p className="font-bold text-sm text-slate-800 dark:text-slate-200 leading-none">Nexo HR</p><p className="text-[10px] text-slate-400 mt-0.5 leading-none">by Tryvor</p></div>
        </div>
        {onClose&&<button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 lg:hidden"><X className="w-4 h-4 text-slate-500"/></button>}
      </div>
      <div className="px-3 pt-3 pb-1 flex-shrink-0">
        <button onClick={()=>{router.push('/empleado');onClose?.()}}
          className={"nav-item w-full "+(pathname==='/empleado'?'nav-item-active':'nav-item-inactive')}>
          <LayoutDashboard className="w-4 h-4 flex-shrink-0"/><span className="flex-1 text-left text-sm">Inicio</span>
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-2 space-y-0.5">
        {GROUPS.map(group=>{
          const visibleItems=group.items.filter(i=>!i.onlyManager||empleado?.rol==='manager')
          if(visibleItems.length===0)return null
          const isOpen=openGroups[group.id]
          const GroupIcon=group.icon
          const hasActive=visibleItems.some(i=>isActive(i.href))
          return(
            <div key={group.id}>
              <button onClick={()=>toggleGroup(group.id)}
                className={"w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 mt-1 "+(hasActive?'text-slate-800 dark:text-slate-200':'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50')}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:(hasActive||isOpen)?group.color+'20':'transparent'}}>
                  <GroupIcon className="w-3.5 h-3.5 flex-shrink-0" style={{color:(hasActive||isOpen)?group.color:undefined}}/>
                </div>
                <span className="flex-1 text-left uppercase tracking-wider text-[10px]">{group.label}</span>
                {hasActive&&<div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background:group.color}}/>}
                <ChevronRight className={"w-3 h-3 flex-shrink-0 transition-transform duration-200 "+(isOpen?'rotate-90':'')}/>
              </button>
              {isOpen&&(
                <div className="ml-3 pl-3 border-l-2 border-slate-100 dark:border-slate-700 mt-0.5 mb-1 space-y-0.5">
                  {visibleItems.map(item=>{
                    const active=isActive(item.href)
                    const Icon=item.icon
                    return(
                      <button key={item.href} onClick={()=>{router.push(item.href);onClose?.()}}
                        className={"nav-item w-full "+(active?'nav-item-active':'nav-item-inactive')}>
                        <Icon className="w-3.5 h-3.5 flex-shrink-0"/>
                        <span className="flex-1 text-left text-[13px]">{item.label}</span>
                        {item.badge&&notifCount>0&&<span className="ml-auto text-[10px] font-bold bg-red-500 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">{notifCount}</span>}
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
        <div onClick={()=>{router.push('/empleado/perfil');onClose?.()}}
          className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 mb-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{backgroundColor:empleado?.avatar_color||'#6366f1'}}>{empleado?.nombre?.charAt(0).toUpperCase()||'?'}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{empleado?.nombre?.split(' ')[0]||'Empleado'}</p>
            <p className="text-[10px] text-slate-400 capitalize">{empleado?.rol||'empleado'}</p>
          </div>
        </div>
        <div className="flex items-center justify-between px-1">
          <button onClick={toggleDark} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors">{dark?<Sun className="w-4 h-4"/>:<Moon className="w-4 h-4"/>}</button>
          <button onClick={logout} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"><LogOut className="w-4 h-4"/></button>
        </div>
      </div>
    </div>
  )

  return(
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <aside className="hidden lg:flex w-56 flex-shrink-0 flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"><SidebarContent/></aside>
      {mobileOpen&&(
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setMobileOpen(false)}/>
          <aside className="absolute left-0 top-0 bottom-0 w-64 shadow-2xl"><SidebarContent onClose={()=>setMobileOpen(false)}/></aside>
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <button onClick={()=>setMobileOpen(true)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"><Menu className="w-5 h-5 text-slate-600 dark:text-slate-400"/></button>
          <div className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center"><span className="text-white font-black text-xs">N</span></div>
          <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Nexo HR</span>
          {notifCount>0&&<span className="ml-auto text-xs font-bold bg-red-500 text-white rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">{notifCount}</span>}
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}