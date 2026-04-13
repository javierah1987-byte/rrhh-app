'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { PenLine, Plus, CheckCircle, X, Loader2, Eye, Send, FileText } from 'lucide-react'

type SF={id:string;estado:string;created_at:string;firmado_at:string|null;firma_imagen:string|null;firma_tipo:string|null;firma_nombre:string|null;mensaje:string|null;documentos:{id:string;nombre:string}|null;empleados:{id:string;nombre:string;avatar_color:string}|null}
type Doc={id:string;nombre:string}
type Emp={id:string;nombre:string;avatar_color:string}

export default function AdminFirmasPage(){
  const [firmas,setFirmas]=useState<SF[]>([])
  const [docs,setDocs]=useState<Doc[]>([])
  const [emps,setEmps]=useState<Emp[]>([])
  const [loading,setLoading]=useState(true)
  const [modal,setModal]=useState(false)
  const [saving,setSaving]=useState(false)
  const [preview,setPreview]=useState<SF|null>(null)
  const [filtro,setFiltro]=useState('todos')
  const [form,setForm]=useState({documento_id:'',empleado_id:'',mensaje:''})

  const cargar=useCallback(async()=>{
    const[{data:fs},{data:ds},{data:es}]=await Promise.all([
      supabase.from('solicitudes_firma').select('*,documentos(id,nombre),empleados(id,nombre,avatar_color)').order('created_at',{ascending:false}),
      supabase.from('documentos').select('id,nombre').order('nombre'),
      supabase.from('empleados').select('id,nombre,avatar_color').in('rol',['empleado','manager']).eq('estado','activo').order('nombre'),
    ])
    setFirmas((fs||[]) as SF[]);setDocs(ds||[]);setEmps(es||[]);setLoading(false)
  },[])
  useEffect(()=>{cargar()},[cargar])

  async function solicitar(){
    if(!form.documento_id||!form.empleado_id)return
    setSaving(true)
    const{data:{user}}=await supabase.auth.getUser()
    const{data:emp}=await supabase.from('empleados').select('id').eq('user_id',user!.id).single()
    await supabase.from('solicitudes_firma').insert({documento_id:form.documento_id,empleado_id:form.empleado_id,solicitante_id:(emp as any)?.id||null,mensaje:form.mensaje.trim()||null})
    setSaving(false);setModal(false);setForm({documento_id:'',empleado_id:'',mensaje:''});await cargar()
  }

  const filtradas=firmas.filter(f=>filtro==='todos'||f.estado===filtro)
  const stats={pendientes:firmas.filter(f=>f.estado==='pendiente').length,firmadas:firmas.filter(f=>f.estado==='firmado').length}

  return(
    <div>
      <div className="page-header mb-5">
        <div><h1 className="page-title flex items-center gap-2"><PenLine className="w-5 h-5 text-indigo-500"/>Firmas electrónicas</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{stats.pendientes} pendientes · {stats.firmadas} completadas</p></div>
        <button onClick={()=>setModal(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4"/>Solicitar firma</button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {[{l:'Pendientes',v:stats.pendientes,c:'text-amber-600',b:'bg-amber-50 dark:bg-amber-900/20'},{l:'Firmadas',v:stats.firmadas,c:'text-emerald-600',b:'bg-emerald-50 dark:bg-emerald-900/20'},{l:'Total',v:firmas.length,c:'text-indigo-600',b:'bg-indigo-50 dark:bg-indigo-900/20'}].map(s=>(
          <div key={s.l} className={`card p-4 text-center ${s.b}`}><p className={`text-2xl font-black ${s.c}`}>{s.v}</p><p className="text-xs text-slate-500 mt-0.5">{s.l}</p></div>
        ))}
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {['todos','pendiente','firmado'].map(e=>(
          <button key={e} onClick={()=>setFiltro(e)} className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${filtro===e?'bg-indigo-600 text-white':'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
            {e==='todos'?'Todas':e.charAt(0).toUpperCase()+e.slice(1)}
          </button>
        ))}
      </div>

      {loading?<div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>
      :<div className="card overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {filtradas.map(f=>{
            const doc=(f as any).documentos,emp=(f as any).empleados
            return(
              <div key={f.id} className="flex items-center gap-3 p-4">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{backgroundColor:emp?.avatar_color||'#6366f1'}}>
                  {emp?.nombre?.charAt(0)||'?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{emp?.nombre||'Empleado'} · <span className="font-normal text-slate-500">{doc?.nombre||'Documento'}</span></p>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(f.created_at).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'})}{f.firmado_at?' · Firmado: '+new Date(f.firmado_at).toLocaleDateString('es-ES',{day:'numeric',month:'short'}):''}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`badge text-xs ${f.estado==='firmado'?'badge-green':f.estado==='pendiente'?'badge-amber':'badge-red'}`}>{f.estado}</span>
                  {f.estado==='firmado'&&f.firma_imagen&&<button onClick={()=>setPreview(f)} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600"><Eye className="w-3.5 h-3.5"/></button>}
                </div>
              </div>
            )
          })}
          {filtradas.length===0&&<div className="p-12 text-center"><PenLine className="w-10 h-10 text-slate-300 mx-auto mb-3"/><p className="text-slate-500">Sin resultados</p></div>}
        </div>
      </div>}

      {modal&&(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5"><h3 className="font-bold text-slate-900 dark:text-slate-100">Solicitar firma</h3><button onClick={()=>setModal(false)}><X className="w-4 h-4 text-slate-400"/></button></div>
            <div className="space-y-4">
              <div><label className="label">Documento *</label><select value={form.documento_id} onChange={e=>setForm(f=>({...f,documento_id:e.target.value}))} className="input mt-1 w-full"><option value="">Seleccionar documento…</option>{docs.map(d=><option key={d.id} value={d.id}>{d.nombre}</option>)}</select></div>
              <div><label className="label">Empleado *</label><select value={form.empleado_id} onChange={e=>setForm(f=>({...f,empleado_id:e.target.value}))} className="input mt-1 w-full"><option value="">Seleccionar empleado…</option>{emps.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}</select></div>
              <div><label className="label">Mensaje <span className="text-slate-400 font-normal">(opcional)</span></label><textarea value={form.mensaje} onChange={e=>setForm(f=>({...f,mensaje:e.target.value}))} placeholder="Instrucciones para el empleado…" rows={3} className="input mt-1 w-full resize-none"/></div>
              <div className="flex gap-3">
                <button onClick={()=>setModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button onClick={solicitar} disabled={saving||!form.documento_id||!form.empleado_id} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving?<><Loader2 className="w-4 h-4 animate-spin"/>Enviando…</>:<><Send className="w-4 h-4"/>Solicitar</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {preview&&(
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={()=>setPreview(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-slate-900 dark:text-slate-100">Firma de {(preview as any).empleados?.nombre}</h3><button onClick={()=>setPreview(null)}><X className="w-4 h-4 text-slate-400"/></button></div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200"><img src={preview.firma_imagen!} alt="Firma" className="w-full h-auto"/></div>
            <div className="mt-3 space-y-1 text-xs text-slate-500">
              <p>Tipo: <span className="font-medium capitalize">{preview.firma_tipo}</span></p>
              {preview.firma_nombre&&<p>Nombre: <span className="font-medium">{preview.firma_nombre}</span></p>}
              <p>Fecha: <span className="font-medium">{new Date(preview.firmado_at!).toLocaleString('es-ES')}</span></p>
            </div>
            <div className="mt-3 p-2 bg-emerald-50 rounded-lg"><p className="text-xs text-emerald-700 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 flex-shrink-0"/>Firma electrónica válida · eIDAS (UE) 910/2014</p></div>
          </div>
        </div>
      )}
    </div>
  )
}