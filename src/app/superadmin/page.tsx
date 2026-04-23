// @ts-nocheck
'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle, XCircle, Shield, Crown, Zap, Star, LogOut, RefreshCw, ChevronDown, ChevronUp, Plus, X, TrendingUp, Users, Trash2, AlertTriangle, PauseCircle, PlayCircle, AlertOctagon, Building2, Layers } from 'lucide-react'

const PLAN_COLORS = { starter:'#6366f1', professional:'#10b981', enterprise:'#f59e0b', fichaje:'#0891b2' }
const PLAN_ICONS  = { starter: Star, professional: Zap, enterprise: Crown, fichaje: Shield }
const PLAN_LABELS = { starter:'Starter', professional:'Professional', enterprise:'Enterprise', fichaje:'Fichaje' }
const CAT_LABELS  = { tiempo:'⏰ Tiempo', ausencias:'📅 Ausencias', equipo:'👥 Equipo', reclutamiento:'💼 Reclutamiento', admin:'⚙️ Admin', comunicacion:'💬 Comunicación', cumplimiento:'🔒 Cumplimiento', premium:'💎 Premium', objetivos:'🎯 Objetivos', tareas:'✅ Tareas', formacion:'📚 Formación' }

function PlanBadge({ planId }) {
  const color = PLAN_COLORS[planId] || '#64748b'
  const label = PLAN_LABELS[planId] || planId
  const Icon = PLAN_ICONS[planId] || Star
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{background: color+'20', color}}>
      <Icon className="w-2.5 h-2.5"/>{label}
    </span>
  )
}

export default function SuperAdminPage() {
  const [isAuth, setIsAuth]   = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)
  const PIN = 'Tryvor2024!'

  const [empresas, setEmpresas]     = useState([])
  const [grupos, setGrupos]         = useState([])
  const [planes, setPlanes]         = useState([])
  const [features, setFeatures]     = useState([])
  const [planFeatures, setPlanFeatures] = useState([])
  const [configs, setConfigs]       = useState([])
  const [overrides, setOverrides]   = useState([])
  const [loading, setLoading]       = useState(true)

  const [activeTab, setActiveTab]   = useState('clientes')
  const [expandedEmp, setExpandedEmp] = useState(null)
  const [expandedGrupo, setExpandedGrupo] = useState(null)
  const [saving, setSaving]         = useState(null)
  const [search, setSearch]         = useState('')

  const [confirmDelete, setConfirmDelete]   = useState(null)
  const [confirmSuspend, setConfirmSuspend] = useState(null)
  const [motivoSuspension, setMotivoSuspension] = useState('')

  const [newEmpModal, setNewEmpModal] = useState(false)
  const [newGrupoModal, setNewGrupoModal] = useState(false)
  const [newEmpForm, setNewEmpForm]   = useState({ nombre:'', email:'', plan:'starter', max_empleados:'10', grupo_id:'', cif:'', telefono:'', direccion:'', ciudad:'', codigo_postal:'', pais:'España', web:'' })
  const [newEmpPaso, setNewEmpPaso]     = useState(1) // 1=empresa, 2=admin, 3=ok
  const [newEmpResult, setNewEmpResult] = useState(null) // {empresa, adminEmail, adminPass}
  const [adminForm, setAdminForm]       = useState({ nombre:'', email:'', password:'' })
  const [newGrupoForm, setNewGrupoForm] = useState({ nombre:'', email_contacto:'', telefono:'' })
  const [savingNew, setSavingNew]   = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    const [{ data: emps }, { data: grps }, { data: pls }, { data: feats }, { data: pfs }, { data: cfgs }, { data: ovs }] = await Promise.all([
      supabase.from('empresas').select('*').order('created_at', {ascending:false}),
      supabase.from('grupos').select('*').order('nombre'),
      supabase.from('planes').select('*').order('precio_mes'),
      supabase.from('features').select('*').order('categoria').order('nombre'),
      supabase.from('plan_features').select('*'),
      supabase.from('empresas_config').select('*'),
      supabase.from('empresas_features_override').select('*'),
    ])
    setEmpresas(emps||[]); setGrupos(grps||[]); setPlanes(pls||[])
    setFeatures(feats||[]); setPlanFeatures(pfs||[]); setConfigs(cfgs||[]); setOverrides(ovs||[])
    setLoading(false)
  }, [])

  useEffect(() => { if (isAuth) cargar() }, [isAuth, cargar])

  const getConfig = empId => configs.find(c => c.empresa_id === empId)
  const getPlanId = emp => { const cfg = getConfig(emp.id); return cfg?.plan_id || emp.plan }
  const getPlanFIds = planId => planFeatures.filter(pf=>pf.plan_id===planId).map(pf=>pf.feature_id)
  const hasOverride = (empId, featId) => overrides.some(o=>o.empresa_id===empId&&o.feature_id===featId&&o.activa!==false)
  const getMRREmp = emp => { const plan = planes.find(p=>p.id===getPlanId(emp)); return plan ? +plan.precio_mes*(emp.max_empleados||10):0 }

  const cambiarPlan = async (empId, planId) => {
    setSaving(empId+'-plan')
    const { error } = await supabase.from('empresas').update({ plan: planId }).eq('id', empId)
    if (error) { alert('Error: ' + error.message); setSaving(null); return }
    const cfg = getConfig(empId)
    if (cfg) await supabase.from('empresas_config').update({ plan_id: planId }).eq('empresa_id', empId)
    else await supabase.from('empresas_config').insert({ empresa_id: empId, plan_id: planId, activa: true })
    setSaving(null); cargar()
  }

  const toggleOverride = async (empId, featId) => {
    setSaving(empId+'-'+featId)
    if (hasOverride(empId,featId)) await supabase.from('empresas_features_override').delete().eq('empresa_id',empId).eq('feature_id',featId)
    else await supabase.from('empresas_features_override').insert({empresa_id:empId, feature_id:featId, activa:true})
    setSaving(null); cargar()
  }

  const crearEmpresa = async () => {
    if (!newEmpForm.nombre||!newEmpForm.email) return
    setSavingNew(true)
    const payload = { nombre:newEmpForm.nombre, email:newEmpForm.email, plan:newEmpForm.plan, max_empleados:+newEmpForm.max_empleados||10, activa:true, cif:newEmpForm.cif||null, telefono:newEmpForm.telefono||null, direccion:newEmpForm.direccion||null, ciudad:newEmpForm.ciudad||null, codigo_postal:newEmpForm.codigo_postal||null, pais:newEmpForm.pais||'España', web:newEmpForm.web||null }
    if (newEmpForm.grupo_id) payload.grupo_id = newEmpForm.grupo_id
    const { data: emp } = await supabase.from('empresas').insert(payload).select().single()
    if (emp) await supabase.from('empresas_config').insert({empresa_id:emp.id,plan_id:newEmpForm.plan})
    setSavingNew(false)
    // Pasar al paso 2: crear usuario admin
    window._newEmpId = emp?.id
    setNewEmpPaso(2)
  }

  const crearAdminEmpresa = async () => {
    if (!adminForm.nombre||!adminForm.email||!adminForm.password) return
    if (adminForm.password.length < 6) { alert('La contraseña debe tener al menos 6 caracteres'); return }
    setSavingNew(true)
    const { data:{ session } } = await supabase.auth.getSession()
    const empId = window._newEmpId
    const res = await fetch('https://mmujjxoywrfolbvmotya.supabase.co/functions/v1/create-user', {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+session?.access_token},
      body: JSON.stringify({
        nombre: adminForm.nombre,
        email: adminForm.email,
        password: adminForm.password,
        rol: 'owner',
        puesto: 'Administrador',
        departamento: 'Dirección',
        jornada_horas: 40,
        empresa_id: empId,
      })
    })
    const data = await res.json()
    setSavingNew(false)
    if (!res.ok) { alert('Error al crear usuario: '+(data.error||'Error desconocido')); return }
    setNewEmpResult({ empresa: newEmpForm.nombre, adminEmail: adminForm.email, adminPass: adminForm.password })
    setNewEmpPaso(3)
    cargar()
  }

  const resetNewEmpModal = () => {
    setNewEmpModal(false)
    setNewEmpPaso(1)
    setNewEmpResult(null)
    setNewEmpForm({nombre:'',email:'',plan:'starter',max_empleados:'10',grupo_id:'',cif:'',telefono:'',direccion:'',ciudad:'',codigo_postal:'',pais:'España',web:''})
    setAdminForm({nombre:'',email:'',password:''})
    window._newEmpId = null
  }

  const crearGrupo = async () => {
    if (!newGrupoForm.nombre) return
    setSavingNew(true)
    await supabase.from('grupos').insert({nombre:newGrupoForm.nombre,email_contacto:newGrupoForm.email_contacto||null,telefono:newGrupoForm.telefono||null})
    setSavingNew(false); setNewGrupoModal(false)
    setNewGrupoForm({nombre:'',email_contacto:'',telefono:''}); cargar()
  }

  const suspenderCliente = (id, nombre, suspendida, isGrupo) => {
    setMotivoSuspension('')
    setConfirmSuspend({id, nombre, suspendida, isGrupo})
  }

  const confirmarSuspension = async () => {
    if (!confirmSuspend) return
    const nuevoEstado = !confirmSuspend.suspendida
    const update = { suspendida:nuevoEstado, motivo_suspension:nuevoEstado?(motivoSuspension||'Impago'):null, fecha_suspension:nuevoEstado?new Date().toISOString():null }
    if (confirmSuspend.isGrupo) {
      // Suspender todas las empresas del grupo
      await supabase.from('empresas').update(update).eq('grupo_id', confirmSuspend.id)
    } else {
      await supabase.from('empresas').update(update).eq('id', confirmSuspend.id)
    }
    setConfirmSuspend(null); setMotivoSuspension(''); cargar()
  }

  const borrarCliente = (id, nombre) => setConfirmDelete({id, nombre})

  const confirmarBorrado = async () => {
    if (!confirmDelete) return
    const id = confirmDelete.id
    try {
      await supabase.from('empresas_features_override').delete().eq('empresa_id',id)
      await supabase.from('empresas_config').delete().eq('empresa_id',id)
      await supabase.from('empleados').update({estado:'inactivo'}).eq('empresa_id',id)
      const { error } = await supabase.from('empresas').delete().eq('id',id)
      if (error) throw error
      setConfirmDelete(null); cargar()
    } catch(err) { alert('Error: '+err.message); setConfirmDelete(null) }
  }

  const mrr = empresas.reduce((s,emp)=>s+getMRREmp(emp),0)
  const arr = mrr*12

  const empsFiltradas = empresas.filter(e => !search || e.nombre?.toLowerCase().includes(search.toLowerCase()) || e.email?.toLowerCase().includes(search.toLowerCase()))
  const empsLibres = empsFiltradas.filter(e=>!e.grupo_id)
  const gruposConEmps = grupos.map(g=>({ ...g, empresas: empsFiltradas.filter(e=>e.grupo_id===g.id) })).filter(g=>g.empresas.length>0||!search)

  if (!isAuth) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-900/50">
          <Shield className="w-8 h-8 text-white"/>
        </div>
        <h1 className="text-white text-2xl font-black text-center mb-1">Super Admin</h1>
        <p className="text-indigo-400 text-sm text-center mb-8">Nexo HR · Panel de control</p>
        <input type="password" value={pinInput} onChange={e=>setPinInput(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter'){ if(pinInput===PIN){setIsAuth(true)}else{setPinError(true);setTimeout(()=>setPinError(false),2000)} } }}
          placeholder="Contraseña de acceso"
          className={`w-full bg-slate-800 text-white rounded-xl px-4 py-3 border outline-none text-sm mb-3 ${pinError?'border-red-500 bg-red-900/20':'border-slate-700 focus:border-indigo-500'}`}/>
        {pinError && <p className="text-red-400 text-xs text-center mb-3">Contraseña incorrecta</p>}
        <button onClick={()=>{ if(pinInput===PIN){setIsAuth(true)}else{setPinError(true);setTimeout(()=>setPinError(false),2000)} }}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 font-bold text-sm transition-colors shadow-lg">
          Acceder
        </button>
      </div>
    </div>
  )

  const tabs = [
    {id:'clientes', label:'Clientes', icon:Building2},
    {id:'planes',   label:'Planes', icon:Star},
    {id:'revenue',  label:'Ingresos', icon:TrendingUp},
  ]

  const EmpCard = ({ emp, inGrupo }) => {
    const planId   = getPlanId(emp)
    const plan     = planes.find(p=>p.id===planId)
    const planColor = emp.suspendida ? '#ef4444' : (PLAN_COLORS[planId]||'#64748b')
    const isOpen   = expandedEmp === emp.id
    const planFIds = plan ? getPlanFIds(planId) : []
    const customCount = overrides.filter(o=>o.empresa_id===emp.id&&!planFIds.includes(o.feature_id)).length
    const empMRR   = getMRREmp(emp)
    return (
      <div className={`rounded-xl border overflow-hidden transition-all ${emp.suspendida?'border-red-300 bg-red-50/30':'border-slate-200 bg-white'} ${inGrupo?'':'shadow-sm'}`}>
        <div className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors"
          onClick={()=>setExpandedEmp(isOpen?null:emp.id)}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-base flex-shrink-0 text-white"
            style={{background:planColor}}>
            {emp.suspendida?'⏸':emp.nombre?.charAt(0)||'?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-slate-800 text-sm truncate">{emp.nombre}</p>
              {emp.suspendida
                ? <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 px-1.5 py-0.5 rounded-full"><AlertOctagon className="w-2.5 h-2.5"/>SUSPENDIDA</span>
                : <PlanBadge planId={planId}/>
              }
              {customCount>0 && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">{customCount} extra</span>}
            </div>
            <p className="text-slate-400 text-xs truncate">{emp.email} · {emp.max_empleados||'?'} usuarios</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-xs font-bold text-emerald-600 mr-1">{empMRR.toFixed(0)}€</span>
            <button onClick={e=>{e.stopPropagation();suspenderCliente(emp.id,emp.nombre,emp.suspendida,false)}}
              title={emp.suspendida?'Reactivar':'Suspender por impago'}
              className={`p-1.5 rounded-lg transition-colors ${emp.suspendida?'text-emerald-500 hover:bg-emerald-50':'text-amber-500 hover:bg-amber-50'}`}>
              {emp.suspendida?<PlayCircle className="w-3.5 h-3.5"/>:<PauseCircle className="w-3.5 h-3.5"/>}
            </button>
            <button onClick={e=>{e.stopPropagation();borrarCliente(emp.id,emp.nombre)}}
              title="Borrar empresa" className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 className="w-3.5 h-3.5"/>
            </button>
            {isOpen?<ChevronUp className="w-4 h-4 text-slate-300"/>:<ChevronDown className="w-4 h-4 text-slate-300"/>}
          </div>
        </div>
        {isOpen && (
          <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50">
            {emp.suspendida ? (
              <div>
                <p className="text-sm font-semibold text-red-600 mb-1">Servicio suspendido</p>
                {emp.motivo_suspension && <p className="text-xs text-red-500">Motivo: {emp.motivo_suspension}</p>}
                {emp.fecha_suspension && <p className="text-xs text-red-400 mt-0.5">Desde: {new Date(emp.fecha_suspension).toLocaleDateString('es-ES')}</p>}
                <button onClick={()=>suspenderCliente(emp.id,emp.nombre,true,false)}
                  className="mt-3 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                  <PlayCircle className="w-3 h-3"/> Reactivar servicio
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-2">
                  <label className="text-xs text-slate-500">Plan:</label>
                  <select value={planId||'starter'} onChange={e=>cambiarPlan(emp.id,e.target.value)}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-indigo-400 bg-white" style={{color:PLAN_COLORS[planId]||'#64748b'}}>
                    {planes.map(p=><option key={p.id} value={p.id}>{p.nombre} — {p.precio_mes}€/u</option>)}
                  </select>
                </div>
                {Object.keys(CAT_LABELS).map(cat => {
                  const catFeats = features.filter(f=>f.categoria===cat)
                  if (!catFeats.length) return null
                  return (
                    <div key={cat}>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{CAT_LABELS[cat]}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {catFeats.map(f => {
                          const inPlan = planFIds.includes(f.id)
                          const inOv   = hasOverride(emp.id,f.id)
                          const active = inPlan||inOv
                          const isSav  = saving===emp.id+'-'+f.id
                          return (
                            <button key={f.id} onClick={()=>toggleOverride(emp.id,f.id)} disabled={isSav}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border transition-all ${active?inPlan?'bg-indigo-50 text-indigo-700 border-indigo-200':'bg-emerald-50 text-emerald-700 border-emerald-200':'bg-white text-slate-400 border-slate-200 hover:border-slate-300'} ${isSav?'opacity-40':''}`}>
                              {active?<CheckCircle className="w-2.5 h-2.5"/>:<XCircle className="w-2.5 h-2.5"/>}
                              {f.nombre}
                              {inPlan&&!inOv&&<span className="text-[8px] opacity-60">plan</span>}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100">

      {/* Header */}
      <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <Shield className="w-5 h-5"/>
          </div>
          <div>
            <h1 className="font-black text-base leading-none">Super Admin</h1>
            <p className="text-indigo-400 text-xs mt-0.5">Nexo HR · Tryvor</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <p className="text-xs text-slate-400">MRR Total</p>
            <p className="font-black text-emerald-400 text-lg leading-none">{mrr.toLocaleString('es-ES',{maximumFractionDigits:0})}€</p>
          </div>
          <div className="hidden sm:flex flex-col items-end">
            <p className="text-xs text-slate-400">Clientes</p>
            <p className="font-black text-white text-lg leading-none">{empresas.length}</p>
          </div>
          <button onClick={cargar} className="p-2 hover:bg-slate-700 rounded-lg transition-colors" title="Recargar">
            <RefreshCw className={`w-4 h-4 ${loading?'animate-spin text-indigo-400':''}`}/>
          </button>
          <button onClick={()=>setIsAuth(false)} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <LogOut className="w-4 h-4"/>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="flex gap-0">
          {tabs.map(t => {
            const Icon = t.icon
            return (
              <button key={t.id} onClick={()=>setActiveTab(t.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors ${activeTab===t.id?'border-indigo-600 text-indigo-600':'border-transparent text-slate-400 hover:text-slate-700'}`}>
                <Icon className="w-4 h-4"/>
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="p-4 lg:p-6 max-w-5xl mx-auto">

        {/* ─── TAB CLIENTES ─── */}
        {activeTab==='clientes' && (
          <div className="space-y-4">
            {/* Actions row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Buscar empresa..."
                className="flex-1 bg-white rounded-xl px-4 py-2.5 text-sm border border-slate-200 outline-none focus:border-indigo-400 shadow-sm"/>
              <div className="flex gap-2">
                <button onClick={()=>setNewGrupoModal(true)}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm whitespace-nowrap">
                  <Layers className="w-4 h-4"/> Nuevo grupo
                </button>
                <button onClick={()=>setNewEmpModal(true)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm whitespace-nowrap">
                  <Plus className="w-4 h-4"/> Nueva empresa
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-16 text-slate-400 text-sm animate-pulse">Cargando clientes...</div>
            ) : (
              <div className="space-y-4">

                {/* GRUPOS */}
                {gruposConEmps.map(grupo => {
                  const grupoMRR = grupo.empresas.reduce((s,e)=>s+getMRREmp(e),0)
                  const totalUsers = grupo.empresas.reduce((s,e)=>s+(e.max_empleados||0),0)
                  const allSusp = grupo.empresas.every(e=>e.suspendida)
                  const someSusp = grupo.empresas.some(e=>e.suspendida)
                  const isOpen = expandedGrupo === grupo.id
                  return (
                    <div key={grupo.id} className="rounded-2xl border-2 border-purple-200 bg-white shadow-sm overflow-hidden">
                      {/* Header grupo */}
                      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 flex items-center gap-3 cursor-pointer"
                        onClick={()=>setExpandedGrupo(isOpen?null:grupo.id)}>
                        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Layers className="w-5 h-5 text-white"/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-white font-bold">{grupo.nombre}</p>
                            {someSusp && <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">{allSusp?'SUSPENDIDO':'PARCIAL'}</span>}
                          </div>
                          <p className="text-purple-200 text-xs">{grupo.empresas.length} empresa{grupo.empresas.length!==1?'s':''} · {totalUsers} usuarios · {grupoMRR.toFixed(0)}€/mes</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={e=>{e.stopPropagation();suspenderCliente(grupo.id,grupo.nombre,allSusp,true)}}
                            title={allSusp?'Reactivar grupo':'Suspender grupo completo'}
                            className={`p-1.5 rounded-lg transition-colors ${allSusp?'bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30':'bg-amber-500/20 text-amber-200 hover:bg-amber-500/30'}`}>
                            {allSusp?<PlayCircle className="w-4 h-4"/>:<PauseCircle className="w-4 h-4"/>}
                          </button>
                          {isOpen?<ChevronUp className="w-4 h-4 text-white/70"/>:<ChevronDown className="w-4 h-4 text-white/70"/>}
                        </div>
                      </div>
                      {/* Empresas del grupo */}
                      {isOpen && (
                        <div className="divide-y divide-slate-100">
                          {grupo.empresas.map(emp=><EmpCard key={emp.id} emp={emp} inGrupo/>)}
                        </div>
                      )}
                      {/* Resumen colapsado */}
                      {!isOpen && (
                        <div className="px-5 py-2 flex gap-3 overflow-x-auto bg-purple-50/50">
                          {grupo.empresas.map(emp=>(
                            <div key={emp.id} className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border flex-shrink-0 ${emp.suspendida?'bg-red-50 border-red-200 text-red-600':'bg-white border-slate-200 text-slate-600'}`}>
                              <span className="font-medium">{emp.nombre}</span>
                              <span className="text-slate-400">{emp.max_empleados}u</span>
                              {emp.suspendida?<AlertOctagon className="w-3 h-3 text-red-500"/>:<PlanBadge planId={getPlanId(emp)}/>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* EMPRESAS SIN GRUPO */}
                {empsLibres.length > 0 && (
                  <div>
                    {gruposConEmps.length > 0 && (
                      <div className="flex items-center gap-3 mb-3 mt-2">
                        <div className="h-px flex-1 bg-slate-200"/>
                        <span className="text-xs text-slate-400 font-medium">Empresas independientes</span>
                        <div className="h-px flex-1 bg-slate-200"/>
                      </div>
                    )}
                    <div className="space-y-2">
                      {empsLibres.map(emp=><EmpCard key={emp.id} emp={emp} inGrupo={false}/>)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB PLANES ─── */}
        {activeTab==='planes' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Comparativa de planes</h2>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
              <table className="w-full bg-white">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider w-48 bg-slate-50">Feature</th>
                    {planes.map(p => {
                      const Icon = PLAN_ICONS[p.id]||Star
                      return (
                        <th key={p.id} className="px-4 py-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:PLAN_COLORS[p.id]+'20'}}>
                              <Icon className="w-4 h-4" style={{color:PLAN_COLORS[p.id]||'#64748b'}}/>
                            </div>
                            <span className="text-xs font-bold" style={{color:PLAN_COLORS[p.id]||'#64748b'}}>{p.nombre}</span>
                            <span className="text-slate-400 text-xs font-normal">{p.precio_mes}€/u/mes</span>
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(CAT_LABELS).map(cat => {
                    const catFeats = features.filter(f=>f.categoria===cat)
                    if (!catFeats.length) return null
                    return [
                      <tr key={`cat-${cat}`}>
                        <td colSpan={planes.length+1} className="px-5 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-y border-slate-100">
                          {CAT_LABELS[cat]}
                        </td>
                      </tr>,
                      ...catFeats.map(f => (
                        <tr key={f.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="px-5 py-2.5 text-sm text-slate-600 font-medium">{f.nombre}</td>
                          {planes.map(p => {
                            const has = planFeatures.some(pf=>pf.plan_id===p.id&&pf.feature_id===f.id)
                            return (
                              <td key={p.id} className="px-4 py-2.5 text-center">
                                {has
                                  ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto"/>
                                  : <span className="text-slate-200 text-xl leading-none">—</span>
                                }
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

        {/* ─── TAB REVENUE ─── */}
        {activeTab==='revenue' && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-slate-800">Ingresos recurrentes</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {label:'MRR', val:mrr.toLocaleString('es-ES',{maximumFractionDigits:0})+'€', color:'emerald'},
                {label:'ARR', val:arr.toLocaleString('es-ES',{maximumFractionDigits:0})+'€', color:'indigo'},
                {label:'Ticket medio', val:empresas.length?(mrr/empresas.length).toLocaleString('es-ES',{maximumFractionDigits:0})+'€':'—', color:'amber'},
                {label:'Clientes', val:empresas.length, color:'purple'},
              ].map((k,i) => (
                <div key={i} className={`bg-${k.color}-50 border border-${k.color}-100 rounded-2xl p-4`}>
                  <p className={`text-2xl font-black text-${k.color}-600`}>{k.val}</p>
                  <p className="text-slate-500 text-xs mt-1">{k.label}</p>
                </div>
              ))}
            </div>

            {/* Por grupos */}
            {gruposConEmps.map(grupo => {
              const gMRR = grupo.empresas.reduce((s,e)=>s+getMRREmp(e),0)
              return (
                <div key={grupo.id} className="bg-white rounded-2xl border border-purple-200 overflow-hidden shadow-sm">
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-white"/>
                      <span className="text-white font-bold">{grupo.nombre}</span>
                    </div>
                    <span className="text-white font-black">{gMRR.toFixed(0)}€/mes</span>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {grupo.empresas.map(emp => {
                      const rev = getMRREmp(emp)
                      const planId = getPlanId(emp)
                      return (
                        <div key={emp.id} className="flex items-center gap-3 px-5 py-2.5">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0" style={{background:PLAN_COLORS[planId]||'#64748b'}}>
                            {emp.nombre?.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate">{emp.nombre}</p>
                            <p className="text-xs text-slate-400">{PLAN_LABELS[planId]||planId} · {emp.max_empleados||10}u</p>
                          </div>
                          <span className={`text-sm font-bold flex-shrink-0 ${emp.suspendida?'text-red-400 line-through':'text-emerald-600'}`}>{rev.toFixed(0)}€</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* Empresas independientes */}
            {empsLibres.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-5 py-3 border-b border-slate-100">
                  <p className="font-semibold text-slate-700">Empresas independientes</p>
                </div>
                <div className="divide-y divide-slate-50">
                  {empsLibres.map(emp => {
                    const rev = getMRREmp(emp)
                    const planId = getPlanId(emp)
                    return (
                      <div key={emp.id} className="flex items-center gap-3 px-5 py-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0" style={{background:PLAN_COLORS[planId]||'#64748b'}}>
                          {emp.nombre?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{emp.nombre}</p>
                          <p className="text-xs text-slate-400">{PLAN_LABELS[planId]||planId} · {emp.max_empleados||10}u</p>
                        </div>
                        <span className={`text-sm font-bold flex-shrink-0 ${emp.suspendida?'text-red-400 line-through':'text-emerald-600'}`}>{rev.toFixed(0)}€</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal nueva empresa - 2 pasos */}
      {newEmpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

            {/* Paso 1: Datos empresa */}
            {newEmpPaso === 1 && (
              <>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Building2 className="w-5 h-5 text-indigo-500"/> Nueva empresa</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Paso 1 de 2 — Datos de la empresa</p>
                  </div>
                  <button onClick={resetNewEmpModal} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-400"/></button>
                </div>
                <div className="p-6 space-y-3">
                  {[{k:'nombre',label:'Nombre empresa',ph:'ACME Corp'},{k:'email',label:'Email empresa',ph:'admin@empresa.com'}].map(f=>(
                    <div key={f.k}>
                      <label className="block text-xs font-medium text-slate-500 mb-1">{f.label} *</label>
                      <input value={newEmpForm[f.k]} onChange={e=>setNewEmpForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph}
                        className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 outline-none focus:border-indigo-400"/>
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Plan</label>
                      <select value={newEmpForm.plan} onChange={e=>setNewEmpForm(p=>({...p,plan:e.target.value}))} className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 outline-none focus:border-indigo-400">
                        {planes.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Nº usuarios</label>
                      <input type="number" value={newEmpForm.max_empleados} onChange={e=>setNewEmpForm(p=>({...p,max_empleados:e.target.value}))} className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 outline-none focus:border-indigo-400"/>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">CIF / NIF</label>
                      <input value={newEmpForm.cif} onChange={e=>setNewEmpForm(p=>({...p,cif:e.target.value}))} placeholder="B12345678"
                        className="w-full bg-slate-50 rounded-xl px-3 py-2 text-sm border border-slate-200 outline-none focus:border-indigo-400"/>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Teléfono</label>
                      <input value={newEmpForm.telefono} onChange={e=>setNewEmpForm(p=>({...p,telefono:e.target.value}))} placeholder="+34 600 000 000"
                        className="w-full bg-slate-50 rounded-xl px-3 py-2 text-sm border border-slate-200 outline-none focus:border-indigo-400"/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Dirección</label>
                    <input value={newEmpForm.direccion} onChange={e=>setNewEmpForm(p=>({...p,direccion:e.target.value}))} placeholder="Calle Mayor 1, 1º"
                      className="w-full bg-slate-50 rounded-xl px-3 py-2 text-sm border border-slate-200 outline-none focus:border-indigo-400"/>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Ciudad</label>
                      <input value={newEmpForm.ciudad} onChange={e=>setNewEmpForm(p=>({...p,ciudad:e.target.value}))} placeholder="Madrid"
                        className="w-full bg-slate-50 rounded-xl px-3 py-2 text-sm border border-slate-200 outline-none focus:border-indigo-400"/>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">C.P.</label>
                      <input value={newEmpForm.codigo_postal} onChange={e=>setNewEmpForm(p=>({...p,codigo_postal:e.target.value}))} placeholder="28001"
                        className="w-full bg-slate-50 rounded-xl px-3 py-2 text-sm border border-slate-200 outline-none focus:border-indigo-400"/>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">País</label>
                      <input value={newEmpForm.pais} onChange={e=>setNewEmpForm(p=>({...p,pais:e.target.value}))}
                        className="w-full bg-slate-50 rounded-xl px-3 py-2 text-sm border border-slate-200 outline-none focus:border-indigo-400"/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Web</label>
                    <input value={newEmpForm.web} onChange={e=>setNewEmpForm(p=>({...p,web:e.target.value}))} placeholder="https://empresa.com"
                      className="w-full bg-slate-50 rounded-xl px-3 py-2 text-sm border border-slate-200 outline-none focus:border-indigo-400"/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Grupo (opcional)</label>
                    <select value={newEmpForm.grupo_id} onChange={e=>setNewEmpForm(p=>({...p,grupo_id:e.target.value}))} className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 outline-none focus:border-indigo-400">
                      <option value="">Sin grupo</option>
                      {grupos.map(g=><option key={g.id} value={g.id}>{g.nombre}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 px-6 pb-6">
                  <button onClick={resetNewEmpModal} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-500 hover:bg-slate-50">Cancelar</button>
                  <button onClick={crearEmpresa} disabled={savingNew||!newEmpForm.nombre||!newEmpForm.email} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                    {savingNew?'Creando...':'Siguiente →'}
                  </button>
                </div>
              </>
            )}

            {/* Paso 2: Crear usuario admin */}
            {newEmpPaso === 2 && (
              <>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Users className="w-5 h-5 text-emerald-500"/> Usuario administrador</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Paso 2 de 2 — Acceso para <span className="font-medium text-slate-600">{newEmpForm.nombre}</span></p>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-xs text-indigo-700">
                    Empresa creada ✓ Ahora crea el usuario administrador que gestionará esta cuenta.
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Nombre completo *</label>
                    <input value={adminForm.nombre} onChange={e=>setAdminForm(p=>({...p,nombre:e.target.value}))} placeholder="Ana García"
                      className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 outline-none focus:border-emerald-400"/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Email de acceso *</label>
                    <input type="email" value={adminForm.email} onChange={e=>setAdminForm(p=>({...p,email:e.target.value}))} placeholder="ana@empresa.com"
                      className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 outline-none focus:border-emerald-400"/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Contraseña inicial *</label>
                    <input type="text" value={adminForm.password} onChange={e=>setAdminForm(p=>({...p,password:e.target.value}))} placeholder="Mín. 6 caracteres"
                      className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 outline-none focus:border-emerald-400"/>
                    <p className="text-xs text-slate-400 mt-1">El cliente la puede cambiar después desde su perfil</p>
                  </div>
                </div>
                <div className="flex gap-3 px-6 pb-6">
                  <button onClick={resetNewEmpModal} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-500 hover:bg-slate-50">Saltar</button>
                  <button onClick={crearAdminEmpresa} disabled={savingNew||!adminForm.nombre||!adminForm.email||!adminForm.password} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                    {savingNew?'Creando acceso...':'Crear acceso'}
                  </button>
                </div>
              </>
            )}

            {/* Paso 3: Resumen con credenciales */}
            {newEmpPaso === 3 && newEmpResult && (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-600"/>
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-1">¡Todo listo!</h3>
                <p className="text-slate-400 text-sm mb-5">{newEmpResult.empresa} ya está activa en Nexo HR</p>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left mb-5 space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Credenciales de acceso</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">URL</span>
                    <span className="text-xs font-mono font-bold text-indigo-600">pruebasgrupoaxen.com/login</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Email</span>
                    <span className="text-xs font-mono font-bold text-slate-700">{newEmpResult.adminEmail}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Contraseña</span>
                    <span className="text-xs font-mono font-bold text-slate-700">{newEmpResult.adminPass}</span>
                  </div>
                </div>
                <button onClick={resetNewEmpModal} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold">
                  Cerrar
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Modal nuevo grupo */}
      {newGrupoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Layers className="w-5 h-5 text-purple-500"/> Nuevo grupo</h3>
              <button onClick={()=>setNewGrupoModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-400"/></button>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nombre del grupo *</label>
                <input value={newGrupoForm.nombre} onChange={e=>setNewGrupoForm(p=>({...p,nombre:e.target.value}))} placeholder="Grupo Empresa SA"
                  className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 outline-none focus:border-purple-400"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Email de contacto</label>
                <input value={newGrupoForm.email_contacto} onChange={e=>setNewGrupoForm(p=>({...p,email_contacto:e.target.value}))} placeholder="contacto@grupo.com"
                  className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 outline-none focus:border-purple-400"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Teléfono</label>
                <input value={newGrupoForm.telefono} onChange={e=>setNewGrupoForm(p=>({...p,telefono:e.target.value}))} placeholder="+34 600 000 000"
                  className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 outline-none focus:border-purple-400"/>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={()=>setNewGrupoModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-500 hover:bg-slate-50">Cancelar</button>
              <button onClick={crearGrupo} disabled={savingNew} className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                <Layers className="w-4 h-4"/> {savingNew?'Creando...':'Crear grupo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal suspender/reactivar */}
      {confirmSuspend && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className={`px-6 py-4 flex items-center gap-3 ${confirmSuspend.suspendida?'bg-emerald-600':'bg-amber-500'}`}>
              {confirmSuspend.suspendida?<PlayCircle className="w-6 h-6 text-white"/>:<PauseCircle className="w-6 h-6 text-white"/>}
              <h3 className="text-white font-bold text-lg">{confirmSuspend.suspendida?'Reactivar':'Suspender'} servicio</h3>
            </div>
            <div className="p-6">
              <div className="bg-slate-100 rounded-xl px-4 py-3 mb-4">
                <p className="font-bold text-slate-800">{confirmSuspend.nombre}</p>
                {confirmSuspend.isGrupo && <p className="text-xs text-purple-600 mt-0.5">Grupo — afecta a todas sus empresas</p>}
              </div>
              {!confirmSuspend.suspendida ? (
                <>
                  <p className="text-slate-500 text-sm mb-3">El cliente no podrá acceder hasta que reaktives el servicio.</p>
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Motivo (opcional)</label>
                    <input value={motivoSuspension} onChange={e=>setMotivoSuspension(e.target.value)}
                      placeholder="Ej: Factura #123 pendiente"
                      className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 outline-none focus:border-amber-400"/>
                  </div>
                  <p className="text-xs text-amber-600 font-semibold mb-5">⚠️ Los usuarios verán pantalla de servicio suspendido.</p>
                </>
              ) : (
                <p className="text-slate-500 text-sm mb-5">Se restablecerá el acceso completo a Nexo HR para todos los usuarios.</p>
              )}
              <div className="flex gap-3">
                <button onClick={()=>setConfirmSuspend(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
                <button onClick={confirmarSuspension}
                  className={`flex-1 py-2.5 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow ${confirmSuspend.suspendida?'bg-emerald-600 hover:bg-emerald-700':'bg-amber-500 hover:bg-amber-600'}`}>
                  {confirmSuspend.suspendida?<><PlayCircle className="w-4 h-4"/>Reactivar</>:<><PauseCircle className="w-4 h-4"/>Suspender</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal borrar */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-red-600 px-6 py-4 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-white"/>
              <h3 className="text-white font-bold text-lg">Borrar empresa</h3>
            </div>
            <div className="p-6">
              <p className="text-slate-500 text-sm mb-3">Vas a borrar permanentemente:</p>
              <div className="bg-slate-100 rounded-xl px-4 py-3 mb-4">
                <p className="font-bold text-slate-800">{confirmDelete.nombre}</p>
                <p className="text-xs text-slate-400 mt-0.5">Se eliminará la empresa y su configuración. Los empleados quedarán inactivos.</p>
              </div>
              <p className="text-xs text-red-500 font-semibold mb-5">⚠️ Esta acción no se puede deshacer.</p>
              <div className="flex gap-3">
                <button onClick={()=>setConfirmDelete(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
                <button onClick={confirmarBorrado} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
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