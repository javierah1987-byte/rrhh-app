'use client'
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { EmptyState, SkeletonTable } from '@/components/shared'
import BreadcrumbComponent from '@/components/Breadcrumb'

type Baja = { id:string; tipo:string; fecha_inicio:string; fecha_fin_prevista:string|null; activa:boolean; numero_parte:string|null; empleados:{nombre:string;avatar_color:string} }
type SortKey = 'nombre'|'tipo'|'fecha_inicio'|'activa'
type SortDir = 'asc'|'desc'

const TIPO_LABEL: Record<string,string> = {
  enfermedad_comun:'Enfermedad común', accidente_laboral:'Accidente laboral',
  maternidad_paternidad:'Maternidad/Paternidad', accidente_no_laboral:'Accidente no laboral', cuidado_familiar:'Cuidado familiar',
}

function SortTh({ label, sk, sortKey, sortDir, onSort }: { label:string; sk:SortKey; sortKey:SortKey; sortDir:SortDir; onSort:(k:SortKey)=>void }) {
  const active = sortKey===sk
  return (
    <th className="table-header cursor-pointer select-none group" onClick={()=>onSort(sk)}>
      <div className="flex items-center gap-1">
        {label}
        {active ? sortDir==='asc' ? <ChevronUp className="w-3.5 h-3.5 text-indigo-600"/> : <ChevronDown className="w-3.5 h-3.5 text-indigo-600"/>
          : <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-400"/>}
      </div>
    </th>
  )
}

export default function BajasAdminPage() {
  const [bajas, setBajas] = useState<Baja[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroActiva, setFiltroActiva] = useState<'todas'|'activa'|'finalizada'>('todas')
  const [sortKey, setSortKey] = useState<SortKey>('fecha_inicio')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  useEffect(() => {
    supabase.from('bajas').select('*,empleados(nombre,avatar_color)').order('fecha_inicio',{ascending:false})
      .then(({ data }) => { setBajas((data as any[])||[]); setLoading(false) })
  }, [])

  function handleSort(k: SortKey) {
    if (sortKey===k) setSortDir(d=>d==='asc'?'desc':'asc')
    else { setSortKey(k); setSortDir('asc') }
  }

  const filtradas = useMemo(() => {
    let list = bajas
    if (busqueda) {
      const q = busqueda.toLowerCase()
      list = list.filter(b => (b.empleados as any).nombre.toLowerCase().includes(q) || (TIPO_LABEL[b.tipo]||b.tipo).toLowerCase().includes(q))
    }
    if (filtroActiva!=='todas') list = list.filter(b=>filtroActiva==='activa'?b.activa:!b.activa)
    return [...list].sort((a,b) => {
      let av:any, bv:any
      if (sortKey==='nombre') { av=(a.empleados as any).nombre; bv=(b.empleados as any).nombre }
      else if (sortKey==='activa') { av=a.activa?'1':'0'; bv=b.activa?'1':'0' }
      else { av=(a as any)[sortKey]||''; bv=(b as any)[sortKey]||'' }
      const cmp = String(av).localeCompare(String(bv),'es',{numeric:true})
      return sortDir==='asc'?cmp:-cmp
    })
  }, [bajas, busqueda, filtroActiva, sortKey, sortDir])

  return (
    <div className="animate-fade-in">
      <BreadcrumbComponent/>
      <div className="page-header">
        <div>
          <h1 className="page-title">Bajas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{bajas.filter(b=>b.activa).length} activas de {bajas.length}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
          <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} className="input pl-9 w-52" placeholder="Buscar empleado o tipo…"/>
        </div>
        <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {(['todas','activa','finalizada'] as const).map(f=>(
            <button key={f} onClick={()=>setFiltroActiva(f)}
              className={`px-4 py-2 text-xs font-medium capitalize transition-colors ${filtroActiva===f?'bg-indigo-600 text-white':'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>{f}</button>
          ))}
        </div>
        <span className="text-sm text-slate-400 self-center">{filtradas.length} resultado{filtradas.length!==1?'s':''}</span>
      </div>
      {loading ? <SkeletonTable rows={4}/> : filtradas.length===0 ? (
        <EmptyState icon="checkmark" title="Sin bajas" description={busqueda?'No hay resultados para tu búsqueda':'No hay bajas registradas'}/>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead><tr>
              <SortTh label="Empleado" sk="nombre" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}/>
              <SortTh label="Tipo" sk="tipo" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}/>
              <SortTh label="Inicio" sk="fecha_inicio" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}/>
              <th className="table-header">Fin previsto</th>
              <SortTh label="Estado" sk="activa" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}/>
              <th className="table-header">Parte</th>
            </tr></thead>
            <tbody>
              {filtradas.map(b=>(
                <tr key={b.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{backgroundColor:(b.empleados as any).avatar_color||'#6366f1'}}>
                        {(b.empleados as any).nombre.split(' ').map((n:string)=>n[0]).join('').substring(0,2)}
                      </div>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{(b.empleados as any).nombre}</span>
                    </div>
                  </td>
                  <td className="table-cell">{TIPO_LABEL[b.tipo]||b.tipo}</td>
                  <td className="table-cell">{new Date(b.fecha_inicio).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'})}</td>
                  <td className="table-cell">{b.fecha_fin_prevista?new Date(b.fecha_fin_prevista).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'}):<span className="text-slate-300 dark:text-slate-600">—</span>}</td>
                  <td className="table-cell"><span className={`badge ${b.activa?'badge-red':'badge-slate'}`}>{b.activa?'Activa':'Finalizada'}</span></td>
                  <td className="table-cell">{b.numero_parte||<span className="text-slate-300 dark:text-slate-600">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}