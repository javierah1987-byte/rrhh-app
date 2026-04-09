'use client'
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, ChevronUp, ChevronDown, Plus, X, FileText, Calendar } from 'lucide-react'
import { Breadcrumb } from '@/components/breadcrumb'
import { EmptyState, SkeletonTable } from '@/components/shared'

type Baja = {
  id:string; empleado_id:string; tipo:string; fecha_inicio:string
  fecha_fin_prevista:string|null; activa:boolean; numero_parte:string|null
  observaciones:string|null; empleados:{nombre:string;avatar_color:string;departamento:string}
}

const TIPO_LABEL: Record<string,string> = {
  enfermedad_comun:'Enfermedad común', accidente_laboral:'Accidente laboral',
  maternidad_paternidad:'Maternidad/Paternidad', accidente_no_laboral:'Accidente no laboral', cuidado_familiar:'Cuidado familiar'
}

type SortKey = 'nombre'|'tipo'|'fecha_inicio'|'activa'
type SortDir = 'asc'|'desc'

export default function BajasAdminPage() {
  const [bajas, setBajas] = useState<Baja[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroActiva, setFiltroActiva] = useState<'todas'|'activa'|'finalizada'>('todas')
  const [sortKey, setSortKey] = useState<SortKey>('fecha_inicio')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    supabase.from('bajas').select('*,empleados(nombre,avatar_color,departamento)').order('fecha_inicio',{ascending:false})
      .then(({ data }) => { setBajas((data as any[])||[]); setLoading(false) })
  }, [])

  function toggleSort(key: SortKey) {
    if (sortKey===key) setSortDir(d=>d==='asc'?'desc':'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const filtradas = useMemo(() => {
    let res = bajas.filter(b => {
      const q = busqueda.toLowerCase()
      const matchBusq = !q ||
        (b.empleados as any).nombre.toLowerCase().includes(q) ||
        TIPO_LABEL[b.tipo]?.toLowerCase().includes(q) ||
        (b.numero_parte||'').toLowerCase().includes(q)
      const matchFiltro = filtroActiva==='todas' || (filtroActiva==='activa'?b.activa:!b.activa)
      return matchBusq && matchFiltro
    })
    res = [...res].sort((a,b2) => {
      let va: any, vb: any
      if (sortKey==='nombre') { va=(a.empleados as any).nombre; vb=(b2.empleados as any).nombre }
      else if (sortKey==='tipo') { va=TIPO_LABEL[a.tipo]||a.tipo; vb=TIPO_LABEL[b2.tipo]||b2.tipo }
      else if (sortKey==='fecha_inicio') { va=a.fecha_inicio; vb=b2.fecha_inicio }
      else { va=a.activa?1:0; vb=b2.activa?1:0 }
      if (va<vb) return sortDir==='asc'?-1:1
      if (va>vb) return sortDir==='asc'?1:-1
      return 0
    })
    return res
  }, [bajas, busqueda, filtroActiva, sortKey, sortDir])

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey!==k) return <ChevronUp className="w-3 h-3 opacity-20"/>
    return sortDir==='asc'?<ChevronUp className="w-3 h-3 text-indigo-600"/>:<ChevronDown className="w-3 h-3 text-indigo-600"/>
  }

  const activas = bajas.filter(b=>b.activa).length

  return (
    <div>
      <Breadcrumb/>
      <div className="page-header">
        <div>
          <h1 className="page-title">Bajas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {activas} activa{activas!==1?'s':''} de {bajas.length} total{bajas.length!==1?'es':''}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
          <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} className="input pl-9 w-56"
            placeholder="Buscar empleado, tipo…"/>
          {busqueda&&<button onClick={()=>setBusqueda('')} className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5"/></button>}
        </div>
        <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {(['todas','activa','finalizada'] as const).map(f=>(
            <button key={f} onClick={()=>setFiltroActiva(f)}
              className={`px-4 py-2 text-xs font-medium capitalize transition-colors ${filtroActiva===f?'bg-indigo-600 text-white':'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              {f}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400">{filtradas.length} resultado{filtradas.length!==1?'s':''}</span>
      </div>

      {loading ? <SkeletonTable rows={5}/> : filtradas.length===0 ? (
        <div className="card">
          <EmptyState icon="document" title="No hay bajas" description={busqueda?"Prueba con otra búsqueda":"No hay bajas registradas todavía"}/>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                {[
                  {k:'nombre',l:'Empleado'},{k:'tipo',l:'Tipo'},
                  {k:'fecha_inicio',l:'Inicio'},{k:'activa',l:'Estado'},
                ].map(col=>(
                  <th key={col.k} className="table-header cursor-pointer select-none"
                    onClick={()=>toggleSort(col.k as SortKey)}>
                    <div className="flex items-center gap-1">{col.l}<SortIcon k={col.k as SortKey}/></div>
                  </th>
                ))}
                <th className="table-header">Fin previsto</th>
                <th className="table-header">Nº Parte</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map(b=>(
                <tr key={b.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{backgroundColor:(b.empleados as any).avatar_color||'#6366f1'}}>
                        {(b.empleados as any).nombre.split(' ').map((n:string)=>n[0]).join('').substring(0,2)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">{(b.empleados as any).nombre}</p>
                        <p className="text-xs text-slate-400">{(b.empleados as any).departamento}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">{TIPO_LABEL[b.tipo]||b.tipo}</td>
                  <td className="table-cell">{new Date(b.fecha_inicio).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'})}</td>
                  <td className="table-cell"><span className={`badge ${b.activa?'badge-red':'badge-slate'}`}>{b.activa?'Activa':'Finalizada'}</span></td>
                  <td className="table-cell">{b.fecha_fin_prevista?new Date(b.fecha_fin_prevista).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'}):<span className="text-slate-300">—</span>}</td>
                  <td className="table-cell">{b.numero_parte||<span className="text-slate-300">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}