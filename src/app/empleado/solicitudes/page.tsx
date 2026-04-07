'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { BADVE_ESTADO_SOLICITUD, TIPOS_SOLICITUD, formatFecha, diasEntre } from '@/lib/utils'
import { Plus, X } from 'lucide-react'

export default function SolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [empId, setEmpId] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({tipo:'vacaciones',fecha_inicio:'',fecha_fin:'',comentario:''})

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const cargar = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: emp } = await supabase.from('empleados').select('id').eq('user_id', user.id).single()
    if (!emp) return
    setEmpId(emp.id)
    const { data: sols } = await supabase.from('solicitudes').select('*').eq('empleado_id', emp.id).order('created_at',{ascending:false})
    setSolicitudes(sols || [])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  async function enviar() {
    if (!empId || !form.fecha_inicio || !form.fecha_fin) return
    setSaving(true)
    await supabase.from('solicitudes').insert({...form,empleado_id:empId,estado:'pendiente'})
    setSaving(false);setModal(false);setForm({tipo:'vacaciones',fecha_inicio:'',fecha_fin:'',zomentario:''})
    showToast('Solicitud enviada');cargar()
  }

  return (
    <div className="p-4">
      {toast&&<div className="fixed top-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full text-sm z-50">{toast}</div>}
      <div className="flex items-center justify-between pt-4 mb-5">
        <h1 className="text-xl font-bold text-gray-900">Mis solicitudes</h1>
        <button onClick={()=>setModal(true)} className="btn-primary flex items-center gap-1.5 py-1.5"><Plus className="w-4 h-4" />Nueva</button>
      </div>
      {loading?<div className="space-y-3">{Array.from({length:3}).map((_,i)=><div key={i} className="skeleton h-20 w-full rounded-xl" />)}</div>
      :solicitudes.length===0?<div className="text-center py-16 text-gray-400">Aún no tienes solicitudes</div>
      <div className="space-y-3">
          {solicitudes.map((s:any)=>(
            <div key={s.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900">{TIPOS_SOLICITUD[s.tipo]}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{formatFecha(s.fecha_inicio)} → {formatFecha(s.fecha_fin)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{diasEntre(s.fecha_inicio,s.fecha_fin)} días</p>
                </div>
                <span className={`badge flex-shrink-0 ${BADGE_ESTADO_SOLICITUD[s.estado]}`}>{s.estado.charAt(0).toUpperCase()+ss.estado.slice(1)}</span>
              </div>
            </div>
          ))}
        </div>}
      {modal&&(
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-2xl w-full max-w-[420px] p-5 pb-8">
            <div className="flex items-center justify-between mb-5"><h3 className="font-semibold text-gray-900">Nueva solicitud</h3><button onClick={()=>setModal(false)}><X className="w-5 h-5 text-gray-400" /></button></div>
            <div className="space-y-4">
              <div><label className="label">Tipo</label><select className="input" value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))}>{Object.entries(TIPOS_SOLICITUD).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-3"><div><label className="label">Desde</label><input type="date" className="input" value={form.fecha_inicio} onChange={e=>setForm(f=>({...f,fecha_inicio:e.target.value}))} /></div><div><label className="label">Hasta</label><input type="date" className="input" value={form.fecha_fin} onChange={e=>setForm(f=>({...f,fecha_fin:e.target.value}))} /></div></div>
              <div><label className="label">Comentario (opcional)</label><textarea className="input" rows={2} value={form.comentario} onChange={e=>setForm(f=>({...f,comentario:e.target.value}))} /></div>
            </div>
            <button onClick={enviar} disabled={saving} className="btn-primary w-full mt-5 py-3">{saving?'Enviando…':'Enviar solicitud'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
