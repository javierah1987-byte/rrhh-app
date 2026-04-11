'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, RefreshCw } from 'lucide-react'

type Presencia = { id:string; nombre:string; avatar_color:string; departamento:string|null; puesto:string|null; estado:string; hora_entrada:string|null; ultimo_evento:string|null }

const CFG:Record<string,{label:string;dot:string;bg:string;text:string}> = {
  trabajando:{label:'Trabajando',dot:'bg-emerald-500',bg:'bg-emerald-50 dark:bg-emerald-900/20',text:'text-emerald-700 dark:text-emerald-300'},
  pausa:     {label:'En pausa',  dot:'bg-amber-400', bg:'bg-amber-50 dark:bg-amber-900/20',  text:'text-amber-700 dark:text-amber-300'},
  fuera:     {label:'Fuera',     dot:'bg-slate-400', bg:'bg-slate-100 dark:bg-slate-700/30', text:'text-slate-500 dark:text-slate-400'},
  sin_fichar:{label:'Sin fichar',dot:'bg-slate-300', bg:'bg-slate-50 dark:bg-slate-800/40',  text:'text-slate-400 dark:text-slate-500'},
}

function horaCorta(ts:string|null){if(!ts)return'—';return new Date(ts).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}
function tiempoDesde(ts:string){const d=Math.floor((Date.now()-new Date(ts).getTime())/60000);return d<1?'ahora':d<60?`hace ${d}min`:(`hace ${Math.floor(d/60)}h`)}

export default function WhoisPage(){
  const [p,setP]=useState<Presencia[]>([])
  const [loading,setL]=useState(true)
  const [upd,setUpd]=useState(new Date())
  const [filtro,setFiltro]=useState('todos')

  const cargar=useCallback(async()=>{
    const {data}=await supabase.from('presencia_actual').select('*').order('estado').order('nombre')
    setP((data as Presencia[])||[])
    setUpd(new Date()); setL(false)
  },[])

  useEffect(()=>{cargar();const t=setInterval(cargar,30000);return()=>clearInterval(t)},[cargar])
  useEffect(()=>{
    const ch=supabase.channel('fichajes-rt').on('postgres_changes',{event:'INSERT',schema:'public',table:'fichajes'},cargar).subscribe()
    return()=>{supabase.removeChannel(ch)}
  },[cargar])

  const counts={todos:p.length,trabajando:p.filter(x=>x.estado==='trabajando').length,pausa:p.filter(x=>x.estado==='pausa').length,fuera:p.filter(x=>x.estado==='fuera').length,sin_fichar:p.filter(x=>x.estado==='sin_fichar').length}
  const filtradas=filtro==='todos'?p:p.filter(x=>x.estado===filtro)

  return(
    <div>
      <div className="page-header mb-5">
        <div>
          <h1 className="page-title flex items-center gap-2"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"/>Who&apos;s In</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Presencia en tiempo real · actualizado {tiempoDesde(upd.toISOString())}</p>
        </div>
        <button onClick={cargar} className="btn-secondary flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5"/>Actualizar</button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[{k:'trabajando',l:'Trabajando',dot:'bg-emerald-500 animate-pulse'},{k:'pausa',l:'En pausa',dot:'bg-amber-400'},{k:'fuera',l:'Fuera',dot:'bg-slate-400'},{k:'sin_fichar',l:'Sin fichar',dot:'bg-slate-300'}].map(s=>(
          <button key={s.k} onClick={()=>setFiltro(filtro===s.k?'todos':s.k)}
            className={`card p-4 text-left transition-all ${filtro===s.k?'ring-2 ring-indigo-400':''}`}>
            <div className="flex items-center gap-2 mb-2"><span className={`w-2.5 h-2.5 rounded-full ${s.dot}`}/><span className="text-xs font-medium text-slate-500">{s.l}</span></div>
            <p className="text-3xl font-black text-slate-900 dark:text-slate-100">{counts[s.k as keyof typeof counts]}</p>
          </button>
        ))}
      </div>

      {loading?(
        <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>
      ):(
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtradas.map(emp=>{
            const cfg=CFG[emp.estado]||CFG.sin_fichar
            const initials=emp.nombre.split(' ').map((n:string)=>n[0]).join('').substring(0,2).toUpperCase()
            return(
              <div key={emp.id} className={`card p-4 flex items-center gap-4 ${emp.estado==='sin_fichar'?'opacity-60':''}`}>
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{backgroundColor:emp.avatar_color||'#6366f1'}}>{initials}</div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-800 ${cfg.dot}`}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">{emp.nombre}</p>
                  <p className="text-xs text-slate-400 truncate">{emp.departamento||emp.puesto||'—'}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot.split(' ')[0]}`}/>{cfg.label}
                    </span>
                    {emp.hora_entrada&&<span className="text-[10px] text-slate-400">desde {horaCorta(emp.hora_entrada)}</span>}
                  </div>
                </div>
              </div>
            )
          })}
          {filtradas.length===0&&<div className="col-span-full card p-12 text-center"><Users className="w-8 h-8 text-slate-300 mx-auto mb-2"/><p className="text-slate-400 text-sm">Nadie en este estado ahora mismo</p></div>}
        </div>
      )}
    </div>
  )
}