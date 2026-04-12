'use client'
import { useState } from 'react'
import { Bell, Play, CheckCircle, Loader2, Clock, CalendarDays, FileText, Timer } from 'lucide-react'
const CHECKS=[
  {id:'sin_fichar',icon:Clock,label:'Sin fichar 3+ días',desc:'Alerta cuando un empleado lleva 3+ días sin fichaje',color:'#6366f1'},
  {id:'contratos_vencen',icon:FileText,label:'Contratos temporales',desc:'Aviso 30, 15 y 7 días antes de que venza un contrato',color:'#f59e0b'},
  {id:'solicitudes_pendientes',icon:CalendarDays,label:'Solicitudes sin resolver',desc:'Recordatorio si una solicitud lleva más de 48h pendiente',color:'#10b981'},
  {id:'deficit_horas',icon:Timer,label:'Déficit de horas (lunes)',desc:'Resumen semanal de empleados con más de 8h de déficit',color:'#ef4444'},
]
export default function RecordatoriosPage(){
  const [ejecutando,setEjecutando]=useState(false)
  const [resultado,setResultado]=useState<any>(null)
  async function ejecutarAhora(){
    setEjecutando(true);setResultado(null)
    try{
      const resp=await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL+'/functions/v1/recordatorios-automaticos',{
        method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer nexohr-cron-2024'},
        body:JSON.stringify({trigger:'manual'}),
      })
      setResultado(await resp.json())
    }catch(e:any){setResultado({ok:false,error:e.message})}
    setEjecutando(false)
  }
  return(
    <div className="max-w-2xl mx-auto">
      <div className="page-header mb-6">
        <div><h1 className="page-title flex items-center gap-2"><Bell className="w-5 h-5 text-indigo-500"/>Recordatorios automáticos</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Se ejecutan automáticamente L-V a las 8:00h</p></div>
        <button onClick={ejecutarAhora} disabled={ejecutando} className="btn-primary flex items-center gap-2 disabled:opacity-50">
          {ejecutando?<><Loader2 className="w-4 h-4 animate-spin"/>Ejecutando…</>:<><Play className="w-4 h-4"/>Ejecutar ahora</>}
        </button>
      </div>
      {resultado&&(
        <div className={`card p-4 mb-5 ${resultado.ok?'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200':'bg-red-50 dark:bg-red-900/20 border border-red-200'}`}>
          <div className="flex items-center gap-2 mb-2"><CheckCircle className={`w-4 h-4 ${resultado.ok?'text-emerald-600':'text-red-500'}`}/><span className="font-semibold text-sm">{resultado.ok?'Completado':'Error'}</span></div>
          {resultado.resultados&&<div className="grid grid-cols-2 gap-2">{Object.entries(resultado.resultados).map(([k,v])=><div key={k} className="bg-white dark:bg-slate-800 rounded-lg p-2"><p className="text-xs text-slate-400">{k.replace(/_/g,' ')}</p><p className="text-lg font-black">{String(v)}</p></div>)}</div>}
          {resultado.error&&<p className="text-sm text-red-600">{resultado.error}</p>}
        </div>
      )}
      <div className="space-y-3 mb-6">
        {CHECKS.map(c=>{const Icon=c.icon;return(
          <div key={c.id} className="card p-4 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:c.color+'15'}}><Icon className="w-5 h-5" style={{color:c.color}}/></div>
            <div className="flex-1"><div className="flex items-center gap-2"><p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{c.label}</p><span className="badge badge-green text-[10px]">Activo</span></div><p className="text-xs text-slate-400 mt-0.5">{c.desc}</p></div>
          </div>
        )})}
      </div>
      <div className="card p-4 bg-slate-50 dark:bg-slate-700/30">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">Programación automática</p>
        <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
          {[{l:'Horario',v:'L-V a las 8:00h'},{l:'Tecnología',v:'Vercel Cron + Edge Fn'},{l:'Destino',v:'Notificaciones en app'},{l:'Anti-duplicados',v:'1 alerta/empleado/día'}].map(x=>(
            <div key={x.l}><p className="font-medium text-slate-700 dark:text-slate-300">{x.l}</p><p>{x.v}</p></div>
          ))}
        </div>
      </div>
    </div>
  )
}