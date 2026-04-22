// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Star, TrendingUp, Users, Plus, X, ChevronDown, ChevronUp, Award } from 'lucide-react'

const COMPETENCIAS = ['Trabajo en equipo','Comunicación','Liderazgo','Iniciativa','Calidad del trabajo','Puntualidad','Adaptabilidad','Resolución de problemas']

function StarRating({ value, onChange, readonly = false }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5,6,7,8,9,10].map(n => (
        <button key={n} type="button"
          onClick={() => !readonly && onChange?.(n)}
          onMouseEnter={() => !readonly && setHover(n)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`w-6 h-6 rounded text-xs font-bold transition-all ${
            n <= (hover || value)
              ? 'bg-amber-400 text-white'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
          } ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}>
          {n}
        </button>
      ))}
    </div>
  )
}

export default function EvaluacionesPage() {
  const [evaluaciones, setEvaluaciones] = useState([])
  const [empleados, setEmpleados]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [showForm, setShowForm]         = useState(false)
  const [expanded, setExpanded]         = useState({})
  const [saving, setSaving]             = useState(false)
  const [form, setForm] = useState({
    empleado_id:'', puntuacion:8, comentarios:'', estado:'completada',
    competencias: Object.fromEntries(COMPETENCIAS.map(c=>[c,7]))
  })

  const cargar = async () => {
    const [ev, emp] = await Promise.all([
      supabase.from('evaluaciones').select('*, empleado:empleados(id,nombre,puesto,departamento,avatar_color)').order('created_at',{ascending:false}),
      supabase.from('empleados').select('id,nombre,puesto').eq('estado','activo').order('nombre'),
    ])
    setEvaluaciones(ev.data||[])
    setEmpleados(emp.data||[])
    setLoading(false)
  }
  useEffect(()=>{cargar()},[])

  const guardar = async () => {
    if(!form.empleado_id) return
    setSaving(true)
    await supabase.from('evaluaciones').insert({
      empleado_id: form.empleado_id,
      periodo: new Date().toISOString().slice(0,7),
      fecha: new Date().toISOString().split('T')[0],
      puntuacion: form.puntuacion,
      comentarios: form.comentarios,
      competencias: form.competencias,
      estado: form.estado,
    })
    setShowForm(false)
    setForm({empleado_id:'',puntuacion:8,comentarios:'',estado:'completada',competencias:Object.fromEntries(COMPETENCIAS.map(c=>[c,7]))})
    setSaving(false)
    await cargar()
  }

  const mediaGeneral = evaluaciones.length > 0
    ? (evaluaciones.reduce((s,e)=>s+(e.puntuacion||0),0)/evaluaciones.length).toFixed(1)
    : '—'

  const porEmpleado = empleados.map(e => {
    const evs = evaluaciones.filter(ev=>ev.empleado_id===e.id)
    const media = evs.length > 0 ? (evs.reduce((s,ev)=>s+(ev.puntuacion||0),0)/evs.length).toFixed(1) : null
    return {...e, evs, media}
  }).filter(e=>e.evs.length>0).sort((a,b)=>Number(b.media)-Number(a.media))

  if(loading) return <div className="p-8 text-slate-400 text-sm">Cargando...</div>

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Award className="w-7 h-7 text-indigo-600"/> Evaluaciones de desempeño
          </h1>
          <p className="text-slate-500 text-sm mt-1">{evaluaciones.length} evaluaciones · Media: {mediaGeneral}/10</p>
        </div>
        <button onClick={()=>setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4"/> Nueva evaluación
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-slate-400 text-xs mb-1">Media general</p>
          <p className="text-3xl font-black text-amber-500">{mediaGeneral}<span className="text-sm text-slate-400">/10</span></p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-slate-400 text-xs mb-1">Evaluaciones</p>
          <p className="text-3xl font-black text-indigo-600">{evaluaciones.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-slate-400 text-xs mb-1">Empleados evaluados</p>
          <p className="text-3xl font-black text-emerald-600">{porEmpleado.length}</p>
        </div>
      </div>

      {/* Ranking por empleado */}
      <div className="space-y-3">
        {porEmpleado.map((e,idx) => {
          const isOpen = expanded[e.id]
          const mediaNum = Number(e.media)
          const color = mediaNum >= 9 ? 'text-emerald-600' : mediaNum >= 7 ? 'text-amber-500' : 'text-red-500'
          return (
            <div key={e.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750"
                onClick={()=>setExpanded(ex=>({...ex,[e.id]:!ex[e.id]}))}>
                {/* Ranking */}
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-500 flex-shrink-0">
                  {idx===0?'🥇':idx===1?'🥈':idx===2?'🥉':idx+1}
                </div>
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{background: e.avatar_color || '#6366f1'}}>
                  {e.nombre?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-white">{e.nombre}</p>
                  <p className="text-slate-400 text-xs">{e.puesto} · {e.evs.length} evaluacion{e.evs.length>1?'es':''}</p>
                </div>
                {/* Puntuación */}
                <div className="text-right flex-shrink-0">
                  <p className={`text-2xl font-black ${color}`}>{e.media}</p>
                  <p className="text-slate-400 text-xs">media/10</p>
                </div>
                {/* Barra */}
                <div className="w-24 hidden sm:block">
                  <div className="bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all"
                      style={{width:`${Number(e.media)*10}%`, background: mediaNum>=9?'#10b981':mediaNum>=7?'#f59e0b':'#ef4444'}}/>
                  </div>
                </div>
                {isOpen?<ChevronUp className="w-4 h-4 text-slate-400"/>:<ChevronDown className="w-4 h-4 text-slate-400"/>}
              </div>

              {isOpen && (
                <div className="border-t border-slate-100 dark:border-slate-700 p-4 space-y-3">
                  {e.evs.slice(0,3).map(ev => (
                    <div key={ev.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{ev.periodo}</span>
                        <StarRating value={ev.puntuacion} readonly/>
                        <span className={`text-sm font-bold ${Number(ev.puntuacion)>=9?'text-emerald-600':Number(ev.puntuacion)>=7?'text-amber-500':'text-red-500'}`}>
                          {ev.puntuacion}/10
                        </span>
                      </div>
                      {ev.comentarios && <p className="text-slate-600 dark:text-slate-300 text-sm mt-2 italic">"{ev.comentarios}"</p>}
                      {ev.competencias && Object.keys(ev.competencias).length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-1.5">
                          {Object.entries(ev.competencias).slice(0,6).map(([comp,val])=>(
                            <div key={comp} className="flex items-center justify-between text-xs">
                              <span className="text-slate-500 truncate">{comp}</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-300 ml-1">{val}/10</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {porEmpleado.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Award className="w-12 h-12 mx-auto mb-3 opacity-20"/>
            <p>No hay evaluaciones registradas</p>
          </div>
        )}
      </div>

      {/* Modal nueva evaluación */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Nueva evaluación</h3>
              <button onClick={()=>setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Empleado</label>
                <select value={form.empleado_id} onChange={e=>setForm(f=>({...f,empleado_id:e.target.value}))}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:bg-slate-700 dark:text-white">
                  <option value="">Seleccionar...</option>
                  {empleados.map(e=><option key={e.id} value={e.id}>{e.nombre} — {e.puesto}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Puntuación general</label>
                <div className="flex items-center gap-3">
                  <StarRating value={form.puntuacion} onChange={v=>setForm(f=>({...f,puntuacion:v}))}/>
                  <span className="text-xl font-black text-amber-500">{form.puntuacion}/10</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Competencias</label>
                <div className="space-y-2">
                  {COMPETENCIAS.slice(0,4).map(comp=>(
                    <div key={comp} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-500 w-40 flex-shrink-0">{comp}</span>
                      <StarRating value={form.competencias[comp]||7} onChange={v=>setForm(f=>({...f,competencias:{...f.competencias,[comp]:v}}))}/>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Comentarios</label>
                <textarea value={form.comentarios} onChange={e=>setForm(f=>({...f,comentarios:e.target.value}))}
                  rows={3} placeholder="Observaciones sobre el desempeño..."
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:bg-slate-700 dark:text-white resize-none"/>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={()=>setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50">Cancelar</button>
                <button onClick={guardar} disabled={saving||!form.empleado_id}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
                  {saving?'Guardando...':'Guardar evaluación'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}