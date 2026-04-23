// @ts-nocheck
'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Building2, CheckCircle, XCircle, Shield, Crown, Zap, Star, ToggleLeft, ToggleRight, LogOut, RefreshCw, ChevronDown, ChevronUp, Plus, X, TrendingUp, Users, Trash2, AlertTriangle, PauseCircle, PlayCircle, AlertOctagon } from 'lucide-react'

const PLAN_COLORS = { starter:'#6366f1', professional:'#10b981', enterprise:'#f59e0b', fichaje:'#0891b2' }
const PLAN_ICONS  = { starter: Star, professional: Zap, enterprise: Crown, fichaje: Shield }
const CAT_LABELS  = { tiempo:'⏰ Tiempo', ausencias:'📅 Ausencias', equipo:'👥 Equipo', reclutamiento:'💼 Reclutamiento', admin:'⚙️ Admin', comunicacion:'💬 Comunicación', cumplimiento:'🔒 Cumplimiento', premium:'💎 Premium', objetivos:'🎯 Objetivos', tareas:'✅ Tareas', formacion:'📚 Formación' }

export default function SuperAdminPage() {
  const [isAuth, setIsAuth]       = useState(false)
  const [pinInput, setPinInput]   = useState('')
  const [pinError, setPinError]   = useState(false)
  const PIN = 'Tryvor2024!'
  const [empresas, setEmpresas]   = useState([])
  const [planes, setPlanes]       = useState([])
  const [features, setFeatures]   = useState([])
  const [planFeatures, setPlanFeatures] = useState([])
  const [configs, setConfigs]     = useState([])
  const [overrides, setOverrides] = useState([])
  const [loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab]     = useState('clientes')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmSuspend, setConfirmSuspend] = useState(null) // {id, nombre, suspendida}
  const [motivoSuspension, setMotivoSuspension] = useState('')
  const [expandedEmp, setExpandedEmp] = useState(null)
  const [saving, setSaving]           = useState(null)
  const [newEmpModal, setNewEmpModal] = useState(false)
  const [newEmpForm, setNewEmpForm]   = useState({ nombre:'', email:'', plan:'starter', max_empleados:'10' })
  const [savingNew, setSavingNew]     = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    const [{ data: emps }, { data: pls }, { data: feats }, { data: pfs }, { data: cfgs }, { data: ovs }] = await Promise.all([
      supabase.from('empresas').select('*').order('suspendida', {ascending:false}).order('created_at', {ascending:false}),
      supabase.from('planes').select('*').order('precio_mes'),
      supabase.from('features').select('*').order('categoria').order('nombre'),
      supabase.from('plan_features').select('*'),
      supabase.from('config_empresa').select('*'),
      supabase.from('empresa_feature_overrides').select('*'),
    ])
    setEmpresas(emps||[])
    setPlanes(pls||[])
    setFeatures(feats||[])
    setPlanFeatures(pfs||[])
    setConfigs(cfgs||[])
    setOverrides(ovs||[])
    setLoading(false)
  }, [])

  useEffect(() => { if (isAuth) cargar() }, [isAuth, cargar])

  const getConfig = empId => configs.find(c => c.empresa_id === empId)
  const getPlanFIds = planId => planFeatures.filter(pf=>pf.plan_id===planId).map(pf=>pf.feature_id)
  const hasOverride = (empId, featId) => overrides.some(o=>o.empresa_id===empId&&o.feature_id===featId)

  const cambiarPlan = async (empId, planId) => {
    setSaving(empId+'-plan')
    const cfg = getConfig(empId)
    if (cfg) {
      await supabase.from('config_empresa').update({ plan_id: planId }).eq('empresa_id', empId)
    } else {
      await supabase.from('config_empresa').insert({ empresa_id: empId, plan_id: planId })
    }
    await supabase.from('empresas').update({ plan: planId }).eq('id', empId)
    setSaving(null); cargar()
  }

  const toggleOverride = async (empId, featId) => {
    setSaving(empId+'-'+featId)
    if (hasOverride(empId, featId)) {
      await supabase.from('empresa_feature_overrides').delete().eq('empresa_id', empId).eq('feature_id', featId)
    } else {
      await supabase.from('empresa_feature_overrides').insert({ empresa_id: empId, feature_id: featId })
    }
    setSaving(null); cargar()
  }

  const crearEmpresa = async () => {
    if (!newEmpForm.nombre || !newEmpForm.email) return
    setSavingNew(true)
    const { data: emp } = await supabase.from('empresas').insert({
      nombre: newEmpForm.nombre, email: newEmpForm.email,
      plan: newEmpForm.plan, max_empleados: +newEmpForm.max_empleados||10, activa: true,
    }).select().single()
    if (emp) await supabase.from('config_empresa').insert({ empresa_id: emp.id, plan_id: newEmpForm.plan })
    setSavingNew(false); setNewEmpModal(false)
    setNewEmpForm({ nombre:'', email:'', plan:'starter', max_empleados:'10' }); cargar()
  }

  const suspenderCliente = (id, nombre, suspendida) => {
    setMotivoSuspension('')
    setConfirmSuspend({ id, nombre, suspendida })
  }

  const confirmarSuspension = async () => {
    if (!confirmSuspend) return
    const { id, suspendida } = confirmSuspend
    const nuevoEstado = !suspendida
    await supabase.from('empresas').update({
      suspendida: nuevoEstado,
      motivo_suspension: nuevoEstado ? (motivoSuspension || 'Impago') : null,
      fecha_suspension: nuevoEstado ? new Date().toISOString() : null,
    }).eq('id', id)
    setConfirmSuspend(null)
    setMotivoSuspension('')
    cargar()
  }

  const borrarCliente = (id, nombre) => setConfirmDelete({ id, nombre })

  const confirmarBorrado = async () => {
    if (!confirmDelete) return
    const id = confirmDelete.id
    try {
      await supabase.from('empresa_feature_overrides').delete().eq('empresa_id', id)
      await supabase.from('config_empresa').delete().eq('empresa_id', id)
      await supabase.from('empleados').update({ estado: 'inactivo' }).eq('empresa_id', id)
      const { error } = await supabase.from('empresas').delete().eq('id', id)
      if (error) throw error
      setConfirmDelete(null); cargar()
    } catch (err) {
      alert('Error: ' + err.message); setConfirmDelete(null)
    }
  }

  const mrr = empresas.reduce((s, emp) => {
    const cfg = getConfig(emp.id)
    const plan = planes.find(p=>p.id===(cfg?.plan_id||emp.plan))
    return s + (plan ? +plan.precio_mes * (emp.max_empleados||10) : 0)
  }, 0)
  const arr = mrr * 12

  if (!isAuth) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-5">
          <Shield className="w-7 h-7 text-white"/>
        </div>
        <h1 className="text-white text-xl font-bold text-center mb-1">Super Admin</h1>
        <p className="text-slate-400 text-sm text-center mb-6">Nexo HR · Tryvor</p>
        <input type="password" value={pinInput} onChange={e=>setPinInput(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter'){ if(pinInput===PIN){setIsAuth(true)}else{setPinError(true);setTimeout(()=>setPinError(false),2000)} } }}
          placeholder="Contraseña de acceso"
          className={`w-full bg-slate-700 text-white rounded-xl px-4 py-3 border outline-none text-sm mb-3 ${pinError?'border-red-500':'border-slate-600 focus:border-indigo-500'}`}/>
        {pinError && <p className="text-red-400 text-xs text-center mb-3">Contraseña incorrecta</p>}
        <button onClick={()=>{ if(pinInput===PIN){setIsAuth(true)}else{setPinError(true);setTimeout(()=>setPinError(false),2000)} }}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 font-bold text-sm">Acceder</button>
      </div>
    </div>
  )

  const tabs = [
    { id:'clientes', label:'Clientes & Features' },
    { id:'planes',   label:'Comparar planes' },
    { id:'revenue',  label:'Ingresos' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5"/>
          </div>
          <div>
            <h1 className="font-bold text-base leading-none">Super Admin</h1>
            <p className="text-slate-400 text-xs mt-0.5">Nexo HR · Tryvor</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-slate-400">MRR</p>
            <p className="font-bold text-emerald-400">{mrr.toLocaleString('es-ES',{minimumFractionDigits:0})}€</p>
          </div>
          <button onClick={cargar} className="p-2 hover:bg-slate-700 rounded-lg">
            <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/>
          </button>
          <button onClick={()=>setIsAuth(false)} className="p-2 hover:bg-slate-700 rounded-lg">
            <LogOut className="w-4 h-4"/>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6 flex gap-1">
        {tabs.map(t => (
          <button key={t.id} onClick={()=>setActiveTab(t.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab===t.id?'border-indigo-600 text-indigo-600':'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-6 max-w-7xl mx-auto">

        {/* TAB CLIENTES */}
        {activeTab === 'clientes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Clientes activos</h2>
                <p className="text-slate-400 text-sm">{empresas.length} empresa{empresas.length!==1?'s':''} registradas</p>
              </div>
              <button onClick={()=>setNewEmpModal(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm">
                <Plus className="w-4 h-4"/> Nueva empresa
              </button>
            </div>
            {loading ? (
              <div className="text-slate-400 text-sm animate-pulse py-8 text-center">Cargando...</div>
            ) : (
              <div className="space-y-3">
                {empresas.map(emp => {
                  const cfg = getConfig(emp.id)
                  const plan = planes.find(p=>p.id===(cfg?.plan_id||emp.plan))
                  const PlanIcon = plan ? (PLAN_ICONS[plan.id]||Star) : Star
                  const planColor = plan ? (PLAN_COLORS[plan.id]||'#64748b') : '#64748b'
                  const isOpen = expandedEmp === emp.id
                  const planFIds = plan ? getPlanFIds(plan.id) : []
                  const ovs = overrides.filter(o=>o.empresa_id===emp.id)
                  const customCount = ovs.filter(o=>!planFIds.includes(o.feature_id)).length
                  return (
                    <div key={emp.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="px-5 py-4 flex items-center gap-3 flex-wrap cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={()=>setExpandedEmp(isOpen?null:emp.id)}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 text-white"
                          style={{background: planColor}}>
                          {emp.nombre?.charAt(0)||'?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{emp.nombre}</p>
                          <p className="text-slate-400 text-xs truncate">{emp.email}</p>
                        </div>
                        <select value={cfg?.plan_id||emp.plan||'starter'}
                          onClick={e=>e.stopPropagation()}
                          onChange={e=>cambiarPlan(emp.id, e.target.value)}
                          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-indigo-400 bg-white flex-shrink-0"
                          style={{color: planColor}}>
                          {planes.map(p=>(
                            <option key={p.id} value={p.id}>{p.nombre} — {p.precio_mes}€/u</option>
                          ))}
                        </select>
                        <div className="flex items-center gap-1 text-slate-400 text-xs flex-shrink-0">
                          <Users className="w-3.5 h-3.5"/>
                          <span>{emp.max_empleados||'?'}</span>
                        </div>
                        {customCount > 0 && (
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                            +{customCount} extra
                          </span>
                        )}
                        {/* Badge suspendida */}
                        {emp.suspendida && (
                          <span className="text-[10px] bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-bold flex-shrink-0 flex items-center gap-1">
                            <AlertOctagon className="w-2.5 h-2.5"/> SUSPENDIDA
                          </span>
                        )}

                        {/* BOTÓN SUSPENDER / REACTIVAR */}
                        <button onClick={(e)=>{ e.stopPropagation(); suspenderCliente(emp.id, emp.nombre, emp.suspendida) }}
                          title={emp.suspendida ? 'Reactivar servicio' : 'Suspender servicio'}
                          className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${emp.suspendida ? 'text-emerald-500 hover:bg-emerald-50' : 'text-amber-500 hover:bg-amber-50'}`}>
                          {emp.suspendida ? <PlayCircle className="w-4 h-4"/> : <PauseCircle className="w-4 h-4"/>}
                        </button>

                        {/* BOTÓN BORRAR */}
                        <button onClick={(e)=>{ e.stopPropagation(); borrarCliente(emp.id, emp.nombre) }}
                          title="Borrar cliente"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
                          <Trash2 className="w-4 h-4"/>
                        </button>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0"/> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0"/>}
                      </div>
                      {isOpen && (
                        <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/50">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Features activas</p>
                          <div className="space-y-3">
                            {Object.keys(CAT_LABELS).map(cat => {
                              const catFeats = features.filter(f=>f.categoria===cat)
                              if (!catFeats.length) return null
                              return (
                                <div key={cat}>
                                  <p className="text-xs text-slate-400 mb-1.5">{CAT_LABELS[cat]}</p>
                                  <div className="flex flex-wrap gap-2">
                                    {catFeats.map(f => {
                                      const inPlan = planFIds.includes(f.id)
                                      const inOverride = hasOverride(emp.id, f.id)
                                      const isActive = inPlan || inOverride
                                      const isSaving = saving === emp.id+'-'+f.id
                                      return (
                                        <button key={f.id}
                                          onClick={()=>toggleOverride(emp.id, f.id)}
                                          disabled={isSaving}
                                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${isActive ? inPlan ? 'bg-indigo-50 text-indigo-700 border-indigo-200 opacity-80' : 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'} ${isSaving?'opacity-50':''}`}>
                                          {isActive ? <CheckCircle className="w-3 h-3"/> : <XCircle className="w-3 h-3"/>}
                                          {f.nombre}
                                          {inPlan && !inOverride && <span className="text-[9px] text-indigo-400 ml-0.5">plan</span>}
                                        </button>
                                      )
                                    })}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB PLANES */}
        {activeTab === 'planes' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Comparar planes</h2>
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider w-48">Feature</th>
                    {planes.map(p => {
                      const Icon = PLAN_ICONS[p.id]||Star
                      return (
                        <th key={p.id} className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider" style={{color:PLAN_COLORS[p.id]||'#64748b'}}>
                          <div className="flex flex-col items-center gap-1">
                            <Icon className="w-4 h-4"/>
                            <span>{p.nombre}</span>
                            <span className="text-slate-400 font-normal normal-case">{p.precio_mes}€/u/mes</span>
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {Object.keys(CAT_LABELS).map(cat => {
                    const catFeats = features.filter(f=>f.categoria===cat)
                    if (!catFeats.length) return null
                    return [
                      <tr key={`cat-${cat}`} className="bg-slate-50/80">
                        <td colSpan={planes.length+1} className="px-5 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          {CAT_LABELS[cat]}
                        </td>
                      </tr>,
                      ...catFeats.map(f => (
                        <tr key={f.id} className="hover:bg-slate-50/50">
                          <td className="px-5 py-2 text-sm text-slate-600">{f.nombre}</td>
                          {planes.map(p => {
                            const has = planFeatures.some(pf=>pf.plan_id===p.id&&pf.feature_id===f.id)
                            return (
                              <td key={p.id} className="px-4 py-2 text-center">
                                {has ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto"/> : <span className="text-slate-200 text-lg">—</span>}
                              </td>
                            )
                          })}
                        </tr>
                      ))
                    ]
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB REVENUE */}
        {activeTab === 'revenue' && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-slate-800">Ingresos recurrentes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label:'MRR', val: mrr.toLocaleString('es-ES',{minimumFractionDigits:2})+'€', icon:TrendingUp, color:'text-emerald-600', bg:'bg-emerald-50' },
                { label:'ARR', val: arr.toLocaleString('es-ES',{minimumFractionDigits:0})+'€', icon:TrendingUp, color:'text-indigo-600', bg:'bg-indigo-50' },
                { label:'Ticket medio', val: empresas.length ? (mrr/empresas.length).toLocaleString('es-ES',{minimumFractionDigits:0})+'€' : '—', icon:Users, color:'text-amber-600', bg:'bg-amber-50' },
              ].map((k,i) => {
                const Icon = k.icon
                return (
                  <div key={i} className={`${k.bg} rounded-2xl border border-slate-200 p-5`}>
                    <Icon className={`w-5 h-5 ${k.color} mb-3`}/>
                    <p className={`text-2xl font-black ${k.color}`}>{k.val}</p>
                    <p className="text-slate-500 text-sm mt-1">{k.label}</p>
                  </div>
                )
              })}
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100">
                <p className="font-semibold text-slate-700">Desglose por empresa</p>
              </div>
              <div className="divide-y divide-slate-50">
                {empresas.map(emp => {
                  const cfg = getConfig(emp.id)
                  const plan = planes.find(p=>p.id===(cfg?.plan_id||emp.plan))
                  const revenue = plan ? +plan.precio_mes * (emp.max_empleados||10) : 0
                  return (
                    <div key={emp.id} className="flex items-center gap-4 px-5 py-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{background: plan ? PLAN_COLORS[plan.id]||'#64748b' : '#64748b'}}>
                        {emp.nombre?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{emp.nombre}</p>
                        <p className="text-xs text-slate-400">{plan?.nombre||'Sin plan'} · {emp.max_empleados||10} usuarios</p>
                      </div>
                      <p className="text-sm font-bold text-emerald-600 flex-shrink-0">{revenue.toLocaleString('es-ES',{minimumFractionDigits:2})}€/mes</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal nueva empresa */}
      {newEmpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-800 text-lg">Nueva empresa</h3>
              <button onClick={()=>setNewEmpModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-400"/>
              </button>
            </div>
            <div className="space-y-3">
              {[
                { k:'nombre', label:'Nombre empresa', ph:'ACME Corp' },
                { k:'email',  label:'Email contacto', ph:'admin@acme.com' },
              ].map(f=>(
                <div key={f.k}>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{f.label}</label>
                  <input value={newEmpForm[f.k]} onChange={e=>setNewEmpForm(p=>({...p,[f.k]:e.target.value}))}
                    placeholder={f.ph}
                    className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 outline-none focus:border-indigo-400"/>
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Plan inicial</label>
                <select value={newEmpForm.plan} onChange={e=>setNewEmpForm(p=>({...p,plan:e.target.value}))}
                  className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 outline-none focus:border-indigo-400">
                  {planes.map(p=><option key={p.id} value={p.id}>{p.nombre} — {p.precio_mes}€/usuario/mes</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nº usuarios</label>
                <input type="number" value={newEmpForm.max_empleados} onChange={e=>setNewEmpForm(p=>({...p,max_empleados:e.target.value}))}
                  className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 outline-none focus:border-indigo-400"/>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={()=>setNewEmpModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-500 hover:bg-slate-50">Cancelar</button>
              <button onClick={crearEmpresa} disabled={savingNew}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                <Plus className="w-4 h-4"/> {savingNew?'Creando...':'Crear empresa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal SUSPENDER / REACTIVAR */}
      {confirmSuspend && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className={`px-6 py-4 flex items-center gap-3 ${confirmSuspend.suspendida ? 'bg-emerald-600' : 'bg-amber-500'}`}>
              {confirmSuspend.suspendida
                ? <PlayCircle className="w-6 h-6 text-white flex-shrink-0"/>
                : <PauseCircle className="w-6 h-6 text-white flex-shrink-0"/>
              }
              <h3 className="text-white font-bold text-lg">
                {confirmSuspend.suspendida ? 'Reactivar servicio' : 'Suspender servicio'}
              </h3>
            </div>
            <div className="p-6">
              <div className="bg-slate-100 rounded-xl px-4 py-3 mb-4">
                <p className="font-bold text-slate-800">{confirmSuspend.nombre}</p>
              </div>
              {!confirmSuspend.suspendida ? (
                <>
                  <p className="text-slate-500 text-sm mb-3">
                    El cliente no podrá acceder a Nexo HR hasta que reaktives el servicio. Verá un aviso de impago.
                  </p>
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Motivo (opcional)</label>
                    <input
                      value={motivoSuspension}
                      onChange={e=>setMotivoSuspension(e.target.value)}
                      placeholder="Ej: Factura #123 pendiente de pago"
                      className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 outline-none focus:border-amber-400"/>
                  </div>
                  <p className="text-xs text-amber-600 font-semibold mb-5">⚠️ Los usuarios verán una pantalla de servicio suspendido.</p>
                </>
              ) : (
                <p className="text-slate-500 text-sm mb-5">
                  Se restablecerá el acceso completo a Nexo HR para este cliente.
                </p>
              )}
              <div className="flex gap-3">
                <button onClick={()=>setConfirmSuspend(null)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
                  Cancelar
                </button>
                <button onClick={confirmarSuspension}
                  className={`flex-1 py-2.5 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg ${confirmSuspend.suspendida ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-500 hover:bg-amber-600'}`}>
                  {confirmSuspend.suspendida
                    ? <><PlayCircle className="w-4 h-4"/> Reactivar</>
                    : <><PauseCircle className="w-4 h-4"/> Suspender</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Modal confirmación BORRAR */
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-red-600 px-6 py-4 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-white flex-shrink-0"/>
              <h3 className="text-white font-bold text-lg">Borrar cliente</h3>
            </div>
            <div className="p-6">
              <p className="text-slate-500 text-sm mb-3">Vas a borrar permanentemente:</p>
              <div className="bg-slate-100 rounded-xl px-4 py-3 mb-4">
                <p className="font-bold text-slate-800">{confirmDelete.nombre}</p>
                <p className="text-xs text-slate-400 mt-0.5">Se eliminará la empresa y su configuración. Los empleados quedarán inactivos.</p>
              </div>
              <p className="text-xs text-red-500 font-semibold mb-5">⚠️ Esta acción no se puede deshacer.</p>
              <div className="flex gap-3">
                <button onClick={()=>setConfirmDelete(null)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
                <button onClick={confirmarBorrado}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg">
                  <Trash2 className="w-4 h-4"/> Borrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}