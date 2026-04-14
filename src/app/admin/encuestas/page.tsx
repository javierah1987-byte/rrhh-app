'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Heart, Plus, BarChart2, Users, CheckCircle, Loader2, X } from 'lucide-react'

type Encuesta={id:string;titulo:string;descripcion:string;activa:boolean;created_at:string;tipo:string}
type Pregunta={id:string;texto:string;tipo_respuesta:string;opciones:string[]|null}

const PREGUNTAS_DEFAULT:Pregunta[]=[
  {id:'1',texto:'¿Cómo valorarías tu satisfacción general en el trabajo?',tipo_respuesta:'escala',opciones:['1','2','3','4','5','6','7','8','9','10']},
  {id:'2',texto:'¿Te sientes reconocido/a por tu trabajo?',tipo_respuesta:'escala',opciones:['1','2','3','4','5']},
  {id:'3',texto:'¿Recomendarías esta empresa a un amigo?',tipo_respuesta:'escala',opciones:['1','2','3','4','5','6','7','8','9','10']},
  {id:'4',texto:'¿Qué mejorarías de tu entorno de trabajo?',tipo_respuesta:'texto',opciones:null},
]

export default function EncuestasPage(){
  const [encuestas,setEncuestas]=useState<Encuesta[]>([])
  const [loading,setLoading]=useState(true)
  const [modal,setModal]=useState(false)
  const [saving,setSaving]=useState(false)
  const [form,setForm]=useState({titulo:'',descripcion:'',tipo:'clima'})

  async function cargar(){
    setLoading(true)
    const{data}=await supabase.from('encuestas').select('*').order('created_at',{ascending:false})
    setEncuestas(data||[])
    setLoading(false)
  }

  useEffect(()=>{cargar()},[])

  async function crear(){
    if(!form.titulo)return
    setSaving(true)
    await supabase.from('encuestas').insert({
      titulo:form.titulo,
      descripcion:form.descripcion,
      activa:true,
      tipo:form.tipo,
      preguntas:PREGUNTAS_DEFAULT
    })
    setSaving(false);setModal(false);setForm({titulo:'',descripcion:'',tipo:'clima'})
    await cargar()
  }

  async function toggleActiva(id:string,activa:boolean){
    await supabase.from('encuestas').update({activa:!activa}).eq('id',id)
    await cargar()
  }

  return(
    <div>
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><Heart className="w-5 h-5 text-pink-500"/>Clima laboral</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Encuestas de satisfacción del equipo</p>
        </div>
        <button onClick={()=>setModal(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4"/>Nueva encuesta</button>
      </div>

      {loading?<div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-pink-300 border-t-pink-600 rounded-full animate-spin"/></div>
      :encuestas.length===0?(
        <div className="card p-16 text-center">
          <Heart className="w-14 h-14 text-slate-200 mx-auto mb-4"/>
          <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Sin encuestas todavía</h3>
          <p className="text-slate-500 text-sm mb-6">Crea tu primera encuesta de clima laboral para conocer la satisfacción del equipo</p>
          <button onClick={()=>setModal(true)} className="btn-primary inline-flex items-center gap-2"><Plus className="w-4 h-4"/>Crear encuesta</button>
        </div>
      ):(
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {encuestas.map(e=>(
            <div key={e.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{e.titulo}</p>
                  {e.descripcion&&<p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{e.descripcion}</p>}
                </div>
                <span className={`ml-2 flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium
                  ${e.activa?'bg-green-100 text-green-700':'bg-slate-100 text-slate-500'}`}>
                  {e.activa?'Activa':'Inactiva'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                <BarChart2 className="w-3.5 h-3.5"/>
                <span>{new Date(e.created_at).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'})}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>toggleActiva(e.id,e.activa)}
                  className={`flex-1 text-xs py-2 rounded-xl font-medium transition-colors
                    ${e.activa?'bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600':'bg-green-50 hover:bg-green-100 text-green-700'}`}>
                  {e.activa?'Desactivar':'Activar'}
                </button>
                <button className="flex-1 text-xs py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium flex items-center justify-center gap-1">
                  <BarChart2 className="w-3 h-3"/>Resultados
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal&&(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Nueva encuesta</h3>
              <button onClick={()=>setModal(false)}><X className="w-4 h-4 text-slate-400"/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Título *</label>
                <input value={form.titulo} onChange={e=>setForm(f=>({...f,titulo:e.target.value}))}
                  placeholder="Encuesta trimestral de clima..." className="input mt-1 w-full"/>
              </div>
              <div>
                <label className="label">Descripción</label>
                <textarea value={form.descripcion} onChange={e=>setForm(f=>({...f,descripcion:e.target.value}))}
                  placeholder="Explica brevemente el objetivo..." rows={2} className="input mt-1 w-full resize-none"/>
              </div>
              <div>
                <label className="label">Tipo</label>
                <select value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))} className="input mt-1 w-full">
                  <option value="clima">Clima laboral</option>
                  <option value="satisfaccion">Satisfacción</option>
                  <option value="enps">eNPS (Net Promoter Score)</option>
                  <option value="evaluacion">Evaluación 360°</option>
                </select>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3">
                <p className="text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5"/>
                  Se incluirán {PREGUNTAS_DEFAULT.length} preguntas predefinidas de clima laboral
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={()=>setModal(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={crear} disabled={saving||!form.titulo} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                {saving?<><Loader2 className="w-4 h-4 animate-spin"/>Creando...</>:<><Heart className="w-4 h-4"/>Crear encuesta</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}