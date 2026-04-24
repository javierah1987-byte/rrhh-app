// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import { Clock, Users, Monitor, LayoutDashboard, LogOut, BarChart2, AlertCircle } from 'lucide-react'

const NAV = [
  { icon:LayoutDashboard, label:'Dashboard',      href:'/fichaje' },
  { icon:BarChart2,       label:'Control horas',  href:'/fichaje/horas' },
  { icon:Users,           label:'Quién está hoy', href:'/fichaje/presencia' },
  { icon:Monitor,         label:'Kiosko',          href:'/kiosko' },
  { icon:AlertCircle,     label:'Correcciones',   href:'/fichaje/correcciones' },
]

export default function FichajeAdminLayout({ children }: {children:React.ReactNode}) {
  const [user, setUser]     = useState(null)
  const [empresa, setEmpresa] = useState('Mi empresa')
  const [loading, setLoading] = useState(true)
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data:{ user } }) => {
      if (!user) { router.push('/login'); return }
      setUser(user)
      const { data: emp } = await supabase.from('empleados').select('nombre,rol').eq('user_id', user.id).single()
      if (emp && !['owner','admin','manager'].includes(emp.rol)) {
        router.push('/empleado')
        return
      }
      setLoading(false)
    })
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-indigo-400 text-sm animate-pulse">Cargando...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      {/* Sidebar minimalista */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col fixed h-full z-10 shadow-sm">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-white"/>
            </div>
            <div>
              <button onClick={()=>router.push('/fichaje')} className="font-bold text-slate-800 dark:text-white text-sm leading-none hover:text-indigo-600 transition-colors">Nexo HR</button>
              <p className="text-slate-400 text-[11px] mt-0.5">Control de presencia</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV.map(item => {
            const Icon = item.icon
            const active = pathname === item.href || (item.href !== '/fichaje' && pathname.startsWith(item.href))
            return (
              <a key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}>
                <Icon className="w-4 h-4 flex-shrink-0"/>
                {item.label}
              </a>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 px-2 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 mb-2">
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.email?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">Admin</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
            <LogOut className="w-4 h-4"/>Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>
    </div>
  )
}