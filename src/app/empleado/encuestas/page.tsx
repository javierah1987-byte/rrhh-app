'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Breadcrumb } from '@/components/Breadcrumb'
import { Heart, CheckCircle, Loader2 } from 'lucide-react'

type Encuesta={id:string;pregunta:string;tipo:'puntuacion'|'si_no'|'texto';anonima:boolean;ya_respondida?:boolean;mi_respuesta?:string}
const EMOJIS=['😞','😕','😐','🙂','😄']
const LABELS=['Muy mal','Mal','Regular','Bien','Muy bien']

export default function EncuestasPage(){
  const [encuestas,setEncuestas]=useState<Encuesta[]>([])
  const [loading,setLoading]=useState(true)
  const [empId,setEmpId]=useState('')
  const [respuestas,setRespuestas]=useState<Record<string,string>>({})
  const [enviando,setEnviando]=useState<Record<string,boolean>>({})

  const cargar=useCallback(async()=>{
    const{data:{user}}=await supabase.auth.getUser(); if(!user)return
    const{data:emp}=await supabase.from('empleados').select('id').eq('user_id',user.id).single(); if(!emp)return
    setEmpId(emp.id)
    const[{data:encs},{data:resps}]=await Promise.all([
      supabase.from('encuestas').select('*').eq('activa',true).order('created_at',{ascending:false}),
      supabase.from('encuestas_respuestas').select('encuesta_id,respuesta').eq('empleado_id',emp.id)
    ])
    const respondidas=new Set(resps?.map(r=>r.encuesta_id)||[])
    const respMap:Record<string,string>={}; resps?.forEach(r=>{respMap[r.encuesta_id]=r.respuesta})
    setEncuestas((encs||[]).map(e=>({...e,ya_respondida:respondidas.has(e.id),mi_respuesta:respMap[e.id]})))
    setLoading(false)
  },[])

  useEffect(()=>{cargar()},[cargar])

  async function responder(id:string,resp:string){
    if(!empId||!resp.trim())return; setEnviando(p=>({...p,[id]:true}))
    await supabase.from('encuestas_respuestas').upsert({encuesta_id:id,empleado_id:empId,respuesta:resp.trim()},{onConflict:'encuesta_id,empleado_id'})
    setEncuestas(p=>p.map(e=>e.id===id?{...e,ya_respondida:true,mi_respuesta:resp}:e))
    setEnviando(p=>({...p,[id]:false}))
  }

  const pendientes=encuestas.filter(e=>!e.ya_respondida)
  const respondidas=encuestas.filter(e=>e.ya_respondida)

  return(
    <div className="p-4 pb-24 lg:pb-4">
      <Breadcrumb/>
      <div className="pt-2 mb-5">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2"><Heart className="w-5 h-5 text-rose-500"/>Clima laboral</h1>
        <p className="text-xs text-slate-400 mt-0.5">Tu opinión mejora el equipo. Las respuestas son anónimas.</p>
      </div>
      {loading?<div className="space-y-4">{[1,2].map(i=><div key={i} className="skeleton h-32 rounded-xl"/>)}</div>
      :encuestas.length===0?<div className="card p-12 text-center"><Heart className="w-10 h-10 text-slate-300 mx-auto mb-3"/><p className="text-slate-500 font-medium">No hay encuestas activas</p></div>
      :<div className="space-y-4">
        {pendientes.map(e=>(
          <div key={e.id} className="card p-5 ring-1 ring-indigo-200 dark:ring-indigo-800">
            <div className="flex items-start gap-2 mb-4"><span className="text-xl">💬</span><div><p className="font-semibold text-slate-900 dark:text-slate-100">{e.pregunta}</p>{e.anonima&&<p className="text-[10px] text-slate-400 mt-0.5">🔒 Respuesta anónima</p>}</div></div>
            {e.tipo==='puntuacion'&&<div className="space-y-3">
              <div className="flex gap-2 justify-between">
                {EMOJIS.map((emoji,i)=>{const val=String(i+1);const sel=respuestas[e.id]===val;return(
                  <button key={i} onClick={()=>setRespuestas(p=>({...p,[e.id]:sel?'':val}))}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${sel?'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 scale-105':'border-slate-200 dark:border-slate-700'}`}>
                    <span className="text-2xl">{emoji}</span>
                    <span className={`text-[9px] font-medium ${sel?'text-indigo-700 dark:text-indigo-300':'text-slate-400'}`}>{LABELS[i]}</span>
                  </button>
                )})}
              </div>
              <button onClick={()=>respuestas[e.id]&&responder(e.id,respuestas[e.id])} disabled={!respuestas[e.id]||enviando[e.id]} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-40">
                {enviando[e.id]?<Loader2 className="w-4 h-4 animate-spin"/>:<CheckCircle className="w-4 h-4"/>}Enviar respuesta
              </button>
            </div>}
            {e.tipo==='si_no'&&<div className="flex gap-3">
              {['Sí','No'].map(opt=>(
                <button key={opt} onClick={()=>responder(e.id,opt)} disabled={enviando[e.id]}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all disabled:opacity-50 ${opt==='Sí'?'border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-emerald-100':'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'}`}>
                  {opt==='Sí'?'👍 Sí':'👎 No'}
                </button>
              ))}
            </div>}
            {e.tipo==='texto'&&<div className="space-y-3">
              <textarea value={respuestas[e.id]||''} onChange={ev=>setRespuestas(p=>({...p,[e.id]:ev.target.value}))} placeholder="Escribe tu respuesta..." rows={3} className="input w-full resize-none"/>
              <button onClick={()=>responder(e.id,respuestas[e.id]||'')} disabled={!respuestas[e.id]?.trim()||enviando[e.id]} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-40">
                {enviando[e.id]?<Loader2 className="w-4 h-4 animate-spin"/>:<CheckCircle className="w-4 h-4"/>}Enviar
              </button>
            </div>}
          </div>
        ))}
        {respondidas.length>0&&<div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Ya respondidas</p>
          <div className="space-y-2">{respondidas.map(e=>(
            <div key={e.id} className="card p-4 flex items-center gap-3 opacity-70">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0"/>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{e.pregunta}</p>
                {e.mi_respuesta&&<p className="text-xs text-slate-400">Tu respuesta: {e.tipo==='puntuacion'?EMOJIS[parseInt(e.mi_respuesta)-1]+' '+LABELS[parseInt(e.mi_respuesta)-1]:e.mi_respuesta}</p>}
              </div>
            </div>
          ))}</div>
        </div>}
      </div>}
    </div>
  )
}