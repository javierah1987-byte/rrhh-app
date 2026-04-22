// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Calendar, Plus, X, CheckCircle, Clock, XCircle, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

const TIPOS = ['vacaciones','permiso','teletrabajo','baja_medica','asuntos_propios','otro']
const TIPO_LABEL = {vacaciones:'🌴 Vacaciones',permiso:'📋 Permiso',teletrabajo:'🏠 Teletrabajo',baja_medica:'🏥 Baja médica',asuntos_propios:'🗓️ Asuntos propios',otro:'📌 Otro'}

export default function SolicitudesEmpleadoPage() {
  const [empId, setEmpId]         = useState(null)
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [tipo, setTipo]           = useState('vacaciones')
  const [inicio, setInicio]       = useState('')
  const [fin, setFin]             = useState('')
  const [comentario, setComentario] = useState('')
  const [sending, setSending]     = useState(false)
  const router = useRouter()

  const cargar = async () => {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: emp } = await supabase.from('empleados').select('id').eq('user_id', user.id).single()
    if (!emp) { setLoading(false); return }
    setEmpId(emp.id)
    const { data } = await supabase.from('solicitudes').select('*').eq('empleado_id', emp.id).order('created_at',{ascending:false})
    setSolicitudes(data || [])
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  const enviar = async () => {
    if (!inicio || !empId) return
    setSending(true)
    await supabase.from('solicitudes').insert({ empleado_id:empId, tipo, fecha_inicio:inicio, fecha_fin:fin||inicio, comentario, estado:'pendiente' })
    setShowForm(false); setTipo('vacaciones'); setInicio(''); setFin(''); setComentario('')
    setSending(false); await cargar()
  }

  const dias = inicio && fin ? Math.max(1, Math.ceil((new Date(fin)-new Date(inicio))/86400000)+1) : inicio ? 1 : 0

  if (loading) return <div className="p-8 text-slate-400 animate-pulse text-sm">Cargando...</div>

  const pendientes = solicitudes.filter(s=>s.estado==='pendiente').length
  const aprobadas  = solicitudes.filter(s=>s.estado==='aprobada').length

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-4">
      <button onClick={()=>router.back()} className="flex items-center gap-2 text-slate-400 hover:text-slate-700 text-sm">
        <ArrowLeft className="w-4 h-4"/> Volver
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Mis solicitudes</h1>
          <p className="text-slate-400 text-sm">{pendientes} pendiente{pendientes!==1?'s':''} · {aprobadas} aprobada{aprobadas!==1?'s':''}</p>
        </div>
        <button onClick={()=>setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
          <Plus className="w-4 h-4"/> Nueva
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200">Nueva solicitud</h3>
            <button onClick={()=>setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2">Tipo</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TIPOS.map(t => (
                <button key={t} onClick={()=>setTipo(t)}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${tipo===t?'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300':'border-slate-200 dark:border-slate-600 text-slate-500 hover:border-slate-300'}`}>
                  {TIPO_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Fecha inicio</label>
              <input type="date" value={inicio} onChange={e=>setInicio(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-600 text-sm outline-none focus:border-indigo-500"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Fecha fin</label>
              <input type="date" value={fin} onChange={e=>setFin(e.target.value)} min={inicio}
                className="w-full bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-600 text-sm outline-none focus:border-indigo-500"/>
            </div>
          </div>

          {dias > 0 && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg px-3 py-2 text-sm text-indigo-600 font-medium">
              📅 {dias} día{dias!==1?'s':''} solicitado{dias!==1?'s':''}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Comentario (opcional)</label>
            <textarea value={comentario} onChange={e=>setComentario(e.target.value)} rows={2} placeholder="Motivo o aclaración..."
              className="w-full bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-600 text-sm outline-none focus:border-indigo-500 resize-none"/>
          </div>

          <div className="flex gap-2">
            <button onClick={()=>setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700">Cancelar</button>
            <button onClick={enviar} disabled={!inicio||sending}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors">
              {sending ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="space-y-2">
        {solicitudes.length === 0 && !showForm && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3"/>
            <p className="text-slate-500 text-sm">No tienes solicitudes. ¡Crea una nueva!</p>
          </div>
        )}
        {solicitudes.map(s => {
          const Icon = s.estado==='aprobada'?CheckCircle:s.estado==='pendiente'?Clock:XCircle
          const color = s.estado==='aprobada'?'text-emerald-500':s.estado==='pendiente'?'text-amber-500':'text-red-500'
          const bg    = s.estado==='aprobada'?'bg-emerald-50 dark:bg-emerald-900/10':s.estado==='pendiente'?'bg-amber-50 dark:bg-amber-900/10':'bg-red-50 dark:bg-red-900/10'
          const dias = s.fecha_fin && s.fecha_inicio ? Math.max(1,Math.ceil((new Date(s.fecha_fin)-new Date(s.fecha_inicio))/86400000)+1) : 1
          return (
            <div key={s.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4 px-5 py-3.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`}/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{TIPO_LABEL[s.tipo]||s.tipo}</p>
                <p className="text-xs text-slate-400">
                  {new Date(s.fecha_inicio).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'})}
                  {s.fecha_fin && s.fecha_fin !== s.fecha_inicio ? ' → '+new Date(s.fecha_fin).toLocaleDateString('es-ES',{day:'numeric',month:'short'}) : ''}
                  {' · '}{dias} día{dias!==1?'s':''}
                </p>
                {s.comentario && <p className="text-xs text-slate-400 italic truncate">"{s.comentario}"</p>}
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${s.estado==='aprobada'?'bg-emerald-100 text-emerald-700':s.estado==='pendiente'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}`}>
                {s.estado}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}