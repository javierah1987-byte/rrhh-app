'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Solicitud, TipoSolicitud } from '@/lib/supabase'
import { BADGE_ESTADO_SOLICITUD, TIPOS_SOLICITUD, diasEntre, formatFecha } from '@/lib/utils'
import { Plus, X } from 'lucide-react'

const TIPOS = Object.entries(TIPOS_SOLICITUD) as [TipoSolicitud, string][]

export default function SolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ tipo: 'vacaciones' as TipoSolicitud, fecha_inicio: '', fecha_fin: '', comentario: '' })
  const [saving, setSaving] = useState(false)
  const [empId, setEmpId] = useState('')

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
    setSaving(false)
    setModal(false)
    setForm({ tipo: 'vacaciones', fecha_inicio: '', fecha_fin: '', comentario: '' })
    cargar()
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between pt-4 mb-5">
        <h1 className="text-xl font-bold text-gray-900">Solicitudes</h1>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-1.5 py-2">
          <Plus className="w-4 h-4" />Nueva
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
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
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{TIPOS_SOLICITUD[sol.tipo]}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatFecha(sol.fecha_inicio)} → {formatFecha(sol.fecha_fin)}
                    <span className="ml-2 text-gray-400">({diasEntre(sol.fecha_inicio, sol.fecha_fin)} días)</span>
                  </p>
                  {sol.comentario && <p className="text-xs text-gray-400 mt-1 italic">"{sol.comentario}"</p>}
                </div>
                <span className={`badge ${BADGE_ESTADO_SOLICITUD[sol.estado]}`}>
                  {sol.estado.charAt(0).toUpperCase() + sol.estado.slice(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-2xl w-full max-w-[420px] p-5 pb-8">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">Nueva solicitud</h3>
              <button onClick={() => setModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Tipo de solicitud</label>
                <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as TipoSolicitud }))} className="input">
                  {TIPOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Desde</label>
                  <input type="date" value={form.fecha_inicio} onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="label">Hasta</label>
                  <input type="date" value={form.fecha_fin} min={form.fecha_inicio} onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))} className="input" />
                </div>
              </div>
              <div>
                <label className="label">Comentario (opcional)</label>
                <textarea value={form.comentario} onChange={e => setForm(f => ({ ...f, comentario: e.target.value }))} className="input h-20 resize-none" placeholder="Motivo o nota adicional..." />
              </div>
              <button onClick={crear} disabled={saving || !form.fecha_inicio || !form.fecha_fin} className="btn-primary w-full py-3">
                {saving ? 'Enviando…' : 'Enviar solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}