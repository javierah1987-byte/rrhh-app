'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Receipt, CheckCircle, XCircle } from 'lucide-react'

type Gasto={id:string;fecha:string;categoria:string;descripcion:string;importe:number;ticket_url:string|null;estado:'pendiente'|'aprobado'|'rechazado';comentario_admin:string|null;empleados:{nombre:string;avatar_color:string;departamento:string|null}}
const EMOJI_CAT:Record<string,string>={transporte:'🚗',comida:'🍽️',alojamiento:'🏨',material:'📦',telefono:'📱',formacion:'📚',otro:'📎'}

export default function AdminGastosPage(){
  const [gastos,setGastos]=useState<Gasto[]>([])
  const [loading,setLoading]=useState(true)
  const [filtro,setFiltro]=useState('pendiente')
  const [procesando,setPro]=useState<string|null>(null)
  const [comentarios,setCom]=useState<Record<string,string>>({})

  const cargar=useCallback(async()=>{
    const{data}=await supabase.from('gastos').select('*,empleados(nombre,avatar_color,departamento)').order('created_at',{ascending:false})
    setGastos((data as Gasto[])||[]); setLoading(false)
  },[])
  useEffect(()=>{cargar()},[cargar])

  async function gestionar(id:string,estado:'aprobado'|'rechazado'){
    setPro(id)
    const g=gastos.find(x=>x.id===id), nota=comentarios[id]||''
    await supabase.from('gastos').update({estado,comentario_admin:nota||null}).eq('id',id)
    const{data:gd}=await supabase.from('gastos').select('empleado_id').eq('id',id).single()
    if(gd)await supabase.from('notificaciones').insert({empleado_id:(gd as any).empleado_id,titulo:'Gasto '+estado,mensaje:'Tu gasto de '+g?.importe.toFixed(2)+' € ha sido '+estado+'.',tipo:estado==='aprobado'?'exito':'advertencia',enlace:'/empleado/gastos'})
    setGastos(p=>p.map(x=>x.id===id?{...x,estado,comentario_admin:nota||null}:x)); setPro(null)
  }

  const filtradas=gastos.filter(g=>filtro==='todas'||g.estado===filtro)
  const totalPend=gastos.filter(g=>g.estado==='pendiente').reduce((s,g)=>s+g.importe,0)
  const counts={pendiente:gastos.filter(g=>g.estado==='pendiente').length,aprobado:gastos.filter(g=>g.estado==='aprobado').length,rechazado:gastos.filter(g=>g.estado==='rechazado').length}

  return(
    <div>
      <div className="page-header mb-5">
        <div><h1 className="page-title">Gastos del equipo</h1><p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Revisa y aprueba los gastos profesionales</p></div>
        <div className="card px-4 py-2 text-right"><p className="text-xs text-slate-400">Pendiente</p><p className="text-xl font-black text-amber-600 dark:text-amber-400">{totalPend.toFixed(2)} €</p></div>
      </div>
      <div className="flex flex-wrap gap-2 mb-5">
        {[{k:'pendiente',l:'Pendientes',c:counts.pendiente,a:'bg-amber-500 text-white',i:'bg-amber-50 text-amber-700'},{k:'aprobado',l:'Aprobados',c:counts.aprobado,a:'bg-emerald-500 text-white',i:'bg-emerald-50 text-emerald-700'},{k:'rechazado',l:'Rechazados',c:counts.rechazado,a:'bg-red-500 text-white',i:'bg-red-50 text-red-700'},{k:'todas',l:'Todos',c:gastos.length,a:'bg-indigo-600 text-white',i:'bg-slate-100 text-slate-700'}].map(f=>(
          <button key={f.k} onClick={()=>setFiltro(f.k)} className={"flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-colors "+(filtro===f.k?f.a:f.i)}>
            {f.l}<span className={"text-xs px-1.5 py-0.5 rounded-full "+(filtro===f.k?'bg-white/20':'bg-white/60 dark:bg-slate-600')}>{f.c}</span>
          </button>
        ))}
      </div>
      {loading?(<div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>)
      :filtradas.length===0?(<div className="card p-12 text-center"><Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3"/><p className="text-slate-500">Sin gastos</p></div>)
      :(<div className="space-y-3">{filtradas.map(g=>{
        const emp=g.empleados as any
        const badgeCls=g.estado==='pendiente'?'badge-amber':g.estado==='aprobado'?'badge-green':'badge-red'
        return(
          <div key={g.id} className={"card p-5 "+(g.estado==='pendiente'?'ring-1 ring-amber-200 dark:ring-amber-800':'')}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{backgroundColor:emp?.avatar_color||'#6366f1'}}>
                  {emp?.nombre?.split(' ').map((n:string)=>n[0]).join('').substring(0,2)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{emp?.nombre}</span>
                    <span className="text-xl">{EMOJI_CAT[g.categoria]||'📎'}</span>
                    <span className={"badge text-xs capitalize "+badgeCls}>{g.estado}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{g.descripcion} · {new Date(g.fecha+'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short'})}</p>
                  {g.comentario_admin&&<p className="text-xs text-slate-400 mt-1">{g.comentario_admin}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="font-black text-lg text-slate-900 dark:text-slate-100">{g.importe.toFixed(2)} €</span>
                {g.estado==='pendiente'&&(
                  <div className="flex flex-col gap-1.5">
                    <input type="text" placeholder="Nota (opcional)" value={comentarios[g.id]||''} onChange={e=>setCom(p=>({...p,[g.id]:e.target.value}))} className="input text-xs py-1 w-36"/>
                    <div className="flex gap-1.5">
                      <button onClick={()=>gestionar(g.id,'rechazado')} disabled={procesando===g.id} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-semibold text-xs disabled:opacity-50">
                        <XCircle className="w-3 h-3"/>Rechazar
                      </button>
                      <button onClick={()=>gestionar(g.id,'aprobado')} disabled={procesando===g.id} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 font-semibold text-xs disabled:opacity-50">
                        <CheckCircle className="w-3 h-3"/>Aprobar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}</div>)}
    </div>
  )
}