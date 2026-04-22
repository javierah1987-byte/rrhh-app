// @ts-nocheck
'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Calendar, CheckCircle2, XCircle, Clock, Filter, ChevronDown, ChevronUp, MessageSquare, X } from 'lucide-react'

const TIPO_LABEL = {vacaciones:'🌴 Vacaciones',permiso:'📋 Permiso',teletrabajo:'🏠 Teletrabajo',baja_medica:'🏥 Baja médica',asuntos_propios:'🗓️ Asuntos propios',otro:'📌 Otro'}

export default function AdminVacacionesPage() {
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading]         = useState(true)
  const [filtro, setFiltro]           = useState('pendiente')
  const [saving, setSaving]           = useState(null)
  const [comentModal, setComentModal] = useState(null) // {id, accion}
  const [motivo, setMotivo]           = useState('')

  const cargar = useCallback(async () => {
    const q = supabase.from('solicitudes')
      .select('*, empleados(nombre,puesto,departamento,avatar_color)')
      .order('created_at', {ascending:false})
    const { data } = filtro === 'todas' ? await q : await q.eq('estado', filtro)
    setSolicitudes(data||[])
    setLoading(false)
  }, [filtro])

  useEffect(() => { setLoading(true); cargar() }, [cargar])

  const aprobar = async (id, comentario='') => {
    setSaving(id)
    await supabase.from('solicitudes').update({estado:'aprobada', comentario_admin: comentario||'Aprobada'}).eq('id',id)
    setSaving(null); setComentModal(null); setMotivo(''); cargar()
  }

  const rechazar = async (id, motivo) => {
    if (!motivo.trim()) return
    setSaving(id)
    await supabase.from('solicitudes').update({estado:'rechazada', comentario_admin: motivo}).eq('id',id)
    setSaving(null); setComentModal(null); setMotivo(''); cargar()
  }

  const pendientesCount = solicitudes.filter(s=>s.estado==='pendiente').length
  const stats = {
    pendiente: solicitudes.filter(s=>s.estado==='pendiente').length,
    aprobada:  solicitudes.filter(s=>s.estado==='aprobada').length,
    rechazada: solicitudes.filter(s=>s.estado==='rechazada').length,
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500"/> Solicitudes de ausencia
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Gestiona vacaciones, permisos y ausencias del equipo</p>
        </div>
        {pendientesCount > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500"/>
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">{pendientesCount} pendiente{pendientesCount!==1?'s':''} de revisión</span>
          </div>
        )}
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {key:'pendiente', label:'Pendientes', color:'#f59e0b', bg:'bg-amber-50 dark:bg-amber-900/10', icon:'⏳'},
          {key:'aprobada',  label:'Aprobadas',  color:'#10b981', bg:'bg-emerald-50 dark:bg-emerald-900/10', icon:'✅'},
          {key:'rechazada', label:'Rechazadas', color:'#ef4444', bg:'bg-red-50 dark:bg-red-900/10', icon:'❌'},
        ].map(s=>(
          <button key={s.key} onClick={()=>setFiltro(s.key)}
            className={`${s.bg} border rounded-xl p-4 text-left transition-all ${filtro===s.key?'border-indigo-400 ring-2 ring-indigo-200 dark:ring-indigo-800':'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
            <p className="text-2xl font-black" style={{color:s.color}}>{s.icon} {stats[s.key]||0}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Filtro de tipo */}
      <div className="flex gap-2 flex-wrap">
        {['todas','pendiente','aprobada','rechazada'].map(f=>(
          <button key={f} onClick={()=>setFiltro(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${filtro===f?'bg-indigo-600 text-white':'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
            {f==='todas'?'Todas':f}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-slate-400 text-sm animate-pulse py-8 text-center">Cargando solicitudes...</div>
      ) : solicitudes.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-10 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3"/>
          <p className="text-slate-500 text-sm">No hay solicitudes {filtro !== 'todas' ? filtro+'s' : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {solicitudes.map(s=>{
            const emp = s.empleados
            const dias = s.fecha_fin && s.fecha_inicio ? Math.max(1,Math.ceil((new Date(s.fecha_fin)-new Date(s.fecha_inicio))/86400000)+1) : 1
            const isPending = s.estado==='pendiente'
            return (
              <div key={s.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="flex items-center gap-4 px-5 py-4 flex-wrap gap-y-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                    style={{background: emp?.avatar_color || '#6366f1'}}>
                    {emp?.nombre?.charAt(0)||'?'}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-[180px]">
                    <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{emp?.nombre}</p>
                    <p className="text-xs text-slate-400">{emp?.puesto} · {emp?.departamento}</p>
                  </div>
                  {/* Tipo y fechas */}
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{TIPO_LABEL[s.tipo]||s.tipo}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(s.fecha_inicio).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'})}
                      {s.fecha_fin && s.fecha_fin!==s.fecha_inicio ? ' → '+new Date(s.fecha_fin).toLocaleDateString('es-ES',{day:'numeric',month:'short'}) : ''}
                      {' · '}<span className="font-medium">{dias} día{dias!==1?'s':''}</span>
                    </p>
                    {s.comentario && <p className="text-xs text-slate-400 italic mt-0.5 truncate max-w-xs">"{s.comentario}"</p>}
                  </div>
                  {/* Estado */}
                  <span className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold ${s.estado==='aprobada'?'bg-emerald-100 text-emerald-700':s.estado==='pendiente'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}`}>
                    {s.estado}
                  </span>
                  {/* Acciones rápidas si pendiente */}
                  {isPending && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={()=>aprobar(s.id)}
                        disabled={saving===s.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                        <CheckCircle2 className="w-3.5 h-3.5"/> {saving===s.id?'...':'Aprobar'}
                      </button>
                      <button onClick={()=>{setComentModal({id:s.id,accion:'rechazar'});setMotivo('')}}
                        disabled={saving===s.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                        <XCircle className="w-3.5 h-3.5"/> Rechazar
                      </button>
                    </div>
                  )}
                  {/* Motivo rechazo */}
                  {!isPending && s.comentario_admin && (
                    <div className="flex items-center gap-1 text-xs text-slate-400 flex-shrink-0">
                      <MessageSquare className="w-3.5 h-3.5"/>
                      <span className="truncate max-w-[120px]">{s.comentario_admin}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal rechazo con motivo */}
      {comentModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-700 dark:text-slate-200">Motivo del rechazo</h3>
              <button onClick={()=>setComentModal(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <textarea value={motivo} onChange={e=>setMotivo(e.target.value)} rows={3}
              placeholder="Indica el motivo para que el empleado pueda entender la decisión..."
              className="w-full bg-slate-50 dark:bg-slate-700 rounded-xl px-4 py-3 text-sm border border-slate-200 dark:border-slate-600 outline-none focus:border-red-400 resize-none text-slate-700 dark:text-slate-200"/>
            <div className="flex gap-2 mt-4">
              <button onClick={()=>setComentModal(null)} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700">Cancelar</button>
              <button onClick={()=>rechazar(comentModal.id, motivo)} disabled={!motivo.trim()||saving===comentModal.id}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors">
                {saving===comentModal.id?'Rechazando...':'Confirmar rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}