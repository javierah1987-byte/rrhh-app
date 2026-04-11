'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Breadcrumb } from '@/components/Breadcrumb'
import { LogIn, LogOut, Coffee, Play, Clock, AlertTriangle, CheckCircle, Loader2, History, Timer, X } from 'lucide-react'

const JORNADA_DEFAULT = 8
const AVISO_MINUTOS = 30
// JORNADA_SEG y AVISO_SEG se calculan dentro del componente

type Evento = { id: string; tipo: string; timestamp: string }
type Estado  = 'sin_fichar' | 'trabajando' | 'en_pausa' | 'finalizado'

function fmt(seg: number) {
  const h = Math.floor(seg/3600), m = Math.floor((seg%3600)/60), s = seg%60
  return [h,m,s].map(v=>String(v).padStart(2,'0')).join(':')
}
function fmtCorto(seg: number) {
  const h = Math.floor(seg/3600), m = Math.floor((seg%3600)/60)
  return h > 0 ? `${h}h ${m}min` : `${m}min`
}

function calcularTiempos(eventos: Evento[], ahora: Date) {
  if (!eventos.length) return { trabajado:0, pausa:0, estado:'sin_fichar' as Estado }
  const evs = [...eventos].sort((a,b)=>a.timestamp.localeCompare(b.timestamp))
  let trabajado=0, pausa=0, ultimaEntrada: Date|null=null, ultimaPausa: Date|null=null
  let estado: Estado = 'sin_fichar'
  for (const ev of evs) {
    const t = new Date(ev.timestamp)
    if (ev.tipo==='entrada')      { ultimaEntrada=t; ultimaPausa=null; estado='trabajando' }
    else if (ev.tipo==='pausa_inicio') { if(ultimaEntrada) trabajado+=(t.getTime()-ultimaEntrada.getTime())/1000; ultimaPausa=t; ultimaEntrada=null; estado='en_pausa' }
    else if (ev.tipo==='pausa_fin')    { if(ultimaPausa)   pausa    +=(t.getTime()-ultimaPausa.getTime())/1000;   ultimaEntrada=t; ultimaPausa=null; estado='trabajando' }
    else if (ev.tipo==='salida')  { if(ultimaEntrada) trabajado+=(t.getTime()-ultimaEntrada.getTime())/1000; if(ultimaPausa) pausa+=(ahora.getTime()-ultimaPausa.getTime())/1000; ultimaEntrada=null; ultimaPausa=null; estado='finalizado' }
  }
  if (estado==='trabajando'&&ultimaEntrada) trabajado+=(ahora.getTime()-ultimaEntrada.getTime())/1000
  else if (estado==='en_pausa'&&ultimaPausa) pausa+=(ahora.getTime()-ultimaPausa.getTime())/1000
  return { trabajado:Math.floor(trabajado), pausa:Math.floor(pausa), estado }
}

function parsarPausas(eventos: Evento[]) {
  const evs = [...eventos].sort((a,b)=>a.timestamp.localeCompare(b.timestamp))
  const pausas: { inicio:string; fin:string|null; duracion:number }[] = []
  let ini: string|null = null
  for (const ev of evs) {
    if (ev.tipo==='pausa_inicio') ini=ev.timestamp
    else if (ev.tipo==='pausa_fin' && ini) { pausas.push({inicio:ini,fin:ev.timestamp,duracion:Math.floor((new Date(ev.timestamp).getTime()-new Date(ini).getTime())/1000)}); ini=null }
  }
  if (ini) pausas.push({inicio:ini,fin:null,duracion:0})
  return pausas
}

function ModalHorasExtra({onClose,onSubmit,loading,jornada}:{onClose:()=>void;onSubmit:(h:number,m:string)=>void;loading:boolean;jornada:number}) {
  const [horas,setHoras]=useState(1), [motivo,setMotivo]=useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Solicitar horas extra</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"><X className="w-4 h-4 text-slate-500"/></button>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Vas a superar tu jornada de {jornadaH} horas. Indica cuántas horas extra necesitas y el motivo para que el administrador lo apruebe.</p>
        <div className="space-y-4">
          <div>
            <label className="label">Horas extra</label>
            <div className="flex items-center gap-4 mt-1">
              <button onClick={()=>setHoras(h=>Math.max(1,h-1))} className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 text-xl font-bold flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600">−</button>
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 w-6 text-center">{horas}</span>
              <button onClick={()=>setHoras(h=>Math.min(4,h+1))} className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 text-xl font-bold flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600">+</button>
              <span className="text-sm text-slate-500">hora{horas>1?'s':''}</span>
            </div>
          </div>
          <div>
            <label className="label">Motivo <span className="text-slate-400 font-normal">(obligatorio)</span></label>
            <textarea value={motivo} onChange={e=>setMotivo(e.target.value)} placeholder="Ej: Cierre urgente de proyecto..." rows={3} className="input w-full resize-none mt-1"/>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button onClick={()=>motivo.trim()&&onSubmit(horas,motivo.trim())} disabled={!motivo.trim()||loading} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
            {loading?<Loader2 className="w-4 h-4 animate-spin"/>:<CheckCircle className="w-4 h-4"/>}Enviar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function FichajePage() {
  const [empId,setEmpId]=useState<string|null>(null)
  const [jornadaH,setJornadaH]=useState(JORNADA_DEFAULT)
  const [eventos,setEventos]=useState<Evento[]>([])
  const [loading,setLoading]=useState(true)
  const [accion,setAccion]=useState(false)
  const [ahora,setAhora]=useState(new Date())
  const [solEnviada,setSolEnviada]=useState(false)
  const [solPendiente,setSolPendiente]=useState(false)
  const [modalExtra,setModalExtra]=useState(false)
  const [loadingExtra,setLoadingExtra]=useState(false)
  const [historial,setHistorial]=useState<{fecha:string;eventos:Evento[]}[]>([])
  const ref=useRef<NodeJS.Timeout>()

  useEffect(()=>{ ref.current=setInterval(()=>setAhora(new Date()),1000); return ()=>clearInterval(ref.current) },[])

  const cargar=useCallback(async(id:string)=>{
    const hoy=new Date().toISOString().slice(0,10)
    const {data}=await supabase.from('fichajes').select('*').eq('empleado_id',id).eq('fecha',hoy).order('timestamp',{ascending:true})
    setEventos(data||[])
    const {data:sol}=await supabase.from('solicitudes').select('id,estado').eq('empleado_id',id).eq('tipo','horas_extra').eq('fecha_inicio',hoy).maybeSingle()
    if(sol){setSolEnviada(true);setSolPendiente(sol.estado==='pendiente')}
    // Historial semana
    const lunes=new Date();lunes.setDate(lunes.getDate()-((lunes.getDay()||7)-1))
    const {data:hist}=await supabase.from('fichajes').select('*').eq('empleado_id',id).gte('fecha',lunes.toISOString().slice(0,10)).lte('fecha',hoy).order('timestamp',{ascending:true})
    const por:Record<string,Evento[]>={}
    for(const ev of (hist||[])){if(!por[ev.fecha])por[ev.fecha]=[];por[ev.fecha].push(ev)}
    setHistorial(Object.entries(por).sort(([a],[b])=>b.localeCompare(a)).map(([fecha,eventos])=>({fecha,eventos})))
  },[])

  useEffect(()=>{
    supabase.auth.getUser().then(({data})=>{
      if(!data.user)return
      supabase.from('empleados').select('id,jornada_horas').eq('user_id',data.user.id).single().then(({data:emp})=>{
        if(!emp)return
        setEmpId(emp.id)
        if(emp.jornada_horas) setJornadaH(Math.round(emp.jornada_horas/5))
        cargar(emp.id).finally(()=>setLoading(false))
      })
    })
  },[cargar])

  const JORNADA_SEG = jornadaH * 3600
  const AVISO_SEG   = JORNADA_SEG - AVISO_MINUTOS * 60
  const {trabajado,pausa,estado}=calcularTiempos(eventos,ahora)
  const pausas=parsarPausas(eventos)
  const pct=Math.min(100,(trabajado/JORNADA_SEG)*100)
  const superaJornada=trabajado>=JORNADA_SEG
  const cercaLimite=trabajado>=AVISO_SEG&&!superaJornada

  async function registrar(tipo:string){
    if(!empId||accion)return; setAccion(true)
    await supabase.from('fichajes').insert({empleado_id:empId,tipo,timestamp:new Date().toISOString(),fecha:new Date().toISOString().slice(0,10)})
    await cargar(empId); setAccion(false)
  }

  async function enviarHorasExtra(horas:number,motivo:string){
    if(!empId)return; setLoadingExtra(true)
    const hoy=new Date().toISOString().slice(0,10)
    await supabase.from('solicitudes').insert({empleado_id:empId,tipo:'horas_extra',fecha_inicio:hoy,fecha_fin:hoy,comentario:motivo,horas_solicitadas:horas,estado:'pendiente'})
    const {data:admin}=await supabase.from('empleados').select('id').eq('rol','admin').limit(1).maybeSingle()
    if(admin){await supabase.from('notificaciones').insert({empleado_id:admin.id,titulo:'Solicitud horas extra pendiente',mensaje:`Se han solicitado ${horas}h extra. Motivo: ${motivo.substring(0,80)}`,tipo:'advertencia',enlace:'/admin/solicitudes'})}
    setSolEnviada(true);setSolPendiente(true);setModalExtra(false);setLoadingExtra(false)
  }

  const entradaHoy=eventos.find(e=>e.tipo==='entrada')
  const colorAro=estado==='finalizado'?'text-emerald-500':superaJornada?'text-red-500':cercaLimite?'text-amber-500':estado==='en_pausa'?'text-slate-400':'text-indigo-500'

  if(loading)return(<div className="flex justify-center py-24"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>)

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">
      <Breadcrumb/>
      <h1 className="page-title">Fichaje</h1>

      {/* Avisos */}
      {cercaLimite&&!solEnviada&&(
        <div className="card p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5"/>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Quedan menos de {AVISO_MINUTOS} minutos para completar tu jornada</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Si necesitas más tiempo, solicita aprobación antes de continuar.</p>
          </div>
          <button onClick={()=>setModalExtra(true)} className="btn-primary text-xs px-3 py-1.5 bg-amber-500 hover:bg-amber-600 border-amber-500 whitespace-nowrap flex-shrink-0">Solicitar horas extra</button>
        </div>
      )}
      {superaJornada&&!solEnviada&&estado!=='finalizado'&&(
        <div className="card p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"/>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">Has superado tu jornada de {jornadaH} horas</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">Solicita aprobación para las horas extra realizadas.</p>
          </div>
          <button onClick={()=>setModalExtra(true)} className="btn-primary text-xs px-3 py-1.5 bg-red-500 hover:bg-red-600 border-red-500 whitespace-nowrap flex-shrink-0">Solicitar horas extra</button>
        </div>
      )}
      {solEnviada&&solPendiente&&estado!=='finalizado'&&(
        <div className="card p-4 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700 flex items-center gap-3">
          <Loader2 className="w-4 h-4 text-indigo-500 animate-spin flex-shrink-0"/>
          <p className="text-sm text-indigo-700 dark:text-indigo-300">Solicitud de horas extra enviada — esperando aprobación del administrador.</p>
        </div>
      )}
      {solEnviada&&!solPendiente&&estado!=='finalizado'&&(
        <div className="card p-4 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700 flex items-center gap-3">
          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0"/>
          <p className="text-sm text-emerald-700 dark:text-emerald-300">Horas extra aprobadas por el administrador.</p>
        </div>
      )}

      {/* Reloj y acciones */}
      <div className="card p-6">
        <div className="flex flex-col items-center gap-1 mb-6">
          <p className="text-4xl font-black text-slate-900 dark:text-slate-100 tabular-nums tracking-tight">
            {ahora.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
          </p>
          <p className="text-sm text-slate-400 capitalize">{ahora.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})}</p>
        </div>

        {/* Barra jornada */}
        <div className="mb-5">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span>Jornada ({jornadaH}h)</span>
            <span className={`font-mono ${superaJornada?'text-red-500 font-bold':cercaLimite?'text-amber-500 font-semibold':''}`}>{fmt(trabajado)}</span>
          </div>
          <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000 ${superaJornada?'bg-red-500':cercaLimite?'bg-amber-400':'bg-indigo-500'}`} style={{width:`${pct}%`}}/>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            {label:'Entrada',value:entradaHoy?new Date(entradaHoy.timestamp).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}):'—',cls:'text-slate-700 dark:text-slate-200'},
            {label:'En pausa',value:pausa>0?fmtCorto(pausa):'—',cls:'text-amber-600 dark:text-amber-400'},
            {label:'Trabajado',value:fmt(trabajado),cls:colorAro},
          ].map((s,i)=>(
            <div key={i} className="text-center p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl">
              <p className="text-[10px] text-slate-400 uppercase font-medium mb-1">{s.label}</p>
              <p className={`text-sm font-bold tabular-nums ${s.cls}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Badge estado */}
        <div className="flex justify-center mb-6">
          {estado==='sin_fichar'&&<span className="badge bg-slate-100 dark:bg-slate-700 text-slate-500 text-sm px-4 py-1.5">Sin fichar hoy</span>}
          {estado==='trabajando'&&<span className="badge bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-sm px-4 py-1.5 flex items-center gap-2"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/>Trabajando</span>}
          {estado==='en_pausa'&&<span className="badge bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-sm px-4 py-1.5 flex items-center gap-2"><Coffee className="w-3.5 h-3.5"/>En pausa ({pausas.filter(p=>!p.fin).length>0?'en curso':''})</span>}
          {estado==='finalizado'&&<span className="badge bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-sm px-4 py-1.5 flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5"/>Jornada completada • {fmt(trabajado)}</span>}
        </div>

        {/* Botones */}
        {estado!=='finalizado'&&(
          <div className="flex gap-3 justify-center">
            {estado==='sin_fichar'&&<button onClick={()=>registrar('entrada')} disabled={accion} className="btn-primary flex items-center gap-2 px-8 py-3 text-base disabled:opacity-50">{accion?<Loader2 className="w-5 h-5 animate-spin"/>:<LogIn className="w-5 h-5"/>}Entrar</button>}
            {estado==='trabajando'&&(<>
              <button onClick={()=>registrar('pausa_inicio')} disabled={accion} className="btn-secondary flex items-center gap-2 px-6 py-3 disabled:opacity-50">{accion?<Loader2 className="w-4 h-4 animate-spin"/>:<Coffee className="w-4 h-4"/>}Pausar</button>
              <button onClick={()=>registrar('salida')} disabled={accion} className="btn-primary flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 border-red-500 disabled:opacity-50">{accion?<Loader2 className="w-4 h-4 animate-spin"/>:<LogOut className="w-4 h-4"/>}Salida</button>
            </>)}
            {estado==='en_pausa'&&<button onClick={()=>registrar('pausa_fin')} disabled={accion} className="btn-primary flex items-center gap-2 px-8 py-3 text-base disabled:opacity-50">{accion?<Loader2 className="w-5 h-5 animate-spin"/>:<Play className="w-5 h-5"/>}Reanudar</button>}
          </div>
        )}
      </div>

      {/* Pausas hoy */}
      {pausas.length>0&&(
        <div className="card p-4">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2"><Coffee className="w-4 h-4 text-amber-500"/>Pausas de hoy ({pausas.length})</h2>
          <div className="space-y-2">
            {pausas.map((p,i)=>(
              <div key={i} className="flex items-center justify-between p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-800/40 px-1.5 py-0.5 rounded">#{i+1}</span>
                  <span className="text-xs text-slate-700 dark:text-slate-300">
                    {new Date(p.inicio).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}{p.fin?` – ${new Date(p.fin).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}`:' – en curso'}
                  </span>
                </div>
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">{p.fin?fmtCorto(p.duracion):<span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"/>en curso</span>}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial semana */}
      {historial.length>0&&(
        <div className="card p-4">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2"><History className="w-4 h-4 text-slate-400"/>Historial de la semana</h2>
          <div className="space-y-2">
            {historial.map(({fecha,eventos:evs})=>{
              const {trabajado:t,estado:e}=calcularTiempos(evs,new Date())
              const esHoy=fecha===new Date().toISOString().slice(0,10)
              const entrada=evs.find(ev=>ev.tipo==='entrada')
              const salida=evs.find(ev=>ev.tipo==='salida')
              const label=esHoy?'Hoy':new Date(fecha+'T12:00:00').toLocaleDateString('es-ES',{weekday:'short',day:'numeric',month:'short'})
              return (
                <div key={fecha} className={`flex items-center justify-between p-2.5 rounded-xl ${esHoy?'bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-200 dark:ring-indigo-700':'bg-slate-50 dark:bg-slate-700/30'}`}>
                  <div>
                    <p className={`text-xs font-semibold capitalize ${esHoy?'text-indigo-700 dark:text-indigo-300':'text-slate-700 dark:text-slate-300'}`}>{label}</p>
                    <p className="text-[10px] text-slate-400">{entrada?new Date(entrada.timestamp).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}):'—'}{salida?' – '+new Date(salida.timestamp).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}):''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Timer className={`w-3.5 h-3.5 ${e==='finalizado'?'text-emerald-500':'text-indigo-400'}`}/>
                    <span className={`text-xs font-bold tabular-nums ${e==='finalizado'&&t>=JORNADA_SEG?'text-emerald-600 dark:text-emerald-400':esHoy?'text-indigo-600 dark:text-indigo-400':'text-slate-500 dark:text-slate-400'}`}>{fmt(t)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {modalExtra&&<ModalHorasExtra onClose={()=>setModalExtra(false)} onSubmit={enviarHorasExtra} loading={loadingExtra} jornada={jornadaH}/>}
    </div>
  )
}