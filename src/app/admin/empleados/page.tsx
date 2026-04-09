'use client'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Plus, Search, X, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react'
import { Breadcrumb } from '@/components/breadcrumb'
import { EmptyState, SkeletonTable } from '@/components/shared'

type Emp = { id:string; nombre:string; email:string; departamento:string; puesto:string; tipo_contrato:string; fecha_alta:string; estado:string; avatar_color:string }

const ESTADO_STYLE: Record<string,string> = { activo:'badge-green', baja:'badge-red', vacaciones:'badge-amber' }
type SortKey = 'nombre'|'departamento'|'puesto'|'estado'|'fecha_alta'

export default function EmpleadosPage() {
  const router = useRouter()
  const [empleados, setEmpleados] = useState<Emp[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [sortKey, setSortKey] = useState<SortKey>('nombre')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc')

  useEffect(() => {
    supabase.from('empleados').select('*').order('nombre')
      .then(({ data }) => { setEmpleados(data||[]); setLoading(false) })
  }, [])

  async function cambiarEstado(id: string, estado: string, e: React.MouseEvent) {
    e.stopPropagation()
    await supabase.from('empleados').update({ estado }).eq('id', id)
    setEmpleados(prev => prev.map(emp => emp.id === id ? { ...emp, estado } : emp))
  }

  function toggleSort(k: SortKey) {
    if (sortKey===k) setSortDir(d=>d==='asc'?'desc':'asc')
    else { setSortKey(k); setSortDir('asc') }
  }

  const filtrados = useMemo(() => {
    let res = empleados.filter(e => {
      const q = busqueda.toLowerCase()
      const matchQ = !q || e.nombre.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q) ||
        e.departamento?.toLowerCase().includes(q) || e.puesto?.toLowerCase().includes(q)
      const matchE = filtroEstado==='todos' || e.estado===filtroEstado
      return matchQ && matchE
    })
    return [...res].sort((a,b) => {
      const va = (a as any)[sortKey]||'', vb = (b as any)[sortKey]||''
      if (va<vb) return sortDir==='asc'?-1:1
      if (va>vb) return sortDir==='asc'?1:-1
      return 0
    })
  }, [empleados, busqueda, filtroEstado, sortKey, sortDir])

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey!==k) return <ChevronUp className="w-3 h-3 opacity-20"/>
    return sortDir==='asc'?<ChevronUp className="w-3 h-3 text-indigo-600"/>:<ChevronDown className="w-3 h-3 text-indigo-600"/>
  }

  const counts = { total:empleados.length, activos:empleados.filter(e=>e.estado==='activo').length }

  return (
    <div>
      <Breadcrumb/>
      <div className="page-header">
        <div>
          <h1 className="page-title">Empleados</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{counts.activos} activos de {counts.total}</p>
        </div>
        <button onClick={()=>router.push('/admin/empleados/nuevo')} className="btn-primary"><Plus className="w-4 h-4"/>Nuevo empleado</button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
          <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} className="input pl-9 w-64"
            placeholder="Nombre, email, departamento…"/>
          {busqueda&&<button onClick={()=>setBusqueda('')} className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5"/></button>}
        </div>
        <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {['todos','activo','baja','vacaciones'].map(f=>(
            <button key={f} onClick={()=>setFiltroEstado(f)}
              className={`px-4 py-2 text-xs font-medium capitalize transition-colors ${filtroEstado===f?'bg-indigo-600 text-white':'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              {f}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400">{filtrados.length} resultado{filtrados.length!==1?'s':''}</span>
      </div>

      {loading ? <SkeletonTable rows={5}/> : filtrados.length===0 ? (
        <div className="card">
          <EmptyState icon="employees" title="No hay empleados" description={busqueda?"Prueba con otra búsqueda":"Añade el primer empleado al equipo"}
            action={!busqueda?<button onClick={()=>router.push('/admin/empleados/nuevo')} className="btn-primary text-sm">Nuevo empleado</button>:undefined}/>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                {[{k:'nombre',l:'Empleado'},{k:'departamento',l:'Departamento'},{k:'puesto',l:'Puesto'}].map(col=>(
                  <th key={col.k} className="table-header cursor-pointer select-none" onClick={()=>toggleSort(col.k as SortKey)}>
                    <div className="flex items-center gap-1">{col.l}<SortIcon k={col.k as SortKey}/></div>
                  </th>
                ))}
                <th className="table-header">Contrato</th>
                {[{k:'fecha_alta',l:'Alta'},{k:'estado',l:'Estado'}].map(col=>(
                  <th key={col.k} className="table-header cursor-pointer select-none" onClick={()=>toggleSort(col.k as SortKey)}>
                    <div className="flex items-center gap-1">{col.l}<SortIcon k={col.k as SortKey}/></div>
                  </th>
                ))}
                <th className="table-header"></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(e => (
                <tr key={e.id} className="table-row cursor-pointer" onClick={()=>router.push(`/admin/empleados/${e.id}`)}>
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{backgroundColor:e.avatar_color||'#6366f1'}}>
                        {e.nombre.split(' ').map((n:string)=>n[0]).join('').substring(0,2)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{e.nombre}</p>
                        <p className="text-xs text-slate-400">{e.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">{e.departamento}</td>
                  <td className="table-cell">{e.puesto}</td>
                  <td className="table-cell capitalize">{e.tipo_contrato?.replace(/_/g,' ')}</td>
                  <td className="table-cell">{e.fecha_alta}</td>
                  <td className="table-cell" onClick={ev=>ev.stopPropagation()}>
                    <select value={e.estado} onChange={ev=>cambiarEstado(e.id,ev.target.value,ev as any)}
                      className={`badge cursor-pointer border-0 capitalize ${ESTADO_STYLE[e.estado]||'badge-slate'}`}>
                      <option value="activo">Activo</option>
                      <option value="baja">Baja</option>
                      <option value="vacaciones">Vacaciones</option>
                    </select>
                  </td>
                  <td className="table-cell" onClick={ev=>ev.stopPropagation()}>
                    <button onClick={()=>router.push(`/admin/empleados/${e.id}`)}
                      className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-medium">
                      <ExternalLink className="w-3.5 h-3.5"/>Ficha
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}