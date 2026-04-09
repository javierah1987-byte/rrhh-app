'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, Clock, FileText, Calendar, TrendingUp, AlertCircle, CheckCircle, Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Stat = { label: string; value: number; icon: any; color: string; bg: string; href: string }
type Solicitud = { id: string; tipo: string; fecha_inicio: string; fecha_fin: string; empleados: { nombre: string; avatar_color: string } }
type Baja = { id: string; tipo: string; fecha_inicio: string; empleados: { nombre: string; avatar_color: string } }
type Aviso = { id: string; titulo: string; fecha: string }

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({ activos: 0, pendientes: 0, bajas: 0, vacacionesHoy: 0 })
  const [solicitudesPendientes, setSolicitudesPendientes] = useState<Solicitud[]>([])
  const [bajasActivas, setBajasActivas] = useState<Baja[]>([])
  const [ultimosAvisos, setUltimosAvisos] = useState<Aviso[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const hoy = new Date().toISOString().slice(0,10)
    Promise.all([
      supabase.from('empleados').select('id,estado').eq('estado','activo'),
      supabase.from('solicitudes').select('id,tipo,fecha_inicio,fecha_fin,empleados(nombre,avatar_color)').eq('estado','pendiente').order('created_at',{ascending:false}),
      supabase.from('bajas').select('id,tipo,fecha_inicio,empleados(nombre,avatar_color)').eq('activa',true),
      supabase.from('solicitudes').select('id').eq('estado','aprobada').lte('fecha_inicio',hoy).gte('fecha_fin',hoy),
      supabase.from('avisos').select('id,titulo,fecha').eq('activo',true).order('fecha',{ascending:false}).limit(3),
    ]).then(([{data:emp},{data:sol},{data:bajas},{data:vacs},{data:avisos}]) => {
      setStats({
        activos: emp?.length || 0,
        pendientes: sol?.length || 0,
        bajas: bajas?.length || 0,
        vacacionesHoy: vacs?.length || 0,
      })
      setSolicitudesPendientes((sol as any[]) || [])
      setBajasActivas((bajas as any[]) || [])
      setUltimosAvisos(avisos || [])
      setLoading(false)
    })
  }, [])

  const TIPO_SOL: Record<string,string> = {
    vacaciones:'🌴 Vacaciones', asuntos_propios:'📋 Asuntos propios',
    permiso_sin_sueldo:'💼 Permiso sin sueldo', cambio_turno:'🔄 Cambio turno', teletrabajo:'🏠 Teletrabajo'
  }
  const TIPO_BAJA: Record<string,string> = {
    enfermedad_comun:'🤒 Enfermedad', accidente_laboral:'🏥 Accidente laboral',
    maternidad_paternidad:'👶 Maternidad/Paternidad', accidente_no_laboral:'🩹 Accidente', cuidado_familiar:'👨‍👩‍👧 Familiar'
  }

  if (loading) return (
    <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Resumen del equipo — {new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label:'Empleados activos', value:stats.activos, icon:Users, color:'text-indigo-600', bg:'bg-indigo-50', href:'/admin/empleados' },
          { label:'Solicitudes pendientes', value:stats.pendientes, icon:Clock, color:'text-amber-600', bg:'bg-amber-50', href:'/admin/vacaciones' },
          { label:'Bajas activas', value:stats.bajas, icon:FileText, color:'text-red-600', bg:'bg-red-50', href:'/admin/bajas' },
          { label:'De vacaciones hoy', value:stats.vacacionesHoy, icon:Calendar, color:'text-emerald-600', bg:'bg-emerald-50', href:'/admin/calendario' },
        ].map((s,i) => (
          <button key={i} onClick={()=>router.push(s.href)} className="stat-card text-left hover:shadow-md transition-shadow cursor-pointer">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`}/>
            </div>
            <span className={`stat-value ${s.color}`}>{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Solicitudes pendientes */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500"/>Solicitudes pendientes
              {stats.pendientes > 0 && <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{stats.pendientes}</span>}
            </h2>
            <button onClick={()=>router.push('/admin/vacaciones')} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Ver todas</button>
          </div>
          {solicitudesPendientes.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2"/>
              <p className="text-sm text-slate-500">Todo al día, sin pendientes</p>
            </div>
          ) : (
            <div className="space-y-2">
              {solicitudesPendientes.slice(0,4).map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{backgroundColor:(s.empleados as any).avatar_color||'#6366f1'}}>
                    {(s.empleados as any).nombre.split(' ').map((n:string)=>n[0]).join('').substring(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{(s.empleados as any).nombre}</p>
                    <p className="text-xs text-slate-500">{TIPO_SOL[s.tipo]||s.tipo} · {new Date(s.fecha_inicio).toLocaleDateString('es-ES',{day:'numeric',month:'short'})} – {new Date(s.fecha_fin).toLocaleDateString('es-ES',{day:'numeric',month:'short'})}</p>
                  </div>
                  <button onClick={()=>router.push('/admin/vacaciones')} className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg font-medium hover:bg-indigo-700 flex-shrink-0">Gestionar</button>
                </div>
              ))}
              {solicitudesPendientes.length > 4 && <p className="text-xs text-slate-400 text-center pt-1">+{solicitudesPendientes.length-4} más</p>}
            </div>
          )}
        </div>

        {/* Bajas activas */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500"/>Bajas activas
              {stats.bajas > 0 && <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">{stats.bajas}</span>}
            </h2>
            <button onClick={()=>router.push('/admin/bajas')} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Ver todas</button>
          </div>
          {bajasActivas.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2"/>
              <p className="text-sm text-slate-500">No hay bajas activas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {bajasActivas.slice(0,4).map(b => (
                <div key={b.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{backgroundColor:(b.empleados as any).avatar_color||'#6366f1'}}>
                    {(b.empleados as any).nombre.split(' ').map((n:string)=>n[0]).join('').substring(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{(b.empleados as any).nombre}</p>
                    <p className="text-xs text-slate-500">{TIPO_BAJA[b.tipo]||b.tipo} · desde {new Date(b.fecha_inicio).toLocaleDateString('es-ES',{day:'numeric',month:'short'})}</p>
                  </div>
                </div>
              ))}
              {bajasActivas.length > 4 && <p className="text-xs text-slate-400 text-center pt-1">+{bajasActivas.length-4} más</p>}
            </div>
          )}
        </div>
      </div>

      {/* Avisos activos */}
      {ultimosAvisos.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 flex items-center gap-2"><Bell className="w-4 h-4 text-indigo-500"/>Avisos activos</h2>
            <button onClick={()=>router.push('/admin/avisos')} className="text-xs text-indigo-600 font-medium hover:text-indigo-800">Gestionar</button>
          </div>
          <div className="space-y-2">
            {ultimosAvisos.map(a => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3 bg-indigo-50 rounded-xl">
                <Bell className="w-4 h-4 text-indigo-400 flex-shrink-0"/>
                <p className="text-sm font-medium text-slate-800 flex-1">{a.titulo}</p>
                <span className="text-xs text-slate-400">{new Date(a.fecha).toLocaleDateString('es-ES',{day:'numeric',month:'short'})}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}