// @ts-nocheck
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { UpsellModal } from '@/components/FeatureGate'
import { Lock, TrendingUp } from 'lucide-react'

const FEAT = 'onboarding'
const MIN_PLAN = 'professional'

function FeatureBlockScreen({ plan, onContacto }) {
  const [modal, setModal] = useState(false)
  return (
    <div className='flex flex-col items-center justify-center min-h-[70vh] p-8 text-center'>
      <div className='w-24 h-24 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-3xl flex items-center justify-center mb-6 shadow-inner'>
        <Lock className='w-12 h-12 text-indigo-400'/>
      </div>
      <h2 className='text-2xl font-black text-slate-800 mb-3'>Función no disponible en tu plan</h2>
      <p className='text-slate-500 max-w-md mb-2'>Para acceder a esta sección necesitas el plan <strong>Professional</strong> o superior.</p>
      <p className='text-slate-400 text-sm mb-8'>Contacta con nosotros y mejora tu plan en minutos.</p>
      <div className='flex flex-col sm:flex-row gap-3'>
        <button onClick={()=>setModal(true)}
          className='bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3.5 rounded-xl flex items-center gap-2 shadow-lg transition-colors'>
          <TrendingUp className='w-5 h-5'/> Ver planes y mejorar
        </button>
        <a href='mailto:hola@tryvor.es?subject=Quiero mejorar mi plan Nexo HR'
          className='border-2 border-indigo-200 text-indigo-600 font-semibold px-8 py-3.5 rounded-xl hover:bg-indigo-50 transition-colors'>
          Contactar por email
        </a>
      </div>
      {modal && <UpsellModal feature={FEAT} minPlan={MIN_PLAN} currentPlan={plan} onClose={()=>setModal(false)}/>}
    </div>
  )
}
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { UserPlus, UserMinus, Clock, ChevronDown, ChevronUp, Plus, X, Check } from 'lucide-react'

const RESP = {
  rrhh:    { label:'RRHH',     color:'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  manager: { label:'Manager',  color:'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  empleado:{ label:'Empleado', color:'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  ti:      { label:'TI',       color:'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  legal:   { label:'Legal',    color:'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
}

function OriginalPageContent() {
  const [procesos, setProcesos]     = useState([])
  const [empleados, setEmpleados]   = useState([])
  const [plantillas, setPlantillas] = useState([])
  const [loading, setLoading]       = useState(true)
  const [tab, setTab]               = useState('activos')
  const [expanded, setExpanded]     = useState({})
  const [showNew, setShowNew]       = useState(false)
  const [form, setForm]             = useState({ empleado_id:'', tipo:'onboarding', plantilla_id:'' })
  const [saving, setSaving]         = useState(false)

  const cargar = async () => {
    setLoading(true)
    const [a,b,c] = await Promise.all([
      supabase.from('onboarding_procesos').select('*, empleado:empleados(id,nombre,puesto), tareas:onboarding_tareas(*)').order('created_at',{ascending:false}),
      supabase.from('empleados').select('id,nombre,puesto').eq('estado','activo').order('nombre'),
      supabase.from('onboarding_plantillas').select('*, tareas:onboarding_tareas_plantilla(*)').eq('activa',true),
    ])
    setProcesos(a.data||[])
    setEmpleados(b.data||[])
    setPlantillas(c.data||[])
    setLoading(false)
  }
  useEffect(()=>{ cargar() },[])

  const toggleTarea = async (id, done) => {
    await supabase.from('onboarding_tareas').update({ completada:!done, completada_at:!done?new Date().toISOString():null }).eq('id',id)
    await cargar()
  }

  const crear = async () => {
    if(!form.empleado_id||!form.plantilla_id) return
    setSaving(true)
    const pl = plantillas.find(p=>p.id===form.plantilla_id)
    const {data:proc} = await supabase.from('onboarding_procesos').insert({
      empleado_id:form.empleado_id, tipo:form.tipo, plantilla_id:form.plantilla_id,
      fecha_inicio:new Date().toISOString().split('T')[0],
      fecha_fin_prevista:new Date(Date.now()+30*86400000).toISOString().split('T')[0],
      estado:'en_progreso'
    }).select().single()
    if(proc&&pl?.tareas) {
      await supabase.from('onboarding_tareas').insert(
        pl.tareas.map((t,i)=>({
          proceso_id:proc.id, titulo:t.titulo, responsable:t.responsable,
          fecha_limite:new Date(Date.now()+(t.dias_desde_inicio||0)*86400000).toISOString().split('T')[0],
          orden:t.orden||i
        }))
      )
    }
    setShowNew(false)
    setForm({empleado_id:'',tipo:'onboarding',plantilla_id:''})
    setSaving(false)
    await cargar()
  }

  const progress = (tareas=[]) => tareas.length?Math.round(tareas.filter(t=>t.completada).length/tareas.length*100):0
  const filtrados = procesos.filter(p=>tab==='activos'?p.estado==='en_progreso':p.estado==='completado')

  if(loading) return <div className="p-8 text-slate-400 text-sm">Cargando...</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <UserPlus className="w-7 h-7 text-indigo-500"/> Onboarding & Offboarding
          </h1>
          <p className="text-slate-500 text-sm mt-1">Incorporación y salida de empleados</p>
        </div>
        <button onClick={()=>setShowNew(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4"/> Nuevo proceso
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          {label:'En progreso', val:procesos.filter(p=>p.estado==='en_progreso').length, color:'text-indigo-600', bg:'bg-indigo-50 dark:bg-indigo-900/20'},
          {label:'Completados',  val:procesos.filter(p=>p.estado==='completado').length,  color:'text-emerald-600',bg:'bg-emerald-50 dark:bg-emerald-900/20'},
          {label:'Total',        val:procesos.length,                                      color:'text-slate-600', bg:'bg-slate-50 dark:bg-slate-800'},
        ].map((s,i)=>(
          <div key={i} className={`${s.bg} rounded-xl p-4`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
            <p className="text-slate-500 text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-slate-200 dark:border-slate-700">
        {[['activos','En progreso'],['completados','Completados']].map(([id,lbl])=>(
          <button key={id} onClick={()=>setTab(id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab===id?'text-indigo-600 border-indigo-600':'text-slate-400 border-transparent hover:text-slate-600'}`}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {filtrados.length===0&&(
          <div className="text-center py-12 text-slate-400">
            <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-20"/>
            <p>No hay procesos {tab==='activos'?'activos':'completados'}</p>
          </div>
        )}
        {filtrados.map(proc=>{
          const pct = progress(proc.tareas)
          const open = expanded[proc.id]
          return (
            <div key={proc.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
              <div className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                onClick={()=>setExpanded(e=>({...e,[proc.id]:!e[proc.id]}))}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${proc.tipo==='onboarding'?'bg-indigo-100 dark:bg-indigo-900/30':'bg-rose-100 dark:bg-rose-900/30'}`}>
                    {proc.tipo==='onboarding'
                      ?<UserPlus className="w-5 h-5 text-indigo-600"/>
                      :<UserMinus className="w-5 h-5 text-rose-500"/>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-800 dark:text-white">{proc.empleado?.nombre}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${proc.tipo==='onboarding'?'bg-indigo-100 text-indigo-700':'bg-rose-100 text-rose-700'}`}>
                        {proc.tipo==='onboarding'?'Incorporación':'Salida'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${proc.estado==='completado'?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}`}>
                        {proc.estado==='completado'?'✅ Completado':'⏳ En progreso'}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5">{proc.empleado?.puesto} · Inicio: {new Date(proc.fecha_inicio).toLocaleDateString('es-ES')}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                        <div className="bg-indigo-500 h-1.5 rounded-full" style={{width:`${pct}%`}}/>
                      </div>
                      <span className="text-xs text-slate-500 flex-shrink-0">{pct}% · {proc.tareas?.filter(t=>t.completada).length||0}/{proc.tareas?.length||0}</span>
                    </div>
                  </div>
                  {open?<ChevronUp className="w-4 h-4 text-slate-400"/>:<ChevronDown className="w-4 h-4 text-slate-400"/>}
                </div>
              </div>

              {open&&(
                <div className="border-t border-slate-100 dark:border-slate-700 divide-y divide-slate-50 dark:divide-slate-700/50">
                  {(proc.tareas||[]).sort((a,b)=>a.orden-b.orden).map(t=>{
                    const r=RESP[t.responsable]||{label:t.responsable,color:'bg-slate-100 text-slate-600'}
                    return(
                      <div key={t.id} className={`flex items-start gap-3 p-3 ${t.completada?'opacity-60':''}`}>
                        <button onClick={()=>toggleTarea(t.id,t.completada)}
                          className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${t.completada?'bg-emerald-500 border-emerald-500':'border-slate-300 hover:border-indigo-400'}`}>
                          {t.completada&&<Check className="w-3 h-3 text-white"/>}
                        </button>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${t.completada?'line-through text-slate-400':'text-slate-700 dark:text-slate-200'}`}>{t.titulo}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${r.color}`}>{r.label}</span>
                            {t.fecha_limite&&<span className="text-xs text-slate-400 flex items-center gap-0.5"><Clock className="w-3 h-3"/>{new Date(t.fecha_limite).toLocaleDateString('es-ES')}</span>}
                            {t.completada&&t.completada_at&&<span className="text-xs text-emerald-600">✓ {new Date(t.completada_at).toLocaleDateString('es-ES')}</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {showNew&&(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Nuevo proceso</h3>
              <button onClick={()=>setShowNew(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Tipo de proceso</label>
                <div className="grid grid-cols-2 gap-2">
                  {[['onboarding','👋 Incorporación'],['offboarding','🚪 Salida']].map(([val,lbl])=>(
                    <button key={val} onClick={()=>setForm(f=>({...f,tipo:val,plantilla_id:''}))}
                      className={`py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${form.tipo===val?'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300':'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300'}`}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Empleado</label>
                <select value={form.empleado_id} onChange={e=>setForm(f=>({...f,empleado_id:e.target.value}))}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:bg-slate-700 dark:text-white">
                  <option value="">Seleccionar empleado...</option>
                  {empleados.map(e=><option key={e.id} value={e.id}>{e.nombre} — {e.puesto}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Plantilla</label>
                <select value={form.plantilla_id} onChange={e=>setForm(f=>({...f,plantilla_id:e.target.value}))}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:bg-slate-700 dark:text-white">
                  <option value="">Seleccionar plantilla...</option>
                  {plantillas.filter(p=>p.tipo===form.tipo).map(p=>(
                    <option key={p.id} value={p.id}>{p.nombre} ({p.tareas?.length||0} tareas)</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={()=>setShowNew(false)} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">Cancelar</button>
                <button onClick={crear} disabled={saving||!form.empleado_id||!form.plantilla_id}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
                  {saving?'Creando...':'Crear proceso'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Wrapper con gate
export default function GatedWrapper() {
  const [hasAccess, setHasAccess] = useState(null)
  const [plan, setPlan] = useState('starter')

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setHasAccess(false); return }
      const { data: emp } = await supabase.from('empleados')
        .select('empresa_id, empresas(plan)')
        .eq('user_id', user.id).single()
      const empPlan = emp?.empresas?.plan || 'starter'
      const empId = emp?.empresa_id
      setPlan(empPlan)
      // Check plan features
      const { data: pf } = await supabase.from('plan_features')
        .select('feature_id').eq('plan_id', empPlan).eq('feature_id', FEAT)
      const { data: ov } = await supabase.from('empresas_features_override')
        .select('activa').eq('empresa_id', empId).eq('feature_id', FEAT).single()
      const inPlan = (pf||[]).length > 0
      const override = ov ? ov.activa : null
      setHasAccess(override !== null ? override : inPlan)
    })()
  }, [])

  if (hasAccess === null) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"/>
    </div>
  )
  if (!hasAccess) return <FeatureBlockScreen plan={plan}/>
  return <OriginalPageContent/>
}