'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { MESES, calcularMinutosTrabajados, minutosAHHMM, diasEntre } from '@/lib/utils'
import { Download, BarChart3 } from 'lucide-react'

export default function InformesPage() {
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [datos, setDatos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [resumen, setResumen] = useState({ totalEmpleados: 0, totalHoras: 0, bajas: 0, solicitudes: 0 })

  const cargar = useCallback(async () => {
    setLoading(true)
    const desde = `${anio}-${String(mes).padStart(2,'0')}-01`
    const hasta = `${anio}-${String(mes).padStart(2,'0')}-31`

    const { data: emps } = await supabase.from('empleados').select('*').neq('rol', 'admin')
    const { data: fichs } = await supabase.from('fichajes').select('*').gte('fecha', desde).lte('fecha', hasta)
    const { data: sols } = await supabase.from('solicitudes').select('*').gte('fecha_inicio', desde).lte('fecha_inicio', hasta)
    const { data: bajas } = await supabase.from('bajas').select('*').gte('fecha_inicio', desde).lte('fecha_inicio', hasta)

    const filas = (emps || []).map(emp => {
      const fEmp = (fichs || []).filter(f => f.empleado_id === emp.id)
      const dias = [...new Set(fEmp.map(f => f.fecha))]
      const minutos = dias.reduce((acc, dia) => {
        const del_dia = fEmp.filter(f => f.fecha === dia).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        return acc + calcularMinutosTrabajados(del_dia)
      }, 0)
      const jornadaMin = emp.jornada_horas * dias.length * 60
      const solsMes = (sols || []).filter(s => s.empleado_id === emp.id)
      const diasVacas = solsMes.filter(s => s.tipo === 'vacaciones' && s.estado === 'aprobada').reduce((a,s) => a + diasEntre(s.fecha_inicio, s.fecha_fin), 0)
      return { emp, diasTrabajados: dias.length, minutos, jornadaMin, extra: minutos - jornadaMin, diasVacas }
    })

    setDatos(filas)
    setResumen({
      totalEmpleados: emps?.length || 0,
      totalHoras: Math.floor(filas.reduce((a, f) => a + f.minutos, 0) / 60),
      bajas: bajas?.length || 0,
      solicitudes: sols?.length || 0,
    })
    setLoading(false)
  }, [anio, mes])

  useEffect(() => { cargar() }, [cargar])

  async function exportar() {
    const { utils, writeFileXLSX } = await import('xlsx')
    const rows = [['Empleado', 'Departamento', 'Días trabajados', 'Horas totales', 'Extra/Déficit', 'Días vacaciones']]
    datos.forEach(({ emp, diasTrabajados, minutos, extra, diasVacas }) => {
      rows.push([emp.nombre, emp.departamento, diasTrabajados, minutosAHHMM(minutos), minutosAHHMM(extra), diasVacas])
    })
    const ws = utils.aoa_to_sheet(rows)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, `Informe ${MESES[mes]} ${anio}`)
    writeFileXLSX(wb, `informe_${MESES[mes]}_${anio}.xlsx`)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-xl font-bold text-gray-900">Informes</h1><p className="text-sm text-gray-500 mt-0.5">Datos de presencia y RRHH</p></div>
        <div className="flex items-center gap-3">
          <select value={mes} onChange={e => setMes(Number(e.target.value))} className="input w-32">
            {MESES.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select value={anio} onChange={e => setAnio(Number(e.target.value))} className="input w-24">
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={exportar} className="btn-primary flex items-center gap-1.5"><Download className="w-4 h-4" />Excel</button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Empleados', value: resumen.totalEmpleados, color: 'text-indigo-600' },
          { label: 'Horas totales', value: resumen.totalHoras + 'h', color: 'text-emerald-600' },
          { label: 'Bajas', value: resumen.bajas, color: 'text-red-600' },
          { label: 'Solicitudes', value: resumen.solicitudes, color: 'text-amber-600' },
        ].map(k => (
          <div key={k.label} className="card p-4">
            <p className="text-xs text-gray-500">{k.label}</p>
            <p className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 bg-gray-50">
            {['Empleado', 'Departamento', 'Días', 'Horas', 'Extra/Déficit', 'Vacaciones'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading ? Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-50">{Array.from({length:6}).map((_,j) => <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-16" /></td>)}</tr>
            )) : datos.map(({ emp, diasTrabajados, minutos, extra, diasVacas }) => (
              <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{emp.nombre}</td>
                <td className="px-4 py-3 text-gray-600">{emp.departamento}</td>
                <td className="px-4 py-3 text-gray-900 font-mono">{diasTrabajados}</td>
                <td className="px-4 py-3 text-gray-900 font-mono">{minutosAHHMM(minutos)}</td>
                <td className="px-4 py-3 font-mono"><span className={extra >= 0 ? 'text-emerald-600' : 'text-red-500'}>{extra >= 0 ? '+' : ''}{minutosAHHMM(extra)}</span></td>
                <td className="px-4 py-3 text-gray-600">{diasVacas > 0 ? `${diasVacas} días` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}