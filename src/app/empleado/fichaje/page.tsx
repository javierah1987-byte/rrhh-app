'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Clock, MapPin, Loader2, Play, Square, Coffee, AlertCircle, CheckCircle } from 'lucide-react'

type Fichaje={id:string;tipo:string;timestamp:string;latitud?:number;longitud?:number;direccion?:string}
type Estado='sin_fichar'|'fichado'|'pausa'

export default function FichajePage(){
  const [estado,setEstado]=useState<Estado>('sin_fichar')
  const [empId,setEmpId]=useState('')
  const [fichajes,setFichajes]=useState<Fichaje[]>([])
  const [loading,setLoading]=useState(true)
  const [accion,setAccion]=useState(false)
  const [hora,setHora]=useState(new Date())
  const [geo,setGeo]=useState<{lat:number;lng:number;dir?:string}|null>(null)
  const [geoErr,setGeoErr]=useState('')
  const [geoLoad,setGeoLoad]=useState(false)
  const [totalHoy,setTotalHoy]=useState(0)

  useEffect(()=>{const t=setInterval(()=>setHora(new Date()),1000);return()=>clearInterval(t)},[])

  const cargar=useCallback(async()=>{
    const{data:{user}}=await supabase.auth.getUser();if(!user)return
    const{data:emp}=await supabase.from('empleados').select('id').eq('user_id',user.id).single();if(!emp)return
    setEmpId(emp.id)
    const hoy=new Date().toISOString().split('T')[0]
    const{data:fs}=await supabase.from('fichajes').select('*').eq('empleado_id',emp.id).eq('fecha',hoy).order('timestamp',{ascending:true})
    setFichajes(fs||[])
    const ult=fs?.at(-1)?.tipo
    setEstado(ult==='entrada'?'fichado':ult==='pausa_inicio'?'pausa':'sin_fichar')
    if(fs&&fs.length>=2){
      const ents=fs.filter(f=>f.tipo==='entrada'),sals=fs.filter(f=>f.tipo==='salida')
      let tot=0;for(let i=0;i<Math.min(ents.length,sals.length);i++)tot+=new Date(sals[i].timestamp).getTime()-new Date(ents[i].timestamp).getTime()
      setTotalHoy(tot)
    }
    setLoading(false)
  },[])
  useEffect(()=>{cargar()},[cargar])

  async function obtenerGeo(){
    setGeoLoad(true);setGeoErr('')
    return new Promise<{lat:number;lng:number;dir?:string;precision?:number}|null>(resolve=>{
      if(!navigator.geolocation){setGeoErr('Navegador sin soporte GPS');setGeoLoad(false);resolve(null);return}
      navigator.geolocation.getCurrentPosition(
        async pos=>{
          const lat=pos.coords.latitude,lng=pos.coords.longitude,precision=Math.round(pos.coords.accuracy)
          let dir=''
          try{
            const r=await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`,
              {headers:{'User-Agent':'NexoHR/1.0 (pruebasgrupoaxen.com)','Accept':'application/json'},signal:AbortSignal.timeout(8000)}
            )
            if(r.ok){const d=await r.json();dir=d.display_name?.split(',').slice(0,3).join(', ')||''}
          }catch(e:any){
            // Fallback: mostrar coordenadas si Nominatim falla
            dir=`${lat.toFixed(5)}, ${lng.toFixed(5)}`
          }
          const res={lat,lng,dir,precision};setGeo(res);setGeoLoad(false);resolve(res)
        },
        err=>{
          const msg=err.code===1?'Permiso GPS denegado. Actívalo en ajustes del navegador.':err.code===2?'No se pudo obtener señal GPS':'Tiempo de espera GPS agotado'
          setGeoErr(msg);setGeoLoad(false);resolve(null)
        },
        {timeout:15000,enableHighAccuracy:true,maximumAge:30000}
      )
    })
  }

  async function fichar(tipo:string){
    setAccion(true)
    const pos=await obtenerGeo()
    await supabase.from('fichajes').insert({empleado_id:empId,tipo,fecha:new Date().toISOString().split('T')[0],timestamp:new Date().toISOString(),...(pos?{latitud:pos.lat,longitud:pos.lng,direccion:pos.dir||null,precision_metros:pos.precision||null}:{})})
    await cargar();setAccion(false)
  }

  const fmtHora=(d:Date)=>d.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit',second:'2-digit'})
  const fmtDur=(ms:number)=>`${Math.floor(ms/3600000)}h ${Math.floor((ms%3600000)/60000)}m`

  if(loading)return<div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>

  const CFG={sin_fichar:{label:'Sin fichar',ring:'ring-slate-200',dot:'bg-slate-400',anim:false},fichado:{label:'Trabajando',ring:'ring-emerald-300',dot:'bg-emerald-500',anim:true},pausa:{label:'En pausa',ring:'ring-amber-300',dot:'bg-amber-500',anim:false}}
  const c=CFG[estado]

  return(
    <div className="max-w-md mx-auto space-y-4 pb-8">
      <div className={`card p-6 text-center ring-2 ${c.ring}`}>
        <p className="text-5xl font-black tabular-nums tracking-tight text-slate-900 dark:text-slate-100 mb-1">{fmtHora(hora)}</p>
        <p className="text-sm text-slate-400">{hora.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})}</p>
        <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700">
          <div className={`w-1.5 h-1.5 rounded-full ${c.dot} ${c.anim?'animate-pulse':''}`}/>
          {c.label}
        </div>
        {totalHoy>0&&<p className="text-xs text-slate-400 mt-1.5">Hoy: {fmtDur(totalHoy)}</p>}
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-2 mb-2"><MapPin className="w-4 h-4 text-indigo-500"/><span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Ubicación</span>{geoLoad&&<Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 ml-auto"/>}</div>
        {geo?<div className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5"/><p className="text-xs text-slate-500">{geo.dir||geo.lat.toFixed(5)+', '+geo.lng.toFixed(5)}</p></div>
          :geoErr?<div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0"/><p className="text-xs text-amber-600">{geoErr} · el fichaje se guarda sin ubicación</p></div>
          :<p className="text-xs text-slate-400">La ubicación se captura automáticamente al fichar</p>}
      </div>

      <div className="card p-4 space-y-3">
        {estado==='sin_fichar'&&<button onClick={()=>fichar('entrada')} disabled={accion} className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black text-lg flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-lg shadow-emerald-200 dark:shadow-none">{accion?<Loader2 className="w-6 h-6 animate-spin"/>:<Play className="w-6 h-6"/>}Entrar a trabajar</button>}
        {estado==='fichado'&&<>
          <button onClick={()=>fichar('pausa_inicio')} disabled={accion} className="w-full py-3 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-700 font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">{accion?<Loader2 className="w-5 h-5 animate-spin"/>:<Coffee className="w-5 h-5"/>}Iniciar pausa</button>
          <button onClick={()=>fichar('salida')} disabled={accion} className="w-full py-3 rounded-2xl bg-red-100 hover:bg-red-200 text-red-700 font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">{accion?<Loader2 className="w-5 h-5 animate-spin"/>:<Square className="w-5 h-5"/>}Finalizar jornada</button>
        </>}
        {estado==='pausa'&&<button onClick={()=>fichar('pausa_fin')} disabled={accion} className="w-full py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white font-black text-lg flex items-center justify-center gap-3 transition-all disabled:opacity-50">{accion?<Loader2 className="w-6 h-6 animate-spin"/>:<Play className="w-6 h-6"/>}Volver del descanso</button>}
      </div>

      {fichajes.length>0&&(
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700"><p className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Clock className="w-4 h-4 text-indigo-500"/>Registros de hoy</p></div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {fichajes.map(f=>(
              <div key={f.id} className="px-4 py-3 flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${f.tipo==='entrada'?'bg-emerald-400':f.tipo==='salida'?'bg-red-400':'bg-amber-400'}`}/>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 capitalize">{f.tipo.replace('_',' ')}</p>
                  {f.direccion&&<p className="text-[10px] text-slate-400 truncate flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5 inline flex-shrink-0"/>{f.direccion}</p>}
                </div>
                <p className="text-xs font-mono text-slate-500 flex-shrink-0">{new Date(f.timestamp).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}