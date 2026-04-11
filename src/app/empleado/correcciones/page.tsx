'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Breadcrumb } from '@/components/Breadcrumb'
import { AlertCircle, Plus, Clock, CheckCircle, XCircle, Loader2, X } from 'lucide-react'

type Correccion = { id:string; fecha:string; tipo_error:string; descripcion:string; hora_correcta:string|null; tipo_fichaje:string|null; estado:'pendiente'|'aprobada'|'rechazada'; respuesta_admin:string|null; created_at:string }

const TIPO_ERROR_LABEL:Record<string,string>={falta_entrada:'Falta fichaje de entrada',falta_salida:'Falta fichaje de salida',hora_incorrecta:'Hora incorrecta',pausa_incorrecta:'Pausa incorrecta',otro:'Otro problema'}
const TIPO_FICHAJE_LABEL:Record<string,string>={entrada:'Entrada',pausa_inicio:'Inicio pausa',pausa_fin:'Fin pausa',salida:'Salida'}
const ESTADO_STYLE:Record<string,string>={pendiente:'badge-amber',aprobada:'badge-green',rechazada:'badge-red'}

export default function CorreccionesPage(){
  const [correcciones,setCorrecciones]=useState<Correccion[]>([])
  const [loading,setLoading]=useState(true)
  const [empId,setEmpId]=useState('')
  const [modal,setModal]=useState(false)
  const [saving,setSaving]=useState(false)
  const [form,setForm]=useState({fecha:new Date().toISOString().slice(0,10),tipo_error:'falta_salida',descripcion:'',hora_correcta:'',tipo_fichaje:'salida'})

  const cargar=useCallback(async()=>{
    const{data:{user}}=await supabase.auth.getUser(); if(!user)return
    const{data:emp}=await supabase.from('empleados').select('id').eq('user_id',user.id).single(); if(!emp)return
    setEmpId(emp.id)
    const{data}=await supabase.from('correcciones_fichaje').select('*').eq('empleado_id',emp.id).order('created_at',{ascending:false})
    setCorrecciones(data||[]); setLoading(false)
  },[])

  useEffect(()=>{cargar()},[cargar])

  async function enviar(){
    if(!empId||!form.descripcion.trim())return; setSaving(true)
    await supabase.from('correcciones_fichaje').insert({empleado_id:empId,fecha:form.fecha,tipo_error:form.tipo_error,descripcion:form.descripcion.trim(),hora_correcta:form.hora_correcta||null,tipo_fichaje:form.tipo_fichaje||null,estado:'pendiente'})
    const{data:admin}=await supabase.from('empleados').select('id').eq('rol','admin').limit(1).maybeSingle()
    if(admin)await supabase.from('notificaciones').insert({empleado_id:admin.id,titulo:'Corrección de fichaje solicitada',mensaje:TIPO_ERROR_LABEL[form.tipo_error]+' el '+new Date(form.fecha+'T12:00:00').toLocaleDateString('es-ES'),tipo:'advertencia',enlace:'/admin/correcciones'})
    setSaving(false); setModal(false)
    setForm({fecha:new Date().toISOString().slice(0,10),tipo_error:'falta_salida',descripcion:'',hora_correcta:'',tipo_fichaje:'salida'})
    cargar()
  }

  return(
    <div className="p-4 pb-24 lg:pb-4">
      <Breadcrumb/>
      <div className="flex items-center justify-between pt-2 mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Correcciones fichaje</h1>
          <p className="text-xs text-slate-400 mt-0.5">¿Faltó un fichaje o la hora es incorrecta? Solicita la corrección.</p>
        </div>
        <button onClick={()=>setModal(true)} className="btn-primary flex items-center gap-1.5 py-2"><Plus className="w-4 h-4"/>Solicitar</button>
      </div>

      {loading?<div className="space-y-3">{[1,2].map(i=><div key={i} className="skeleton h-20 rounded-xl"/>)}</div>
      :correcciones.length===0?(
        <div className="card p-12 text-center"><Clock className="w-10 h-10 text-slate-300 mx-auto mb-3"/><p className="text-slate-500 font-medium">Sin correcciones pendientes</p></div>
      ):(
        <div className="space-y-3">
          {correcciones.map(c=>(
            <div key={c.id} className={`card p-4 ${c.estado==='pendiente'?'ring-1 ring-amber-200 dark:ring-amber-800':''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{TIPO_ERROR_LABEL[c.tipo_error]}</p>
                    <span className={`badge ${ESTADO_STYLE[c.estado]} text-xs capitalize`}>{c.estado}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{new Date(c.fecha+'T12:00:00').toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})}{c.tipo_fichaje?' · '+TIPO_FICHAJE_LABEL[c.tipo_fichaje]:''}{c.hora_correcta?' a las '+c.hora_correcta.substring(0,5):''}</p>
                  <p className="text-xs text-slate-400 mt-1 italic">"{c.descripcion}"</p>
                  {c.respuesta_admin&&<div className={`mt-2 p-2 rounded-lg text-xs ${c.estado==='aprobada'?'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700':'bg-red-50 dark:bg-red-900/20 text-red-700'}`}><span className="font-semibold">Admin: </span>{c.respuesta_admin}</div>}
                </div>
                <div className="flex-shrink-0">{c.estado==='aprobada'?<CheckCircle className="w-5 h-5 text-emerald-500"/>:c.estado==='rechazada'?<XCircle className="w-5 h-5 text-red-500"/>:<AlertCircle className="w-5 h-5 text-amber-500"/>}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal&&(
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-t-2xl w-full max-w-[460px] p-5 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Solicitar corrección</h3>
              <button onClick={()=>setModal(false)}><X className="w-4 h-4 text-slate-400"/></button>
            </div>
            <div className="space-y-4">
              <div><label className="label">Fecha</label><input type="date" value={form.fecha} max={new Date().toISOString().slice(0,10)} onChange={e=>setForm(f=>({...f,fecha:e.target.value}))} className="input"/></div>
              <div><label className="label">Tipo de problema</label><select value={form.tipo_error} onChange={e=>setForm(f=>({...f,tipo_error:e.target.value}))} className="input">{Object.entries(TIPO_ERROR_LABEL).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
              {(form.tipo_error==='hora_incorrecta'||form.tipo_error==='falta_entrada'||form.tipo_error==='falta_salida')&&(
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Tipo fichaje</label><select value={form.tipo_fichaje} onChange={e=>setForm(f=>({...f,tipo_fichaje:e.target.value}))} className="input">{Object.entries(TIPO_FICHAJE_LABEL).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
                  <div><label className="label">Hora correcta</label><input type="time" value={form.hora_correcta} onChange={e=>setForm(f=>({...f,hora_correcta:e.target.value}))} className="input"/></div>
                </div>
              )}
              <div><label className="label">Descripción</label><textarea value={form.descripcion} onChange={e=>setForm(f=>({...f,descripcion:e.target.value}))} placeholder="Ej: Se me olvidó fichar la salida, salí a las 18:00" rows={3} className="input w-full resize-none"/></div>
              <button onClick={enviar} disabled={saving||!form.descripcion.trim()} className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50">
                {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<AlertCircle className="w-4 h-4"/>}{saving?'Enviando…':'Enviar solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}