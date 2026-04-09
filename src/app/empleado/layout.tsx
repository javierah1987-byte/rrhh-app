'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Empleado } from '@/lib/supabase'
import { LayoutDashboard, Clock, Calendar, CalendarDays, FileText, User, CreditCard, LogOut, ChevronRight, Menu, Sun, Moon, MessageSquare, BellRing } from 'lucide-react'

const NAV = [
  { href: '/empleado', label: 'Inicio', icon: LayoutDashboard },
  { href: '/empleado/fichaje', label: 'Fichaje', icon: Clock },
  { href: '/empleado/solicitudes', label: 'Solicitudes', icon: Calendar },
  { href: '/empleado/bajas', label: 'Mis bajas', icon: FileText },
  { href: '/empleado/nominas', label: 'Nóminas', icon: CreditCard },
  { href: '/empleado/calendario', label: 'Calendario', icon: CalendarDays },
  { href: '/empleado/mensajes', label: 'Mensajes', icon: MessageSquare },
  { href: '/empleado/notificaciones', label: 'Notificaciones', icon: BellRing },
  { href: '/empleado/perfil', label: 'Mi perfil', icon: User },
]

const NexoLogo = () => (
  <svg width="22" height="22" viewBox="0 0 80 80" fill="none">
    <circle cx="28" cy="28" r="10" fill="white"/>
    <circle cx="52" cy="28" r="10" fill="white" fillOpacity="0.7"/>
    <path d="M18 52 C18 44 22 40 28 40 C34 40 38 44 38 52" stroke="white" strokeWidth="5" strokeLinecap="round" fill="none"/>
    <path d="M42 52 C42 44 46 40 52 40 C58 40 62 44 62 52" stroke="white" strokeWidth="5" strokeLinecap="round" fill="none" strokeOpacity="0.7"/>
  </svg>
)

export default function EmpleadoLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [empleado, setEmpleado] = useState<Empleado | null>(null)
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const [notifCount, setNotifCount] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem('nexohr-dark')
    if (saved === 'true') { setDark(true); document.documentElement.classList.add('dark') }
  }, [])

  function toggleDark() {
    const next = !dark
    setDark(next)
    if (next) { document.documentElement.classList.add('dark'); localStorage.setItem('nexohr-dark', 'true') }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('nexohr-dark', 'false') }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      supabase.from('empleados').select('*').eq('user_id', data.user.id).single()
        .then(({ data: emp }) => {
          if (!emp) { router.push('/login'); return }
          setEmpleado(emp)
          supabase.from('notificaciones').select('id', { count: 'exact' }).eq('empleado_id', emp.id).eq('leida', false)
            .then(({ count }) => setNotifCount(count || 0))
          const ch = supabase.channel('notif-emp-nav')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificaciones' }, () => {
              setNotifCount(c => c + 1)
            }).subscribe()
          return () => { supabase.removeChannel(ch) }
        })
    })
  }, [router])

  if (!empleado) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#EEF2FF,#F0FDF4)' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl animate-spin border-4 border-indigo-200 border-t-indigo-600" />
        <p className="text-sm text-slate-500">Cargando Nexo HR…</p>
      </div>
    </div>
  )

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-100 dark:border-slate-700">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#4F46E5,#10B981)' }}>
          <NexoLogo />
        </div>
        <div className="flex-1">
          <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">Nexo HR</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Portal empleado</p>
        </div>
        <button onClick={toggleDark} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
          {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
        </button>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          const badge = href === '/empleado/notificaciones' ? notifCount : 0
          return (
            <button key={href} onClick={() => { router.push(href); setOpen(false) }}
              className={`nav-item w-full ${active ? 'nav-item-active' : 'nav-item-inactive'}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              {badge > 0 && <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{badge}</span>}
              {active && badge === 0 && <ChevronRight className="w-3 h-3 opacity-40" />}
            </button>
          )
        })}
      </nav>
      <div className="px-3 py-4 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl mb-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: empleado.avatar_color || '#10B981' }}>
            {empleado.nombre.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{empleado.nombre}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium capitalize">{empleado.puesto}</p>
          </div>
        </div>
        <button onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
          className="nav-item nav-item-inactive w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 mt-1">
          <LogOut className="w-4 h-4" /><span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      <aside className="hidden lg:flex w-56 flex-col border-r border-slate-200 dark:border-slate-700 flex-shrink-0"><Sidebar /></aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-56 shadow-xl"><Sidebar /></aside>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <button onClick={() => setOpen(true)} className="relative p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
            <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            {notifCount > 0 && <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{notifCount}</span>}
          </button>
          <span className="font-bold text-slate-900 dark:text-slate-100 flex-1">Nexo HR</span>
          <button onClick={toggleDark} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
            {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900">{children}</main>
      </div>
    </div>
  )
}