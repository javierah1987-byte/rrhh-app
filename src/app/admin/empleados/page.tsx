'use client'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Search, ExternalLink, Plus, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { EmptyState, SkeletonTable } from '@/components/shared'
import Breadcrumb from '@/components/Breadcrumb'

type Emp = { id:string; nombre:string; email:string; departamento:string; puesto:string; tipo_contrato:string; fecha_alta:string; estado:string; avatar_color:string }
type SortKey = keyof Emp
type SortDir = 'asc'|'desc'

const ESTADO_STYLE: Record<string,string> = { activo:'badge-green', baja:'badge-red', vacaciones:'badge-amber' }

function SortIcon({ active, dir }: { active:boolean; dir:SortDir }) {
  if (!active) return <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-400"/>
  return dir==='asc'
    ? <ChevronUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400"/>
    : <ChevronDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400"/>
}

export default function EmpleadosPage() {
  const router = useRouter()
  const [empleados, setEmpleados] = useState<Emp[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('nombre')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  useEffect(() => {
    supabase.from('empleados').select('*').order('nombre')
      .then(({ data }) => { setEmpleados(data||[]); setLoading(false) })
  }, [])

  async function cambiarEstado(id:string, estado:string, ev:React.MouseEvent) {
    ev.stopPropagation()
    await supabase.from('empleados').update({estado}).eq('id',id)
    setEmpleados(prev=>prev.map(e=>e.id===id?{...e,estado}:e))
  }

  function handleSort(key: SortKey) {
    if (sortKey===key) setSortDir(d=>d==='asc'?'desc':'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const filtrados = useMemo(() => {
    let list = empleados
    if (busqueda) {
      const q = busqueda.toLowerCase()
      list = list.filter(e =>
        e.nombre?.toLowerCase().includes(q) ||
        e.departamento?.toLowerCase().includes(q) ||
        e.puesto?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q)
      )
    }
    return [...list].sort((a,b) => {
      const av = (a[sortKey]||''), bv = (b[sortKey]||'')
      const cmp = String(av).localeCompare(String(bv),'es',{numeric:true,sensitivity:'base'})
      return sortDir==='asc'?cmp:-cmp
    })
  }, [empleados, busqueda, sortKey, sortDir])

  const cols: { key:SortKey; label:string }[] = [
    {key:'nombre',label:'Empleado'},
    {key:'departamento',label:'Departamento'},
    {key:'puesto',label:'Puesto'},
    {key:'tipo_contrato',label:'Contrato'},
    {key:'fecha_alta',label:'Alta'},
    {key:'estado',label:'Estado'},
  ]

  return (
    <div className="animate-fade-in">
      <Breadcrumb/>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="page-title">Empleados</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {empleados.filter(e=>e.estado==='activo').length} activos de {empleados.length}
          </p>
        </div>
        <button onClick={()=>router.push('/admin/empleados/nuevo')} className="btn-primary">
          <Plus className="w-4 h-4"/>Nuevo empleado
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
        <input value={busqueda} onChange={e=>setBusqueda(e.target.value)}
          className="input pl-9 max-w-sm"
          placeholder="Buscar por nombre, puesto, departamento…"/>
        {busqueda && (
          <span className="absolute right-3 top-2 text-xs text-slate-400">
            {filtrados.length} resultado{filtrados.length!==1?'s':''}
          </span>
        )}
      </div>

      {loading ? <SkeletonTable rows={5}/> : filtrados.length===0 ? (
        <EmptyState
          icon="employees"
          title={busqueda ? 'Sin resultados' : 'No hay empleados'}
          description={busqueda ? `No se encontraron empleados para "${busqueda}"` : 'Añade el primer empleado del equipo'}
          action={!busqueda && <button onClick={()=>router.push('/admin/empleados/nuevo')} className="btn-primary text-sm"><Plus className="w-4 h-4"/>Nuevo empleado</button>}
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                {cols.map(col=>(
                  <th key={col.key}
                    className="table-header cursor-pointer select-none group"
                    onClick={()=>handleSort(col.key)}>
                    <div className="flex items-center gap-1">
                      {col.label}
                      <SortIcon active={sortKey===col.key} dir={sortDir}/>
                    </div>
                  </th>
                ))}
                <th className="table-header">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(e=>(
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
                  <td className="table-cell">{e.departamento||'—'}</td>
                  <td className="table-cell">{e.puesto||'—'}</td>
                  <td className="table-cell capitalize">{e.tipo_contrato?.replace(/_/g,' ')||'—'}</td>
                  <td className="table-cell">{e.fecha_alta||'—'}</td>
                  <td className="table-cell" onClick={ev=>ev.stopPropagation()}>
                    <select value={e.estado} onChange={ev=>cambiarEstado(e.id,ev.target.value,ev as any)}
                      className={`badge cursor-pointer border-0 capitalize bg-transparent ${ESTADO_STYLE[e.estado]||'badge-slate'}`}>
                      <option value="activo">Activo</option>
                      <option value="baja">Baja</option>
                      <option value="vacaciones">Vacaciones</option>
                    </select>
                  </td>
                  <td className="table-cell" onClick={ev=>ev.stopPropagation()}>
                    <button onClick={()=>router.push(`/admin/empleados/${e.id}`)}
                      className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-medium">
                      <ExternalLink className="w-3.5 h-3.5"/>Ver ficha
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500">
            {filtrados.length} empleado{filtrados.length!==1?'s':''}
            {busqueda&&` de ${empleados.length} en total`}
          </div>
        </div>
      )}
    </div>
  )
}