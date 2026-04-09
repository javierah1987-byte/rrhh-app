'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

type Festivo = { id:string; fecha:string; nombre:string; tipo:string; anio:number }

const TIPO_STYLE: Record<string,string> = {
  nacional: 'badge-red',
  autonomico: 'badge-amber',
  local: 'badge-indigo',
  empresa: 'badge-green',
}
const TIPO_LABEL: Record<string,string> = {
  nacional: 'Nacional', autonomico: 'Autonómico', local: 'Local', empresa: 'Empresa'
}
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS_SEMANA = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

export default function FestivosPage() {
  const [festivos, setFestivos] = useState<Festivo[]>([])
  const [loading, setLoading] = useState(true)
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ fecha: '', nombre: '', tipo: 'nacional' })
  const [vista, setVista] = useState<'lista'|'calendario'>('calendario')

  useEffect(() => {
    supabase.from('festivos').select('*').order('fecha')
      .then(({ data }) => { setFestivos(data || []); setLoading(false) })
  }, [])

  async function crearFestivo(ev: React.FormEvent) {
    ev.preventDefault(); setSaving(true)
    const { data, error } = await supabase.from('festivos').insert(form).select().single()
    if (!error && data) {
      setFestivos(prev => [...prev, data as Festivo].sort((a,b) => a.fecha.localeCompare(b.fecha)))
      setForm({ fecha: '', nombre: '', tipo: 'nacional' })
      setShowForm(false)
    }
    setSaving(false)
  }

  async function eliminar(id: string) {
    await supabase.from('festivos').delete().eq('id', id)
    setFestivos(prev => prev.filter(f => f.id !== id))
  }

  const festivosAnio = festivos.filter(f => f.anio === anio)
  const festivosFechas = new Set(festivosAnio.map(f => f.fecha))

  // Vista calendario: mostrar cuadrícula del año
  function renderCalendario() {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({length:12},(_,m) => {
          const primerDia = new Date(anio, m, 1)
          const diasEnMes = new Date(anio, m+1, 0).getDate()
          let startDow = primerDia.getDay()
          const celdas: (number|null)[] = [...Array(startDow).fill(null)]
          for (let d=1; d<=diasEnMes; d++) celdas.push(d)
          while (celdas.length % 7 !== 0) celdas.push(null)

          const festivosMes = festivosAnio.filter(f => new Date(f.fecha).getMonth() === m)

          return (
            <div key={m} className="card p-4">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3">{MESES[m]}</h3>
              <div className="grid grid-cols-7 mb-1">
                {DIAS_SEMANA.map(d => <div key={d} className="text-center text-[10px] font-semibold text-slate-400">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {celdas.map((dia, i) => {
                  if (!dia) return <div key={i}/>
                  const fecha = `${anio}-${String(m+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
                  const esFestivo = festivosFechas.has(fecha)
                  const dow = new Date(anio, m, dia).getDay()
                  const esFinde = dow === 0 || dow === 6
                  const fest = festivosAnio.find(f => f.fecha === fecha)
                  return (
                    <div key={i} title={fest?.nombre}
                      className={`h-6 flex items-center justify-center rounded text-[11px] font-medium cursor-default
                        ${esFestivo ? 'bg-red-500 text-white' : esFinde ? 'text-slate-300 dark:text-slate-600' : 'text-slate-600 dark:text-slate-300'}`}>
                      {dia}
                    </div>
                  )
                })}
              </div>
              {festivosMes.length > 0 && (
                <div className="mt-2 space-y-1">
                  {festivosMes.map(f => (
                    <div key={f.id} className="flex items-center gap-1.5 text-[10px]">
                      <span className={`badge ${TIPO_STYLE[f.tipo]} py-0`}>{new Date(f.fecha).getDate()}</span>
                      <span className="text-slate-600 dark:text-slate-400 truncate">{f.nombre}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Calendario laboral</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {festivosAnio.length} festivos en {anio} · {festivosAnio.filter(f=>f.tipo==='nacional').length} nacionales
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <button onClick={()=>setVista('calendario')} className={`px-3 py-1.5 text-xs font-medium transition-colors ${vista==='calendario'?'bg-indigo-600 text-white':'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              Calendario
            </button>
            <button onClick={()=>setVista('lista')} className={`px-3 py-1.5 text-xs font-medium transition-colors ${vista==='lista'?'bg-indigo-600 text-white':'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              Lista
            </button>
          </div>
          <button onClick={()=>setShowForm(!showForm)} className="btn-primary"><Plus className="w-4 h-4"/>Añadir festivo</button>
        </div>
      </div>

      {/* Navegación año */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={()=>setAnio(a=>a-1)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"><ChevronLeft className="w-4 h-4"/></button>
        <span className="font-bold text-xl text-slate-900 dark:text-slate-100 w-16 text-center">{anio}</span>
        <button onClick={()=>setAnio(a=>a+1)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"><ChevronRight className="w-4 h-4"/></button>
        <div className="flex gap-2 ml-2">
          {Object.entries(TIPO_LABEL).map(([k,v]) => (
            <div key={k} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${k==='nacional'?'bg-red-500':k==='autonomico'?'bg-amber-500':k==='local'?'bg-indigo-500':'bg-emerald-500'}`}/>
              <span className="text-xs text-slate-500 dark:text-slate-400">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="card p-5 mb-5">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Añadir festivo</h3>
          <form onSubmit={crearFestivo} className="flex flex-wrap gap-3 items-end">
            <div><label className="label">Fecha *</label><input type="date" value={form.fecha} onChange={e=>setForm(f=>({...f,fecha:e.target.value}))} className="input w-44" required/></div>
            <div className="flex-1 min-w-[200px]"><label className="label">Nombre *</label><input value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} className="input" placeholder="Ej: Fiesta del Patrón" required/></div>
            <div><label className="label">Tipo</label>
              <select value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))} className="input w-36">
                {Object.entries(TIPO_LABEL).map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <button type="submit" disabled={saving} className="btn-primary">{saving?'Guardando…':'Añadir'}</button>
            <button type="button" onClick={()=>setShowForm(false)} className="btn-secondary">Cancelar</button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>
      ) : vista === 'calendario' ? renderCalendario() : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead><tr>
              <th className="table-header">Fecha</th>
              <th className="table-header">Día semana</th>
              <th className="table-header">Nombre</th>
              <th className="table-header">Tipo</th>
              <th className="table-header"></th>
            </tr></thead>
            <tbody>
              {festivosAnio.map(f => (
                <tr key={f.id} className="table-row">
                  <td className="table-cell font-medium">{new Date(f.fecha).toLocaleDateString('es-ES',{day:'numeric',month:'long'})}</td>
                  <td className="table-cell">{DIAS_SEMANA[new Date(f.fecha).getDay()]}</td>
                  <td className="table-cell">{f.nombre}</td>
                  <td className="table-cell"><span className={`badge ${TIPO_STYLE[f.tipo]}`}>{TIPO_LABEL[f.tipo]}</span></td>
                  <td className="table-cell">
                    <button onClick={()=>eliminar(f.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-3.5 h-3.5"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {festivosAnio.length===0 && <p className="text-center text-slate-400 py-10">No hay festivos en {anio}</p>}
        </div>
      )}
    </div>
  )
}