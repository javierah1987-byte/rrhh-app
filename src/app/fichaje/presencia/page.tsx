// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Wifi, MapPin, RefreshCw } from 'lucide-react'

export default function FichajePresenciaPage() {
  const [empleados, setEmpleados] = useState([])
  const [fichajes, setFichajes]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const cargar = async () => {
    const hoy = new Date().toISOString().split('T')[0]
    const [{ data: emps }, { data: fichs }] = await Promise.all([
      supabase.from('empleados').select('id,nombre,puesto,departamento,avatar_color').eq('estado','activo'),
      supabase.from('fichajes').select('empleado_id,tipo,timestamp,latitud,longitud,direccion').eq('fecha', hoy).order('timestamp',{ascending:false}),
    ])
    setEmpleados(emps||[])
    setFichajes(fichs||[])
    setLastUpdate(new Date())
    setLoading(false)
  }

  useEffect(() => { cargar(); const iv=setInterval(cargar,30000); return()=>clearInterval(iv) }, [])

  const getEstado = eid => {
    const mios = (fichajes||[]).filter(f=>f.empleado_id===eid)
    const entrada = mios.find(f=>f.tipo==='entrada')
    const salida  = mios.find(f=>f.tipo==='salida')
    if (!entrada) return {status:'ausente',color:'#94a3b8',label:'Sin fichar',horas:null}
    if (salida)   return {status:'salida', color:'#f59e0b',label:'Ha salido',horas:Math.floor((new Date(salida.timestamp)-new Date(entrada.timestamp))/3600000)}
    return {status:'presente',color:'#10b981',label:'Trabajando',horas:Math.floor((new Date()-new Date(entrada.timestamp))/3600000),hora:new Date(entrada.timestamp).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}),loc:entrada.direccion}
  }

  const presentes = (empleados||[]).filter(e=>getEstado(e.id).status==='presente').length

  if (loading) return <div className="p-8 text-slate-400 animate-pulse text-sm">Cargando...</div>

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Wifi className="w-5 h-5 text-emerald-500"/> Presencia en tiempo real
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">{presentes} de {(empleados||[]).length} presentes · {lastUpdate.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}</p>
        </div>
        <button onClick={cargar} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg">
          <RefreshCw className="w-3.5 h-3.5"/> Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(empleados||[]).map(e => {
          const est = getEstado(e.id)
          return(
            <div key={e.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white"
                    style={{background:e.avatar_color||'#6366f1'}}>
                    {e.nombre?.charAt(0)}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800"
                    style={{background:est.color}}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-700 dark:text-slate-200 truncate">{e.nombre}</p>
                  <p className="text-xs text-slate-400 truncate">{e.puesto}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{color:est.color}}>{est.label}</span>
                {est.horas !== null && <span className="text-sm text-slate-500">{est.horas}h</span>}
              </div>
              {est.hora && <p className="text-xs text-slate-400 mt-1">Entrada a las {est.hora}</p>}
              {est.loc && (
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 truncate">
                  <MapPin className="w-3 h-3 flex-shrink-0"/>{est.loc}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}