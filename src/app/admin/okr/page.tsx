'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Target, Plus, X, Loader2, ChevronDown, TrendingUp, CheckCircle, Edit3 } from 'lucide-react'

type Objetivo={id:string;titulo:string;descripcion:string|null;tipo:string;periodo:string;estado:string;created_at:string;propietario?:{nombre:string}|null;resultados?:Resultado[]}
type Resultado={id:string;objetivo_id:string;titulo:string;valor_inicial:number;valor_actual:number;valor_meta:number;unidad:string;tipo_metrica:string;responsable?:{nombre:string}|null}

const PERIODOS=['Q1 2026','Q2 2026','Q3 2026','Q4 2026','2026','Q1 2027']

function ProgressBar({actual,meta,color='indigo'}:{actual:number;meta:number;color?:string}){
  const pct=meta>0?Math.min(Math.round((actual/meta)*100),100):0
  const bg=pct>=100?'bg-emerald-500':pct>=70?'bg-indigo-500':pct>=40?'bg-amber-500':'bg-red-400'
  return(
    <div>
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>{actual}</span>
        <span className={`font-semibold ${pct>=100?'text-emerald-600':'text-slate-700 dark:text-slate-300'}`}>{pct}%</span>
        <span>{meta}</span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-600 rounded-full overflow-hidden">
        <div className={`h-full ${bg} transition-all rounded-full`} style={{width:pct+'%'}}/>
      </div>
    </div>
  )
}

export default function OKRPage(){
  const [objetivos,setObjetivos]=useState<Objetivo[]>([])
  const [empleados,setEmpleados]=useState<{id:string;nombre:string}[]>([])
  const [loading,setLoading]=useState(true)
  const [modalO,setModalO]=useState(false)
  const [modalR,setModalR]=useState<Objetivo|null>(null)
  const [saving,setSaving]=useState(false)
  const [periodo,setPeriodo]=useState('Q2 2026')
  const [editando,setEditando]=useState<{rid:string;valor:string}|null>(null)
  const [formO,setFormO]=useState({titulo:'',descripcion:'',tipo:'empresa',periodo:'Q2 2026',propietario_id:''})
  const [formR,setFormR]=useState({titulo:'',valor_meta:'100',unidad:'%',tipo_metrica:'porcentaje',responsable_id:''})

  const cargar=useCallback(async()=>{
    const[{data:os},{data:rs},{data:es}]=await Promise.all([
      supabase.from('okr_objetivos').select('*,propietario:propietario_id(nombre)').eq('periodo',periodo).order('created_at'),
      supabase.from('okr_resultados').select('*,responsable:responsable_id(nombre)'),
      supabase.from('empleados').select('id,nombre').in('rol',['empleado','manager','admin']).eq('estado','activo').order('nombre'),
    ])
    const resMap:Record<string,Resultado[]>={}
    rs?.forEach((r:any)=>{if(!resMap[r.objetivo_id])resMap[r.objetivo_id]=[];resMap[r.objetivo_id].push(r)})
    setObjetivos((os||[]).map((o:any)=>({...o,resultados:resMap[o.id]||[]})))
    setEmpleados(es||[])
    setLoading(false)
  },[periodo])

  useEffect(()=>{cargar()},[cargar])

  async function crearObjetivo(){
    if(!formO.titulo)return
    setSaving(true)
    await supabase.from('okr_objetivos').insert({...formO,propietario_id:formO.propietario_id||null,descripcion:formO.descripcion||null})
    setSaving(false);setModalO(false)
    setFormO({titulo:'',descripcion:'',tipo:'empresa',periodo:'Q2 2026',propietario_id:''})
    await cargar()
  }

  async function crearResultado(oid:string){
    if(!formR.titulo||!formR.valor_meta)return
    setSaving(true)
    await supabase.from('okr_resultados').insert({objetivo_id:oid,titulo:formR.titulo,valor_meta:Number(formR.valor_meta),unidad:formR.unidad,tipo_metrica:formR.tipo_metrica,responsable_id:formR.responsable_id||null,valor_inicial:0,valor_actual:0})
    setSaving(false)
    setFormR({titulo:'',valor_meta:'100',unidad:'%',tipo_metrica:'porcentaje',responsable_id:''})
    await cargar()
    // Actualizar modal
    const{data:obj}=await supabase.from('okr_objetivos').select('*,propietario:propietario_id(nombre)').eq('id',oid).single()
    const{data:rs}=await supabase.from('okr_resultados').select('*,responsable:responsable_id(nombre)').eq('objetivo_id',oid)
    if(obj)setModalR({...obj,resultados:rs||[]})
  }

  async function actualizarValor(rid:string,valor:string){
    const n=parseFloat(valor)
    if(isNaN(n))return
    await supabase.from('okr_resultados').update({valor_actual:n,updated_at:new Date().toISOString()}).eq('id',rid)
    setEditando(null)
    await cargar()
    if(modalR){
      const{data:rs}=await supabase.from('okr_resultados').select('*,responsable:responsable_id(nombre)').eq('objetivo_id',modalR.id)
      setModalR(prev=>prev?{...prev,resultados:rs||[]}:null)
    }
  }

  const progresoObjetivo=(o:Objetivo)=>{
    if(!o.resultados?.length)return 0
    const avg=o.resultados.reduce((s,r)=>s+(r.valor_meta>0?Math.min((r.valor_actual/r.valor_meta)*100,100):0),0)/o.resultados.length
    return Math.round(avg)
  }

  const TIPO_COLOR:Record<string,string>={empresa:'bg-indigo-100 text-indigo-700',equipo:'bg-emerald-100 text-emerald-700',personal:'bg-amber-100 text-amber-700'}

  return(
    <div>
      <div className="page-header mb-5">
        <div><h1 className="page-title flex items-center gap-2"><Target className="w-5 h-5 text-indigo-500"/>OKR</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Objetivos y Resultados Clave</p></div>
        <div className="flex items-center gap-2">
          <select value={periodo} onChange={e=>setPeriodo(e.target.value)} className="input text-sm w-auto">
            {PERIODOS.map(p=><option key={p}>{p}</option>)}
          </select>
          <button onClick={()=>setModalO(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4"/>Nuevo objetivo</button>
        </div>
      </div>

      {loading?<div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>
      :objetivos.length===0?(
        <div className="card p-12 text-center">
          <Target className="w-12 h-12 text-slate-200 mx-auto mb-3"/>
          <p className="font-semibold text-slate-500">Sin objetivos para {periodo}</p>
          <p className="text-sm text-slate-400 mt-1">Crea tu primer OKR para este período</p>
          <button onClick={()=>setModalO(true)} className="btn-primary mt-4 inline-flex items-center gap-2"><Plus className="w-4 h-4"/>Crear objetivo</button>
        </div>
      ):(
        <div className="space-y-4">
          {objetivos.map(o=>{
            const pct=progresoObjetivo(o)
            return(
              <div key={o.id} className="card overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100">{o.titulo}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIPO_COLOR[o.tipo]||TIPO_COLOR.empresa}`}>{o.tipo}</span>
                        {o.propietario&&<span className="text-xs text-slate-400">{(o.propietario as any).nombre}</span>}
                      </div>
                      {o.descripcion&&<p className="text-sm text-slate-500">{o.descripcion}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className={`text-2xl font-black ${pct>=100?'text-emerald-600':pct>=70?'text-indigo-600':pct>=40?'text-amber-600':'text-red-500'}`}>{pct}%</div>
                      <button onClick={()=>setModalR(o)} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"><Plus className="w-3 h-3"/>KR</button>
                    </div>
                  </div>
                  {/* Barra de progreso del objetivo */}
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-600 rounded-full overflow-hidden mb-3">
                    <div className={`h-full transition-all rounded-full ${pct>=100?'bg-emerald-500':pct>=70?'bg-indigo-500':pct>=40?'bg-amber-500':'bg-red-400'}`} style={{width:pct+'%'}}/>
                  </div>
                  {/* Key Results */}
                  {o.resultados&&o.resultados.length>0&&(
                    <div className="space-y-3">
                      {o.resultados.map(r=>(
                        <div key={r.id} className="pl-4 border-l-2 border-slate-200 dark:border-slate-600">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{r.titulo}</p>
                            {editando?.rid===r.id?(
                              <div className="flex items-center gap-1">
                                <input type="number" value={editando.valor} onChange={e=>setEditando({rid:r.id,valor:e.target.value})}
                                  className="w-20 text-xs border border-slate-200 rounded px-2 py-0.5"/>
                                <button onClick={()=>actualizarValor(r.id,editando.valor)} className="text-emerald-500 hover:text-emerald-700"><CheckCircle className="w-4 h-4"/></button>
                                <button onClick={()=>setEditando(null)} className="text-slate-400"><X className="w-3 h-3"/></button>
                              </div>
                            ):(
                              <button onClick={()=>setEditando({rid:r.id,valor:String(r.valor_actual)})} className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-0.5">
                                <Edit3 className="w-3 h-3"/>Actualizar
                              </button>
                            )}
                          </div>
                          <ProgressBar actual={r.valor_actual} meta={r.valor_meta}/>
                          <p className="text-[10px] text-slate-400 mt-0.5">{r.valor_actual} / {r.valor_meta} {r.unidad}{r.responsable&&<> · {(r.responsable as any).nombre}</>}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL NUEVO OBJETIVO */}
      {modalO&&(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={e=>e.target===e.currentTarget&&setModalO(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5"><h3 className="font-bold text-slate-900 dark:text-slate-100">Nuevo objetivo</h3><button onClick={()=>setModalO(false)}><X className="w-4 h-4 text-slate-400"/></button></div>
            <div className="space-y-3">
              <div><label className="label">Objetivo *</label><input value={formO.titulo} onChange={e=>setFormO(f=>({...f,titulo:e.target.value}))} className="input w-full mt-1" placeholder="Ej: Mejorar satisfacción del cliente" autoFocus/></div>
              <div><label className="label">Descripción</label><textarea value={formO.descripcion} onChange={e=>setFormO(f=>({...f,descripcion:e.target.value}))} rows={2} className="input w-full mt-1 resize-none"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Tipo</label><select value={formO.tipo} onChange={e=>setFormO(f=>({...f,tipo:e.target.value}))} className="input w-full mt-1"><option value="empresa">Empresa</option><option value="equipo">Equipo</option><option value="personal">Personal</option></select></div>
                <div><label className="label">Período</label><select value={formO.periodo} onChange={e=>setFormO(f=>({...f,periodo:e.target.value}))} className="input w-full mt-1">{PERIODOS.map(p=><option key={p}>{p}</option>)}</select></div>
              </div>
              <div><label className="label">Propietario</label><select value={formO.propietario_id} onChange={e=>setFormO(f=>({...f,propietario_id:e.target.value}))} className="input w-full mt-1"><option value="">Sin asignar</option>{empleados.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}</select></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={()=>setModalO(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={crearObjetivo} disabled={saving||!formO.titulo} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                {saving?<><Loader2 className="w-4 h-4 animate-spin"/>…</>:<><Target className="w-4 h-4"/>Crear</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AÑADIR KR */}
      {modalR&&(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={e=>e.target===e.currentTarget&&setModalR(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <div className="flex items-center justify-between mb-2"><h3 className="font-bold text-slate-900 dark:text-slate-100">Añadir Key Result</h3><button onClick={()=>setModalR(null)}><X className="w-4 h-4 text-slate-400"/></button></div>
            <p className="text-xs text-slate-400 mb-4">{modalR.titulo}</p>
            <div className="space-y-3">
              <div><label className="label">Resultado clave *</label><input value={formR.titulo} onChange={e=>setFormR(f=>({...f,titulo:e.target.value}))} className="input w-full mt-1" placeholder="Ej: Aumentar NPS a 70" autoFocus/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Meta</label><input type="number" value={formR.valor_meta} onChange={e=>setFormR(f=>({...f,valor_meta:e.target.value}))} className="input w-full mt-1"/></div>
                <div><label className="label">Unidad</label><input value={formR.unidad} onChange={e=>setFormR(f=>({...f,unidad:e.target.value}))} className="input w-full mt-1" placeholder="%, puntos, €..."/></div>
              </div>
              <div><label className="label">Responsable</label><select value={formR.responsable_id} onChange={e=>setFormR(f=>({...f,responsable_id:e.target.value}))} className="input w-full mt-1"><option value="">Sin asignar</option>{empleados.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}</select></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={()=>setModalR(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={()=>crearResultado(modalR.id)} disabled={saving||!formR.titulo} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                {saving?<><Loader2 className="w-4 h-4 animate-spin"/>…</>:<><Plus className="w-4 h-4"/>Añadir KR</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}