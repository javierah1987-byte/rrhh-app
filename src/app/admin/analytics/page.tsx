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
  const pct = max > 0 ? Math.min((Number(String(value).replace(/[^0-9.]/g,'')) / max) * 100, 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-600 dark:text-slate-300 w-32 truncate flex-shrink-0">{label}</span>
      <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
        <div className="h-2.5 rounded-full transition-all" style={{width:`${pct}%`, background: color || '#6366f1'}}/>
      </div>
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 w-14 text-right flex-shrink-0">{value}</span>
    </div>
  )
}

export default function PeopleAnalyticsPage() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('mes')

  useEffect(() => { loadData() }, [periodo])

  const loadData = async () => {
    setLoading(true)
    const hoy = new Date()
    const desde = periodo === 'mes'
      ? new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0]
      : new Date(hoy.getFullYear(), 0, 1).toISOString().split('T')[0]

    const [r_emps, r_fich, r_sols, r_bajas, r_gastos, r_evals] = await Promise.all([
      supabase.from('empleados').select('id,nombre,puesto,departamento,rol,fecha_alta,estado'),
      supabase.from('fichajes').select('empleado_id,tipo,fecha').gte('fecha', desde),
      supabase.from('solicitudes').select('empleado_id,tipo,estado,fecha_inicio').gte('fecha_inicio', desde),
      supabase.from('bajas').select('empleado_id,tipo,fecha_inicio,fecha_alta,activa').gte('fecha_inicio', desde),
      supabase.from('gastos').select('empleado_id,importe,estado,categoria').gte('created_at', desde),
      supabase.from('evaluaciones').select('empleado_id,puntuacion,estado').gte('created_at', desde),
    ])

    const empleados  = r_emps.data  || []
    const fichajes   = r_fich.data  || []
    const solicitudes = r_sols.data || []
    const bajas      = r_bajas.data || []
    const gastos     = r_gastos.data || []
    const evals      = r_evals.data || []

    // Días de asistencia por empleado
    const diasPorEmp = {}
    fichajes.filter(f => f.tipo === 'entrada').forEach(f => {
      if (!diasPorEmp[f.empleado_id]) diasPorEmp[f.empleado_id] = new Set()
      diasPorEmp[f.empleado_id].add(f.fecha)
    })

    // Asistencia por departamento
    const deptos = {}
    empleados.forEach(e => {
      if (!e.departamento) return
      if (!deptos[e.departamento]) deptos[e.departamento] = { total: 0, dias: 0 }
      deptos[e.departamento].total++
      deptos[e.departamento].dias += diasPorEmp[e.id]?.size || 0
    })

    // Gastos por categoría (aprobados)
    const gastosCat = {}
    gastos.filter(g => g.estado === 'aprobado').forEach(g => {
      const cat = g.categoria || 'Otros'
      gastosCat[cat] = (gastosCat[cat] || 0) + Number(g.importe)
    })

    // Antigüedad del equipo
    const ahora = new Date()
    const antiguedades = empleados.map(e => {
      const inc = e.fecha_alta ? new Date(e.fecha_alta) : new Date('2023-01-01')
      const meses = Math.max(0, Math.floor((ahora - inc) / (30 * 24 * 60 * 60 * 1000)))
      return { nombre: e.nombre, meses, años: Math.floor(meses / 12) }
    }).sort((a, b) => b.meses - a.meses)

    // Métricas clave
    const totalDiasFichados = Object.values(diasPorEmp).reduce((s, v) => s + v.size, 0)
    const totalGastos       = gastos.filter(g => g.estado === 'aprobado').reduce((s, g) => s + Number(g.importe), 0)
    const ausenciaPend      = solicitudes.filter(s => s.estado === 'pendiente').length
    const bajasActivas      = bajas.filter(b => b.activa === true || !b.fecha_alta).length
    const totalDiasBaja     = bajas.reduce((s, b) => {
      if (!b.fecha_inicio) return s
      const fin = b.fecha_alta ? new Date(b.fecha_alta) : new Date()
      return s + Math.max(0, Math.floor((fin - new Date(b.fecha_inicio)) / 86400000))
    }, 0)
    const mediaEval = evals.length > 0
      ? (evals.reduce((s, e) => s + (Number(e.puntuacion) || 0), 0) / evals.length).toFixed(1)
      : null

    setData({
      empleados, fichajes, gastos, evals, bajas,
      diasPorEmp, deptos, gastosCat, antiguedades,
      totalDiasFichados, totalGastos, ausenciaPend, bajasActivas, totalDiasBaja, mediaEval,
    })
    setLoading(false)
  }

  if (loading) return (
    <div className="p-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded-xl"/>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_,i) => <div key={i} className="h-28 bg-slate-200 dark:bg-slate-700 rounded-xl"/>)}
        </div>
      </div>
    </div>
  )

  const {
    empleados, diasPorEmp, deptos, gastosCat, antiguedades,
    totalDiasFichados, totalGastos, ausenciaPend, bajasActivas, totalDiasBaja, mediaEval,
  } = data

  const maxDepDias = Math.max(...Object.values(deptos).map(d => d.dias), 1)
  const maxGasto   = Math.max(...Object.values(gastosCat), 1)
  const maxEmpDias = Math.max(...empleados.map(e => diasPorEmp[e.id]?.size || 0), 1)
  const maxMeses   = Math.max(...antiguedades.map(a => a.meses), 1)

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
          {[['mes','Este mes'],['año','Este año']].map(([k,l]) => (
            <button key={k} onClick={() => setPeriodo(k)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${periodo===k?'bg-white dark:bg-slate-700 shadow text-indigo-600':'text-slate-500 hover:text-slate-700'}`}>{l}</button>
          ))}
        </div>
      </div>

      {/* KPIs fila 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <KPI icon={Users}        label="Empleados"        value={empleados.length}                          sub="en la empresa"        color="#6366f1"/>
        <KPI icon={Clock}        label="Días fichados"    value={totalDiasFichados}                         sub="entradas registradas" color="#10b981"/>
        <KPI icon={Award}        label="Evaluación media" value={mediaEval ? mediaEval+'/10' : 'Sin datos'} sub="desempeño"            color="#ec4899"/>
        <KPI icon={TrendingUp}   label="Gastos aprobados" value={totalGastos.toFixed(0)+'€'}               sub="total periodo"        color="#0891b2"/>
      </div>

      {/* KPIs fila 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPI icon={Calendar}      label="Días de baja"         value={totalDiasBaja}    sub="en el periodo"  color="#ef4444"/>
        <KPI icon={AlertTriangle} label="Ausencias pendientes" value={ausenciaPend}     sub="por aprobar"    color="#f59e0b"/>
        <KPI icon={Smile}         label="Bajas activas"        value={bajasActivas}     sub="IT en curso"    color="#8b5cf6"/>
        <KPI icon={Users}         label="Con fichaje hoy"      value={Object.keys(diasPorEmp).filter(id => {
          const hoy = new Date().toISOString().split('T')[0]
          return diasPorEmp[id]?.has(hoy)
        }).length} sub="presentes hoy" color="#10b981"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Asistencia por departamento */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500"/> Asistencia por departamento
          </h3>
          {Object.keys(deptos).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(deptos).sort((a,b) => b[1].dias - a[1].dias).map(([dep, d]) => (
                <BarRow key={dep} label={dep} value={d.dias+' días'} max={maxDepDias} color="#6366f1"/>
              ))}
            </div>
          ) : <p className="text-slate-400 text-sm">Sin datos de asistencia en el periodo</p>}
        </div>

        {/* Gastos por categoría */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500"/> Gastos por categoría
          </h3>
          {Object.keys(gastosCat).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(gastosCat).sort((a,b) => b[1]-a[1]).map(([cat, imp]) => (
                <BarRow key={cat} label={cat} value={Number(imp).toFixed(0)+'€'} max={maxGasto} color="#10b981"/>
              ))}
            </div>
          ) : <p className="text-slate-400 text-sm">Sin gastos aprobados en el periodo</p>}
        </div>

        {/* Asistencia por persona */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500"/> Asistencia por persona
          </h3>
          <div className="space-y-3">
            {empleados.slice(0, 8).map(e => (
              <BarRow key={e.id} label={e.nombre.split(' ')[0]} value={(diasPorEmp[e.id]?.size || 0)+' días'} max={maxEmpDias} color="#6366f1"/>
            ))}
          </div>
        </div>

        {/* Antigüedad del equipo */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500"/> Antigüedad del equipo
          </h3>
          <div className="space-y-3">
            {antiguedades.slice(0, 8).map(a => (
              <BarRow key={a.nombre} label={a.nombre.split(' ')[0]}
                value={a.años > 0 ? a.años+'a ' + (a.meses%12) + 'm' : a.meses+'m'}
                max={maxMeses} color="#f59e0b"/>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}