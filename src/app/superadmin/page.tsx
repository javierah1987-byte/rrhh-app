// @ts-nocheck
'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Building2, CheckCircle, XCircle, Shield, Crown, Zap, Star, ToggleLeft, ToggleRight, LogOut, RefreshCw, ChevronDown, ChevronUp, Plus, X } from 'lucide-react'

const PLAN_COLORS = { starter:'#6366f1', professional:'#10b981', enterprise:'#f59e0b' }
const PLAN_ICONS  = { starter: Star, professional: Zap, enterprise: Crown }
const CAT_LABELS  = { tiempo:'⏰ Tiempo', ausencias:'📅 Ausencias', equipo:'👥 Equipo', reclutamiento:'💼 Reclutamiento', admin:'🗂️ Administración', objetivos:'🎯 Objetivos', formacion:'📚 Formación', tareas:'✅ Tareas', comunicacion:'💬 Comunicación', cumplimiento:'🛡️ Cumplimiento', premium:'⭐ Premium' }

export default function SuperAdminPage() {
  const [auth, setAuth]               = useState(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [loading, setLoading]         = useState(true)
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [loginError, setLoginError]   = useState('')
  const [planes, setPlanes]           = useState([])
  const [features, setFeatures]       = useState([])
  const [planFeatures, setPlanFeatures] = useState([])
  const [empresas, setEmpresas]       = useState([])
  const [configs, setConfigs]         = useState([])
  const [overrides, setOverrides]     = useState([])
  const [activeTab, setActiveTab]     = useState('clientes')
  const [expandedEmp, setExpandedEmp] = useState(null)
  const [saving, setSaving]           = useState(null)
  const [showNewCliente, setShowNewCliente] = useState(false)
  const [newNombre, setNewNombre]     = useState('')
  const [newEmail, setNewEmail]       = useState('')
  const [newPlan, setNewPlan]         = useState('starter')
  const [creatingCliente, setCreatingCliente] = useState(false)

  const cargar = useCallback(async () => {
    const [p,f,pf,e,c,ov] = await Promise.all([
      supabase.from('planes').select('*').order('orden'),
      supabase.from('features').select('*').order('categoria,nombre'),
      supabase.from('plan_features').select('*'),
      supabase.from('empresas').select('id,nombre'),
      supabase.from('empresas_config').select('*'),
      supabase.from('empresas_features_override').select('*'),
    ])
    setPlanes(p.data||[])
    setFeatures(f.data||[])
    setPlanFeatures(pf.data||[])
    setEmpresas(e.data||[])
    setConfigs(c.data||[])
    setOverrides(ov.data||[])
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(async ({data:{user}}) => {
      if (!user) { setLoading(false); return }
      setAuth(user)
      const {data} = await supabase.from('super_admins').select('email,activo').eq('email', user.email).eq('activo', true).maybeSingle()
      if (data) { setIsSuperAdmin(true); await cargar() }
      setLoading(false)
    })
  }, [cargar])

  const handleLogin = async (e) => {
    e.preventDefault(); setLoginError('')
    const {data: sd, error} = await supabase.auth.signInWithPassword({email, password})
    if (error) { setLoginError('Credenciales incorrectas'); return }
    const user = sd?.user
    if (!user) { setLoginError('Error al obtener usuario'); return }
    const {data, error: saError} = await supabase.from('super_admins').select('email,activo').eq('email', user.email).eq('activo', true).maybeSingle()
    if (saError) { setLoginError('Error: ' + saError.message); await supabase.auth.signOut(); return }
    if (!data) { setLoginError('No tienes acceso de Super Admin'); await supabase.auth.signOut(); return }
    setAuth(user); setIsSuperAdmin(true); await cargar()
  }

  // Helpers
  const getConfig  = (eid) => configs.find(c => c.empresa_id === eid)
  const getPlanFIds = (pid) => planFeatures.filter(pf => pf.plan_id === pid).map(pf => pf.feature_id)
  const getOverride = (eid, fid) => overrides.find(o => o.empresa_id === eid && o.feature_id === fid)

  // Feature efectiva de una empresa (plan base + overrides)
  const isFeatureActiva = (eid, fid) => {
    const cfg = getConfig(eid)
    const planFIds = cfg?.plan_id ? getPlanFIds(cfg.plan_id) : []
    const ov = getOverride(eid, fid)
    if (ov !== undefined) return ov.activa      // override manda
    return planFIds.includes(fid)               // si no override, depende del plan
  }

  const toggleFeature = async (eid, fid) => {
    setSaving(eid + fid)
    const actual = isFeatureActiva(eid, fid)
    const cfg = getConfig(eid)
    const enPlan = cfg?.plan_id ? getPlanFIds(cfg.plan_id).includes(fid) : false
    const ov = getOverride(eid, fid)

    if (!ov) {
      // Crear override: si estaba activa (en plan), desactivar; si no estaba, activar
      await supabase.from('empresas_features_override').insert({ empresa_id:eid, feature_id:fid, activa:!actual })
    } else {
      // Si el override devuelve al estado natural del plan, eliminarlo
      if (ov.activa === enPlan) {
        await supabase.from('empresas_features_override').delete().eq('id', ov.id)
      } else {
        await supabase.from('empresas_features_override').update({ activa:!ov.activa }).eq('id', ov.id)
      }
    }
    await cargar(); setSaving(null)
  }

  const toggleEmpresaActiva = async (eid, activa) => {
    setSaving('toggle_'+eid)
    await supabase.from('empresas_config').upsert({empresa_id:eid, activa:!activa},{onConflict:'empresa_id'})
    await cargar(); setSaving(null)
  }

  const cambiarPlan = async (eid, planId) => {
    setSaving('plan_'+eid)
    await supabase.from('empresas_config').upsert({empresa_id:eid, plan_id:planId},{onConflict:'empresa_id'})
    // Limpiar overrides redundantes
    await supabase.from('empresas_features_override').delete().eq('empresa_id', eid)
    await cargar(); setSaving(null)
  }

  const crearCliente = async () => {
    if (!newNombre || !newEmail) return
    setCreatingCliente(true)
    const {data:emp} = await supabase.from('empresas').insert({nombre:newNombre, email:newEmail, ciudad:'España', pais:'España'}).select().single()
    if (emp) {
      await supabase.from('empresas_config').insert({empresa_id:emp.id, plan_id:newPlan, activa:true, max_empleados:50})
    }
    setShowNewCliente(false); setNewNombre(''); setNewEmail(''); setNewPlan('starter')
    setCreatingCliente(false); await cargar()
  }

  const getFeaturesByCategoria = () => {
    const cats = {}
    features.forEach(f => { if(!cats[f.categoria]) cats[f.categoria]=[]; cats[f.categoria].push(f) })
    return cats
  }

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Cargando...</div>

  if (!auth || !isSuperAdmin) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl p-8 w-full max-w-md border border-slate-700 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><Shield className="w-8 h-8 text-white"/></div>
          <h1 className="text-2xl font-bold text-white">Super Admin · Tryvor</h1>
          <p className="text-slate-400 mt-1">Panel de control de clientes</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div><label className="block text-sm text-slate-400 mb-1">Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 border border-slate-600 focus:border-indigo-500 outline-none"/></div>
          <div><label className="block text-sm text-slate-400 mb-1">Contraseña</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 border border-slate-600 focus:border-indigo-500 outline-none"/></div>
          {loginError && <p className="text-red-400 text-sm bg-red-900/20 rounded-lg px-3 py-2">{loginError}</p>}
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors">Acceder</button>
        </form>
      </div>
    </div>
  )

  const cats = getFeaturesByCategoria()
  const activosCount = configs.filter(c=>c.activa).length

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center"><Shield className="w-5 h-5"/></div>
          <div><h1 className="font-bold text-lg leading-none">Nexo HR · Super Admin</h1><p className="text-slate-400 text-xs mt-0.5">Panel Tryvor · {activosCount} clientes activos</p></div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={cargar} className="text-slate-400 hover:text-white"><RefreshCw className="w-4 h-4"/></button>
          <span className="text-slate-500 text-sm hidden sm:block">{auth?.email}</span>
          <button onClick={()=>supabase.auth.signOut().then(()=>{setAuth(null);setIsSuperAdmin(false)})} className="flex items-center gap-1.5 text-slate-400 hover:text-red-400 text-sm">
            <LogOut className="w-4 h-4"/> Salir
          </button>
        </div>
      </header>

      {/* KPIs */}
      <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {label:'Clientes',val:empresas.length,color:'#6366f1'},
          {label:'Activos',val:activosCount,color:'#10b981'},
          {label:'Planes',val:planes.length,color:'#f59e0b'},
          {label:'Módulos',val:features.length,color:'#ec4899'},
        ].map((s,i)=>(
          <div key={i} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-2xl font-bold" style={{color:s.color}}>{s.val}</p>
            <p className="text-slate-400 text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-slate-700 flex gap-1">
        {[['clientes','Clientes & Features'],['planes','Comparar planes']].map(([id,lbl])=>(
          <button key={id} onClick={()=>setActiveTab(id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab===id?'text-indigo-400 border-indigo-400':'text-slate-400 border-transparent hover:text-white'}`}>{lbl}</button>
        ))}
      </div>

      <div className="px-6 py-4 pb-12">

        {/* === TAB CLIENTES === */}
        {activeTab==='clientes' && (
          <div className="space-y-3">
            {/* Botón nuevo cliente */}
            <button onClick={()=>setShowNewCliente(true)}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-600 hover:border-indigo-500 rounded-xl py-3 text-slate-400 hover:text-indigo-400 transition-colors text-sm font-medium">
              <Plus className="w-4 h-4"/> Añadir nuevo cliente
            </button>

            {empresas.map(emp => {
              const cfg = getConfig(emp.id)
              const plan = planes.find(p=>p.id===cfg?.plan_id)
              const PlanIcon = plan?PLAN_ICONS[plan.id]:Star
              const planColor = plan?PLAN_COLORS[plan.id]:'#64748b'
              const isOpen = expandedEmp === emp.id
              const planFIds = plan?getPlanFIds(plan.id):[]
              const ovs = overrides.filter(o=>o.empresa_id===emp.id)
              const customCount = ovs.filter(o=>!planFIds.includes(o.feature_id)&&o.activa).length // añadidos extra
              const removedCount = ovs.filter(o=>planFIds.includes(o.feature_id)&&!o.activa).length // quitados del plan

              return (
                <div key={emp.id} className={`bg-slate-800 rounded-xl border overflow-hidden ${cfg?.activa!==false?'border-slate-700':'border-red-800/60'}`}>
                  {/* Cabecera cliente */}
                  <div className="p-4 flex items-center gap-3 flex-wrap cursor-pointer hover:bg-slate-750"
                    onClick={()=>setExpandedEmp(isOpen?null:emp.id)}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0"
                      style={{background:planColor+'20',color:planColor}}>
                      {emp.nombre?.charAt(0)||'?'}
                    </div>
                    <div className="flex-1 min-w-[140px]">
                      <p className="font-semibold text-white">{emp.nombre}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {plan&&<span className="text-xs flex items-center gap-1 font-medium" style={{color:planColor}}>
                          <PlanIcon className="w-3 h-3"/>{plan.nombre}
                        </span>}
                        {customCount>0&&<span className="text-xs text-emerald-400">+{customCount} extra</span>}
                        {removedCount>0&&<span className="text-xs text-rose-400">-{removedCount} quitados</span>}
                      </div>
                    </div>

                    {/* Select plan */}
                    <select value={cfg?.plan_id||''} onChange={e=>{e.stopPropagation();cambiarPlan(emp.id,e.target.value)}}
                      onClick={e=>e.stopPropagation()}
                      className="bg-slate-700 text-white text-sm rounded-lg px-3 py-1.5 border border-slate-600 outline-none">
                      <option value="">Sin plan</option>
                      {planes.map(p=><option key={p.id} value={p.id}>{p.nombre} — {p.precio_mes}€/mes</option>)}
                    </select>

                    {/* Toggle activa */}
                    <button onClick={e=>{e.stopPropagation();toggleEmpresaActiva(emp.id,cfg?.activa)}}
                      disabled={saving==='toggle_'+emp.id} className="flex items-center gap-1.5 flex-shrink-0">
                      {cfg?.activa!==false
                        ?<><ToggleRight className="w-7 h-7 text-emerald-400"/><span className="text-xs text-emerald-400 font-medium hidden sm:block">Activa</span></>
                        :<><ToggleLeft className="w-7 h-7 text-red-400"/><span className="text-xs text-red-400 font-medium hidden sm:block">Suspendida</span></>
                      }
                    </button>

                    {isOpen?<ChevronUp className="w-4 h-4 text-slate-400"/>:<ChevronDown className="w-4 h-4 text-slate-400"/>}
                  </div>

                  {/* Panel de features expandido */}
                  {isOpen && (
                    <div className="border-t border-slate-700 p-4">
                      <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wider">
                        Módulos activos — puedes activar o desactivar individualmente
                      </p>
                      <div className="space-y-4">
                        {Object.entries(cats).map(([cat,feats])=>(
                          <div key={cat}>
                            <p className="text-xs font-semibold text-slate-400 mb-2">{CAT_LABELS[cat]||cat}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {feats.map(f=>{
                                const activa = isFeatureActiva(emp.id, f.id)
                                const enPlan = planFIds.includes(f.id)
                                const ov = getOverride(emp.id, f.id)
                                const isCustom = ov && (ov.activa !== enPlan)
                                return (
                                  <button key={f.id}
                                    onClick={()=>toggleFeature(emp.id, f.id)}
                                    disabled={saving===emp.id+f.id}
                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all text-left ${activa
                                      ?'border-emerald-700/50 bg-emerald-900/20 hover:bg-emerald-900/30'
                                      :'border-slate-700 bg-slate-800 hover:bg-slate-700 opacity-60 hover:opacity-80'
                                    }`}>
                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${activa?'bg-emerald-500':'bg-slate-600'}`}>
                                      {activa?<CheckCircle className="w-3 h-3 text-white"/>:<X className="w-3 h-3 text-slate-400"/>}
                                    </div>
                                    <span className={`text-xs flex-1 ${activa?'text-slate-200':'text-slate-500'}`}>{f.nombre}</span>
                                    {isCustom&&<span className="text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0"
                                      style={{background:activa?'#10b98120':'#ef444420',color:activa?'#10b981':'#ef4444'}}>
                                      {activa?'+ añadido':'- quitado'}
                                    </span>}
                                    {!isCustom&&enPlan&&activa&&<span className="text-[10px] text-slate-500 flex-shrink-0">plan</span>}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 mt-4 italic">
                        Verde = activo · Gris = inactivo · "+ añadido" = extra fuera del plan · "- quitado" = eliminado del plan
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* === TAB PLANES === */}
        {activeTab==='planes' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
            {planes.map(plan=>{
              const PlanIcon=PLAN_ICONS[plan.id]||Star
              const planFIds=getPlanFIds(plan.id)
              const color=PLAN_COLORS[plan.id]||'#6366f1'
              return(
                <div key={plan.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                  <div className="p-5 border-b border-slate-700" style={{background:color+'12'}}>
                    <div className="flex items-center gap-2 mb-1">
                      <PlanIcon className="w-5 h-5" style={{color}}/>
                      <h3 className="font-bold text-lg" style={{color}}>{plan.nombre}</h3>
                    </div>
                    <p className="text-2xl font-black">{plan.precio_mes}€<span className="text-sm font-normal text-slate-400">/usuario/mes</span></p>
                    <p className="text-slate-400 text-xs mt-1">{plan.descripcion}</p>
                    <div className="text-xs text-slate-500 mt-2">{plan.max_gb_docs} GB · {planFIds.length} módulos</div>
                  </div>
                  <div className="p-4 max-h-[500px] overflow-y-auto space-y-0.5">
                    {Object.entries(cats).map(([cat,feats])=>(
                      <div key={cat}>
                        <p className="text-slate-500 text-[10px] uppercase tracking-wider mt-3 mb-1">{CAT_LABELS[cat]||cat}</p>
                        {feats.map(f=>(
                          <div key={f.id} className="flex items-center gap-2 py-0.5">
                            {planFIds.includes(f.id)
                              ?<CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0"/>
                              :<XCircle className="w-3.5 h-3.5 text-slate-600 flex-shrink-0"/>
                            }
                            <span className={`text-xs ${planFIds.includes(f.id)?'text-slate-200':'text-slate-600'}`}>{f.nombre}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal nuevo cliente */}
      {showNewCliente&&(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg text-white">Nuevo cliente</h3>
              <button onClick={()=>setShowNewCliente(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm text-slate-400 mb-1.5">Nombre de la empresa</label>
                <input value={newNombre} onChange={e=>setNewNombre(e.target.value)} placeholder="Empresa XYZ SL"
                  className="w-full bg-slate-700 text-white rounded-lg px-4 py-2.5 border border-slate-600 outline-none focus:border-indigo-500"/></div>
              <div><label className="block text-sm text-slate-400 mb-1.5">Email de contacto</label>
                <input value={newEmail} onChange={e=>setNewEmail(e.target.value)} placeholder="admin@empresa.com" type="email"
                  className="w-full bg-slate-700 text-white rounded-lg px-4 py-2.5 border border-slate-600 outline-none focus:border-indigo-500"/></div>
              <div><label className="block text-sm text-slate-400 mb-1.5">Plan inicial</label>
                <div className="grid grid-cols-3 gap-2">
                  {planes.map(p=>{
                    const PI=PLAN_ICONS[p.id]||Star; const col=PLAN_COLORS[p.id]
                    return(<button key={p.id} onClick={()=>setNewPlan(p.id)}
                      className={`py-2.5 px-3 rounded-lg border-2 text-xs font-medium transition-all ${newPlan===p.id?'text-white':'border-slate-600 text-slate-400'}`}
                      style={newPlan===p.id?{borderColor:col,background:col+'20',color:col}:{}}> 
                      <PI className="w-3.5 h-3.5 mx-auto mb-1"/>{p.nombre}</button>)
                  })}
                </div>
                <p className="text-slate-500 text-xs mt-1.5">{planes.find(p=>p.id===newPlan)?.precio_mes}€/usuario/mes · {getPlanFIds(newPlan).length} módulos</p>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={()=>setShowNewCliente(false)} className="flex-1 py-2.5 border border-slate-600 rounded-lg text-sm text-slate-400 hover:bg-slate-700">Cancelar</button>
                <button onClick={crearCliente} disabled={creatingCliente||!newNombre||!newEmail}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
                  {creatingCliente?'Creando...':'Crear cliente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}