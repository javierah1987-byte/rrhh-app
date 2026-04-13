'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Briefcase, Plus, X, Users, ChevronRight, Star, Loader2, Search, MapPin, Clock, Trash2, CheckCircle } from 'lucide-react'

type Vacante={id:string;titulo:string;departamento:string|null;tipo:string;jornada:string;estado:string;ubicacion:string|null;salario_min:number|null;salario_max:number|null;fecha_cierre:string|null;created_at:string;_count?:number}
type Candidato={id:string;vacante_id:string;nombre:string;email:string|null;telefono:string|null;linkedin_url:string|null;fase:string;puntuacion:number|null;notas:string|null;fuente:string;created_at:string}

const FASES=['nuevo','revision','entrevista_rrhh','entrevista_tecnica','oferta','contratado','descartado']
const FASE_LABEL:Record<string,string>={nuevo:'Nuevo',revision:'Revisión',entrevista_rrhh:'Entrevista RRHH',entrevista_tecnica:'Entrevista técnica',oferta:'Oferta',contratado:'Contratado',descartado:'Descartado'}
const FASE_COLOR:Record<string,string>={nuevo:'bg-slate-100 text-slate-600',revision:'bg-blue-100 text-blue-700',entrevista_rrhh:'bg-indigo-100 text-indigo-700',entrevista_tecnica:'bg-purple-100 text-purple-700',oferta:'bg-amber-100 text-amber-700',contratado:'bg-emerald-100 text-emerald-700',descartado:'bg-red-100 text-red-600'}

export default function ReclutamientoPage(){
  const [vacantes,setVacantes]=useState<Vacante[]>([])
  const [candidatos,setCandidatos]=useState<Candidato[]>([])
  const [loading,setLoading]=useState(true)
  const [selected,setSelected]=useState<Vacante|null>(null)
  const [modalV,setModalV]=useState(false)
  const [modalC,setModalC]=useState(false)
  const [saving,setSaving]=useState(false)
  const [search,setSearch]=useState('')
  const [faseFilter,setFaseFilter]=useState('todos')
  const [formV,setFormV]=useState({titulo:'',departamento:'',tipo:'presencial',jornada:'completa',ubicacion:'',descripcion:'',requisitos:'',salario_min:'',salario_max:'',fecha_cierre:''})
  const [formC,setFormC]=useState({nombre:'',email:'',telefono:'',linkedin_url:'',notas:'',fuente:'manual'})

  const cargar=useCallback(async()=>{
    const{data:vs}=await supabase.from('vacantes').select('*').order('created_at',{ascending:false})
    // Contar candidatos por vacante
    const{data:cs}=await supabase.from('candidatos').select('vacante_id')
    const counts:Record<string,number>={}
    cs?.forEach((c:any)=>{counts[c.vacante_id]=(counts[c.vacante_id]||0)+1})
    setVacantes((vs||[]).map((v:any)=>({...v,_count:counts[v.id]||0})))
    setLoading(false)
  },[])

  const cargarCandidatos=useCallback(async(vid:string)=>{
    const{data}=await supabase.from('candidatos').select('*').eq('vacante_id',vid).order('created_at',{ascending:false})
    setCandidatos((data||[]) as Candidato[])
  },[])

  useEffect(()=>{cargar()},[cargar])
  useEffect(()=>{if(selected)cargarCandidatos(selected.id)},[selected,cargarCandidatos])

  async function crearVacante(){
    if(!formV.titulo.trim())return
    setSaving(true)
    const{data:{user}}=await supabase.auth.getUser()
    const{data:emp}=await supabase.from('empleados').select('id').eq('user_id',user!.id).single()
    await supabase.from('vacantes').insert({
      titulo:formV.titulo.trim(),departamento:formV.departamento||null,tipo:formV.tipo,
      jornada:formV.jornada,ubicacion:formV.ubicacion||null,descripcion:formV.descripcion||null,
      requisitos:formV.requisitos||null,salario_min:formV.salario_min?Number(formV.salario_min):null,
      salario_max:formV.salario_max?Number(formV.salario_max):null,
      fecha_cierre:formV.fecha_cierre||null,creado_por:(emp as any)?.id
    })
    setSaving(false);setModalV(false)
    setFormV({titulo:'',departamento:'',tipo:'presencial',jornada:'completa',ubicacion:'',descripcion:'',requisitos:'',salario_min:'',salario_max:'',fecha_cierre:''})
    await cargar()
  }

  async function crearCandidato(){
    if(!formC.nombre.trim()||!selected)return
    setSaving(true)
    await supabase.from('candidatos').insert({...formC,nombre:formC.nombre.trim(),vacante_id:selected.id,fase:'nuevo',email:formC.email||null,telefono:formC.telefono||null,linkedin_url:formC.linkedin_url||null,notas:formC.notas||null})
    setSaving(false);setModalC(false)
    setFormC({nombre:'',email:'',telefono:'',linkedin_url:'',notas:'',fuente:'manual'})
    await cargarCandidatos(selected.id)
  }

  async function cambiarFase(cid:string,fase:string){
    await supabase.from('candidatos').update({fase,updated_at:new Date().toISOString()}).eq('id',cid)
    await cargarCandidatos(selected!.id)
  }

  async function eliminarCandidato(cid:string){
    if(!confirm('¿Eliminar este candidato?'))return
    await supabase.from('candidatos').delete().eq('id',cid)
    await cargarCandidatos(selected!.id)
  }

  async function toggleEstadoVacante(v:Vacante){
    const nuevo=v.estado==='abierta'?'cerrada':'abierta'
    await supabase.from('vacantes').update({estado:nuevo}).eq('id',v.id)
    await cargar()
    if(selected?.id===v.id)setSelected({...v,estado:nuevo})
  }

  const candidatosFiltrados=candidatos.filter(c=>{
    const mt=!search||c.nombre.toLowerCase().includes(search.toLowerCase())||c.email?.toLowerCase().includes(search.toLowerCase())
    const mf=faseFilter==='todos'||c.fase===faseFilter
    return mt&&mf
  })

  return(
    <div className="flex h-[calc(100vh-5rem)] gap-0 -mx-6 -mt-2">
      {/* Panel izquierdo — Vacantes */}
      <div className="w-80 flex-shrink-0 border-r border-slate-200 dark:border-slate-700 flex flex-col bg-white dark:bg-slate-800">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Vacantes</h2>
            <button onClick={()=>setModalV(true)} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"><Plus className="w-3 h-3"/>Nueva</button>
          </div>
        </div>
        {loading?<div className="flex justify-center py-8"><div className="w-6 h-6 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>
        :<div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
          {vacantes.length===0&&<p className="text-sm text-slate-400 text-center py-8">Sin vacantes</p>}
          {vacantes.map(v=>(
            <div key={v.id} onClick={()=>setSelected(v)}
              className={`p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${selected?.id===v.id?'bg-indigo-50 dark:bg-indigo-900/20 border-l-2 border-indigo-500':''}`}>
              <div className="flex items-start justify-between gap-1">
                <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 leading-tight">{v.titulo}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${v.estado==='abierta'?'bg-emerald-100 text-emerald-700':'bg-slate-100 text-slate-500'}`}>{v.estado}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                <Users className="w-3 h-3"/>{v._count} candidatos
                {v.departamento&&<><span className="opacity-40">·</span>{v.departamento}</>}
              </p>
            </div>
          ))}
        </div>}
      </div>

      {/* Panel derecho — Candidatos */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selected?(
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <Briefcase className="w-12 h-12 text-slate-200 mb-3"/>
            <p className="text-slate-500 font-medium">Selecciona una vacante</p>
            <p className="text-sm text-slate-400 mt-1">para ver y gestionar sus candidatos</p>
          </div>
        ):(
          <>
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-slate-900 dark:text-slate-100">{selected.titulo}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${selected.estado==='abierta'?'bg-emerald-100 text-emerald-700':'bg-slate-100 text-slate-500'}`}>{selected.estado}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    {selected.tipo} · {selected.jornada}
                    {selected.ubicacion&&<><MapPin className="w-3 h-3"/>{selected.ubicacion}</>}
                    {(selected.salario_min||selected.salario_max)&&<><span className="opacity-40">·</span>{selected.salario_min&&selected.salario_max?`${selected.salario_min/1000}k-${selected.salario_max/1000}k €`:''}</>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={()=>toggleEstadoVacante(selected)} className="btn-secondary text-xs px-3 py-1.5">
                    {selected.estado==='abierta'?'Cerrar vacante':'Reabrir vacante'}
                  </button>
                  <button onClick={()=>setModalC(true)} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"><Plus className="w-3 h-3"/>Añadir candidato</button>
                </div>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <div className="relative flex-1 min-w-[140px]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"/>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar candidato..." className="input pl-8 py-1.5 text-sm w-full"/>
                </div>
                <select value={faseFilter} onChange={e=>setFaseFilter(e.target.value)} className="input py-1.5 text-sm w-auto">
                  <option value="todos">Todas las fases</option>
                  {FASES.map(f=><option key={f} value={f}>{FASE_LABEL[f]}</option>)}
                </select>
              </div>
            </div>

            {/* Tablero Kanban simplificado */}
            <div className="flex-1 overflow-x-auto p-4">
              <div className="flex gap-3 h-full min-w-max">
                {FASES.filter(f=>f!=='descartado').map(fase=>{
                  const cols=candidatosFiltrados.filter(c=>c.fase===fase)
                  return(
                    <div key={fase} className="w-56 flex flex-col">
                      <div className="flex items-center justify-between mb-2 px-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${FASE_COLOR[fase]}`}>{FASE_LABEL[fase]}</span>
                        <span className="text-xs text-slate-400">{cols.length}</span>
                      </div>
                      <div className="flex-1 space-y-2 overflow-y-auto">
                        {cols.map(c=>(
                          <div key={c.id} className="card p-3 text-sm group">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{c.nombre}</p>
                            {c.email&&<p className="text-xs text-slate-400 truncate">{c.email}</p>}
                            {c.puntuacion&&<div className="flex gap-0.5 mt-1">{[1,2,3,4,5].map(s=><Star key={s} className={`w-3 h-3 ${s<=c.puntuacion!?'text-amber-400 fill-amber-400':'text-slate-200'}`}/>)}</div>}
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {fase!=='contratado'&&fase!=='descartado'&&(
                                <select value={c.fase} onChange={e=>cambiarFase(c.id,e.target.value)}
                                  className="text-[10px] border border-slate-200 dark:border-slate-600 rounded px-1 py-0.5 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                  {FASES.map(f=><option key={f} value={f}>{FASE_LABEL[f]}</option>)}
                                </select>
                              )}
                              <button onClick={()=>eliminarCandidato(c.id)} className="p-0.5 text-slate-300 hover:text-red-400 ml-auto"><Trash2 className="w-3 h-3"/></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
                {/* Columna Descartados */}
                <div className="w-48 flex flex-col opacity-60">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Descartados</span>
                    <span className="text-xs text-slate-400">{candidatosFiltrados.filter(c=>c.fase==='descartado').length}</span>
                  </div>
                  <div className="flex-1 space-y-2 overflow-y-auto">
                    {candidatosFiltrados.filter(c=>c.fase==='descartado').map(c=>(
                      <div key={c.id} className="card p-2 text-xs">
                        <p className="font-medium text-slate-500 truncate">{c.nombre}</p>
                        <button onClick={()=>cambiarFase(c.id,'revision')} className="text-[10px] text-indigo-500 mt-1">Recuperar</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* MODAL NUEVA VACANTE */}
      {modalV&&(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={e=>e.target===e.currentTarget&&setModalV(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5"><h3 className="font-bold text-slate-900 dark:text-slate-100">Nueva vacante</h3><button onClick={()=>setModalV(false)}><X className="w-4 h-4 text-slate-400"/></button></div>
            <div className="space-y-3">
              <div><label className="label">Título *</label><input value={formV.titulo} onChange={e=>setFormV(f=>({...f,titulo:e.target.value}))} className="input w-full mt-1" placeholder="Frontend Developer, HR Manager..."/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Departamento</label><input value={formV.departamento} onChange={e=>setFormV(f=>({...f,departamento:e.target.value}))} className="input w-full mt-1"/></div>
                <div><label className="label">Ubicación</label><input value={formV.ubicacion} onChange={e=>setFormV(f=>({...f,ubicacion:e.target.value}))} className="input w-full mt-1" placeholder="Madrid, Remoto..."/></div>
                <div><label className="label">Tipo</label><select value={formV.tipo} onChange={e=>setFormV(f=>({...f,tipo:e.target.value}))} className="input w-full mt-1"><option value="presencial">Presencial</option><option value="remoto">Remoto</option><option value="hibrido">Híbrido</option></select></div>
                <div><label className="label">Jornada</label><select value={formV.jornada} onChange={e=>setFormV(f=>({...f,jornada:e.target.value}))} className="input w-full mt-1"><option value="completa">Completa</option><option value="parcial">Parcial</option></select></div>
                <div><label className="label">Salario mín. (€/año)</label><input type="number" value={formV.salario_min} onChange={e=>setFormV(f=>({...f,salario_min:e.target.value}))} className="input w-full mt-1" placeholder="25000"/></div>
                <div><label className="label">Salario máx. (€/año)</label><input type="number" value={formV.salario_max} onChange={e=>setFormV(f=>({...f,salario_max:e.target.value}))} className="input w-full mt-1" placeholder="35000"/></div>
              </div>
              <div><label className="label">Descripción</label><textarea value={formV.descripcion} onChange={e=>setFormV(f=>({...f,descripcion:e.target.value}))} rows={3} className="input w-full mt-1 resize-none" placeholder="Descripción del puesto..."/></div>
              <div><label className="label">Requisitos</label><textarea value={formV.requisitos} onChange={e=>setFormV(f=>({...f,requisitos:e.target.value}))} rows={2} className="input w-full mt-1 resize-none" placeholder="Experiencia, habilidades..."/></div>
              <div><label className="label">Fecha límite</label><input type="date" value={formV.fecha_cierre} onChange={e=>setFormV(f=>({...f,fecha_cierre:e.target.value}))} className="input w-full mt-1"/></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={()=>setModalV(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={crearVacante} disabled={saving||!formV.titulo} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                {saving?<><Loader2 className="w-4 h-4 animate-spin"/>Creando…</>:<><Briefcase className="w-4 h-4"/>Crear vacante</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AÑADIR CANDIDATO */}
      {modalC&&selected&&(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={e=>e.target===e.currentTarget&&setModalC(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5"><h3 className="font-bold text-slate-900 dark:text-slate-100">Añadir candidato</h3><button onClick={()=>setModalC(false)}><X className="w-4 h-4 text-slate-400"/></button></div>
            <div className="space-y-3">
              <div><label className="label">Nombre *</label><input value={formC.nombre} onChange={e=>setFormC(f=>({...f,nombre:e.target.value}))} className="input w-full mt-1" autoFocus/></div>
              <div><label className="label">Email</label><input type="email" value={formC.email} onChange={e=>setFormC(f=>({...f,email:e.target.value}))} className="input w-full mt-1"/></div>
              <div><label className="label">Teléfono</label><input value={formC.telefono} onChange={e=>setFormC(f=>({...f,telefono:e.target.value}))} className="input w-full mt-1"/></div>
              <div><label className="label">LinkedIn</label><input value={formC.linkedin_url} onChange={e=>setFormC(f=>({...f,linkedin_url:e.target.value}))} className="input w-full mt-1" placeholder="https://linkedin.com/in/..."/></div>
              <div><label className="label">Fuente</label><select value={formC.fuente} onChange={e=>setFormC(f=>({...f,fuente:e.target.value}))} className="input w-full mt-1"><option value="manual">Manual</option><option value="linkedin">LinkedIn</option><option value="infojobs">InfoJobs</option><option value="referido">Referido</option><option value="web">Web propia</option></select></div>
              <div><label className="label">Notas</label><textarea value={formC.notas} onChange={e=>setFormC(f=>({...f,notas:e.target.value}))} rows={2} className="input w-full mt-1 resize-none"/></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={()=>setModalC(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={crearCandidato} disabled={saving||!formC.nombre} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                {saving?<><Loader2 className="w-4 h-4 animate-spin"/>…</>:<><Plus className="w-4 h-4"/>Añadir</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}