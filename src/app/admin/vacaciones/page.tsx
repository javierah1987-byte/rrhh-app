'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle, XCircle, Clock, Calendar, Filter } from 'lucide-react'

type Solicitud = {
  id: string; tipo: string; fecha_inicio: string; fecha_fin: string
  estado: string; comentario: string|null; created_at: string
  empleados: { nombre: string; avatar_color: string; departamento: string }
}

const TIPO_LABEL: Record<string,string> = {
  vacaciones:'Vacaciones', asuntos_propios:'Asuntos propios',
  permiso_sin_sueldo:'Permiso sin sueldo', cambio_turno:'Cambio turno', teletrabajo:'Teletrabajo'
}
const ESTADO_STYLE: Record<string,string> = {
  pendiente:'badge-amber', aprobada:'badge-green', rechazada:'badge-red'
}

export default function VacacionesAdminPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('pendiente')
  const [procesando, setProcesando] = useState<string|null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase
      .from('solicitudes')
      .select('id,tipo,fecha_inicio,fecha_fin,estado,comentario,created_at,empleados(nombre,avatar_color,departamento)')
      .order('created_at', { ascending: false })
    setSolicitudes((data as any[]) || [])
    setLoading(false)
  }

  async function cambiarEstado(id: string, nuevoEstado: 'aprobada'|'rechazada') {
    setProcesando(id)
    await supabase.from('solicitudes').update({ estado: nuevoEstado }).eq('id', id)
    setSolicitudes(prev => prev.map(s => s.id === id ? { ...s, estado: nuevoEstado } : s))
    setProcesando(null)
  }

  const filtradas = solicitudes.filter(s => filtro === 'todas' || s.estado === filtro)

  const counts = {
    pendiente: solicitudes.filter(s=>s.estado==='pendiente').length,
    aprobada: solicitudes.filter(s=>s.estado==='aprobada').length,
    rechazada: solicitudes.filter(s=>s.estado==='rechazada').length,
  }

  const dias = (s: Solicitud) => {
    const d = (new Date(s.fecha_fin).getTime() - new Date(s.fecha_inicio).getTime()) / 86400000 + 1
    return d + (d===1?' día':' días')
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Solicitudes</h1>
          <p className="text-sm text-slate-500 mt-1">Gestiona las solicitudes del equipo</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-5">
        {[
          { key:'pendiente', label:'Pendientes', count:counts.pendiente, active:'bg-amber-500 text-white', inactive:'bg-amber-50 text-amber-700 hover:bg-amber-100' },
          { key:'aprobada', label:'Aprobadas', count:counts.aprobada, active:'bg-emerald-500 text-white', inactive:'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
          { key:'rechazada', label:'Rechazadas', count:counts.rechazada, active:'bg-red-500 text-white', inactive:'bg-red-50 text-red-700 hover:bg-red-100' },
          { key:'todas', label:'Todas', count:solicitudes.length, active:'bg-indigo-600 text-white', inactive:'bg-slate-100 text-slate-700 hover:bg-slate-200' },
        ].map(f => (
          <button key={f.key} onClick={()=>setFiltro(f.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-colors ${filtro===f.key ? f.active : f.inactive}`}>
            {f.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${filtro===f.key ? 'bg-white/20' : 'bg-white/60'}`}>{f.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>
      ) : filtradas.length === 0 ? (
        <div className="card p-12 text-center">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3"/>
          <p className="text-slate-500">No hay solicitudes {filtro !== 'todas' ? filtro+'s' : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map(s => (
            <div key={s.id} className={`card p-5 ${s.estado==='pendiente' ? 'ring-1 ring-amber-200' : ''}`}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Empleado + info */}
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{backgroundColor:(s.empleados as any).avatar_color||'#6366f1'}}>
                    {(s.empleados as any).nombre.split(' ').map((n:string)=>n[0]).join('').substring(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900">{(s.empleados as any).nombre}</span>
                      <span className="text-xs text-slate-400">{(s.empleados as any).departamento}</span>
                      <span className={`badge ${ESTADO_STYLE[s.estado]||'badge-slate'} capitalize`}>{s.estado}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5">{TIPO_LABEL[s.tipo]||s.tipo}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3"/>
                        {new Date(s.fecha_inicio).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'})}
                        {' → '}
                        {new Date(s.fecha_fin).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'})}
                      </span>
                      <span className="font-medium text-indigo-600">{dias(s)}</span>
                    </div>
                    {s.comentario && <p className="text-xs text-slate-400 mt-1 italic">"{s.comentario}"</p>}
                  </div>
                </div>

                {/* Acciones */}
                {s.estado === 'pendiente' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => cambiarEstado(s.id, 'rechazada')}
                      disabled={procesando===s.id}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-semibold text-sm transition-colors disabled:opacity-50">
                      <XCircle className="w-4 h-4"/>Rechazar
                    </button>
                    <button
                      onClick={() => cambiarEstado(s.id, 'aprobada')}
                      disabled={procesando===s.id}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 font-semibold text-sm transition-colors disabled:opacity-50">
                      <CheckCircle className="w-4 h-4"/>{procesando===s.id ? 'Guardando…' : 'Aprobar'}
                    </button>
                  </div>
                )}
                {s.estado !== 'pendiente' && (
                  <div className="flex gap-2 flex-shrink-0">
                    {s.estado === 'aprobada' && (
                      <button onClick={() => cambiarEstado(s.id, 'rechazada')} disabled={procesando===s.id}
                        className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 font-medium transition-colors">
                        Rechazar
                      </button>
                    )}
                    {s.estado === 'rechazada' && (
                      <button onClick={() => cambiarEstado(s.id, 'aprobada')} disabled={procesando===s.id}
                        className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 font-medium transition-colors">
                        Aprobar
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}