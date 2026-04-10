'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Solicitud, TipoSolicitud } from '@/lib/supabase'
import { BADGE_ESTADO_SOLICITUD, TIPOS_SOLICITUD, diasEntre, formatFecha } from '@/lib/utils'
import { Plus, X, Trash2, AlertCircle } from 'lucide-react'

const TIPOS = Object.entries(TIPOS_SOLICITUD) as [TipoSolicitud, string][]

export default function SolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState({ tipo: 'vacaciones' as TipoSolicitud, fecha_inicio: '', fecha_fin: '', comentario: '' })
  const [saving, setSaving]     = useState(false)
  const [empId, setEmpId]       = useState('')
  const [cancelando, setCancelando] = useState<string|null>(null)
  const [confirmCancel, setConfirmCancel] = useState<string|null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: emp } = await supabase.from('empleados').select('id').eq('user_id', user.id).single()
    if (!emp) return
    setEmpId(emp.id)
    const { data: sols } = await supabase.from('solicitudes').select('*').eq('empleado_id', emp.id).order('created_at', { ascending: false })
    setSolicitudes(sols || [])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  async function crear() {
    if (!form.fecha_inicio || !form.fecha_fin) return
    setSaving(true)
    await supabase.from('solicitudes').insert({ ...form, empleado_id: empId, estado: 'pendiente' })
    setSaving(false); setModal(false)
    setForm({ tipo: 'vacaciones', fecha_inicio: '', fecha_fin: '', comentario: '' })
    cargar()
  }

  async function cancelar(id: string) {
    setCancelando(id)
    await supabase.from('solicitudes').delete().eq('id', id).eq('estado', 'pendiente')
    setConfirmCancel(null)
    setCancelando(null)
    setSolicitudes(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div className="p-4 pb-24 lg:pb-4">
      <div className="flex items-center justify-between pt-4 mb-5">
        <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Solicitudes</h1>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-1.5 py-2">
          <Plus className="w-4 h-4"/>Nueva
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({length:3}).map((_,i)=><div key={i} className="skeleton h-20 rounded-xl"/>)}</div>
      ) : solicitudes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">Sin solicitudes</p>
          <p className="text-sm mt-1">Crea tu primera solicitud con el botón superior</p>
        </div>
      ) : (
        <div className="space-y-3">
          {solicitudes.map(sol => (
            <div key={sol.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900 dark:text-slate-100 text-sm">{TIPOS_SOLICITUD[sol.tipo] || sol.tipo}</p>
                    <span className={`badge ${BADGE_ESTADO_SOLICITUD[sol.estado]}`}>
                      {sol.estado.charAt(0).toUpperCase() + sol.estado.slice(1)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    {formatFecha(sol.fecha_inicio)} → {formatFecha(sol.fecha_fin)}
                    {sol.tipo !== 'horas_extra' && <span className="ml-2 text-gray-400">({diasEntre(sol.fecha_inicio, sol.fecha_fin)} días)</span>}
                    {sol.tipo === 'horas_extra' && (sol as any).horas_solicitadas && <span className="ml-2 text-orange-500 font-medium">{(sol as any).horas_solicitadas}h extra</span>}
                  </p>
                  {sol.comentario && <p className="text-xs text-gray-400 mt-1 italic">"{sol.comentario}"</p>}
                </div>
                {sol.estado === 'pendiente' && (
                  <button
                    onClick={() => setConfirmCancel(sol.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
                    title="Cancelar solicitud">
                    <Trash2 className="w-4 h-4"/>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal nueva solicitud */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-t-2xl w-full max-w-[420px] p-5 pb-8">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900 dark:text-slate-100">Nueva solicitud</h3>
              <button onClick={() => setModal(false)}><X className="w-5 h-5 text-gray-400"/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Tipo de solicitud</label>
                <select value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value as TipoSolicitud}))} className="input">
                  {TIPOS.map(([v,l])=><option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Desde</label>
                  <input type="date" value={form.fecha_inicio} onChange={e=>setForm(f=>({...f,fecha_inicio:e.target.value}))} className="input"/>
                </div>
                <div>
                  <label className="label">Hasta</label>
                  <input type="date" value={form.fecha_fin} min={form.fecha_inicio} onChange={e=>setForm(f=>({...f,fecha_fin:e.target.value}))} className="input"/>
                </div>
              </div>
              <div>
                <label className="label">Comentario (opcional)</label>
                <textarea value={form.comentario} onChange={e=>setForm(f=>({...f,comentario:e.target.value}))} className="input h-20 resize-none" placeholder="Motivo o nota adicional..."/>
              </div>
              <button onClick={crear} disabled={saving||!form.fecha_inicio||!form.fecha_fin} className="btn-primary w-full py-3">
                {saving?'Enviando…':'Enviar solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmación cancelar */}
      {confirmCancel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-500"/>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">Cancelar solicitud</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={()=>setConfirmCancel(null)} className="btn-secondary flex-1">Volver</button>
              <button onClick={()=>cancelar(confirmCancel)} disabled={cancelando===confirmCancel}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50">
                {cancelando===confirmCancel?'Cancelando…':'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}