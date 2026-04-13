'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Wifi, RefreshCw, MapPin, Users, UserCheck, TrendingUp, LayoutList } from 'lucide-react'

type Presencia={id:string;nombre:string;avatar_color:string;entrada:string;latitud?:number;longitud?:number;direccion?:string}
type Ausente={id:string;nombre:string;avatar_color:string;ultimo_fichaje?:string}

export default function WhoisPage(){
  const [presentes,setPresentes]=useState<Presencia[]>([])
  const [ausentes,setAusentes]=useState<Ausente[]>([])
  const [pctAsistencia,setPctAsistencia]=useState(0)
  const [loading,setLoading]=useState(true)
  const [updated,setUpdated]=useState(new Date())
  const [tab,setTab]=useState<'lista'|'mapa'>('lista')
  const mapRef=useRef<any>(null)
  const mapInstanceRef=useRef<any>(null)

  const cargar=useCallback(async()=>{
    const hoy=new Date().toISOString().split('T')[0]
    const{data:emps}=await supabase.from('empleados').select('id,nombre,avatar_color').eq('estado','activo')
    const{data:fichs}=await supabase.from('fichajes').select('empleado_id,tipo,timestamp,latitud,longitud,direccion').eq('fecha',hoy).order('timestamp',{ascending:false})

    const fichajesMap=new Map<string,any>()
    fichs?.forEach(f=>{if(!fichajesMap.has(f.empleado_id))fichajesMap.set(f.empleado_id,f)})

    const pres:Presencia[]=[],aus:Ausente[]=[]
    emps?.forEach(e=>{
      const ult=fichajesMap.get(e.id)
      if(ult?.tipo==='entrada'){
        pres.push({id:e.id,nombre:e.nombre,avatar_color:e.avatar_color,entrada:ult.timestamp,latitud:ult.latitud||undefined,longitud:ult.longitud||undefined,direccion:ult.direccion||undefined})
      } else {
        aus.push({id:e.id,nombre:e.nombre,avatar_color:e.avatar_color,ultimo_fichaje:ult?.timestamp})
      }
    })
    setPresentes(pres);setAusentes(aus)
    setPctAsistencia(emps?.length?Math.round((pres.length/(emps.length))*100):0)
    setUpdated(new Date());setLoading(false)
  },[])

  useEffect(()=>{cargar();const t=setInterval(cargar,120000);return()=>clearInterval(t)},[cargar])

  // Inicializar mapa Leaflet cuando se cambia al tab mapa
  useEffect(()=>{
    if(tab!=='mapa'||!mapRef.current)return
    
    const initMap=async()=>{
      // Cargar Leaflet dinámicamente
      if(!(window as any).L){
        await new Promise<void>(res=>{
          const css=document.createElement('link');css.rel='stylesheet';css.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';document.head.appendChild(css)
          const js=document.createElement('script');js.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';js.onload=()=>res();document.head.appendChild(js)
        })
      }
      
      const L=(window as any).L
      if(mapInstanceRef.current){mapInstanceRef.current.remove();mapInstanceRef.current=null}
      
      const presConGeo=presentes.filter(p=>p.latitud&&p.longitud)
      const centro=presConGeo.length>0?[presConGeo[0].latitud!,presConGeo[0].longitud!]:[28.1235,-15.4363] // Las Palmas por defecto
      
      const map=L.map(mapRef.current,{zoom:14,center:centro})
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
        attribution:'© <a href="https://openstreetmap.org">OpenStreetMap</a>',maxZoom:19
      }).addTo(map)
      
      presConGeo.forEach(p=>{
        const icon=L.divIcon({
          html:`<div style="background:${p.avatar_color||'#6366f1'};width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:14px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${p.nombre.charAt(0)}</div>`,
          className:'',iconSize:[36,36],iconAnchor:[18,18]
        })
        L.marker([p.latitud!,p.longitud!],{icon})
          .addTo(map)
          .bindPopup(`<b>${p.nombre}</b><br><span style="color:#6b7280;font-size:12px">${p.direccion||p.latitud?.toFixed(5)+', '+p.longitud?.toFixed(5)}</span><br><span style="color:#10b981;font-size:12px">● Trabajando</span>`)
      })
      
      if(presConGeo.length>1){
        const bounds=L.latLngBounds(presConGeo.map(p=>[p.latitud!,p.longitud!]))
        map.fitBounds(bounds,{padding:[20,20]})
      }
      mapInstanceRef.current=map
    }
    initMap()
    return()=>{if(mapInstanceRef.current){mapInstanceRef.current.remove();mapInstanceRef.current=null}}
  },[tab,presentes])

  const avatar=(nombre:string,color:string,size='w-10 h-10')=>(
    <div className={`${size} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`} style={{backgroundColor:color||'#6366f1'}}>
      {nombre.charAt(0)}
    </div>
  )

  return(
    <div>
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><Wifi className="w-5 h-5 text-emerald-500"/>Who's In</h1>
          <p className="text-xs text-slate-400 mt-0.5">Actualizado {updated.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>setTab(t=>t==='lista'?'mapa':'lista')} className="btn-secondary flex items-center gap-2">
            {tab==='lista'?<><LayoutList className="w-4 h-4"/>Ver mapa</>:<><Users className="w-4 h-4"/>Ver lista</>}
          </button>
          <button onClick={cargar} className="btn-secondary flex items-center gap-2"><RefreshCw className="w-4 h-4"/>Actualizar</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <p className="text-3xl font-black text-emerald-600">{presentes.length}</p>
          <p className="text-sm text-slate-500 mt-1 flex items-center justify-center gap-1"><UserCheck className="w-3.5 h-3.5"/>En oficina</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-black text-slate-400">{ausentes.length}</p>
          <p className="text-sm text-slate-500 mt-1 flex items-center justify-center gap-1"><Users className="w-3.5 h-3.5"/>Ausentes</p>
        </div>
        <div className="card p-4 text-center relative overflow-hidden">
          <svg className="w-16 h-16 mx-auto -mt-1" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3"/>
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10b981" strokeWidth="3"
              strokeDasharray={`${pctAsistencia} ${100-pctAsistencia}`} strokeDashoffset="25" strokeLinecap="round"/>
            <text x="18" y="20.5" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#065f46">{pctAsistencia}%</text>
          </svg>
          <p className="text-sm text-slate-500 -mt-1 flex items-center justify-center gap-1"><TrendingUp className="w-3.5 h-3.5"/>Asistencia</p>
        </div>
      </div>

      {/* Mapa Leaflet */}
      {tab==='mapa'&&(
        <div className="card overflow-hidden mb-4">
          <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-500"/>Mapa de presencia en tiempo real</p>
            <p className="text-xs text-slate-400">{presentes.filter(p=>p.latitud).length} con ubicación GPS</p>
          </div>
          {presentes.filter(p=>p.latitud).length===0?(
            <div className="p-12 text-center">
              <MapPin className="w-10 h-10 text-slate-200 mx-auto mb-2"/>
              <p className="text-slate-500 text-sm">Sin empleados con ubicación GPS hoy</p>
              <p className="text-xs text-slate-400 mt-1">La ubicación se captura al fichar desde el móvil</p>
            </div>
          ):(
            <div ref={mapRef} style={{height:'400px',width:'100%'}}/>
          )}
        </div>
      )}

      {/* Lista */}
      {tab==='lista'&&(
        <div className="grid md:grid-cols-2 gap-4">
          {/* Presentes */}
          <div className="card overflow-hidden">
            <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>Presentes ({presentes.length})
              </p>
            </div>
            {loading?<div className="p-6 flex justify-center"><div className="w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin"/></div>
            :presentes.length===0?<p className="text-sm text-slate-400 text-center p-8">Nadie ha fichado hoy todavía</p>
            :<div className="divide-y divide-slate-100 dark:divide-slate-700">
              {presentes.map(p=>(
                <div key={p.id} className="flex items-center gap-3 p-3">
                  {avatar(p.nombre,p.avatar_color)}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{p.nombre}</p>
                    <p className="text-xs text-slate-400">Desde {new Date(p.entrada).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}</p>
                    {p.direccion&&<p className="text-xs text-indigo-500 truncate flex items-center gap-1 mt-0.5"><MapPin className="w-2.5 h-2.5 flex-shrink-0"/>{p.direccion}</p>}
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"/>
                </div>
              ))}
            </div>}
          </div>

          {/* Ausentes */}
          <div className="card overflow-hidden">
            <div className="p-3 border-b border-slate-100 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400"/>Ausentes ({ausentes.length})
              </p>
            </div>
            {loading?<div className="p-6 flex justify-center"><div className="w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin"/></div>
            :ausentes.length===0?<p className="text-sm text-slate-400 text-center p-8">¡Todos han fichado!</p>
            :<div className="divide-y divide-slate-100 dark:divide-slate-700">
              {ausentes.map(a=>(
                <div key={a.id} className="flex items-center gap-3 p-3 opacity-60">
                  {avatar(a.nombre,a.avatar_color)}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">{a.nombre}</p>
                    <p className="text-xs text-slate-400">{a.ultimo_fichaje?'Último: '+new Date(a.ultimo_fichaje).toLocaleDateString('es-ES',{day:'numeric',month:'short'}):'Sin fichajes'}</p>
                  </div>
                </div>
              ))}
            </div>}
          </div>
        </div>
      )}
    </div>
  )
}