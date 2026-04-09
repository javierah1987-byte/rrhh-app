'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Bell, CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react'

type Notif = { id:string; titulo:string; mensaje:string; tipo:string; leida:boolean; enlace:string|null; created_at:string }

const TIPO_STYLE: Record<string,{icon:any,bg:string,iconColor:string}> = {
  exito: { icon:CheckCircle, bg:'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800', iconColor:'text-emerald-500' },
  error: { icon:XCircle, bg:'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800', iconColor:'text-red-500' },
  advertencia: { icon:AlertTriangle, bg:'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800', iconColor:'text-amber-500' },
  info: { icon:Info, bg:'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800', iconColor:'text-indigo-500' },
}

export default function NotificacionesPage() {
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)
  const [empId, setEmpId] = useState<string|null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase.from('empleados').select('id').eq('user_id', data.user.id).single()
        .then(({ data: emp }) => {
          if (!emp) return
          setEmpId(emp.id)
          supabase.from('notificaciones').select('*').eq('empleado_id', emp.id).order('created_at',{ascending:false})
            .then(({ data: n }) => { setNotifs(n||[]); setLoading(false) })
          // Marcar todas como leídas
          supabase.from('notificaciones').update({leida:true}).eq('empleado_id',emp.id)
        })
    })
  }, [])

  async function eliminar(id: string) {
    await supabase.from('notificaciones').delete().eq('id', id)
    setNotifs(prev=>prev.filter(n=>n.id!==id))
  }

  async function eliminarTodas() {
    if (!empId) return
    await supabase.from('notificaciones').delete().eq('empleado_id', empId)
    setNotifs([])
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notificaciones</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Avisos y actualizaciones sobre tus solicitudes</p>
        </div>
        {notifs.length>0 && (
          <button onClick={eliminarTodas} className="btn-secondary text-xs">Borrar todas</button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>
      ) : notifs.length===0 ? (
        <div className="card p-12 text-center">
          <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3"/>
          <p className="text-slate-500 font-medium">Sin notificaciones</p>
          <p className="text-slate-400 text-sm mt-1">Aquí aparecerán las actualizaciones de tus solicitudes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifs.map(n => {
            const s = TIPO_STYLE[n.tipo]||TIPO_STYLE.info
            const Icon = s.icon
            return (
              <div key={n.id} className={`rounded-2xl border p-5 ${s.bg} ${!n.leida?'ring-2 ring-indigo-300':'opacity-75'}`}>
                <div className="flex items-start gap-4">
                  <Icon className={`w-6 h-6 flex-shrink-0 mt-0.5 ${s.iconColor}`}/>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">{n.titulo}</h3>
                      {!n.leida && <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0"/>}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">{n.mensaje}</p>
                    <p className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleDateString('es-ES',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'})}</p>
                  </div>
                  <button onClick={()=>eliminar(n.id)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg leading-none flex-shrink-0">×</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}