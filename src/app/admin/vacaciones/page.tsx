'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle, XCircle, Clock, Calendar, CheckSquare, Square, Timer, Hourglass } from 'lucide-react'

type Solicitud = {
  id:string; tipo:string; fecha_inicio:string; fecha_fin:string; horas_solicitadas:number|null
  estado:string; comentario:string|null; created_at:string
  empleados:{ nombre:string; avatar_color:string; departamento:string; id?:string }
}

const TIPO_LABEL: Record<string,string> = {
  vacaciones:'Vacaciones', asuntos_propios:'Asuntos propios',
  permiso_sin_sueldo:'Permiso sin sueldo', cambio_turno:'Cambio turno',
  teletrabajo:'Teletrabajo', horas_extra:'Horas extra', permiso:'Permiso'
}
const TIPO_ICON: Record<string,any> = {
  horas_extra: Timer
}
const ESTADO_STYLE: Record<string,string> = {
  pendiente:'badge-amber', aprobada:'badge-green', rechazada:'badge-red'
}

export default function VacacionesAdminPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('pendiente')
  const [procesando, setProcesando] = useState<string|null>(null)
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set())
  const [procesandoMasivo, setProcesandoMasivo] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('solicitudes')
      .select('id,tipo,fecha_inicio,fecha_fin,horas_solicitadas,estado,comentario,created_at,empleado_id,empleados(id,nombre,avatar_color,departamento)')
      .order('created_at',{ascending:false})
    setSolicitudes((data as any[])||[])
    setLoading(false)
  }

  async function cambiarEstado(id:string, nuevoEstado:'aprobada'|'rechazada') {
    setProcesando(id)
    await supabase.from('solicitudes').update({estado:nuevoEstado}).eq('id',id)
    // Notificar al empleado
    const sol = solicitudes.find(s=>s.id===id)
    if (sol) {
      const tipoLabel = TIPO_LABEL[sol.tipo] || sol.tipo
      const empId = (sol.empleados as any)?.id || (sol as any).empleado_id
      if (empId) {
        await supabase.from('notificaciones').insert({
          empleado_id: empId,
          titulo: nuevoEstado === 'aprobada' ? `${tipoLabel} aprobada` : `${tipoLabel} rechazada`,
          mensaje: nuevoEstado === 'aprobada'
            ? `Tu solicitud de ${tipoLabel.toLowerCase()} ha sido aprobada.`
            : `Tu solicitud de ${tipoLabel.toLowerCase()} ha sido rechazada.`,
          tipo: nuevoEstado === 'aprobada' ? 'exito' : 'advertencia',
          enlace: '/empleado/solicitudes'
        })
      }
    }
    setSolicitudes(prev=>prev.map(s=>s.id===id?{...s,estado:nuevoEstado}:s))
    setProcesando(null)
  }

  async function accionMasiva(nuevoEstado:'aprobada'|'rechazada') {
    if (seleccionadas.size===0) return
    setProcesandoMasivo(true)
    const ids = Array.from(seleccionadas)
    await supabase.from('solicitudes').update({estado:nuevoEstado}).in('id',ids)
    setSolicitudes(prev=>prev.map(s=>seleccionadas.has(s.id)?{...s,estado:nuevoEstado}:s))
    setSeleccionadas(new Set())
    setProcesandoMasivo(false)
  }

  function toggleSeleccion(id:string) {
    setSeleccionadas(prev=>{ const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n })
  }

  function toggleTodas() {
    const pendFilt = filtradas.filter(s=>s.estado==='pendiente')
    if (seleccionadas.size===pendFilt.length) setSeleccionadas(new Set())
    else setSeleccionadas(new Set(pendFilt.map(s=>s.id)))
  }

  const filtradas = solicitudes.filter(s=>
    filtro==='todas'    ? true :
    filtro==='horas_extra' ? s.tipo==='horas_extra' :
    s.estado===filtro && s.tipo!=='horas_extra'
  )

  const pendientesFiltradas = filtradas.filter(s=>s.estado==='pendiente')
  const todasSeleccionadas = pendientesFiltradas.length>0 && pendientesFiltradas.every(s=>seleccionadas.has(s.id))

  const counts = {
    pendiente:    solicitudes.filter(s=>s.estado==='pendiente' && s.tipo!=='horas_extra').length,
    aprobada:     solicitudes.filter(s=>s.estado==='aprobada'  && s.tipo!=='horas_extra').length,
    rechazada:    solicitudes.filter(s=>s.estado==='rechazada' && s.tipo!=='horas_extra').length,
    horas_extra:  solicitudes.filter(s=>s.tipo==='horas_extra').length,
    horas_pendientes: solicitudes.filter(s=>s.tipo==='horas_extra'&&s.estado==='pendiente').length,
    todas:        solicitudes.length,
  }

  function renderPeriodo(s: Solicitud) {
    if (s.tipo === 'horas_extra') {
      return (
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3"/>
            {new Date(s.fecha_inicio + 'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'})}
          </span>
          <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Timer className="w-3 h-3"/>
            {s.horas_solicitadas} hora{(s.horas_solicitadas||0)>1?'s':''} extra
          </span>
        </div>
      )
    }
    const dias = (new Date(s.fecha_fin).getTime()-new Date(s.fecha_inicio).getTime())/86400000+1
    return (
      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3"/>
          {new Date(s.fecha_inicio+'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'})}
          {s.fecha_inicio!==s.fecha_fin && <> &rarr; {new Date(s.fecha_fin+'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'})}</>}
        </span>
        <span className="font-medium text-indigo-600 dark:text-indigo-400">{dias} {dias===1?'día':'días'}</span>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Solicitudes</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gestiona las solicitudes del equipo</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-5">
        {[
          {key:'pendiente',label:'Pendientes',count:counts.pendiente,activeClass:'bg-amber-500 text-white',inactiveClass:'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100'},
          {key:'aprobada',label:'Aprobadas',count:counts.aprobada,activeClass:'bg-emerald-500 text-white',inactiveClass:'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'},
          {key:'rechazada',label:'Rechazadas',count:counts.rechazada,activeClass:'bg-red-500 text-white',inactiveClass:'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100'},
          {key:'horas_extra',label:'Horas extra',count:counts.horas_extra,activeClass:'bg-orange-500 text-white',inactiveClass:'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 hover:bg-orange-100',badge:counts.horas_pendientes},
          {key:'todas',label:'Todas',count:counts.todas,activeClass:'bg-indigo-600 text-white',inactiveClass:'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'},
        ].map(f=>(
          <button key={f.key} onClick={()=>{setFiltro(f.key);setSeleccionadas(new Set())}}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-colors ${filtro===f.key?f.activeClass:f.inactiveClass}`}>
            {f.key==='horas_extra'&&<Timer className="w-3.5 h-3.5"/>}
            {f.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${filtro===f.key?'bg-white/20':'bg-white/60 dark:bg-slate-600'}`}>{f.count}</span>
            {(f as any).badge > 0 && filtro !== f.key && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{(f as any).badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Barra acciones masivas */}
      {(filtro==='pendiente'||filtro==='horas_extra') && pendientesFiltradas.length>0 && (
        <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl mb-4 transition-all ${seleccionadas.size>0?'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800':'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}>
          <button onClick={toggleTodas} className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600">
            {todasSeleccionadas?<CheckSquare className="w-4 h-4 text-indigo-600"/>:<Square className="w-4 h-4"/>}
            {seleccionadas.size>0?'Seleccionadas '+seleccionadas.size:'Seleccionar todas las pendientes'}
          </button>
          {seleccionadas.size>0&&(
            <div className="ml-auto flex gap-2">
              <button onClick={()=>accionMasiva('rechazada')} disabled={procesandoMasivo} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 font-semibold text-sm transition-colors disabled:opacity-50">
                <XCircle className="w-4 h-4"/>Rechazar {seleccionadas.size}
              </button>
              <button onClick={()=>accionMasiva('aprobada')} disabled={procesandoMasivo} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 font-semibold text-sm transition-colors disabled:opacity-50">
                <CheckCircle className="w-4 h-4"/>{procesandoMasivo?'Procesando…':'Aprobar '+seleccionadas.size}
              </button>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>
      ) : filtradas.length===0 ? (
        <div className="card p-12 text-center">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3"/>
          <p className="text-slate-500">No hay solicitudes {filtro==='horas_extra'?'de horas extra':filtro!=='todas'?filtro+'s':''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map(s=>{
            const esHorasExtra = s.tipo === 'horas_extra'
            return (
              <div key={s.id} className={`card p-5 ${s.estado==='pendiente'?esHorasExtra?'ring-1 ring-orange-200 dark:ring-orange-800':'ring-1 ring-amber-200 dark:ring-amber-800':''} ${seleccionadas.has(s.id)?'ring-2 ring-indigo-500':''} transition-all`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {s.estado==='pendiente' && (
                    <button onClick={()=>toggleSeleccion(s.id)} className="hidden sm:block flex-shrink-0">
                      {seleccionadas.has(s.id)?<CheckSquare className="w-5 h-5 text-indigo-600"/>:<Square className="w-5 h-5 text-slate-300 hover:text-slate-500"/>}
                    </button>
                  )}
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{backgroundColor:(s.empleados as any).avatar_color||'#6366f1'}}>
                      {(s.empleados as any).nombre.split(' ').map((n:string)=>n[0]).join('').substring(0,2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{(s.empleados as any).nombre}</span>
                        <span className="text-xs text-slate-400">{(s.empleados as any).departamento}</span>
                        <span className={`badge ${ESTADO_STYLE[s.estado]||'badge-slate'} capitalize`}>{s.estado}</span>
                        {esHorasExtra && <span className="badge bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 flex items-center gap-1"><Timer className="w-3 h-3"/>Horas extra</span>}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{TIPO_LABEL[s.tipo]||s.tipo}</p>
                      {renderPeriodo(s)}
                      {s.comentario && <p className="text-xs text-slate-400 mt-1 italic">"{s.comentario}"</p>}
                    </div>
                  </div>
                  {s.estado==='pendiente' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={()=>cambiarEstado(s.id,'rechazada')} disabled={procesando===s.id}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 font-semibold text-sm transition-colors disabled:opacity-50">
                        <XCircle className="w-4 h-4"/>Rechazar
                      </button>
                      <button onClick={()=>cambiarEstado(s.id,'aprobada')} disabled={procesando===s.id}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 font-semibold text-sm transition-colors disabled:opacity-50">
                        <CheckCircle className="w-4 h-4"/>{procesando===s.id?'Guardando…':'Aprobar'}
                      </button>
                    </div>
                  )}
                  {s.estado!=='pendiente' && (
                    <div className="flex gap-2 flex-shrink-0">
                      {s.estado==='aprobada' && <button onClick={()=>cambiarEstado(s.id,'rechazada')} disabled={procesando===s.id} className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-red-50 hover:text-red-600 font-medium transition-colors">Rechazar</button>}
                      {s.estado==='rechazada' && <button onClick={()=>cambiarEstado(s.id,'aprobada')} disabled={procesando===s.id} className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 font-medium transition-colors">Aprobar</button>}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}