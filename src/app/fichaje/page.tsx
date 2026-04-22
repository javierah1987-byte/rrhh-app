// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Clock, Users, CheckCircle, AlertTriangle, TrendingUp, Wifi } from 'lucide-react'

export default function FichajeDashboardPage() {
  const [stats, setStats]   = useState({presentes:0, total:0, horas_hoy:0, correcciones:0})
  const [empleados, setEmpleados] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      const hoy = new Date().toISOString().split('T')[0]
      const [{ data: emps }, { data: fichs }, { data: corrs }] = await Promise.all([
        supabase.from('empleados').select('id,nombre,puesto,avatar_color').eq('estado','activo'),
        supabase.from('fichajes').select('empleado_id,tipo,timestamp').eq('fecha', hoy),
        supabase.from('fichajes').select('id').eq('fecha', hoy).eq('tipo', 'correccion'),
      ])

      const empList = emps || []
      const fichList = fichs || []

      const entradasHoy = fichList.filter(f=>f.tipo==='entrada')
      const presentes = entradasHoy.filter(e => !fichList.some(f=>f.tipo==='salida'&&f.empleado_id===e.empleado_id)).length

      const totalHoras = entradasHoy.reduce((s, e) => {
        const salida = fichList.find(f=>f.tipo==='salida'&&f.empleado_id===e.empleado_id)
        const fin = salida ? new Date(salida.timestamp) : new Date()
        return s + (fin - new Date(e.timestamp)) / 3600000
      }, 0)

      setStats({ presentes, total: empList.length, horas_hoy: Math.round(totalHoras*10)/10, correcciones: corrs?.length||0 })

      // Estado de cada empleado
      setEmpleados(empList.map(e => {
        const entrada = fichList.find(f=>f.tipo==='entrada'&&f.empleado_id===e.id)
        const salida  = fichList.find(f=>f.tipo==='salida' &&f.empleado_id===e.id)
        const status  = !entrada ? 'ausente' : salida ? 'salida' : 'presente'
        const horas   = entrada ? Math.floor((salida?new Date(salida.timestamp):new Date() - new Date(entrada.timestamp))/3600000) : 0
        const hora    = entrada ? new Date(entrada.timestamp).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}) : null
        return { ...e, status, horas, hora }
      }))

      setLoading(false)
    }
    cargar()
    const iv = setInterval(cargar, 30000)
    return () => clearInterval(iv)
  }, [])

  const fecha = new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'})

  if (loading) return <div className="p-8 text-slate-400 animate-pulse text-sm">Cargando...</div>

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Panel de fichaje</h1>
        <p className="text-slate-400 capitalize mt-0.5">{fecha}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Presentes ahora', val: stats.presentes+'/'+stats.total, color:'#10b981', bg:'bg-emerald-50 dark:bg-emerald-900/10', icon:Wifi, dot:true },
          { label:'Horas acumuladas hoy', val: stats.horas_hoy+'h', color:'#6366f1', bg:'bg-indigo-50 dark:bg-indigo-900/10', icon:Clock },
          { label:'Han fichado hoy', val: empleados.filter(e=>e.status!=='ausente').length, color:'#0891b2', bg:'bg-sky-50 dark:bg-sky-900/10', icon:CheckCircle },
          { label:'Sin fichar', val: empleados.filter(e=>e.status==='ausente').length, color:'#f59e0b', bg:'bg-amber-50 dark:bg-amber-900/10', icon:AlertTriangle },
        ].map((s,i) => {
          const Icon = s.icon
          return(
            <div key={i} className={`${s.bg} border border-slate-200 dark:border-slate-700 rounded-2xl p-5`}>
              <div className="flex items-center justify-between mb-3">
                <Icon className="w-5 h-5" style={{color:s.color}}/>
                {s.dot && <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>}
              </div>
              <p className="text-3xl font-black" style={{color:s.color}}>{s.val}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          )
        })}
      </div>

      {/* Estado del equipo */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500"/> Estado del equipo hoy
          </h2>
          <span className="text-xs text-slate-400">Actualización en tiempo real</span>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
          {empleados.length === 0 ? (
            <p className="text-slate-400 text-sm p-6 text-center">No hay empleados registrados</p>
          ) : empleados.map(e => (
            <div key={e.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
                  style={{background:e.avatar_color||'#6366f1'}}>
                  {e.nombre?.charAt(0)}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-800 ${
                  e.status==='presente'?'bg-emerald-400':e.status==='salida'?'bg-amber-400':'bg-slate-300'
                }`}/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{e.nombre}</p>
                <p className="text-xs text-slate-400">{e.puesto}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-medium ${e.status==='presente'?'text-emerald-600':e.status==='salida'?'text-amber-600':'text-slate-400'}`}>
                  {e.status==='presente'?'Trabajando':e.status==='salida'?'Ha salido':'Sin fichar'}
                </p>
                {e.hora && (
                  <p className="text-xs text-slate-400">
                    Entrada {e.hora}{e.horas>0?' · '+e.horas+'h':''}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Acceso rápido al kiosko */}
      <a href="/kiosko" target="_blank"
        className="flex items-center gap-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-6 py-4 transition-colors shadow-lg shadow-indigo-900/20">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Clock className="w-6 h-6"/>
        </div>
        <div>
          <p className="font-bold text-lg">Abrir Kiosko de Fichaje</p>
          <p className="text-indigo-200 text-sm">Los empleados pueden fichar desde aquí</p>
        </div>
        <div className="ml-auto text-indigo-200 text-2xl">→</div>
      </a>
    </div>
  )
}