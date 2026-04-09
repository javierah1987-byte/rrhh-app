'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Clock, Users, Edit2, Save, X, Calendar } from 'lucide-react'

type Turno = { id:string; nombre:string; hora_inicio:string; hora_fin:string; dias_semana:number[]; color:string; activo:boolean }
type Asignacion = { id:string; empleado_id:string; turno_id:string; fecha_inicio:string; fecha_fin:string|null; empleados:{nombre:string;avatar_color:string}; turnos:{nombre:string;color:string} }
type Emp = { id:string; nombre:string; avatar_color:string }

const DIAS = ['','Lun','Mar','Mié','Jue','Vie','Sáb','Dom']
const COLORES_TURNO = ['#6366F1','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#F97316']

function duracion(ini:string, fin:string) {
  const [h1,m1]=ini.split(':').map(Number), [h2,m2]=fin.split(':').map(Number)
  let mins=(h2*60+m2)-(h1*60+m1); if(mins<0) mins+=1440
  return `${Math.floor(mins/60)}h ${mins%60>0?mins%60+'min':''}`
}

export default function HorariosPage() {
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([])
  const [empleados, setEmpleados] = useState<Emp[]>([])
  const [tab, setTab] = useState<'turnos'|'asignaciones'>('turnos')
  const [loading, setLoading] = useState(true)
  const [showTurnoForm, setShowTurnoForm] = useState(false)
  const [showAsigForm, setShowAsigForm] = useState(false)
  const [savingT, setSavingT] = useState(false)
  const [savingA, setSavingA] = useState(false)
  const [turnoForm, setTurnoForm] = useState({ nombre:'', hora_inicio:'09:00', hora_fin:'17:00', dias_semana:[1,2,3,4,5] as number[], color:'#6366F1' })
  const [asigForm, setAsigForm] = useState({ empleado_id:'', turno_id:'', fecha_inicio:new Date().toISOString().slice(0,10), fecha_fin:'' })

  useEffect(() => {
    Promise.all([
      supabase.from('turnos').select('*').order('nombre'),
      supabase.from('asignaciones_turno').select('*,empleados(nombre,avatar_color),turnos(nombre,color)').order('fecha_inicio',{ascending:false}),
      supabase.from('empleados').select('id,nombre,avatar_color').order('nombre'),
    ]).then(([{data:t},{data:a},{data:e}]) => {
      setTurnos(t||[]); setAsignaciones((a as any)||[]); setEmpleados(e||[]); setLoading(false)
    })
  }, [])

  async function crearTurno(ev:React.FormEvent) {
    ev.preventDefault(); setSavingT(true)
    const {data} = await supabase.from('turnos').insert({...turnoForm,activo:true}).select().single()
    if(data) setTurnos(prev=>[...prev,data as Turno])
    setTurnoForm({nombre:'',hora_inicio:'09:00',hora_fin:'17:00',dias_semana:[1,2,3,4,5],color:'#6366F1'})
    setShowTurnoForm(false); setSavingT(false)
  }

  async function eliminarTurno(id:string) {
    if(!confirm('¿Eliminar este turno?')) return
    await supabase.from('turnos').delete().eq('id',id)
    setTurnos(prev=>prev.filter(t=>t.id!==id))
  }

  async function crearAsignacion(ev:React.FormEvent) {
    ev.preventDefault(); setSavingA(true)
    const {data} = await supabase.from('asignaciones_turno')
      .insert({...asigForm, fecha_fin: asigForm.fecha_fin||null})
      .select('*,empleados(nombre,avatar_color),turnos(nombre,color)').single()
    if(data) setAsignaciones(prev=>[data as any,...prev])
    setAsigForm({empleado_id:'',turno_id:'',fecha_inicio:new Date().toISOString().slice(0,10),fecha_fin:''})
    setShowAsigForm(false); setSavingA(false)
  }

  async function eliminarAsig(id:string) {
    await supabase.from('asignaciones_turno').delete().eq('id',id)
    setAsignaciones(prev=>prev.filter(a=>a.id!==id))
  }

  function toggleDia(d:number) {
    setTurnoForm(f=>({...f, dias_semana: f.dias_semana.includes(d) ? f.dias_semana.filter(x=>x!==d) : [...f.dias_semana,d].sort()}))
  }

  // Vista semanal: quién trabaja hoy y esta semana
  const hoy = new Date()
  const semana = Array.from({length:7},(_,i)=>{ const d=new Date(hoy); d.setDate(d.getDate()-d.getDay()+1+i); return d })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Horarios y turnos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gestiona los turnos y asignaciones del equipo</p>
        </div>
        <div className="flex gap-2">
          {tab==='turnos' && <button onClick={()=>setShowTurnoForm(!showTurnoForm)} className="btn-primary"><Plus className="w-4 h-4"/>Nuevo turno</button>}
          {tab==='asignaciones' && <button onClick={()=>setShowAsigForm(!showAsigForm)} className="btn-primary"><Plus className="w-4 h-4"/>Asignar turno</button>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
        {(['turnos','asignaciones'] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${tab===t?'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm':'text-slate-600 dark:text-slate-400'}`}>
            {t==='turnos'?'⏰ Turnos':'👥 Asignaciones'}
          </button>
        ))}
      </div>

      {/* Form nuevo turno */}
      {tab==='turnos' && showTurnoForm && (
        <div className="card p-6 mb-5">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Crear turno</h3>
          <form onSubmit={crearTurno} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="label">Nombre *</label><input value={turnoForm.nombre} onChange={e=>setTurnoForm(f=>({...f,nombre:e.target.value}))} className="input" placeholder="Ej: Mañana" required/></div>
              <div><label className="label">Hora inicio *</label><input type="time" value={turnoForm.hora_inicio} onChange={e=>setTurnoForm(f=>({...f,hora_inicio:e.target.value}))} className="input" required/></div>
              <div><label className="label">Hora fin *</label><input type="time" value={turnoForm.hora_fin} onChange={e=>setTurnoForm(f=>({...f,hora_fin:e.target.value}))} className="input" required/></div>
            </div>
            <div>
              <label className="label">Días de la semana</label>
              <div className="flex gap-2 flex-wrap">
                {[1,2,3,4,5,6,7].map(d=>(
                  <button key={d} type="button" onClick={()=>toggleDia(d)}
                    className={`w-12 py-2 rounded-xl text-xs font-bold border-2 transition-all ${turnoForm.dias_semana.includes(d)?'bg-indigo-600 text-white border-indigo-600':'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-indigo-300'}`}>
                    {DIAS[d]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Color</label>
              <div className="flex gap-2">
                {COLORES_TURNO.map(c=>(
                  <button key={c} type="button" onClick={()=>setTurnoForm(f=>({...f,color:c}))}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${turnoForm.color===c?'border-slate-900 dark:border-white scale-110':'border-transparent'}`}
                    style={{backgroundColor:c}}/>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={savingT} className="btn-primary">{savingT?'Guardando…':'Crear turno'}</button>
              <button type="button" onClick={()=>setShowTurnoForm(false)} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Form asignación */}
      {tab==='asignaciones' && showAsigForm && (
        <div className="card p-6 mb-5">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Asignar turno a empleado</h3>
          <form onSubmit={crearAsignacion} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="label">Empleado *</label><select value={asigForm.empleado_id} onChange={e=>setAsigForm(f=>({...f,empleado_id:e.target.value}))} className="input" required><option value="">Selecciona empleado</option>{empleados.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}</select></div>
              <div><label className="label">Turno *</label><select value={asigForm.turno_id} onChange={e=>setAsigForm(f=>({...f,turno_id:e.target.value}))} className="input" required><option value="">Selecciona turno</option>{turnos.map(t=><option key={t.id} value={t.id}>{t.nombre} ({t.hora_inicio}–{t.hora_fin})</option>)}</select></div>
              <div><label className="label">Desde *</label><input type="date" value={asigForm.fecha_inicio} onChange={e=>setAsigForm(f=>({...f,fecha_inicio:e.target.value}))} className="input" required/></div>
              <div><label className="label">Hasta (opcional)</label><input type="date" value={asigForm.fecha_fin} onChange={e=>setAsigForm(f=>({...f,fecha_fin:e.target.value}))} className="input"/></div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={savingA} className="btn-primary">{savingA?'Guardando…':'Asignar'}</button>
              <button type="button" onClick={()=>setShowAsigForm(false)} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div> : (

        tab==='turnos' ? (
          turnos.length===0 ? (
            <div className="card p-12 text-center"><Clock className="w-10 h-10 text-slate-300 mx-auto mb-3"/><p className="text-slate-500">No hay turnos creados</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {turnos.map(t=>(
                <div key={t.id} className="card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{backgroundColor:t.color+'20'}}>
                        <Clock className="w-6 h-6" style={{color:t.color}}/>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100">{t.nombre}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t.hora_inicio} – {t.hora_fin}</p>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{duracion(t.hora_inicio,t.hora_fin)}</p>
                      </div>
                    </div>
                    <button onClick={()=>eliminarTurno(t.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-3.5 h-3.5"/></button>
                  </div>
                  <div className="mt-4 flex gap-1">
                    {[1,2,3,4,5,6,7].map(d=>(
                      <div key={d} className={`w-8 h-6 rounded text-center text-[10px] font-bold flex items-center justify-center ${t.dias_semana.includes(d)?'text-white':'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}
                        style={t.dias_semana.includes(d)?{backgroundColor:t.color}:{}}>{DIAS[d]}</div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                    {asignaciones.filter(a=>a.turno_id===t.id).length} empleado(s) asignado(s)
                  </p>
                </div>
              ))}
            </div>
          )
        ) : (
          asignaciones.length===0 ? (
            <div className="card p-12 text-center"><Users className="w-10 h-10 text-slate-300 mx-auto mb-3"/><p className="text-slate-500">No hay asignaciones</p></div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead><tr>
                  <th className="table-header">Empleado</th>
                  <th className="table-header">Turno</th>
                  <th className="table-header">Desde</th>
                  <th className="table-header">Hasta</th>
                  <th className="table-header"></th>
                </tr></thead>
                <tbody>
                  {asignaciones.map(a=>(
                    <tr key={a.id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{backgroundColor:(a.empleados as any).avatar_color||'#6366f1'}}>
                            {(a.empleados as any).nombre.split(' ').map((n:string)=>n[0]).join('').substring(0,2)}
                          </div>
                          <span className="font-medium text-slate-800 dark:text-slate-200">{(a.empleados as any).nombre}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="badge" style={{backgroundColor:(a.turnos as any).color+'20',color:(a.turnos as any).color}}>{(a.turnos as any).nombre}</span>
                      </td>
                      <td className="table-cell">{new Date(a.fecha_inicio).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'})}</td>
                      <td className="table-cell">{a.fecha_fin?new Date(a.fecha_fin).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'}):<span className="badge badge-green">Indefinido</span>}</td>
                      <td className="table-cell"><button onClick={()=>eliminarAsig(a.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-3.5 h-3.5"/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )
      )}
    </div>
  )
}