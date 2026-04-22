// @ts-nocheck
'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Clock, Calendar, Filter, ChevronDown, ChevronUp, Download } from 'lucide-react'

export default function FichajeHorasPage() {
  const [empleados, setEmpleados] = useState([])
  const [fichajes, setFichajes]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [empFiltro, setEmpFiltro] = useState('')
  const [fechaDesde, setFechaDesde] = useState(new Date(Date.now()-7*86400000).toISOString().split('T')[0])
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split('T')[0])
  const [expandido, setExpandido] = useState(null)

  const cargar = useCallback(async () => {
    const [{ data: emps }, { data: fichs }] = await Promise.all([
      supabase.from('empleados').select('id,nombre,puesto,avatar_color').eq('estado','activo').order('nombre'),
      supabase.from('fichajes').select('*').gte('fecha', fechaDesde).lte('fecha', fechaHasta).order('fecha', {ascending:false}).order('timestamp', {ascending:false}),
    ])
    setEmpleados(emps||[])
    setFichajes(fichs||[])
    setLoading(false)
  }, [fechaDesde, fechaHasta])

  useEffect(() => { setLoading(true); cargar() }, [cargar])

  // Agrupar por empleado
  const byEmp = (empleados||[])
    .filter(e => !empFiltro || e.id === empFiltro)
    .map(e => {
      const miosFichs = (fichajes||[]).filter(f=>f.empleado_id===e.id)
      // Agrupar por día
      const byDay = {}
      miosFichs.forEach(f => {
        if(!byDay[f.fecha]) byDay[f.fecha]=[]
        byDay[f.fecha].push(f)
      })
      // Calcular horas por día
      let totalHoras = 0
      const dias = Object.entries(byDay).map(([fecha, fiches]) => {
        const entrada = fiches.find(f=>f.tipo==='entrada')
        const salida  = fiches.find(f=>f.tipo==='salida')
        const horas   = entrada && salida ? (new Date(salida.timestamp)-new Date(entrada.timestamp))/3600000 : entrada ? (new Date()-new Date(entrada.timestamp))/3600000 : 0
        totalHoras += horas
        return { fecha, entrada: entrada?.timestamp, salida: salida?.timestamp, horas: Math.round(horas*10)/10, completo: !!(entrada&&salida) }
      }).sort((a,b)=>b.fecha.localeCompare(a.fecha))
      return { ...e, dias, totalHoras: Math.round(totalHoras*10)/10, diasTrabajados: dias.filter(d=>d.horas>0).length }
    })

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500"/> Control de horas
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Historial completo de fichajes del equipo</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5">
          <Calendar className="w-4 h-4 text-slate-400"/>
          <input type="date" value={fechaDesde} onChange={e=>setFechaDesde(e.target.value)}
            className="bg-transparent text-sm text-slate-600 dark:text-slate-300 outline-none"/>
          <span className="text-slate-300">→</span>
          <input type="date" value={fechaHasta} onChange={e=>setFechaHasta(e.target.value)}
            className="bg-transparent text-sm text-slate-600 dark:text-slate-300 outline-none"/>
        </div>
        <select value={empFiltro} onChange={e=>setEmpFiltro(e.target.value)}
          className="flex-1 min-w-[160px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-600 dark:text-slate-300 outline-none">
          <option value="">Todos los empleados</option>
          {(empleados||[]).map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-slate-400 animate-pulse py-8 text-center text-sm">Cargando historial...</div>
      ) : (
        <div className="space-y-3">
          {byEmp.map(e => (
            <div key={e.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <button onClick={()=>setExpandido(expandido===e.id?null:e.id)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors text-left">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                  style={{background:e.avatar_color||'#6366f1'}}>
                  {e.nombre?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-700 dark:text-slate-200">{e.nombre}</p>
                  <p className="text-xs text-slate-400">{e.puesto}</p>
                </div>
                <div className="text-right flex-shrink-0 mr-2">
                  <p className="text-lg font-black text-indigo-600">{e.totalHoras}h</p>
                  <p className="text-xs text-slate-400">{e.diasTrabajados} días</p>
                </div>
                {expandido===e.id?<ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0"/>:<ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0"/>}
              </button>

              {expandido===e.id && (
                <div className="border-t border-slate-100 dark:border-slate-700">
                  {e.dias.length === 0 ? (
                    <p className="text-slate-400 text-sm px-5 py-4">Sin registros en este periodo</p>
                  ) : (
                    <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                      {e.dias.map(d => (
                        <div key={d.fecha} className="flex items-center gap-4 px-5 py-2.5">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${d.completo?'bg-emerald-400':d.horas>0?'bg-amber-400':'bg-red-400'}`}/>
                          <p className="text-sm text-slate-600 dark:text-slate-300 w-28 flex-shrink-0">
                            {new Date(d.fecha+'T12:00:00').toLocaleDateString('es-ES',{weekday:'short',day:'numeric',month:'short'})}
                          </p>
                          <p className="text-xs text-slate-400 flex-1">
                            {d.entrada ? new Date(d.entrada).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}) : '—'}
                            {' → '}
                            {d.salida  ? new Date(d.salida).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}) : 'en curso'}
                          </p>
                          <p className={`text-sm font-bold flex-shrink-0 ${d.horas>0?'text-indigo-600':'text-slate-300'}`}>
                            {d.horas > 0 ? d.horas+'h' : '—'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}