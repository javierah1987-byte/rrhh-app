// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Wifi, MapPin, Clock, Users, RefreshCw } from 'lucide-react'

export default function WhosInPage() {
  const [empleados, setEmpleados] = useState([])
  const [fichajes, setFichajes]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const cargar = async () => {
    const hoy = new Date().toISOString().split('T')[0]
    const [{ data: emps }, { data: fich }] = await Promise.all([
      supabase.from('empleados').select('id,nombre,puesto,departamento,avatar_color').eq('estado','activo'),
      supabase.from('fichajes').select('empleado_id,tipo,timestamp,latitud,longitud,direccion').eq('fecha', hoy).order('timestamp', {ascending:false}),
    ])
    setEmpleados(emps||[])
    setFichajes(fich||[])
    setLastUpdate(new Date())
    setLoading(false)
  }

  useEffect(() => { cargar(); const iv=setInterval(cargar,30000); return()=>clearInterval(iv) }, [])

  const getEstado = eid => {
    const mios = fichajes.filter(f=>f.empleado_id===eid)
    const entrada = mios.find(f=>f.tipo==='entrada')
    const salida  = mios.find(f=>f.tipo==='salida')
    if (!entrada) return {status:'ausente',color:'#94a3b8',label:'Sin fichar',horas:null}
    if (salida)   return {status:'salida', color:'#f59e0b',label:'Salió',horas: Math.floor((new Date(salida.timestamp)-new Date(entrada.timestamp))/3600000)}
    const horas = Math.floor((new Date()-new Date(entrada.timestamp))/3600000)
    return {status:'presente',color:'#10b981',label:'Presente',horas, hora: new Date(entrada.timestamp).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}), loc: entrada.direccion}
  }

  const presentes = empleados.filter(e=>getEstado(e.id).status==='presente').length
  const ausentes  = empleados.filter(e=>getEstado(e.id).status==='ausente').length
  const salidos   = empleados.filter(e=>getEstado(e.id).status==='salida').length

  if (loading) return <div className="p-8 text-slate-400 text-sm animate-pulse">Cargando...</div>

  const byDept = {}
  empleados.forEach(e=>{ if(!byDept[e.departamento]) byDept[e.departamento]=[]; byDept[e.departamento].push(e) })

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Wifi className="w-5 h-5 text-emerald-500"/> Who's In — Presencia hoy
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Actualizado {lastUpdate.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}</p>
        </div>
        <button onClick={cargar} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg">
          <RefreshCw className="w-3.5 h-3.5"/> Actualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {label:'Presentes', val:presentes, color:'#10b981', bg:'bg-emerald-50 dark:bg-emerald-900/10', dot:'bg-emerald-400 animate-pulse'},
          {label:'Salidos',   val:salidos,   color:'#f59e0b', bg:'bg-amber-50 dark:bg-amber-900/10',   dot:'bg-amber-400'},
          {label:'Sin fichar',val:ausentes,  color:'#94a3b8', bg:'bg-slate-50 dark:bg-slate-800',      dot:'bg-slate-400'},
        ].map((s,i)=>(
          <div key={i} className={`${s.bg} border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center gap-3`}>
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${s.dot}`}/>
            <div>
              <p className="text-2xl font-black" style={{color:s.color}}>{s.val}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Cards por departamento */}
      {Object.entries(byDept).map(([dept,emps])=>(
        <div key={dept}>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{dept}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {emps.map(e=>{
              const est = getEstado(e.id)
              return(
                <div key={e.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm"
                      style={{background:e.avatar_color||'#6366f1'}}>
                      {e.nombre?.charAt(0)}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-800"
                      style={{background:est.color}}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{e.nombre}</p>
                    <p className="text-xs text-slate-400 truncate">{e.puesto}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs font-medium" style={{color:est.color}}>{est.label}</span>
                      {est.horas !== null && <span className="text-xs text-slate-400">· {est.horas}h</span>}
                      {est.hora && <span className="text-xs text-slate-400">desde {est.hora}</span>}
                    </div>
                    {est.loc && (
                      <p className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5 truncate">
                        <MapPin className="w-2.5 h-2.5 flex-shrink-0"/>{est.loc}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}