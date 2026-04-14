'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Mail, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react'

type Email={id:string;para:string;asunto:string;tipo:string;enviado:boolean;enviado_at:string|null;error:string|null;created_at:string}

export default function EmailQueuePage(){
  const [emails,setEmails]=useState<Email[]>([])
  const [loading,setLoading]=useState(true)
  const [tab,setTab]=useState<'todos'|'pendientes'|'enviados'|'errores'>('todos')

  async function cargar(){
    setLoading(true)
    const{data}=await supabase.from('email_queue').select('*').order('created_at',{ascending:false}).limit(100)
    setEmails(data||[])
    setLoading(false)
  }

  useEffect(()=>{cargar()},[])

  const filtrados=emails.filter(e=>{
    if(tab==='pendientes')return !e.enviado&&!e.error
    if(tab==='enviados')return e.enviado
    if(tab==='errores')return!!e.error
    return true
  })

  const stats={
    total:emails.length,
    pendientes:emails.filter(e=>!e.enviado&&!e.error).length,
    enviados:emails.filter(e=>e.enviado).length,
    errores:emails.filter(e=>!!e.error).length,
  }

  const tipoBadge:Record<string,string>={
    firma_pendiente:'bg-indigo-100 text-indigo-700',
    solicitud_aprobada:'bg-green-100 text-green-700',
    solicitud_rechazada:'bg-red-100 text-red-700',
  }

  return(
    <div>
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><Mail className="w-5 h-5 text-indigo-500"/>Cola de emails</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Historial de notificaciones enviadas</p>
        </div>
        <button onClick={cargar} className="btn-secondary flex items-center gap-2"><RefreshCw className="w-4 h-4"/>Actualizar</button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          {label:'Total',value:stats.total,color:'text-slate-700 dark:text-slate-200',bg:''},
          {label:'Pendientes',value:stats.pendientes,color:'text-amber-600',bg:'bg-amber-50 dark:bg-amber-900/20'},
          {label:'Enviados',value:stats.enviados,color:'text-emerald-600',bg:'bg-emerald-50 dark:bg-emerald-900/20'},
          {label:'Errores',value:stats.errores,color:'text-red-500',bg:'bg-red-50 dark:bg-red-900/20'},
        ].map(s=>(
          <div key={s.label} className={`card p-4 text-center ${s.bg}`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        {(['todos','pendientes','enviados','errores'] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize
              ${tab===t?'bg-indigo-600 text-white':'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading?<div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin"/></div>
        :filtrados.length===0?<div className="p-12 text-center"><Mail className="w-10 h-10 text-slate-200 mx-auto mb-2"/><p className="text-slate-500">Sin emails en esta categoría</p></div>
        :<div className="divide-y divide-slate-100 dark:divide-slate-700">
          {filtrados.map(e=>(
            <div key={e.id} className="flex items-start gap-4 p-4">
              <div className="flex-shrink-0 mt-0.5">
                {e.enviado?<CheckCircle className="w-5 h-5 text-emerald-500"/>
                :e.error?<XCircle className="w-5 h-5 text-red-500"/>
                :<Clock className="w-5 h-5 text-amber-500"/>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{e.asunto}</p>
                  {e.tipo&&<span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipoBadge[e.tipo]||'bg-slate-100 text-slate-600'}`}>{e.tipo.replace('_',' ')}</span>}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Para: {e.para}</p>
                {e.error&&<p className="text-xs text-red-500 mt-0.5">Error: {e.error}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-slate-400">
                  {new Date(e.enviado_at||e.created_at).toLocaleDateString('es-ES',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
                </p>
                <p className={`text-xs font-medium mt-0.5 ${e.enviado?'text-emerald-600':e.error?'text-red-500':'text-amber-600'}`}>
                  {e.enviado?'Enviado':e.error?'Error':'Pendiente'}
                </p>
              </div>
            </div>
          ))}
        </div>}
      </div>
      <p className="text-xs text-slate-400 mt-3 text-center">
        Para activar el envío real, configura RESEND_API_KEY en Supabase → Edge Functions → send-email → Secrets
      </p>
    </div>
  )
}