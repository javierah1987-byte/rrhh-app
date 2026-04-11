'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Clock, CheckCircle, XCircle, AlertCircle, Calendar } from 'lucide-react'

type Correccion={id:string;fecha:string;tipo_error:string;descripcion:string;hora_correcta:string|null;tipo_fichaje:string|null;estado:'pendiente'|'aprobada'|'rechazada';respuesta_admin:string|null;empleados:{nombre:string;avatar_color:string;departamento:string|null};empleado_id?:string}

const TIPO_ERROR_LABEL:Record<string,string>={falta_entrada:'Falta entrada',falta_salida:'Falta salida',hora_incorrecta:'Hora incorrecta',pausa_incorrecta:'Pausa incorrecta',otro:'Otro'}
const TIPO_FICHAJE_LABEL:Record<string,string>={entrada:'Entrada',pausa_inicio:'Inicio pausa',pausa_fin:'Fin pausa',salida:'Salida'}

export default function AdminCorreccionesPage(){
  const [items,setItems]=useState<Correccion[]>([])
  const [loading,setLoading]=useState(true)
  const [filtro,setFiltro]=useState('pendiente')
  const [procesando,setProcesando]=useState<string|null>(null)
  const [respuestas,setRespuestas]=useState<Record<string,string>>({})

  const cargar=useCallback(async()=>{
    const{data}=await supabase.from('correcciones_fichaje').select('*,empleados(nombre,avatar_color,departamento)').order('created_at',{ascending:false})
    setItems((data as Correccion[])||[]); setLoading(false)
  },[])
  useEffect(()=>{cargar()},[cargar])

  async function gestionar(id:string,estado:'aprobada'|'rechazada'){
    setProcesando(id)
    const resp=respuestas[id]||''
    const c=items.find(x=>x.id===id)
    await supabase.from('correcciones_fichaje').update({estado,respuesta_admin:resp||null,updated_at:new Date().toISOString()}).eq('id',id)
    if(estado==='aprobada'&&c?.tipo_fichaje&&c?.hora_correcta){
      const ts=new Date(`${c.fecha}T${c.hora_correcta}:00`)
      const{data:cd}=await supabase.from('correcciones_fichaje').select('empleado_id').eq('id',id).single()
      if(cd)(await supabase.from('fichajes').insert({empleado_id:(cd as any).empleado_id,tipo:c.tipo_fichaje,timestamp:ts.toISOString(),fecha:c.fecha}))
    }
    const{data:cd}=await supabase.from('correcciones_fichaje').select('empleado_id').eq('id',id).single()
    if(cd)await supabase.from('notificaciones').insert({empleado_id:(cd as any).empleado_id,titulo:'Corrección de fichaje '+estado,mensaje:estado==='aprobada'?'Tu corrección de fichaje ha sido aplicada.':'Tu solicitud fue rechazada.'+( resp?' '+resp:''),tipo:estado==='aprobada'?'exito':'advertencia',enlace:'/empleado/fichaje'})
    setItems(p=>p.map(x=>x.id===id?{...x,estado,respuesta_admin:resp||null}:x))
    setRespuestas(p=>{const n={...p};delete n[id];return n}); setProcesando(null)
  }

  const filtradas=items.filter(c=>filtro==='todas'||c.estado===filtro)
  const counts={pendiente:items.filter(c=>c.estado==='pendiente').length,aprobada:items.filter(c=>c.estado==='aprobada').length,rechazada:items.filter(c=>c.estado==='rechazada').length}

  return(
    <div>
      <div className="page-header mb-5"><div><h1 className="page-title">Correcciones fichaje</h1><p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Solicitudes de corrección del equipo</p></div></div>
      <div className="flex flex-wrap gap-2 mb-5">
        {[{k:'pendiente',l:'Pendientes',c:counts.pendiente,a:'bg-amber-500 text-white',i:'bg-amber-50 text-amber-700'},{k:'aprobada',l:'Aprobadas',c:counts.aprobada,a:'bg-emerald-500 text-white',i:'bg-emerald-50 text-emerald-700'},{k:'rechazada',l:'Rechazadas',c:counts.rechazada,a:'bg-red-500 text-white',i:'bg-red-50 text-red-700'},{k:'todas',l:'Todas',c:items.length,a:'bg-indigo-600 text-white',i:'bg-slate-100 text-slate-700'}].map(f=>(
          <button key={f.k} onClick={()=>setFiltro(f.k)} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-colors ${filtro===f.k?f.a:f.i+' dark:bg-opacity-20'}`}>
            {f.l}<span className={`text-xs px-1.5 py-0.5 rounded-full ${filtro===f.k?'bg-white/20':'bg-white/60 dark:bg-slate-600'}`}>{f.c}</span>
          </button>
        ))}
      </div>
      {loading?<div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>
      :filtradas.length===0?<div className="card p-12 text-center"><Clock className="w-10 h-10 text-slate-300 mx-auto mb-3"/><p className="text-slate-500">Sin correcciones</p></div>
      :<div className="space-y-3">{filtradas.map(c=>{const emp=c.empleados as any;return(
        <div key={c.id} className={`card p-5 ${c.estado==='pendiente'?'ring-1 ring-amber-200 dark:ring-amber-800':''}`}>
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{backgroundColor:emp?.avatar_color||'#6366f1'}}>{emp?.nombre?.split(' ').map((n:string)=>n[0]).join('').substring(0,2)}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{emp?.nombre}</span>
                  {emp?.departamento&&<span className="text-xs text-slate-400">{emp.departamento}</span>}
                  <span className={`badge text-xs capitalize ${c.estado==='pendiente'?'badge-amber':c.estado==='aprobada'?'badge-green':'badge-red'}`}>{c.estado}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-wrap">
                  <Calendar className="w-3 h-3"/><span>{new Date(c.fecha+'T12:00:00').toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">· {TIPO_ERROR_LABEL[c.tipo_error]}</span>
                  {c.tipo_fichaje&&<span>· {TIPO_FICHAJE_LABEL[c.tipo_fichaje]}</span>}
                  {c.hora_correcta&&<span>a las {c.hora_correcta.substring(0,5)}</span>}
                </div>
                <p className="text-xs text-slate-400 mt-1 italic">"{c.descripcion}"</p>
                {c.respuesta_admin&&c.estado!=='pendiente'&&<p className="text-xs mt-1 text-slate-500">Respuesta: {c.respuesta_admin}</p>}
              </div>
            </div>
            {c.estado==='pendiente'&&(
              <div className="flex flex-col gap-2 flex-shrink-0 min-w-[200px]">
                <input type="text" placeholder="Comentario (opcional)" value={respuestas[c.id]||''} onChange={e=>setRespuestas(p=>({...p,[c.id]:e.target.value}))} className="input text-xs py-1.5"/>
                <div className="flex gap-2">
                  <button onClick={()=>gestionar(c.id,'rechazada')} disabled={procesando===c.id} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 font-semibold text-sm disabled:opacity-50"><XCircle className="w-3.5 h-3.5"/>Rechazar</button>
                  <button onClick={()=>gestionar(c.id,'aprobada')} disabled={procesando===c.id} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 font-semibold text-sm disabled:opacity-50"><CheckCircle className="w-3.5 h-3.5"/>Aprobar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}}</div>}
    </div>
  )
}