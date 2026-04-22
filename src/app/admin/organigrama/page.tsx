// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, ChevronDown, ChevronRight } from 'lucide-react'

const ROL_COLORS = {
  owner:   { bg:'#4f46e515', border:'#4f46e5', text:'#4f46e5', label:'Director' },
  admin:   { bg:'#10b98115', border:'#10b981', text:'#10b981', label:'Admin' },
  manager: { bg:'#f59e0b15', border:'#f59e0b', text:'#f59e0b', label:'Manager' },
  empleado:{ bg:'#64748b15', border:'#64748b', text:'#64748b', label:'Empleado' },
}

function EmpleadoCard({ emp, children, depth = 0 }) {
  const [open, setOpen] = useState(depth < 2)
  const c = ROL_COLORS[emp.rol] || ROL_COLORS.empleado
  const hasChildren = children && children.length > 0

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex flex-col items-center">
        {/* Línea vertical arriba si no es raíz */}
        {depth > 0 && <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"/>}
        
        {/* Tarjeta del empleado */}
        <div
          onClick={() => hasChildren && setOpen(o => !o)}
          className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border-2 shadow-sm transition-all ${hasChildren ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}`}
          style={{background: c.bg, borderColor: c.border, minWidth: '180px', maxWidth: '220px'}}>
          
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
            style={{background: c.border}}>
            {emp.nombre?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">{emp.nombre}</p>
            <p className="text-xs truncate" style={{color: c.text}}>{emp.puesto || emp.departamento}</p>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{background: c.border+'25', color: c.text}}>
              {c.label}
            </span>
          </div>
          {hasChildren && (
            <div className="flex-shrink-0">
              {open ? <ChevronDown className="w-4 h-4" style={{color: c.text}}/> : <ChevronRight className="w-4 h-4" style={{color: c.text}}/>}
            </div>
          )}
        </div>

        {/* Contador de subordinados */}
        {hasChildren && !open && (
          <div className="mt-1 text-xs text-slate-400">{children.length} persona{children.length > 1 ? 's':'s'}</div>
        )}
      </div>

      {/* Hijos */}
      {open && hasChildren && (
        <div className="relative mt-0">
          {/* Línea vertical desde la tarjeta */}
          <div className="absolute left-1/2 top-0 w-px h-6 bg-slate-200 dark:bg-slate-700 -translate-x-px"/>
          
          {/* Línea horizontal entre hijos */}
          {children.length > 1 && (
            <div className="absolute top-6 bg-slate-200 dark:bg-slate-700 h-px"
              style={{left: `calc(50% - ${(children.length - 1) * 120}px)`, width: `${(children.length - 1) * 240}px`}}/>
          )}
          
          <div className="flex gap-6 pt-6 flex-wrap justify-center">
            {children.map(child => (
              <EmpleadoCard key={child.id} emp={child.emp} depth={depth+1} children={child.children}/>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function OrganigramaPage() {
  const [empleados, setEmpleados] = useState([])
  const [loading, setLoading]     = useState(true)
  const [filtro, setFiltro]       = useState('')

  useEffect(() => {
    supabase.from('empleados')
      .select('id,nombre,puesto,departamento,rol,manager_id')
      
      .order('nombre')
      .then(({data}) => { setEmpleados(data||[]); setLoading(false) })
  }, [])

  // Construir árbol
  const buildTree = (items, managerId = null) => {
    return items
      .filter(e => (e.manager_id || null) === managerId)
      .filter(e => !filtro || e.nombre.toLowerCase().includes(filtro.toLowerCase()) || e.departamento?.toLowerCase().includes(filtro.toLowerCase()))
      .map(e => ({ emp: e, children: buildTree(items, e.id) }))
  }

  // Agrupar por departamento
  const deptos = [...new Set(empleados.map(e => e.departamento).filter(Boolean))]

  const roots = buildTree(empleados, null)
  // Si no hay jerarquía, mostrar todos como raíz
  const treeNodes = roots.length > 0 ? roots : empleados.map(e => ({emp:e, children:[]}))

  const stats = deptos.map(d => ({
    nombre: d,
    count: empleados.filter(e => e.departamento === d).length,
    roles: {
      manager: empleados.filter(e => e.departamento === d && e.rol === 'manager').length,
      empleado: empleados.filter(e => e.departamento === d && e.rol === 'empleado').length,
    }
  }))

  if (loading) return <div className="p-8 text-slate-400 text-sm">Cargando organigrama...</div>

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-600"/> Organigrama
          </h1>
          <p className="text-slate-500 text-sm mt-1">{empleados.length} empleados activos · {deptos.length} departamentos</p>
        </div>
        <input value={filtro} onChange={e=>setFiltro(e.target.value)}
          placeholder="Buscar persona o departamento..."
          className="border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-400 dark:bg-slate-800 dark:text-white w-64"/>
      </div>

      {/* Stats por departamento */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {stats.map(d => (
          <div key={d.nombre} className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
            <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{d.nombre}</p>
            <p className="text-2xl font-bold text-indigo-600">{d.count}</p>
            <p className="text-slate-400 text-xs">{d.roles.manager} managers · {d.roles.empleado} empleados</p>
          </div>
        ))}
      </div>

      {/* Árbol */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 overflow-x-auto">
        <div className="flex flex-wrap justify-center gap-10 min-w-max mx-auto">
          {treeNodes.map(node => (
            <EmpleadoCard key={node.emp.id} emp={node.emp} depth={0} children={node.children}/>
          ))}
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex gap-4 mt-4 flex-wrap">
        {Object.entries(ROL_COLORS).map(([rol,c]) => (
          <div key={rol} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{background: c.border}}/>
            <span className="text-xs text-slate-500">{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}