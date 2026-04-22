// @ts-nocheck
'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Search, Plus, Users, Building2, Filter, ChevronRight, UserCheck, UserX } from 'lucide-react'

export default function EmpleadosPage() {
  const [empleados, setEmpleados] = useState([])
  const [loading, setLoading]     = useState(true)
  const [busqueda, setBusqueda]   = useState('')
  const [deptFiltro, setDeptFiltro] = useState('')
  const [rolFiltro, setRolFiltro] = useState('')
  const router = useRouter()

  const cargar = useCallback(async () => {
    const { data } = await supabase.from('empleados')
      .select('id,nombre,email,puesto,departamento,rol,estado,avatar_color,fecha_alta,salario_base,tipo_contrato')
      .order('nombre')
    setEmpleados(data||[])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const deptos = [...new Set((empleados||[]).map(e=>e.departamento).filter(Boolean))].sort()
  const roles  = [...new Set((empleados||[]).map(e=>e.rol).filter(Boolean))].sort()

  const filtrados = (empleados||[]).filter(e => {
    const q = busqueda.toLowerCase()
    const matchQ = !q || e.nombre?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q) || e.puesto?.toLowerCase().includes(q)
    const matchD = !deptFiltro || e.departamento === deptFiltro
    const matchR = !rolFiltro  || e.rol === rolFiltro
    return matchQ && matchD && matchR
  })

  const activos   = (empleados||[]).filter(e=>e.estado==='activo').length
  const inactivos = (empleados||[]).filter(e=>e.estado!=='activo').length

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500"/> Empleados
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">{activos} activos · {inactivos} inactivos</p>
        </div>
        <button onClick={()=>router.push('/admin/empleados/nuevo')}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
          <Plus className="w-4 h-4"/> Nuevo empleado
        </button>
      </div>

      {/* Stats por departamento */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {deptos.map(d => {
          const n = (empleados||[]).filter(e=>e.departamento===d&&e.estado==='activo').length
          return(
            <button key={d} onClick={()=>setDeptFiltro(deptFiltro===d?'':d)}
              className={`bg-white dark:bg-slate-800 rounded-xl border p-3 text-left transition-all ${deptFiltro===d?'border-indigo-400 ring-2 ring-indigo-100 dark:ring-indigo-900':'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
              <p className="text-2xl font-black text-indigo-600">{n}</p>
              <p className="text-xs text-slate-500 truncate">{d}</p>
            </button>
          )
        })}
      </div>

      {/* Búsqueda y filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
          <input value={busqueda} onChange={e=>setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, email o puesto..."
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-200"/>
        </div>
        <select value={rolFiltro} onChange={e=>setRolFiltro(e.target.value)}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-600 dark:text-slate-300 outline-none focus:border-indigo-500 min-w-[130px]">
          <option value="">Todos los roles</option>
          {roles.map(r=><option key={r} value={r}>{r}</option>)}
        </select>
        {(busqueda||deptFiltro||rolFiltro) && (
          <button onClick={()=>{setBusqueda('');setDeptFiltro('');setRolFiltro('')}}
            className="px-3 py-2.5 text-sm text-slate-400 hover:text-slate-600 border border-slate-200 dark:border-slate-700 rounded-xl">
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla / lista */}
      {loading ? (
        <div className="text-slate-400 text-sm animate-pulse py-8 text-center">Cargando empleados...</div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Header tabla */}
          <div className="hidden sm:grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-slate-100 dark:border-slate-700 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <div className="w-10"/>
            <div>Nombre</div>
            <div>Puesto / Departamento</div>
            <div>Contrato</div>
            <div>Estado</div>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {filtrados.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3"/>
                <p className="text-slate-400 text-sm">No se encontraron empleados</p>
              </div>
            ) : filtrados.map(e => (
              <button key={e.id} onClick={()=>router.push('/admin/empleados/'+e.id)}
                className="w-full grid grid-cols-1 sm:grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors text-left">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                  style={{background:e.avatar_color||'#6366f1'}}>
                  {e.nombre?.charAt(0)||'?'}
                </div>
                {/* Nombre / email */}
                <div className="min-w-0">
                  <p className="font-semibold text-slate-700 dark:text-slate-200 truncate">{e.nombre}</p>
                  <p className="text-xs text-slate-400 truncate">{e.email}</p>
                </div>
                {/* Puesto / Depto */}
                <div className="hidden sm:block min-w-0">
                  <p className="text-sm text-slate-600 dark:text-slate-300 truncate">{e.puesto||'—'}</p>
                  <p className="text-xs text-slate-400 truncate">{e.departamento||'—'}</p>
                </div>
                {/* Contrato */}
                <div className="hidden sm:block">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 capitalize">
                    {e.tipo_contrato||'—'}
                  </span>
                </div>
                {/* Estado */}
                <div className="flex items-center gap-2 justify-end sm:justify-start">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${e.estado==='activo'?'bg-emerald-400':'bg-slate-300'}`}/>
                  <span className="text-xs text-slate-500 capitalize hidden sm:block">{e.estado||'activo'}</span>
                  <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0"/>
                </div>
              </button>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <p className="text-xs text-slate-400">{filtrados.length} de {(empleados||[]).length} empleados</p>
          </div>
        </div>
      )}
    </div>
  )
}