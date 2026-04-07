'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Empleado, Fichaje } from '@/lib/supabase'
import { iniciales, BADGE_ESTADO_EMPLEADO, BADGE_FICHAJE, LABEL_FICHAJE, calcularMinutosTrabajados, estadoFichaje, formatHora, minutosAHHMM } from '@/lib/utils'

interface EmpleadoConFichajes extends Empleado {
  fichajes_hoy: Fichaje[]
  estado_fichaje: string
  minutos_hoy: number
}

export default function AdminFichajePage() {
  const [equipo, setEquipo] = useState<EmpleadoConFichajes[]>([])
  const [loading, setLoading] = useState(true)
  const [hora, setHora] = useState(new Date())

  const cargar = useCallback(async () => {
    const hoy = new Date().toISOString().slice(0, 10)
    const { data: empleados } = await supabase.from('empleados').select('*').neq('rol', 'admin').order('nombre')
    if (!empleados) return
    const { data: fichajes } = await supabase.from('fichajes').select('*').eq('fecha', hoy)
    const enriquecidos: EmpleadoConFichajes[] = empleados.map(emp => {
      const fHoy = (fichajes || []).filter(f => f.empleado_id === emp.id).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      return { ...emp, fichajes_hoy: fHoy, estado_fichaje: estadoFichaje(fHoy), minutos_hoy: calcularMinutosTrabajados(fHoy) }
    })
    setEquipo(enriquecidos)
    setLoading(false)
  }, [])

  useEffect(() => { cargar(); const interval = setInterval(cargar, 60000); return () => clearInterval(interval) }, [cargar])
  useEffect(() => { const t = setInterval(() => setHora(new Date()), 1000); return () => clearInterval(t) }, [])

  const trabajando = equipo.filter(e => e.estado_fichaje === 'trabajando').length
  const pausa = equipo.filter(e => e.estado_fichaje === 'pausa').length
  const sinFichar = equipo.filter(e => e.estado_fichaje === 'sin_fichar').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-xl font-bold text-gray-900">Estado del equipo</h1><p className="text-sm text-gray-500 mt-0.5">Fichajes en tiempo real</p></div>
        <div className="text-3xl font-mono font-bold text-indigo-600 tabular-nums">{hora.toLocaleTimeString('es-ES')}</div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[{label:'Trabajando',value:trabajando,color:'text-emerald-600',bg:'bg-emerald-50'},{label:'En pausa',value:pausa,color:'text-amber-600',bg:'bg-amber-50'},{label:'Sin fichar',value:sinFichar,color:'text-gray-600',bg:'bg-gray-50'},{label:'Total plantilla',value:equipo.length,color:'text-indigo-600',bg:'bg-indigo-50'}].map(k => (
          <div key={k.label} className={`card p-4 ${k.bg}`}><p className="text-xs text-gray-500">{k.label}</p><p className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</p></div>
        ))}
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100 bg-gray-50">{['Empleado','Departamento','Estado','Última acción','Tiempo hoy','Estado RRHH'].map(h => (<th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>))}</tr></thead>
            <tbody>
              {loading ? Array.from({length:4}).map((_,i) => (<tr key={i} className="border-b border-gray-50">{Array.from({length:6}).map((_,j) => (<td key={j} className="px-4 py-3"><div className="skeleton h-4 w-24" /></td>))}</tr>))
              : equipo.map(emp => {
                const ultimo = emp.fichajes_hoy[emp.fichajes_hoy.length - 1]
                return (<tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{backgroundColor:emp.avatar_color}}>{iniciales(emp.nombre)}</div><span className="text-sm font-medium text-gray-900">{emp.nombre}</span></div></td>
                  <td className="px-4 py-3 text-sm text-gray-600">{emp.departamento}</td>
                  <td className="px-4 py-3"><span className={`badge ${BADGE_FICHAJE[emp.estado_fichaje] || 'bg-gray-100 text-gray-500'}`}>{LABEL_FICHAJE[emp.estado_fichaje] || 'Sin fichar'}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono">{ultimo ? formatHora(ultimo.timestamp) : '—'}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">{emp.minutos_hoy > 0 ? minutosAHHMM(emp.minutos_hoy) : '—'}</td>
                  <td className="px-4 py-3"><span className={`badge ${BADGE_ESTADO_EMPLEADO[emp.estado]}`}>{emp.estado.charAt(0).toUpperCase() + emp.estado.slice(1)}</span></td>
                </tr>)
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}