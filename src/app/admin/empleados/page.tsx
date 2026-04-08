'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Empleado } from '@/lib/supabase'
import { iniciales, BADGE_ESTADO_EMPLEADO, formatFecha } from '@/lib/utils'
import { Search, Plus, X } from 'lucide-react'

export default function EmpleadosPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [seleccionado, setSeleccionado] = useState<Empleado | null>(null)
  const [toast, setToast] = useState('')
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  const cargar = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('empleados').select('*').order('nombre')
    setEmpleados(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const filtrados = empleados.filter(e =>
    e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.departamento.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.puesto.toLowerCase().includes(busqueda.toLowerCase())
  )

  const departamentos = [...new Set(empleados.map(e => e.departamento))].sort()

  return (
    <div>
      {toast && <div className="fixed top-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm z-50">{toast}</div>}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Empleados</h1>
          <p className="text-sm text-gray-500 mt-0.5">{empleados.filter(e => e.estado === 'activo').length} activos · {empleados.length} total</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Activos', value: empleados.filter(e => e.estado === 'activo').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'De baja', value: empleados.filter(e => e.estado === 'baja').length, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Vacaciones', value: empleados.filter(e => e.estado === 'vacaciones').length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Departamentos', value: departamentos.length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map(k => (
          <div key={k.label} className={`card p-4 ${k.bg}`}>
            <p className="text-xs text-gray-500">{k.label}</p>
            <p className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)} className="input pl-9" placeholder="Buscar por nombre, departamento o puesto..." />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 bg-gray-50">
            {['Empleado', 'Departamento', 'Puesto', 'Contrato', 'Alta', 'Estado'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-50">
                {Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-20" /></td>
                ))}
              </tr>
            )) : filtrados.map(emp => (
              <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setSeleccionado(emp)}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: emp.avatar_color }}>
                      {iniciales(emp.nombre)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{emp.nombre}</p>
                      <p className="text-xs text-gray-400">{emp.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{emp.departamento}</td>
                <td className="px-4 py-3 text-gray-600">{emp.puesto}</td>
                <td className="px-4 py-3 text-gray-600">{emp.tipo_contrato}</td>
                <td className="px-4 py-3 text-gray-600">{formatFecha(emp.fecha_alta)}</td>
                <td className="px-4 py-3"><span className={`badge ${BADGE_ESTADO_EMPLEADO[emp.estado]}`}>{emp.estado}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {seleccionado && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Ficha del empleado</h3>
              <button onClick={() => setSeleccionado(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold" style={{ backgroundColor: seleccionado.avatar_color }}>
                {iniciales(seleccionado.nombre)}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-lg">{seleccionado.nombre}</p>
                <p className="text-sm text-gray-500">{seleccionado.email}</p>
                <span className={`badge mt-1 ${BADGE_ESTADO_EMPLEADO[seleccionado.estado]}`}>{seleccionado.estado}</span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {[
                ['Departamento', seleccionado.departamento],
                ['Puesto', seleccionado.puesto],
                ['Tipo contrato', seleccionado.tipo_contrato],
                ['Jornada', `${seleccionado.jornada_horas}h / día`],
                ['Fecha de alta', formatFecha(seleccionado.fecha_alta)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-medium text-gray-900">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}