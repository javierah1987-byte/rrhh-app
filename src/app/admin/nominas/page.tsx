'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, TrendingUp, Search } from 'lucide-react'

type Emp = { id: string; nombre: string; avatar_color: string }
type Nomina = { id: string; empleado_id: string; mes: number; anio: number; salario_base: number; complementos: number; irpf_pct: number; ss_pct: number; liquido: number }

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const fmt = (n: number) => n.toLocaleString('es-ES',{style:'currency',currency:'EUR'})

function calcLiquido(base: number, comp: number, irpf: number, ss: number) {
  return (base + comp) * (1 - irpf/100 - ss/100)
}

export default function AdminNominasPage() {
  const [empleados, setEmpleados] = useState<Emp[]>([])
  const [nominas, setNominas] = useState<Nomina[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filtroEmp, setFiltroEmp] = useState('todos')
  const [busqueda, setBusqueda] = useState('')

  const hoy = new Date()
  const [form, setForm] = useState({
    empleado_id: '', mes: hoy.getMonth()+1, anio: hoy.getFullYear(),
    salario_base: 1800, complementos: 0, irpf_pct: 15, ss_pct: 6.35,
  })

  const liquido = calcLiquido(form.salario_base, form.complementos, form.irpf_pct, form.ss_pct)

  useEffect(() => {
    Promise.all([
      supabase.from('empleados').select('id,nombre,avatar_color').order('nombre'),
      supabase.from('nominas').select('*').order('anio',{ascending:false}).order('mes',{ascending:false}),
    ]).then(([{data:e},{data:n}]) => {
      setEmpleados(e||[]); setNominas(n||[]); setLoading(false)
    })
  }, [])

  async function handleCreate(ev: React.FormEvent) {
    ev.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('nominas').insert({
      ...form, liquido: Math.round(liquido*100)/100
    })
    if (!error) {
      const {data:n} = await supabase.from('nominas').select('*').order('anio',{ascending:false}).order('mes',{ascending:false})
      setNominas(n||[])
      setShowForm(false)
      setForm({empleado_id:'', mes:hoy.getMonth()+1, anio:hoy.getFullYear(), salario_base:1800, complementos:0, irpf_pct:15, ss_pct:6.35})
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta nómina?')) return
    await supabase.from('nominas').delete().eq('id', id)
    setNominas(prev=>prev.filter(n=>n.id!==id))
  }

  function getNombre(id: string) { return empleados.find(e=>e.id===id)?.nombre||'—' }
  function getColor(id: string) { return empleados.find(e=>e.id===id)?.avatar_color||'#6366f1' }
  function getInitials(id: string) { const n=getNombre(id); return n.split(' ').map((p:string)=>p[0]).join('').substring(0,2) }

  const filtradas = nominas.filter(n => {
    const porEmp = filtroEmp==='todos' || n.empleado_id===filtroEmp
    const porBusq = !busqueda || getNombre(n.empleado_id).toLowerCase().includes(busqueda.toLowerCase())
    return porEmp && porBusq
  })

  const totalLiquido = filtradas.reduce((s,n)=>s+n.liquido,0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Nóminas</h1>
          <p className="text-sm text-slate-500 mt-1">Crea y gestiona las nóminas del equipo</p>
        </div>
        <button onClick={()=>setShowForm(!showForm)} className="btn-primary">
          <Plus className="w-4 h-4"/>{showForm?'Cancelar':'Nueva nómina'}
        </button>
      </div>

      {/* Formulario nueva nómina */}
      {showForm && (
        <div className="card p-6 mb-5">
          <h3 className="font-bold text-slate-900 mb-4">Crear nómina</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="label">Empleado *</label>
                <select value={form.empleado_id} onChange={e=>setForm(f=>({...f,empleado_id:e.target.value}))} className="input" required>
                  <option value="">Selecciona empleado</option>
                  {empleados.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Mes *</label>
                <select value={form.mes} onChange={e=>setForm(f=>({...f,mes:+e.target.value}))} className="input">
                  {MESES.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Año *</label>
                <input type="number" value={form.anio} onChange={e=>setForm(f=>({...f,anio:+e.target.value}))} className="input" min="2020" max="2030"/>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="label">Salario base (€)</label>
                <input type="number" value={form.salario_base} onChange={e=>setForm(f=>({...f,salario_base:+e.target.value}))} className="input" step="0.01"/>
              </div>
              <div>
                <label className="label">Complementos (€)</label>
                <input type="number" value={form.complementos} onChange={e=>setForm(f=>({...f,complementos:+e.target.value}))} className="input" step="0.01"/>
              </div>
              <div>
                <label className="label">IRPF (%)</label>
                <input type="number" value={form.irpf_pct} onChange={e=>setForm(f=>({...f,irpf_pct:+e.target.value}))} className="input" step="0.01" min="0" max="50"/>
              </div>
              <div>
                <label className="label">Seg. Social (%)</label>
                <input type="number" value={form.ss_pct} onChange={e=>setForm(f=>({...f,ss_pct:+e.target.value}))} className="input" step="0.01" min="0" max="30"/>
              </div>
            </div>
            {/* Preview líquido */}
            <div className="bg-indigo-50 rounded-2xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Líquido a percibir</p>
                <p className="text-2xl font-bold text-indigo-900">{fmt(liquido)}</p>
              </div>
              <div className="text-right text-xs text-slate-500 space-y-0.5">
                <p>Bruto: {fmt(form.salario_base+form.complementos)}</p>
                <p>IRPF: -{fmt((form.salario_base+form.complementos)*form.irpf_pct/100)}</p>
                <p>SS: -{fmt((form.salario_base+form.complementos)*form.ss_pct/100)}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">{saving?'Guardando…':'Crear nómina'}</button>
              <button type="button" onClick={()=>setShowForm(false)} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros + resumen */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
          <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} className="input pl-9 w-48" placeholder="Buscar empleado…"/>
        </div>
        <select value={filtroEmp} onChange={e=>setFiltroEmp(e.target.value)} className="input w-52">
          <option value="todos">Todos los empleados</option>
          {empleados.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}
        </select>
        <div className="ml-auto flex items-center gap-2 text-sm text-slate-600">
          <TrendingUp className="w-4 h-4 text-emerald-500"/>
          <span className="font-semibold">{filtradas.length} nóminas · Total líquido: </span>
          <span className="font-bold text-emerald-600">{fmt(totalLiquido)}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>
      ) : filtradas.length===0 ? (
        <div className="card p-12 text-center"><TrendingUp className="w-10 h-10 text-slate-300 mx-auto mb-3"/><p className="text-slate-500">No hay nóminas</p></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Empleado</th>
                <th className="table-header">Período</th>
                <th className="table-header text-right">Bruto</th>
                <th className="table-header text-right">IRPF</th>
                <th className="table-header text-right">SS</th>
                <th className="table-header text-right">Neto</th>
                <th className="table-header"></th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map(n=>(
                <tr key={n.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{backgroundColor:getColor(n.empleado_id)}}>
                        {getInitials(n.empleado_id)}
                      </div>
                      <span className="font-medium text-slate-800">{getNombre(n.empleado_id)}</span>
                    </div>
                  </td>
                  <td className="table-cell">{MESES[n.mes-1]} {n.anio}</td>
                  <td className="table-cell text-right">{fmt(n.salario_base+n.complementos)}</td>
                  <td className="table-cell text-right text-red-600">-{n.irpf_pct}%</td>
                  <td className="table-cell text-right text-red-600">-{n.ss_pct}%</td>
                  <td className="table-cell text-right font-bold text-emerald-600">{fmt(n.liquido)}</td>
                  <td className="table-cell">
                    <button onClick={()=>handleDelete(n.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-3.5 h-3.5"/>
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