// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { BarChart2, TrendingUp, Users, Clock, Award, AlertTriangle, Calendar, Smile } from 'lucide-react'

function KPI({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-sm">{label}</p>
          <p className="text-3xl font-black mt-1" style={{color}}>{value}</p>
          {sub && <p className="text-slate-400 text-xs mt-1">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: color+'20'}}>
          <Icon className="w-5 h-5" style={{color}}/>
        </div>
      </div>
    </div>
  )
}

function BarRow({ label, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-600 dark:text-slate-300 w-28 truncate flex-shrink-0">{label}</span>
      <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
        <div className="h-2.5 rounded-full transition-all" style={{width:`${pct}%`, background: color || '#6366f1'}}/>
      </div>
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 w-12 text-right flex-shrink-0">{value}</span>
    </div>
  )
}

export default function PeopleAnalyticsPage() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('mes')

  useEffect(() => {
    loadData()
  }, [periodo])

  const loadData = async () => {
    setLoading(true)
    const hoy = new Date()
    const mesActual = hoy.toISOString().slice(0,7)
    const desde = periodo === 'mes'
      ? new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString()
      : new Date(hoy.getFullYear(), 0, 1).toISOString()

    const [emps, fichajes, solicitudes, bajas, gastos, evaluaciones, encuestas] = await Promise.all([
      supabase.from('empleados').select('id,nombre,puesto,departamento,rol,fecha_incorporacion,estado'),
      supabase.from('fichajes').select('empleado_id,tipo,fecha,timestamp').gte('fecha', desde.slice(0,10)),
      supabase.from('solicitudes_ausencia').select('empleado_id,tipo,estado,fecha_inicio,fecha_fin').gte('fecha_inicio', desde.slice(0,10)),
      supabase.from('bajas').select('empleado_id,tipo,fecha_inicio,fecha_fin,estado').gte('fecha_inicio', desde.slice(0,10)),
      supabase.from('gastos').select('empleado_id,importe,estado,categoria').gte('created_at', desde),
      supabase.from('evaluaciones').select('empleado_id,puntuacion,tipo').gte('created_at', desde),
      supabase.from('encuestas').select('puntuacion').eq('activa', false),
    ])

    const empleados = emps.data || []
    const fich = fichajes.data || []
    const sols = solicitudes.data || []
    const bj = bajas.data || []
    const gst = gastos.data || []
    const evs = evaluaciones.data || []
    const enc = encuestas.data || []

    // Horas por empleado (contar días únicos con fichaje entrada)
    const diasPorEmp = {}
    fich.filter(f => f.tipo === 'entrada').forEach(f => {
      if (!diasPorEmp[f.empleado_id]) diasPorEmp[f.empleado_id] = new Set()
      diasPorEmp[f.empleado_id].add(f.fecha)
    })

    // Asistencia por depto
    const deptos = {}
    empleados.forEach(e => {
      if (!e.departamento) return
      if (!deptos[e.departamento]) deptos[e.departamento] = {total:0, dias:0}
      deptos[e.departamento].total++
      deptos[e.departamento].dias += diasPorEmp[e.id]?.size || 0
    })

    // Vacaciones pendientes por empleado
    const vacPend = {}
    sols.filter(s => s.tipo === 'vacaciones' && s.estado === 'pendiente').forEach(s => {
      const emp = empleados.find(e => e.id === s.empleado_id)
      if (emp) vacPend[emp.nombre] = (vacPend[emp.nombre] || 0) + 1
    })

    // Antigüedad
    const ahora = new Date()
    const antiguedades = empleados.map(e => {
      const inc = new Date(e.fecha_incorporacion || '2020-01-01')
      const meses = Math.floor((ahora - inc) / (30 * 24 * 60 * 60 * 1000))
      return { nombre: e.nombre, meses, años: Math.floor(meses/12) }
    }).sort((a,b) => b.meses - a.meses)

    // Gastos por categoría
    const gastosCat = {}
    gst.forEach(g => { gastosCat[g.categoria || 'Otro'] = (gastosCat[g.categoria || 'Otro'] || 0) + Number(g.importe) })

    // Puntuación media encuestas
    const mediaClima = enc.length > 0 ? (enc.reduce((s,e) => s + (e.puntuacion||0), 0) / enc.length).toFixed(1) : '-'

    // Puntuación media evaluaciones
    const mediaEval = evs.length > 0 ? (evs.reduce((s,e) => s + (e.puntuacion||0), 0) / evs.length).toFixed(1) : '-'

    // Días de baja
    const totalDiasBaja = bj.reduce((s,b) => {
      if (!b.fecha_inicio) return s
      const fin = b.fecha_fin ? new Date(b.fecha_fin) : new Date()
      const ini = new Date(b.fecha_inicio)
      return s + Math.max(0, Math.floor((fin-ini)/(86400000)))
    }, 0)

    // Total gastos aprobados
    const totalGastos = gst.filter(g=>g.estado==='aprobado').reduce((s,g)=>s+Number(g.importe),0)

    setData({
      empleados, fich, sols, bj, gst, evs,
      diasPorEmp, deptos, vacPend, antiguedades,
      gastosCat, mediaClima, mediaEval, totalDiasBaja, totalGastos,
      totalDiasFichados: Object.values(diasPorEmp).reduce((s,v)=>s+v.size,0),
    })
    setLoading(false)
  }

  if (loading) return <div className="p-8 text-slate-400 text-sm">Cargando analytics...</div>

  const {empleados:emps, diasPorEmp, deptos, vacPend, antiguedades, gastosCat, mediaClima, mediaEval, totalDiasBaja, totalGastos, totalDiasFichados, sols, bj} = data
  const maxDepDias = Math.max(...Object.values(deptos).map(d=>d.dias), 1)
  const maxGasto = Math.max(...Object.values(gastosCat), 1)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BarChart2 className="w-7 h-7 text-indigo-600"/> People Analytics
          </h1>
          <p className="text-slate-500 text-sm mt-1">Métricas clave de tu equipo</p>
        </div>
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          {[['mes','Este mes'],['año','Este año']].map(([k,l])=>(
            <button key={k} onClick={()=>setPeriodo(k)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${periodo===k?'bg-white dark:bg-slate-700 shadow text-indigo-600':'text-slate-500 hover:text-slate-700'}`}>{l}</button>
          ))}
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPI icon={Users}       label="Empleados activos"   value={emps.length}               sub="en plantilla"            color="#6366f1"/>
        <KPI icon={Clock}       label="Días fichados"        value={totalDiasFichados}          sub="registros de entrada"   color="#10b981"/>
        <KPI icon={Smile}       label="Clima laboral"        value={mediaClima + '/10'}         sub="media encuestas"         color="#f59e0b"/>
        <KPI icon={Award}       label="Evaluación media"     value={mediaEval !== '-' ? mediaEval + '/10' : '-'} sub="desempeño" color="#ec4899"/>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPI icon={Calendar}     label="Días de baja"         value={totalDiasBaja}              sub="en el periodo"          color="#ef4444"/>
        <KPI icon={TrendingUp}   label="Gastos aprobados"     value={totalGastos.toFixed(0)+'€'} sub="total periodo"          color="#0891b2"/>
        <KPI icon={AlertTriangle} label="Ausencias pendientes" value={sols?.filter(s=>s.estado==='pendiente').length || 0} sub="por aprobar" color="#f59e0b"/>
        <KPI icon={Users}        label="Bajas activas"         value={bj?.filter(b=>!b.fecha_fin).length || 0} sub="IT en curso" color="#8b5cf6"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Asistencia por departamento */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500"/> Asistencia por departamento
          </h3>
          <div className="space-y-3">
            {Object.entries(deptos).sort((a,b)=>b[1].dias-a[1].dias).map(([dep,d])=>(
              <BarRow key={dep} label={dep} value={d.dias} max={maxDepDias} color="#6366f1"/>
            ))}
          </div>
        </div>

        {/* Gastos por categoría */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500"/> Gastos por categoría
          </h3>
          <div className="space-y-3">
            {Object.entries(gastosCat).sort((a,b)=>b[1]-a[1]).map(([cat,imp])=>(
              <BarRow key={cat} label={cat} value={imp.toFixed(0)+'€'} max={maxGasto} color="#10b981"/>
            ))}
            {Object.keys(gastosCat).length === 0 && <p className="text-slate-400 text-sm">Sin gastos en el periodo</p>}
          </div>
        </div>

        {/* Días fichados por persona */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500"/> Asistencia por persona
          </h3>
          <div className="space-y-3">
            {emps.slice(0,6).map(e => {
              const dias = diasPorEmp[e.id]?.size || 0
              const maxDias = Math.max(...emps.map(x => diasPorEmp[x.id]?.size||0), 1)
              return <BarRow key={e.id} label={e.nombre} value={dias+' días'} max={maxDias} color="#6366f1"/>
            })}
          </div>
        </div>

        {/* Antigüedad del equipo */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500"/> Antigüedad del equipo
          </h3>
          <div className="space-y-3">
            {antiguedades.slice(0,6).map(a=>{
              const maxMeses = Math.max(...antiguedades.map(x=>x.meses), 1)
              return <BarRow key={a.nombre} label={a.nombre}
                value={a.años > 0 ? a.años+'a '+((a.meses%12))+'m' : a.meses+'m'}
                max={maxMeses} color="#f59e0b"/>
            })}
          </div>
        </div>
      </div>
    </div>
  )
}