'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Shield, AlertTriangle, CheckCircle, XCircle, Loader2, Eye } from 'lucide-react'

type Denuncia={id:string;codigo_seguimiento:string;categoria:string;descripcion:string;anonima:boolean;contacto_email:string|null;estado:string;prioridad:string;notas_internas:string|null;created_at:string}

const CATS:Record<string,string>={acoso_laboral:'Acoso laboral',acoso_sexual:'Acoso sexual',discriminacion:'Discriminación',fraude:'Fraude',corrupcion:'Corrupción',seguridad:'Seguridad',privacidad:'Privacidad',otros:'Otros'}
const ESTADOS:Record<string,string>={recibida:'badge-amber',en_investigacion:'bg-blue-100 text-blue-700',resuelta:'badge-green',archivada:'bg-slate-100 text-slate-500',desestimada:'badge-red'}
const PRIORIDADES:Record<string,string>={baja:'bg-slate-100 text-slate-500',normal:'bg-blue-100 text-blue-600',alta:'bg-orange-100 text-orange-600',urgente:'badge-red'}

export default function AdminDenunciasPage(){
  const [denuncias,setDenuncias]=useState<Denuncia[]>([])
  const [loading,setLoading]=useState(true)
  const [sel,setSel]=useState<Denuncia|null>(null)
  const [notas,setNotas]=useState('')
  const [saving,setSaving]=useState(false)
  const [filtroEstado,setFiltroEstado]=useState('todos')

  const cargar=useCallback(async()=>{
    const{data}=await supabase.from('denuncias').select('*').order('created_at',{ascending:false})
    setDenuncias(data||[]);setLoading(false)
  },[])
  useEffect(()=>{cargar()},[cargar])

  async function actualizar(id:string,cambios:any){
    setSaving(true)
    await supabase.from('denuncias').update({...cambios,updated_at:new Date().toISOString()}).eq('id',id)
    setDenuncias(p=>p.map(d=>d.id===id?{...d,...cambios}:d))
    if(sel?.id===id)setSel(prev=>prev?{...prev,...cambios}:prev)
    setSaving(false)
  }

  const filtradas=denuncias.filter(d=>filtroEstado==='todos'||d.estado===filtroEstado)
  const pendientes=denuncias.filter(d=>d.estado==='recibida').length
  const urgentes=denuncias.filter(d=>d.prioridad==='urgente'&&d.estado!=='resuelta'&&d.estado!=='archivada').length

  return(
    <div>
      <div className="page-header mb-5">
        <div>
          <h1 className="page-title flex items-center gap-2"><Shield className="w-5 h-5 text-indigo-500"/>Canal de denuncias</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Gestión confidencial · Ley 2/2023</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {pendientes>0&&<div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-xl text-sm text-amber-700"><AlertTriangle className="w-4 h-4"/><span><strong>{pendientes}</strong> sin revisar</span></div>}
          {urgentes>0&&<div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl text-sm text-red-700"><AlertTriangle className="w-4 h-4"/><span><strong>{urgentes}</strong> urgentes</span></div>}
        </div>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {['todos','recibida','en_investigacion','resuelta'].map(e=>(
          <button key={e} onClick={()=>setFiltroEstado(e)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${filtroEstado===e?'bg-indigo-600 text-white':'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
            {e==='todos'?'Todas':e.replace('_',' ')} {e!=='todos'&&<span className="ml-1 opacity-70">({denuncias.filter(d=>d.estado===e).length})</span>}
          </button>
        ))}
      </div>

      {loading?<div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>
      :<div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filtradas.map(d=>(
          <div key={d.id} onClick={()=>{setSel(d);setNotas(d.notas_internas||'')}}
            className={`card p-4 cursor-pointer hover:shadow-md transition-all ${d.estado==='recibida'?'ring-1 ring-amber-300 dark:ring-amber-600':''}`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`badge text-xs ${ESTADOS[d.estado]||'badge-amber'}`}>{d.estado.replace('_',' ')}</span>
                <span className={`badge text-xs ${PRIORIDADES[d.prioridad]||'badge-amber'}`}>{d.prioridad}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">{d.codigo_seguimiento}</span>
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">{CATS[d.categoria]||d.categoria}</p>
            <p className="text-xs text-slate-500 line-clamp-2">{d.descripcion}</p>
            <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
              <span>{new Date(d.created_at).toLocaleDateString('es-ES',{day:'numeric',month:'short'})}</span>
              <span>·</span>
              <span>{d.anonima?'🕴️ Anónima':'👤 Con contacto'}</span>
            </div>
          </div>
        ))}
        {filtradas.length===0&&<div className="col-span-full card p-12 text-center"><Shield className="w-10 h-10 text-slate-300 mx-auto mb-3"/><p className="text-slate-500">Sin denuncias</p></div>}
      </div>}

      {sel&&(
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={e=>e.target===e.currentTarget&&setSel(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">{CATS[sel.categoria]}</h3>
              <button onClick={()=>setSel(null)}><XCircle className="w-5 h-5 text-slate-400"/></button>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4 mb-4">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Descripción</p>
              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">{sel.descripcion}</p>
            </div>
            {sel.contacto_email&&<div className="mb-4 text-sm text-slate-500">Contacto: <strong className="text-slate-700 dark:text-slate-300">{sel.contacto_email}</strong></div>}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div><label className="label">Estado</label><select value={sel.estado} onChange={e=>actualizar(sel.id,{estado:e.target.value})} className="input mt-1 text-sm">
                {['recibida','en_investigacion','resuelta','archivada','desestimada'].map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}
              </select></div>
              <div><label className="label">Prioridad</label><select value={sel.prioridad} onChange={e=>actualizar(sel.id,{prioridad:e.target.value})} className="input mt-1 text-sm">
                {['baja','normal','alta','urgente'].map(s=><option key={s} value={s}>{s}</option>)}
              </select></div>
            </div>
            <div className="mb-4">
              <label className="label">Notas internas <span className="text-slate-400 font-normal">(no visibles al denunciante)</span></label>
              <textarea value={notas} onChange={e=>setNotas(e.target.value)} rows={3} className="input w-full resize-none mt-1 text-sm" placeholder="Observaciones, seguimiento, acciones tomadas..."/>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>setSel(null)} className="btn-secondary flex-1">Cerrar</button>
              <button onClick={()=>actualizar(sel.id,{notas_internas:notas})} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<CheckCircle className="w-4 h-4"/>}Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}