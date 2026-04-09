'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, Clock, FileText, Calendar, TrendingUp, CheckCircle, Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { EmptyState, SkeletonStats, SkeletonCard } from '@/components/shared'

type Solicitud = { id:string; tipo:string; fecha_inicio:string; fecha_fin:string; estado:string; empleados:{nombre:string;avatar_color:string} }
type Baja = { id:string; tipo:string; fecha_inicio:string; empleados:{nombre:string;avatar_color:string} }
type Aviso = { id:string; titulo:string; fecha:string }

const TIPO_SOL: Record<string,string> = {
  vacaciones:'🌴 Vacaciones', asuntos_propios:'💻 Asuntos propios',
  permiso_sin_sueldo:'💼 Permiso', cambio_turno:'🔄 Cambio turno', teletrabajo:'🏠 Teletrabajo'
}
const TIPO_BAJA: Record<string,string> = {
  enfermedad_comun:'🤒 Enfermedad', accidente_laboral:'🏥 Accidente laboral',
  maternidad_paternidad:'👶 Mat./Pat.', accidente_no_laboral:'🩹 Accidente',
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({ activos:0, pendientes:0, bajas:0, vacacionesHoy:0 })
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [bajas, setBajas] = useState<Baja[]>([])
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const hoy = new Date().toISOString().slice(0,10)
    Promise.all([
      supabase.from('empleados').select('id').eq('estado','activo'),
      supabase.from('solicitudes').select('id,tipo,fecha_inicio,fecha_fin,estado,empleados(nombre,avatar_color)').eq('estado','pendiente').order('created_at',{ascending:false}),
      supabase.from('bajas').select('id,tipo,fecha_inicio,empleados(nombre,avatar_color)').eq('activa',true),
      supabase.from('solicitudes').select('id').eq('estado','aprobada').lte('fecha_inicio',hoy).gte('fecha_fin',hoy),
      supabase.from('avisos').select('id,titulo,fecha').eq('activo',true).order('fecha',{ascending:false}).limit(3),
    ]).then(([{data:emp},{data:sol},{data:baj},{data:vacs},{data:avs}]) => {
      setStats({ activos:emp?.length||0, pendientes:sol?.length||0, bajas:baj?.length||0, vacacionesHoy:vacs?.length||0 })
      setSolicitudes((sol as any[])||[])
      setBajas((baj as any[])||[])
      setAvisos(avs||[])
      setLoading(false)
    })
  }, [])

  const fechaHoy = new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'})

  if (loading) return (
    <div className="space-y-5 animate-fade-in">
      <div><div className="skeleton h-8 w-48 mb-2"/><div className="skeleton h-4 w-64"/></div>
      <SkeletonStats cols={4}/>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <SkeletonCard/><SkeletonCard/>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 capitalize">{fechaHoy}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 stagger">
        {[
          { label:'Empleados activos', value:stats.activos, icon:Users, color:'text-indigo-600', bg:'bg-indigo-50 dark:bg-indigo-900/30', href:'/admin/empleados' },
          { label:'Solicitudes pendientes', value:stats.pendientes, icon:Clock, color:'text-amber-600', bg:'bg-amber-50 dark:bg-amber-900/30', href:'/admin/vacaciones' },
          { label:'Bajas activas', value:stats.bajas, icon:FileText, color:'text-red-600', bg:'bg-red-50 dark:bg-red-900/30', href:'/admin/bajas' },
          { label:'De vacaciones hoy', value:stats.vacacionesHoy, icon:Calendar, color:'text-emerald-600', bg:'bg-emerald-50 dark:bg-emerald-900/30', href:'/admin/calendario' },
        ].map((s,i) => (
          <button key={i} onClick={()=>router.push(s.href)}
            className="stat-card card-hover text-left animate-fade-in">
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
        <div className="card p-5 animate-fade-in" style={{animationDelay:'100ms'}}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500"/>Solicitudes pendientes
              {stats.pendientes>0&&<span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-bold px-2 py-0.5 rounded-full">{stats.pendientes}</span>}
            </h2>
            <button onClick={()=>router.push('/admin/vacaciones')} className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-medium">Ver todas</button>
          </div>
          {solicitudes.length===0 ? (
            <EmptyState icon="checkmark" title="Todo al día" description="No hay solicitudes pendientes de revisar"/>
          ) : (
            <div className="space-y-2 stagger">
              {solicitudes.slice(0,4).map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl animate-fade-in">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{backgroundColor:(s.empleados as any).avatar_color||'#6366f1'}}>
                    {(s.empleados as any).nombre.split(' ').map((n:string)=>n[0]).join('').substring(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{(s.empleados as any).nombre}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{TIPO_SOL[s.tipo]||s.tipo} · {new Date(s.fecha_inicio).toLocaleDateString('es-ES',{day:'numeric',month:'short'})} → {new Date(s.fecha_fin).toLocaleDateString('es-ES',{day:'numeric',month:'short'})}</p>
                  </div>
                  <button onClick={()=>router.push('/admin/vacaciones')}
                    className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors flex-shrink-0">
                    Gestionar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bajas activas */}
        <div className="card p-5 animate-fade-in" style={{animationDelay:'150ms'}}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-500"/>Bajas activas
              {stats.bajas>0&&<span className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-bold px-2 py-0.5 rounded-full">{stats.bajas}</span>}
            </h2>
            <button onClick={()=>router.push('/admin/bajas')} className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-medium">Ver todas</button>
          </div>
          {bajas.length===0 ? (
            <EmptyState icon="checkmark" title="Sin bajas activas" description="El equipo está al completo"/>
          ) : (
            <div className="space-y-2 stagger">
              {bajas.slice(0,4).map(b => (
                <div key={b.id} className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl animate-fade-in">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{backgroundColor:(b.empleados as any).avatar_color||'#6366f1'}}>
                    {(b.empleados as any).nombre.split(' ').map((n:string)=>n[0]).join('').substring(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{(b.empleados as any).nombre}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{TIPO_BAJA[b.tipo]||b.tipo} · desde {new Date(b.fecha_inicio).toLocaleDateString('es-ES',{day:'numeric',month:'short'})}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {avisos.length>0&&(
        <div className="card p-5 animate-fade-in" style={{animationDelay:'200ms'}}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2"><Bell className="w-4 h-4 text-indigo-500"/>Avisos activos</h2>
            <button onClick={()=>router.push('/admin/avisos')} className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-800">Gestionar</button>
          </div>
          <div className="space-y-2 stagger">
            {avisos.map(a=>(
              <div key={a.id} className="flex items-center gap-3 px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl animate-fade-in">
                <Bell className="w-4 h-4 text-indigo-400 flex-shrink-0"/>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 flex-1">{a.titulo}</p>
                <span className="text-xs text-slate-400">{new Date(a.fecha).toLocaleDateString('es-ES',{day:'numeric',month:'short'})}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}