'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Plus, Search, ExternalLink } from 'lucide-react'

type Emp = { id:string; nombre:string; email:string; departamento:string; puesto:string; tipo_contrato:string; fecha_alta:string; estado:string; avatar_color:string }

const ESTADO_STYLE: Record<string,string> = {
  activo: 'badge-green', baja: 'badge-red', vacaciones: 'badge-amber'
}

export default function EmpleadosPage() {
  const router = useRouter()
  const [empleados, setEmpleados] = useState<Emp[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [counts, setCounts] = useState({ total: 0, activos: 0 })

  useEffect(() => {
    supabase.from('empleados').select('*').order('nombre')
      .then(({ data }) => {
        const emps = data || []
        setEmpleados(emps)
        setCounts({ total: emps.length, activos: emps.filter(e => e.estado === 'activo').length })
        setLoading(false)
      })
  }, [])

  async function cambiarEstado(id: string, estado: string) {
    await supabase.from('empleados').update({ estado }).eq('id', id)
    setEmpleados(prev => prev.map(e => e.id === id ? { ...e, estado } : e))
  }

  const filtrados = empleados.filter(e =>
    !busqueda || e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.departamento?.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.puesto?.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Empleados</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{counts.activos} activos de {counts.total}</p>
        </div>
        <button onClick={() => router.push('/admin/empleados/nuevo')} className="btn-primary">
          <Plus className="w-4 h-4" />Nuevo empleado
        </button>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
          className="input pl-9 max-w-sm"
          placeholder="Buscar por nombre o departamento..." />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600" /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Empleado</th>
                <th className="table-header">Departamento</th>
                <th className="table-header">Puesto</th>
                <th className="table-header">Tipo contrato</th>
                <th className="table-header">Alta</th>
                <th className="table-header">Estado</th>
                <th className="table-header">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(e => (
                <tr key={e.id} className="table-row cursor-pointer" onClick={() => router.push(`/admin/empleados/${e.id}`)}>
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: e.avatar_color || '#6366f1' }}>
                        {e.nombre.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{e.nombre}</p>
                        <p className="text-xs text-slate-400">{e.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">{e.departamento}</td>
                  <td className="table-cell">{e.puesto}</td>
                  <td className="table-cell capitalize">{e.tipo_contrato?.replace(/_/g, ' ')}</td>
                  <td className="table-cell">{e.fecha_alta}</td>
                  <td className="table-cell" onClick={ev => ev.stopPropagation()}>
                    <select value={e.estado} onChange={ev => cambiarEstado(e.id, ev.target.value)}
                      className={`badge cursor-pointer border-0 capitalize ${ESTADO_STYLE[e.estado] || 'badge-slate'}`}>
                      <option value="activo">Activo</option>
                      <option value="baja">Baja</option>
                      <option value="vacaciones">Vacaciones</option>
                    </select>
                  </td>
                  <td className="table-cell" onClick={ev => ev.stopPropagation()}>
                    <button onClick={() => router.push(`/admin/empleados/${e.id}`)}
                      className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-medium">
                      <ExternalLink className="w-3.5 h-3.5" />Ver ficha
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtrados.length === 0 && (
            <p className="text-center text-slate-400 py-12">No se encontraron empleados</p>
          )}
        </div>
      )}
    </div>
  )
}