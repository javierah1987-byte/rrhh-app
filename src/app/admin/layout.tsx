'use client'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CommandPalette } from '@/components/CommandPalette'
import { ToastProvider } from '@/components/ToastProvider'
import { LayoutDashboard,Users,CalendarDays,FileText,Clock,DollarSign,BarChart2,Bell,MessageSquare,Calendar,Briefcase,ClipboardList,Star,Gift,LogOut,ChevronDown,Sun,Moon,Search,Menu,X,LucideIcon } from 'lucide-react'

type NavItem = { icon: LucideIcon; label: string; href: string; badge?: boolean }
type NavGroup = { label: string|null; items: NavItem[] }

const GROUPS: NavGroup[] = [
  { label:null, items:[{icon:LayoutDashboard,label:'Dashboard',href:'/admin'}] },
  { label:'Equipo', items:[{icon:Users,label:'Empleados',href:'/admin/empleados'},{icon:Clock,label:'Control horas',href:'/admin/control-horas'},{icon:ClipboardList,label:'Horarios',href:'/admin/horarios'},{icon:Star,label:'Evaluaciones',href:'/admin/evaluaciones'}] },
  { label:'Solicitudes', items:[{icon:CalendarDays,label:'Solicitudes',href:'/admin/vacaciones',badge:true},{icon:FileText,label:'Bajas',href:'/admin/bajas'},{icon:Briefcase,label:'Petición docs',href:'/admin/solicitudes-documentos'}] },
  { label:'Nóminas y docs', items:[{icon:DollarSign,label:'Nóminas',href:'/admin/nominas'},{icon:FileText,label:'Documentos',href:'/admin/documentos'},{icon:BarChart2,label:'Informes',href:'/admin/informes'}] },
  { label:'Comunicación', items:[{icon:Bell,label:'Avisos',href:'/admin/avisos'},{icon:MessageSquare,label:'Mensajes',href:'/admin/mensajes'},{icon:Gift,label:'Recordatorios',href:'/admin/recordatorios'}] },
  { label:'Config', items:[{icon:Calendar,label:'Calendario',href:'/admin/calendario'},{icon:CalendarDays,label:'Festivos',href:'/admin/festivos'}] },
]

function NavItemBtn({item,active,badge}:{item:NavItem;active:boolean;badge:number}){
  const router=useRouter()
  return(
    <button onClick={()=>router.push(item.href)} className={`nav-item w-full ${active?'nav-item-active':'nav-item-inactive'}`}>
      <item.icon className="w-4 h-4 flex-shrink-0"/>
      <span className="flex-1 text-left truncate text-sm">{item.label}</span>
      {badge>0&&<span className="min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 flex-shrink-0">{badge}</span>}
    </button>
  )
}

function Sidebar({onClose,pendientes}:{onClose?:()=>void;pendientes:number}){
  const pathname=usePathname()
  const router=useRouter()
  const [dark,setDark]=useState(false)
  const [openG,setOpenG]=useState<Record<string,boolean>>({})
  const [name,setName]=useState('Admin')
  useEffect(()=>{
    setDark(localStorage.getItem('nexohr-dark')==='true')
    supabase.auth.getUser().then(({data:{user}})=>{
      if(user) supabase.from('empleados').select('nombre').eq('user_id',user.id).single().then(({data})=>{ if(data) setName((data as any).nombre.split(' ')[0]) })
    })
  },[])
  const toggleDark=()=>{ const n=!dark; setDark(n); document.documentElement.classList.toggle('dark',n); localStorage.setItem('nexohr-dark',String(n)) }
  const logout=async()=>{ await supabase.auth.signOut(); router.push('/') }
  return(
    <div className="flex flex-col h-full bg-white dark:bg-slate-800">
      <div className="flex items-center justify-between px-4 pt-5 pb-3 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center"><span className="text-white font-black text-sm">N</span></div>
          <div><p className="font-bold text-sm text-slate-800 dark:text-slate-200 leading-none">Nexo HR</p><p className="text-[10px] text-slate-400 mt-0.5">Admin</p></div>
        </div>
        {onClose&&<button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 lg:hidden"><X className="w-4 h-4 text-slate-500"/></button>}
      </div>
      <button onClick={()=>window.dispatchEvent(new CustomEvent('nexohr-cmdk'))}
        className="mx-3 mb-3 flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-400 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer flex-shrink-0">
        <Search className="w-3.5 h-3.5"/><span className="flex-1 text-left">Buscar...</span><kbd className="font-mono text-[10px] bg-slate-200 dark:bg-slate-600 px-1 rounded">⌘K</kbd>
      </button>
      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5 pb-4">
        {GROUPS.map((g,gi)=>(
          <div key={gi}>
            {g.label&&(
              <button onClick={()=>setOpenG(o=>({...o,[g.label!]:!o[g.label!]}))}
                className="w-full flex items-center justify-between px-2 py-1.5 mt-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                {g.label}<ChevronDown className={`w-3 h-3 transition-transform ${openG[g.label!]===false?'-rotate-90':''}`}/>
              </button>
            )}
            {openG[g.label!]!==false&&g.items.map(item=>(
              <NavItemBtn key={item.href} item={item}
                active={pathname===item.href||(item.href!=='/admin'&&pathname.startsWith(item.href))}
                badge={item.badge ? pendientes : 0}/>
            ))}
          </div>
        ))}
      </nav>
      <div className="px-3 pb-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex-shrink-0">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Hola, {name}</span>
          <div className="flex items-center gap-1">
            <button onClick={toggleDark} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors">{dark?<Sun className="w-4 h-4"/>:<Moon className="w-4 h-4"/>}</button>
            <button onClick={logout} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"><LogOut className="w-4 h-4"/></button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminLayout({children}:{children:React.ReactNode}){
  const [pendientes,setPendientes]=useState(0)
  const [mobileOpen,setMobileOpen]=useState(false)
  useEffect(()=>{
    supabase.from('solicitudes').select('id',{count:'exact',head:true}).eq('estado','pendiente').then(({count})=>setPendientes(count||0))
    const ch=supabase.channel('sol-count').on('postgres_changes',{event:'*',schema:'public',table:'solicitudes'},()=>{
      supabase.from('solicitudes').select('id',{count:'exact',head:true}).eq('estado','pendiente').then(({count})=>setPendientes(count||0))
    }).subscribe()
    return()=>{supabase.removeChannel(ch)}
  },[])
  return(
    <ToastProvider>
      <CommandPalette/>
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
        <aside className="hidden lg:flex w-56 flex-shrink-0 flex-col border-r border-slate-200 dark:border-slate-700">
          <Sidebar pendientes={pendientes}/>
        </aside>
        {mobileOpen&&(
          <div className="fixed inset-0 z-40 lg:hidden" onClick={()=>setMobileOpen(false)}>
            <div className="absolute inset-0 bg-black/50"/>
            <aside className="absolute left-0 top-0 bottom-0 w-64 shadow-xl animate-slide-in" onClick={e=>e.stopPropagation()}>
              <Sidebar pendientes={pendientes} onClose={()=>setMobileOpen(false)}/>
            </aside>
          </div>
        )}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
            <button onClick={()=>setMobileOpen(true)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"><Menu className="w-5 h-5 text-slate-600 dark:text-slate-400"/></button>
            <span className="font-bold text-slate-800 dark:text-slate-200">Nexo HR</span>
            <button onClick={()=>window.dispatchEvent(new CustomEvent('nexohr-cmdk'))} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"><Search className="w-5 h-5 text-slate-600 dark:text-slate-400"/></button>
          </div>
          <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </ToastProvider>
  )
}