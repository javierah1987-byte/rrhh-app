'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

type SolDoc = { id:string; tipo_documento:string; descripcion:string|null; estado:string; respuesta:string|null; created_at:string }

const TIPOS_DOC = [
  'Certificado de empresa',
  'Certificado de vida laboral',
  'Certificado de retenciones (IRPF)',
  'Nómina duplicada',
  'Contrato de trabajo',
  'Informe de horarios',
  'Carta de recomendación',
  'Otro documento',
]

const ESTADO_STYLE: Record<string,{badge:string;icon:any;color:string}> = {
  pendiente: { badge:'badge-amber', icon:Clock, color:'text-amber-500' },
  en_proceso: { badge:'badge-indigo', icon:AlertCircle, color:'text-indigo-500' },
  completada: { badge:'badge-green', icon:CheckCircle, color:'text-emerald-500' },
  rechazada: { badge:'badge-red', icon:XCircle, color:'text-red-500' },
}

export default function EmpSolicitudDocsPage() {
  const [solicitudes, setSolicitudes] = useState<SolDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [empId, setEmpId] = useState<string|null>(null)
  const [form, setForm] = useState({ tipo_documento: '', descripcion: '' })

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase.from('empleados').select('id').eq('user_id', data.user.id).single()
        .then(({ data: emp }) => {
          if (!emp) return
          setEmpId(emp.id)
          supabase.from('solicitudes_documentos').select('*').eq('empleado_id', emp.id).order('created_at',{ascending:false})
            .then(({ data: s }) => { setSolicitudes(s||[]); setLoading(false) })
        })
    })
  }, [])

  async function crearSolicitud(ev: React.FormEvent) {
    ev.preventDefault()
    if (!empId) return
    setSaving(true)
    const { data } = await supabase.from('solicitudes_documentos')
      .insert({ empleado_id: empId, ...form }).select().single()
    if (data) setSolicitudes(prev => [data as SolDoc, ...prev])
    setForm({ tipo_documento: '', descripcion: '' })
    setShowForm(false)
    setSaving(false)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Solicitar documentos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Pide a RRHH cualquier certificado o documento laboral</p>
        </div>
        <button onClick={()=>setShowForm(!showForm)} className="btn-primary"><Plus className="w-4 h-4"/>Nueva solicitud</button>
      </div>

      {showForm && (
        <div className="card p-6 mb-5">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Solicitar documento</h3>
          <form onSubmit={crearSolicitud} className="space-y-4">
            <div>
              <label className="label">Tipo de documento *</label>
              <select value={form.tipo_documento} onChange={e=>setForm(f=>({...f,tipo_documento:e.target.value}))} className="input" required>
                <option value="">Selecciona el documento…</option>
                {TIPOS_DOC.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Descripción / motivo (opcional)</label>
              <textarea value={form.descripcion} onChange={e=>setForm(f=>({...f,descripcion:e.target.value}))} className="input" rows={3}
                placeholder="Indica para qué necesitas el documento o cualquier detalle…"/>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">{saving?'Enviando…':'Enviar solicitud'}</button>
              <button type="button" onClick={()=>setShowForm(false)} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>
      ) : solicitudes.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3"/>
          <p className="text-slate-500 font-medium">Sin solicitudes todavía</p>
          <p className="text-slate-400 text-sm mt-1">Pulsa "Nueva solicitud" para pedir un certificado o documento</p>
        </div>
      ) : (
        <div className="space-y-3">
          {solicitudes.map(s => {
            const st = ESTADO_STYLE[s.estado] || ESTADO_STYLE.pendiente
            const Icon = st.icon
            return (
              <div key={s.id} className="card p-5">
                <div className="flex items-start gap-4">
                  <Icon className={`w-6 h-6 flex-shrink-0 mt-0.5 ${st.color}`}/>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">{s.tipo_documento}</h3>
                      <span className={`badge ${st.badge} capitalize`}>{s.estado.replace(/_/g,' ')}</span>
                    </div>
                    {s.descripcion && <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{s.descripcion}</p>}
                    {s.respuesta && (
                      <div className="mt-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl px-3 py-2">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-0.5">Respuesta de RRHH:</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{s.respuesta}</p>
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-2">{new Date(s.created_at).toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}