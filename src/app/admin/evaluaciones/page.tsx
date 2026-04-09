'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Star, ChevronDown, ChevronUp, Edit2, Save, X, Award } from 'lucide-react'

type Emp = { id:string; nombre:string; avatar_color:string; puesto:string }
type Eval = { id:string; empleado_id:string; periodo:string; fecha:string; puntuacion:number; competencias:Record<string,number>; comentarios:string|null; objetivos:string|null; estado:string }

const COMPETENCIAS_DEFAULT = [
  { key:'trabajo_equipo', label:'Trabajo en equipo' },
  { key:'iniciativa', label:'Iniciativa y proactividad' },
  { key:'calidad', label:'Calidad del trabajo' },
  { key:'comunicacion', label:'Comunicación' },
  { key:'puntualidad', label:'Puntualidad y compromiso' },
]

const PERIODOS = ['Q1 2025','Q2 2025','Q3 2025','Q4 2025','Q1 2026','Q2 2026','Anual 2024','Anual 2025','Anual 2026']

function StarRating({ value, onChange }: { value: number; onChange?: (v:number)=>void }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5,6,7,8,9,10].map(n=>(
        <button key={n} type="button" onClick={()=>onChange?.(n)}
          className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${onChange?'hover:scale-110 cursor-pointer':'cursor-default'}`}>
          <div className={`w-3 h-3 rounded-full ${n<=value?'bg-amber-400':'bg-slate-200 dark:bg-slate-600'}`}/>
        </button>
      ))}
      <span className={`text-sm font-bold ml-1 ${value>=8?'text-emerald-600':value>=6?'text-amber-500':'text-red-500'}`}>{value}/10</span>
    </div>
  )
}

export default function EvaluacionesPage() {
  const [empleados, setEmpleados] = useState<Emp[]>([])
  const [evaluaciones, setEvaluaciones] = useState<Eval[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<string|null>(null)
  const [empFiltro, setEmpFiltro] = useState('todos')

  const [form, setForm] = useState({
    empleado_id:'', periodo:'Q2 2026', fecha:new Date().toISOString().slice(0,10),
    competencias: Object.fromEntries(COMPETENCIAS_DEFAULT.map(c=>[c.key,5])),
    comentarios:'', objetivos:''
  })

  const puntuacionMedia = Object.values(form.competencias).reduce((s,v)=>s+v,0)/Object.values(form.competencias).length

  useEffect(() => {
    Promise.all([
      supabase.from('empleados').select('id,nombre,avatar_color,puesto').order('nombre'),
      supabase.from('evaluaciones').select('*').order('fecha',{ascending:false}),
    ]).then(([{data:e},{data:ev}]) => { setEmpleados(e||[]); setEvaluaciones((ev as any)||[]); setLoading(false) })
  }, [])

  async function handleCreate(ev:React.FormEvent) {
    ev.preventDefault(); setSaving(true)
    const puntuacion = Math.round(puntuacionMedia*10)/10
    const {data} = await supabase.from('evaluaciones').insert({...form, puntuacion, estado:'completada'}).select().single()
    if(data) setEvaluaciones(prev=>[data as any,...prev])
    setForm({empleado_id:'',periodo:'Q2 2026',fecha:new Date().toISOString().slice(0,10),competencias:Object.fromEntries(COMPETENCIAS_DEFAULT.map(c=>[c.key,5])),comentarios:'',objetivos:''})
    setShowForm(false); setSaving(false)
  }

  async function handleDelete(id:string) {
    if(!confirm('¿Eliminar evaluación?')) return
    await supabase.from('evaluaciones').delete().eq('id',id)
    setEvaluaciones(prev=>prev.filter(e=>e.id!==id))
  }

  function getNombre(id:string) { return empleados.find(e=>e.id===id)?.nombre||'—' }
  function getColor(id:string) { return empleados.find(e=>e.id===id)?.avatar_color||'#6366f1' }
  function getInitials(id:string) { const n=getNombre(id); return n.split(' ').map((p:string)=>p[0]).join('').substring(0,2) }
  function getPuesto(id:string) { return empleados.find(e=>e.id===id)?.puesto||'' }

  const filtradas = evaluaciones.filter(e=>empFiltro==='todos'||e.empleado_id===empFiltro)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Evaluaciones de desempeño</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Evaluaciones periódicas por competencias</p>
        </div>
        <button onClick={()=>setShowForm(!showForm)} className="btn-primary"><Plus className="w-4 h-4"/>Nueva evaluación</button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="card p-6 mb-5">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Crear evaluación de desempeño</h3>
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="label">Empleado *</label><select value={form.empleado_id} onChange={e=>setForm(f=>({...f,empleado_id:e.target.value}))} className="input" required><option value="">Selecciona empleado</option>{empleados.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}</select></div>
              <div><label className="label">Período *</label><select value={form.periodo} onChange={e=>setForm(f=>({...f,periodo:e.target.value}))} className="input">{PERIODOS.map(p=><option key={p} value={p}>{p}</option>)}</select></div>
              <div><label className="label">Fecha evaluación</label><input type="date" value={form.fecha} onChange={e=>setForm(f=>({...f,fecha:e.target.value}))} className="input"/></div>
            </div>

            {/* Competencias */}
            <div className="card p-4 dark:bg-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Evaluación por competencias</h4>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500"/>
                  <span className={`font-bold text-lg ${puntuacionMedia>=8?'text-emerald-600':puntuacionMedia>=6?'text-amber-500':'text-red-500'}`}>{puntuacionMedia.toFixed(1)}/10</span>
                </div>
              </div>
              <div className="space-y-3">
                {COMPETENCIAS_DEFAULT.map(c=>(
                  <div key={c.key} className="flex items-center justify-between gap-4">
                    <label className="text-sm text-slate-700 dark:text-slate-300 w-48 flex-shrink-0">{c.label}</label>
                    <StarRating value={form.competencias[c.key]} onChange={v=>setForm(f=>({...f,competencias:{...f.competencias,[c.key]:v}}))}/>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="label">Comentarios y logros</label><textarea value={form.comentarios} onChange={e=>setForm(f=>({...f,comentarios:e.target.value}))} className="input" rows={3} placeholder="Describe el desempeño del empleado…"/></div>
              <div><label className="label">Objetivos próximo período</label><textarea value={form.objetivos} onChange={e=>setForm(f=>({...f,objetivos:e.target.value}))} className="input" rows={3} placeholder="Objetivos y áreas de mejora…"/></div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">{saving?'Guardando…':'Guardar evaluación'}</button>
              <button type="button" onClick={()=>setShowForm(false)} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Filtro */}
      <div className="mb-4">
        <select value={empFiltro} onChange={e=>setEmpFiltro(e.target.value)} className="input w-56">
          <option value="todos">Todos los empleados</option>
          {empleados.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>
      ) : filtradas.length===0 ? (
        <div className="card p-12 text-center"><Award className="w-10 h-10 text-slate-300 mx-auto mb-3"/><p className="text-slate-500">No hay evaluaciones</p></div>
      ) : (
        <div className="space-y-3">
          {filtradas.map(ev=>{
            const isOpen = expanded===ev.id
            const comps = ev.competencias as Record<string,number>
            return (
              <div key={ev.id} className="card overflow-hidden">
                <div className="p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{backgroundColor:getColor(ev.empleado_id)}}>
                    {getInitials(ev.empleado_id)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{getNombre(ev.empleado_id)}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{getPuesto(ev.empleado_id)}</span>
                      <span className="badge badge-indigo">{ev.periodo}</span>
                      <span className={`badge ${ev.estado==='completada'?'badge-green':ev.estado==='firmada'?'badge-indigo':'badge-amber'} capitalize`}>{ev.estado}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{new Date(ev.fecha).toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${ev.puntuacion>=8?'text-emerald-600':ev.puntuacion>=6?'text-amber-500':'text-red-500'}`}>{ev.puntuacion}</div>
                      <div className="text-xs text-slate-400">/10</div>
                    </div>
                    <button onClick={()=>setExpanded(isOpen?null:ev.id)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700">
                      {isOpen?<ChevronUp className="w-4 h-4 text-slate-500"/>:<ChevronDown className="w-4 h-4 text-slate-500"/>}
                    </button>
                    <button onClick={()=>handleDelete(ev.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"><X className="w-4 h-4"/></button>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-slate-100 dark:border-slate-700 p-5 bg-slate-50 dark:bg-slate-800/50 space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Competencias</h4>
                      <div className="space-y-2">
                        {COMPETENCIAS_DEFAULT.map(c=>(
                          <div key={c.key} className="flex items-center gap-4">
                            <span className="text-sm text-slate-600 dark:text-slate-300 w-48 flex-shrink-0">{c.label}</span>
                            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                              <div className={`h-2 rounded-full ${(comps[c.key]||0)>=8?'bg-emerald-500':(comps[c.key]||0)>=6?'bg-amber-500':'bg-red-500'}`} style={{width:((comps[c.key]||0)*10)+'%'}}/>
                            </div>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 w-8 text-right">{comps[c.key]||0}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {ev.comentarios && <div><h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Comentarios</h4><p className="text-sm text-slate-700 dark:text-slate-300">{ev.comentarios}</p></div>}
                    {ev.objetivos && <div><h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Objetivos próximo período</h4><p className="text-sm text-slate-700 dark:text-slate-300">{ev.objetivos}</p></div>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}