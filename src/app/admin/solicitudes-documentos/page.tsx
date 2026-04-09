'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { FileText, Clock, CheckCircle, XCircle, MessageSquare } from 'lucide-react'

type SolDoc = { id:string; empleado_id:string; tipo_documento:string; descripcion:string|null; estado:string; respuesta:string|null; created_at:string; empleados:{nombre:string;avatar_color:string} }

const ESTADOS = ['pendiente','en_proceso','completada','rechazada']
const ESTADO_BADGE: Record<string,string> = { pendiente:'badge-amber', en_proceso:'badge-indigo', completada:'badge-green', rechazada:'badge-red' }

export default function AdminSolDocsPage() {
  const [solicitudes, setSolicitudes] = useState<SolDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('pendiente')
  const [respondiendo, setRespondiendo] = useState<string|null>(null)
  const [respuesta, setRespuesta] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    const { data } = await supabase.from('solicitudes_documentos')
      .select('*,empleados(nombre,avatar_color)').order('created_at',{ascending:false})
    setSolicitudes((data as any[])||[])
    setLoading(false)
  }

  async function actualizarEstado(id:string, estado:string, resp?:string) {
    setSaving(true)
    await supabase.from('solicitudes_documentos').update({ estado, respuesta: resp||null, updated_at: new Date().toISOString() }).eq('id',id)
    setSolicitudes(prev=>prev.map(s=>s.id===id?{...s,estado,respuesta:resp||null}:s))
    setRespondiendo(null); setRespuesta(''); setSaving(false)
  }

  const filtradas = solicitudes.filter(s=>filtro==='todas'||s.estado===filtro)
  const counts: Record<string,number> = {}
  ESTADOS.forEach(e=>{ counts[e]=solicitudes.filter(s=>s.estado===e).length })

  function getNombre(s:SolDoc) { return (s.empleados as any).nombre }
  function getColor(s:SolDoc) { return (s.empleados as any).avatar_color||'#6366f1' }
  function getInitials(s:SolDoc) { return getNombre(s).split(' ').map((n:string)=>n[0]).join('').substring(0,2) }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Solicitudes de documentos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Peticiones de certificados y documentos del equipo</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {[['pendiente','Pendientes'],['en_proceso','En proceso'],['completada','Completadas'],['rechazada','Rechazadas'],['todas','Todas']].map(([k,v])=>(
          <button key={k} onClick={()=>setFiltro(k)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors
              ${filtro===k?'bg-indigo-600 text-white':'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
            {v}
            {k!=='todas' && <span className={`text-xs px-1.5 py-0.5 rounded-full ${filtro===k?'bg-white/20':'bg-white/60 dark:bg-slate-500'}`}>{counts[k]||0}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>
      ) : filtradas.length===0 ? (
        <div className="card p-12 text-center"><FileText className="w-10 h-10 text-slate-300 mx-auto mb-3"/><p className="text-slate-500">Sin solicitudes</p></div>
      ) : (
        <div className="space-y-3">
          {filtradas.map(s=>(
            <div key={s.id} className="card p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{backgroundColor:getColor(s)}}>
                  {getInitials(s)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{getNombre(s)}</span>
                    <span className={`badge ${ESTADO_BADGE[s.estado]}`}>{s.estado.replace(/_/g,' ')}</span>
                    <span className="text-xs text-slate-400">{new Date(s.created_at).toLocaleDateString('es-ES',{day:'numeric',month:'short'})}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{s.tipo_documento}</p>
                  {s.descripcion && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{s.descripcion}</p>}
                  {s.respuesta && <div className="mt-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-3 py-2 text-sm text-emerald-800 dark:text-emerald-300">{s.respuesta}</div>}

                  {respondiendo===s.id ? (
                    <div className="mt-3 space-y-2">
                      <textarea value={respuesta} onChange={e=>setRespuesta(e.target.value)} className="input text-sm" rows={2}
                        placeholder="Escribe tu respuesta o indicaciones…"/>
                      <div className="flex gap-2">
                        <button onClick={()=>actualizarEstado(s.id,'completada',respuesta)} disabled={saving} className="btn-accent text-xs px-3 py-1.5">
                          <CheckCircle className="w-3.5 h-3.5"/>Completar
                        </button>
                        <button onClick={()=>actualizarEstado(s.id,'en_proceso',respuesta)} disabled={saving} className="btn-primary text-xs px-3 py-1.5">En proceso</button>
                        <button onClick={()=>actualizarEstado(s.id,'rechazada',respuesta)} disabled={saving} className="text-xs px-3 py-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-medium">Rechazar</button>
                        <button onClick={()=>{setRespondiendo(null);setRespuesta('')}} className="btn-secondary text-xs px-3 py-1.5">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={()=>{setRespondiendo(s.id);setRespuesta(s.respuesta||'')}}
                      className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-medium">
                      <MessageSquare className="w-3.5 h-3.5"/>Responder / cambiar estado
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}