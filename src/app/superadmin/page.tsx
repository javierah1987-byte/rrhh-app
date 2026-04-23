// @ts-nocheck
'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Shield, LogOut, RefreshCw, Plus, X, Trash2, AlertTriangle, PauseCircle, PlayCircle,
  AlertOctagon, CheckCircle, XCircle, ChevronDown, ChevronUp, Users, TrendingUp,
  Star, Zap, Crown, Building2, Layers, Search, Edit3, Save } from 'lucide-react'

const PLAN_COLORS  = { starter:'#6366f1', professional:'#10b981', enterprise:'#f59e0b', fichaje:'#0891b2' }
const PLAN_LABELS  = { starter:'Starter', professional:'Professional', enterprise:'Enterprise', fichaje:'Solo Fichaje' }
const PLAN_ICONS   = { starter: Star, professional: Zap, enterprise: Crown, fichaje: Shield }
const CAT_LABELS   = { tiempo:'⏰ Tiempo', ausencias:'📅 Ausencias', equipo:'👥 Equipo', reclutamiento:'💼 Reclutamiento',
  admin:'⚙️ Admin', comunicacion:'💬 Comunicación', cumplimiento:'🔒 Cumplimiento',
  premium:'💎 Premium', objetivos:'🎯 Objetivos', tareas:'✅ Tareas', formacion:'📚 Formación' }

export default function SuperAdminPage() {
  const [isAuth, setIsAuth] = useState(false)
  const [pin, setPin]       = useState('')
  const [pinErr, setPinErr] = useState(false)
  const PIN = 'Tryvor2024!'

  const [empresas,   setEmpresas]   = useState([])
  const [grupos,     setGrupos]     = useState([])
  const [planes,     setPlanes]     = useState([])
  const [features,   setFeatures]   = useState([])
  const [planFeats,  setPlanFeats]  = useState([])
  const [configs,    setConfigs]    = useState([])
  const [overrides,  setOverrides]  = useState([])
  const [loading,    setLoading]    = useState(true)

  const [tab,        setTab]        = useState('clientes')
  const [search,     setSearch]     = useState('')
  const [expanded,   setExpanded]   = useState(null)
  const [saving,     setSaving]     = useState(null)

  const [modalEmp,   setModalEmp]   = useState(false)
  const [modalGrupo, setModalGrupo] = useState(false)
  const [formEmp,    setFormEmp]    = useState({ nombre:'', email:'', plan:'starter', max_empleados:'10', grupo_id:'' })
  const [formGrupo,  setFormGrupo]  = useState({ nombre:'', email_contacto:'', telefono:'' })
  const [savingNew,  setSavingNew]  = useState(false)

  const [confirmDel,  setConfirmDel]  = useState(null)
  const [confirmSusp, setConfirmSusp] = useState(null)
  const [motivo,      setMotivo]      = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    const [e, g, pl, ft, pf, cf, ov] = await Promise.all([
      supabase.from('empresas').select('*').order('nombre'),
      supabase.from('grupos').select('*').order('nombre'),
      supabase.from('planes').select('*').order('precio_mes'),
      supabase.from('features').select('*').order('categoria').order('nombre'),
      supabase.from('plan_features').select('*'),
      supabase.from('config_empresa').select('*'),
      supabase.from('empresa_feature_overrides').select('*'),
    ])
    setEmpresas(e.data||[]); setGrupos(g.data||[])
    setPlanes(pl.data||[]); setFeatures(ft.data||[])
    setPlanFeats(pf.data||[]); setConfigs(cf.data||[]); setOverrides(ov.data||[])
    setLoading(false)
  }, [])

  useEffect(() => { if (isAuth) cargar() }, [isAuth, cargar])

  const getPlanId = empId => configs.find(c=>c.empresa_id===empId)?.plan_id
  const getPlanFIds = planId => planFeats.filter(pf=>pf.plan_id===planId).map(pf=>pf.feature_id)
  const hasOv = (empId, fid) => overrides.some(o=>o.empresa_id===empId&&o.feature_id===fid)

  const cambiarPlan = async (empId, planId) => {
    setSaving(empId+'-plan')
    const cfg = configs.find(c=>c.empresa_id===empId)
    if (cfg) await supabase.from('config_empresa').update({plan_id:planId}).eq('empresa_id',empId)
    else await supabase.from('config_empresa').insert({empresa_id:empId,plan_id:planId})
    await supabase.from('empresas').update({plan:planId}).eq('id',empId)
    setSaving(null); cargar()
  }

  const toggleOv = async (empId, fid) => {
    setSaving(empId+'-'+fid)
    if (hasOv(empId,fid)) await supabase.from('empresa_feature_overrides').delete().eq('empresa_id',empId).eq('feature_id',fid)
    else await supabase.from('empresa_feature_overrides').insert({empresa_id:empId,feature_id:fid})
    setSaving(null); cargar()
  }

  const crearEmpresa = async () => {
    if (!formEmp.nombre||!formEmp.email) return
    setSavingNew(true)
    const { data: emp } = await supabase.from('empresas').insert({
      nombre:formEmp.nombre, email:formEmp.email, plan:formEmp.plan,
      max_empleados:+formEmp.max_empleados||10, activa:true,
      grupo_id: formEmp.grupo_id||null,
    }).select().single()
    if (emp) await supabase.from('config_empresa').insert({empresa_id:emp.id,plan_id:formEmp.plan})
    setSavingNew(false); setModalEmp(false)
    setFormEmp({nombre:'',email:'',plan:'starter',max_empleados:'10',grupo_id:''}); cargar()
  }

  const crearGrupo = async () => {
    if (!formGrupo.nombre) return
    setSavingNew(true)
    await supabase.from('grupos').insert({...formGrupo})
    setSavingNew(false); setModalGrupo(false)
    setFormGrupo({nombre:'',email_contacto:'',telefono:''}); cargar()
  }

  const suspender = (id, nombre, suspendida, isGrupo) => {
    setMotivo('')
    setConfirmSusp({id, nombre, suspendida, isGrupo})
  }

  const confirmarSusp = async () => {
    if (!confirmSusp) return
    const nuevoEstado = !confirmSusp.suspendida
    const payload = { suspendida:nuevoEstado, motivo_suspension:nuevoEstado?(motivo||'Impago'):null, fecha_suspension:nuevoEstado?new Date().toISOString():null }
    if (confirmSusp.isGrupo) {
      await supabase.from('grupos').update(payload).eq('id', confirmSusp.id)
      await supabase.from('empresas').update({suspendida:nuevoEstado}).eq('grupo_id', confirmSusp.id)
    } else {
      await supabase.from('empresas').update(payload).eq('id', confirmSusp.id)
    }
    setConfirmSusp(null); setMotivo(''); cargar()
  }

  const borrar = (id, nombre, isGrupo) => setConfirmDel({id, nombre, isGrupo})

  const confirmarBorrar = async () => {
    if (!confirmDel) return
    try {
      if (confirmDel.isGrupo) {
        await supabase.from('empresas').update({grupo_id:null}).eq('grupo_id',confirmDel.id)
        await supabase.from('grupos').delete().eq('id',confirmDel.id)
      } else {
        await supabase.from('empresa_feature_overrides').delete().eq('empresa_id',confirmDel.id)
        await supabase.from('config_empresa').delete().eq('empresa_id',confirmDel.id)
        await supabase.from('empleados').update({estado:'inactivo'}).eq('empresa_id',confirmDel.id)
        await supabase.from('empresas').delete().eq('id',confirmDel.id)
      }
      setConfirmDel(null); cargar()
    } catch(e) { alert('Error: '+e.message); setConfirmDel(null) }
  }

  const mrr = empresas.reduce((s,emp) => {
    const planId = getPlanId(emp.id)||emp.plan
    const plan = planes.find(p=>p.id===planId)
    return s+(plan&&!emp.suspendida ? +plan.precio_mes*(emp.max_empleados||10) : 0)
  },0)

  if (!isAuth) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
          <Shield className="w-8 h-8 text-white"/>
        </div>
        <h1 className="text-white text-2xl font-black text-center mb-1">Super Admin</h1>
        <p className="text-indigo-300 text-sm text-center mb-7">Nexo HR · Tryvor</p>
        <input type="password" value={pin} onChange={e=>setPin(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter'){ if(pin===PIN){setIsAuth(true)}else{setPinErr(true);setTimeout(()=>setPinErr(false),2000)} } }}
          placeholder="Contraseña de acceso"
          className={`w-full bg-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 border outline-none text-sm mb-3 ${pinErr?'border-red-400':'border-white/20 focus:border-indigo-400'}`}/>
        {pinErr && <p className="text-red-400 text-xs text-center mb-3">Contraseña incorrecta</p>}
        <button onClick={()=>{ if(pin===PIN){setIsAuth(true)}else{setPinErr(true);setTimeout(()=>setPinErr(false),2000)} }}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 font-bold text-sm transition-colors">
          Acceder
        </button>
      </div>
    </div>
  )

  // ── Helpers de display ──
  const empSolas = empresas.filter(e=>!e.grupo_id)
  const empFiltradas = search
    ? empresas.filter(e=>e.nombre.toLowerCase().includes(search.toLowerCase())||e.email?.toLowerCase().includes(search.toLowerCase()))
    : null

  const EmpCard = ({ emp, compact=false }) => {
    const planId = getPlanId(emp.id)||emp.plan
    const plan = planes.find(p=>p.id===planId)
    const planColor = emp.suspendida?'#ef4444':(plan?PLAN_COLORS[plan.id]||'#64748b':'#64748b')
    const PIcon = plan?PLAN_ICONS[plan.id]||Star:Star
    const isOpen = expanded===emp.id
    const planFIds = plan?getPlanFIds(plan.id):[]
    const extra = overrides.filter(o=>o.empresa_id===emp.id&&!planFIds.includes(o.feature_id)).length
    return (
      <div className={`rounded-xl border overflow-hidden transition-all ${emp.suspendida?'border-red-300 bg-red-50/50':'border-slate-200 bg-white'} ${compact?'':'shadow-sm'}`}>
        <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50/50"
          onClick={()=>setExpanded(isOpen?null:emp.id)}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white flex-shrink-0 text-sm"
            style={{background:planColor}}>
            {emp.suspendida?'⏸':emp.nombre.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 text-sm truncate">{emp.nombre}</p>
            <p className="text-slate-400 text-xs truncate">{emp.email}</p>
          </div>
          {emp.suspendida?(
            <span className="text-[10px] bg-red-100 text-red-700 border border-red-300 px-2 py-0.5 rounded-full font-bold flex-shrink-0">
              ⏸ SUSP.
            </span>
          ):(
            <>
              <select value={planId||'starter'}
                onClick={e=>e.stopPropagation()}
                onChange={e=>cambiarPlan(emp.id,e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none bg-white flex-shrink-0 font-medium"
                style={{color:planColor}}>
                {planes.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
              <span className="flex items-center gap-0.5 text-slate-400 text-xs flex-shrink-0">
                <Users className="w-3 h-3"/>{emp.max_empleados||'?'}
              </span>
              {extra>0&&<span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-bold">+{extra}</span>}
            </>
          )}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button onClick={e=>{e.stopPropagation();suspender(emp.id,emp.nombre,emp.suspendida,false)}}
              className={`p-1.5 rounded-lg transition-colors ${emp.suspendida?'text-emerald-500 hover:bg-emerald-50':'text-amber-400 hover:bg-amber-50'}`}>
              {emp.suspendida?<PlayCircle className="w-3.5 h-3.5"/>:<PauseCircle className="w-3.5 h-3.5"/>}
            </button>
            <button onClick={e=>{e.stopPropagation();borrar(emp.id,emp.nombre,false)}}
              className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 className="w-3.5 h-3.5"/>
            </button>
            {isOpen?<ChevronUp className="w-4 h-4 text-slate-400"/>:<ChevronDown className="w-4 h-4 text-slate-400"/>}
          </div>
        </div>
        {isOpen&&(
          <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/30">
            {emp.suspendida?(
              <div>
                <p className="text-sm text-red-600 font-medium">Servicio suspendido</p>
                {emp.motivo_suspension&&<p className="text-xs text-red-400 mt-0.5">Motivo: {emp.motivo_suspension}</p>}
                {emp.fecha_suspension&&<p className="text-xs text-slate-400 mt-0.5">{new Date(emp.fecha_suspension).toLocaleDateString('es-ES')}</p>}
                <button onClick={()=>suspender(emp.id,emp.nombre,true,false)}
                  className="mt-2 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                  <PlayCircle className="w-3.5 h-3.5"/> Reactivar
                </button>
              </div>
            ):(
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Features</p>
                {Object.keys(CAT_LABELS).map(cat=>{
                  const feats = features.filter(f=>f.categoria===cat)
                  if(!feats.length) return null
                  const planFIds2 = getPlanFIds(planId)
                  return(
                    <div key={cat} className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] text-slate-400 w-full">{CAT_LABELS[cat]}</span>
                      {feats.map(f=>{
                        const inPlan=planFIds2.includes(f.id)
                        const inOv=hasOv(emp.id,f.id)
                        const active=inPlan||inOv
                        return(
                          <button key={f.id} onClick={()=>toggleOv(emp.id,f.id)}
                            disabled={saving===emp.id+'-'+f.id}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border transition-all
                              ${active?(inPlan?'bg-indigo-50 text-indigo-700 border-indigo-200':'bg-emerald-50 text-emerald-700 border-emerald-200'):'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`,
                          }>
                            {active?<CheckCircle className="w-2.5 h-2.5"/>:<XCircle className="w-2.5 h-2.5"/>}
                            {f.nombre}
                            {inPlan&&!inOv&&<span className="text-[9px] opacity-60">plan</span>}
                          </button>
                        )
                      })}
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

  const empBuscar = empFiltradas||[]

  return (
    <div className="min-h-screen bg-slate-100">

      {/* Header */}
      <div className="bg-slate-900 px-6 py-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white"/>
          </div>
          <div>
            <h1 className="font-black text-white text-base leading-none">Super Admin</h1>
            <p className="text-slate-400 text-xs mt-0.5">Nexo HR · Tryvor</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center hidden sm:block">
            <p className="text-xs text-slate-400">MRR activo</p>
            <p className="text-xl font-black text-emerald-400">{mrr.toLocaleString('es-ES',{minimumFractionDigits:0})}€</p>
          </div>
          <div className="text-center hidden sm:block">
            <p className="text-xs text-slate-400">Clientes</p>
            <p className="text-xl font-black text-indigo-400">{empresas.length}</p>
          </div>
          <div className="text-center hidden sm:block">
            <p className="text-xs text-slate-400">Grupos</p>
            <p className="text-xl font-black text-purple-400">{grupos.length}</p>
          </div>
          <button onClick={cargar} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/>
          </button>
          <button onClick={()=>setIsAuth(false)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
            <LogOut className="w-4 h-4"/>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6 flex gap-0">
        {[
          {id:'clientes', label:'🏢 Clientes'},
          {id:'grupos',   label:'🗂️ Grupos'},
          {id:'planes',   label:'📊 Planes'},
          {id:'revenue',  label:'💰 Ingresos'},
        ].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition-all ${tab===t.id?'border-indigo-600 text-indigo-700 bg-indigo-50/50':'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-6 max-w-6xl mx-auto">

        {/* ── TAB CLIENTES ── */}
        {tab==='clientes'&&(
          <div className="space-y-5">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                <input value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="Buscar empresa..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400"/>
              </div>
              <button onClick={()=>setModalEmp(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm transition-colors">
                <Plus className="w-4 h-4"/> Nueva empresa
              </button>
              <button onClick={()=>setModalGrupo(true)}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm transition-colors">
                <Layers className="w-4 h-4"/> Nuevo grupo
              </button>
            </div>

            {loading?<div className="text-slate-400 animate-pulse text-center py-10">Cargando...</div>:search?(
              <div className="space-y-2">
                {empBuscar.map(emp=><EmpCard key={emp.id} emp={emp}/>)}
                {empBuscar.length===0&&<p className="text-slate-400 text-sm text-center py-8">Sin resultados</p>}
              </div>
            ):(
              <div className="space-y-4">
                {/* Grupos */}
                {grupos.map(g=>{
                  const gEmps = empresas.filter(e=>e.grupo_id===g.id)
                  const gMrr = gEmps.reduce((s,e)=>{
                    const planId = getPlanId(e.id)||e.plan
                    const plan = planes.find(p=>p.id===planId)
                    return s+(plan&&!e.suspendida?+plan.precio_mes*(e.max_empleados||10):0)
                  },0)
                  const gEmps_total = gEmps.reduce((s,e)=>s+(e.max_empleados||0),0)
                  const gSuspended = gEmps.every(e=>e.suspendida)
                  return(
                    <div key={g.id} className={`rounded-2xl border-2 overflow-hidden shadow-sm ${g.suspendida?'border-red-300':'border-purple-200'}`}>
                      {/* Header grupo */}
                      <div className={`px-5 py-4 flex items-center gap-3 flex-wrap ${g.suspendida?'bg-red-50':'bg-purple-50'}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-lg flex-shrink-0 ${g.suspendida?'bg-red-500':'bg-purple-600'}`}>
                          {g.suspendida?'⏸':g.nombre.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-black text-slate-800">{g.nombre}</p>
                            <span className="text-[10px] bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-bold">GRUPO</span>
                            {g.suspendida&&<span className="text-[10px] bg-red-100 text-red-700 border border-red-300 px-2 py-0.5 rounded-full font-bold">⏸ SUSPENDIDO</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-slate-400">{gEmps.length} empresa{gEmps.length!==1?'s':''}</span>
                            <span className="text-xs text-slate-400">{gEmps_total} usuarios</span>
                            <span className="text-xs font-semibold text-emerald-600">{gMrr.toLocaleString('es-ES',{minimumFractionDigits:0})}€/mes</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={()=>suspender(g.id,g.nombre,g.suspendida,true)}
                            title={g.suspendida?'Reactivar grupo':'Suspender grupo'}
                            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${g.suspendida?'bg-emerald-100 text-emerald-700 hover:bg-emerald-200':'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}>
                            {g.suspendida?<><PlayCircle className="w-3.5 h-3.5"/>Reactivar</>:<><PauseCircle className="w-3.5 h-3.5"/>Suspender</>}
                          </button>
                          <button onClick={()=>borrar(g.id,g.nombre,true)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4"/>
                          </button>
                        </div>
                      </div>
                      {/* Empresas del grupo */}
                      <div className="px-4 pb-4 pt-3 bg-white space-y-2">
                        {gEmps.map(emp=><EmpCard key={emp.id} emp={emp} compact/>)}
                        {gEmps.length===0&&<p className="text-slate-400 text-xs text-center py-3">Sin empresas en este grupo</p>}
                        <button onClick={()=>{setFormEmp(f=>({...f,grupo_id:g.id}));setModalEmp(true)}}
                          className="w-full flex items-center justify-center gap-2 py-2 text-xs text-purple-600 hover:text-purple-800 border border-dashed border-purple-300 hover:border-purple-500 rounded-xl transition-colors">
                          <Plus className="w-3.5 h-3.5"/> Añadir empresa al grupo
                        </button>
                      </div>
                    </div>
                  )
                })}

                {/* Empresas sin grupo */}
                {empSolas.length>0&&(
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Sin grupo</p>
                    <div className="space-y-2">
                      {empSolas.map(emp=><EmpCard key={emp.id} emp={emp}/>)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TAB GRUPOS ── */}
        {tab==='grupos'&&(
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Grupos de empresas</h2>
                <p className="text-slate-400 text-sm">Clientes con múltiples razones sociales</p>
              </div>
              <button onClick={()=>setModalGrupo(true)}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm">
                <Plus className="w-4 h-4"/> Nuevo grupo
              </button>
            </div>
            {loading?<div className="animate-pulse text-center text-slate-400 py-8">Cargando...</div>:
              <div className="grid gap-4">
                {grupos.map(g=>{
                  const gEmps = empresas.filter(e=>e.grupo_id===g.id)
                  const total_u = gEmps.reduce((s,e)=>s+(e.max_empleados||0),0)
                  const gMrr = gEmps.reduce((s,e)=>{
                    const planId=getPlanId(e.id)||e.plan
                    const plan=planes.find(p=>p.id===planId)
                    return s+(plan&&!e.suspendida?+plan.precio_mes*(e.max_empleados||10):0)
                  },0)
                  return(
                    <div key={g.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 bg-purple-600 rounded-xl flex items-center justify-center text-white font-black text-lg">{g.nombre.charAt(0)}</div>
                          <div>
                            <p className="font-bold text-slate-800">{g.nombre}</p>
                            <p className="text-xs text-slate-400">{g.email_contacto||'—'} · {g.telefono||'—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <p className="text-xs text-slate-400">Empresas</p>
                            <p className="font-bold text-slate-700">{gEmps.length}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-slate-400">Usuarios</p>
                            <p className="font-bold text-slate-700">{total_u}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-slate-400">MRR</p>
                            <p className="font-bold text-emerald-600">{gMrr.toLocaleString('es-ES',{minimumFractionDigits:0})}€</p>
                          </div>
                        </div>
                      </div>
                      <div className="px-5 py-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {gEmps.map(e=>{
                            const planId=getPlanId(e.id)||e.plan
                            const plan=planes.find(p=>p.id===planId)
                            const clr=e.suspendida?'#ef4444':(plan?PLAN_COLORS[plan.id]||'#64748b':'#64748b')
                            const mrr2=plan&&!e.suspendida?+plan.precio_mes*(e.max_empleados||10):0
                            return(
                              <div key={e.id} className={`flex items-center gap-2.5 p-3 rounded-xl border ${e.suspendida?'border-red-200 bg-red-50':'border-slate-100 bg-slate-50'}`}>
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                                  style={{background:clr}}>{e.nombre.charAt(0)}</div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-slate-700 truncate">{e.nombre}</p>
                                  <p className="text-xs text-slate-400">{PLAN_LABELS[planId]||planId} · {e.max_empleados||0}u</p>
                                </div>
                                <p className={`text-xs font-bold flex-shrink-0 ${e.suspendida?'text-red-400 line-through':'text-emerald-600'}`}>{mrr2.toLocaleString('es-ES',{minimumFractionDigits:0})}€</p>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {grupos.length===0&&<p className="text-slate-400 text-sm text-center py-10">No hay grupos creados todavía</p>}
              </div>
            }
          </div>
        )}

        {/* ── TAB PLANES ── */}
        {tab==='planes'&&(
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Comparar planes</h2>
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-48">Feature</th>
                    {planes.map(p=>{
                      const Icon=PLAN_ICONS[p.id]||Star
                      return(
                        <th key={p.id} className="px-4 py-3 text-center" style={{color:PLAN_COLORS[p.id]||'#64748b'}}>
                          <div className="flex flex-col items-center gap-1">
                            <Icon className="w-4 h-4"/>
                            <span className="text-xs font-bold uppercase tracking-wide">{p.nombre}</span>
                            <span className="text-slate-400 font-normal text-xs normal-case">{p.precio_mes}€/u/mes</span>
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(CAT_LABELS).map(cat=>{
                    const feats=features.filter(f=>f.categoria===cat)
                    if(!feats.length) return null
                    return[
                      <tr key={`h-${cat}`} className="bg-slate-50/80">
                        <td colSpan={planes.length+1} className="px-5 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">{CAT_LABELS[cat]}</td>
                      </tr>,
                      ...feats.map(f=>(
                        <tr key={f.id} className="border-t border-slate-50 hover:bg-slate-50/40">
                          <td className="px-5 py-2 text-sm text-slate-600">{f.nombre}</td>
                          {planes.map(p=>{
                            const has=planFeats.some(pf=>pf.plan_id===p.id&&pf.feature_id===f.id)
                            return(<td key={p.id} className="px-4 py-2 text-center">
                              {has?<CheckCircle className="w-4 h-4 text-emerald-500 mx-auto"/>:<span className="text-slate-200">—</span>}
                            </td>)
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

        {/* ── TAB INGRESOS ── */}
        {tab==='revenue'&&(
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-slate-800">Ingresos recurrentes</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {l:'MRR',       v:mrr.toLocaleString('es-ES',{minimumFractionDigits:2})+'€', c:'text-emerald-600', bg:'bg-emerald-50 border-emerald-200'},
                {l:'ARR',       v:(mrr*12).toLocaleString('es-ES',{minimumFractionDigits:0})+'€', c:'text-indigo-600', bg:'bg-indigo-50 border-indigo-200'},
                {l:'Empresas',  v:empresas.length, c:'text-slate-700', bg:'bg-white border-slate-200'},
                {l:'Suspendidas', v:empresas.filter(e=>e.suspendida).length, c:'text-red-600', bg:'bg-red-50 border-red-200'},
              ].map((k,i)=>(
                <div key={i} className={`${k.bg} rounded-2xl border p-5`}>
                  <p className={`text-2xl font-black ${k.c}`}>{k.v}</p>
                  <p className="text-slate-500 text-sm mt-1">{k.l}</p>
                </div>
              ))}
            </div>
            {/* Tabla desglose */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                <p className="font-bold text-slate-700 text-sm">Desglose por empresa</p>
              </div>
              <div className="divide-y divide-slate-50">
                {/* Grupos primero */}
                {grupos.map(g=>{
                  const gEmps=empresas.filter(e=>e.grupo_id===g.id)
                  const gMrr=gEmps.reduce((s,e)=>{
                    const planId=getPlanId(e.id)||e.plan
                    const plan=planes.find(p=>p.id===planId)
                    return s+(plan&&!e.suspendida?+plan.precio_mes*(e.max_empleados||10):0)
                  },0)
                  return[
                    <div key={g.id} className="flex items-center gap-3 px-5 py-2.5 bg-purple-50">
                      <div className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-black">{g.nombre.charAt(0)}</div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-700">{g.nombre} <span className="text-[10px] text-purple-500 font-normal">grupo</span></p>
                      </div>
                      <p className="text-sm font-black text-emerald-600">{gMrr.toLocaleString('es-ES',{minimumFractionDigits:2})}€/mes</p>
                    </div>,
                    ...gEmps.map(e=>{
                      const planId=getPlanId(e.id)||e.plan
                      const plan=planes.find(p=>p.id===planId)
                      const rev=plan&&!e.suspendida?+plan.precio_mes*(e.max_empleados||10):0
                      return(
                        <div key={e.id} className="flex items-center gap-3 px-5 py-2 pl-10">
                          <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{background:e.suspendida?'#ef4444':(plan?PLAN_COLORS[plan.id]||'#64748b':'#64748b')}}>
                            {e.nombre.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-slate-600 truncate">{e.nombre} {e.suspendida&&<span className="text-red-500 text-xs">(suspendida)</span>}</p>
                            <p className="text-xs text-slate-400">{PLAN_LABELS[planId]||planId} · {e.max_empleados||0}u</p>
                          </div>
                          <p className={`text-sm font-bold flex-shrink-0 ${e.suspendida?'text-red-300 line-through':'text-slate-600'}`}>{rev.toLocaleString('es-ES',{minimumFractionDigits:2})}€</p>
                        </div>
                      )
                    })
                  ]
                })}
                {/* Empresas sin grupo */}
                {empSolas.map(e=>{
                  const planId=getPlanId(e.id)||e.plan
                  const plan=planes.find(p=>p.id===planId)
                  const rev=plan&&!e.suspendida?+plan.precio_mes*(e.max_empleados||10):0
                  return(
                    <div key={e.id} className="flex items-center gap-3 px-5 py-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{background:e.suspendida?'#ef4444':(plan?PLAN_COLORS[plan.id]||'#64748b':'#64748b')}}>
                        {e.nombre.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{e.nombre}</p>
                        <p className="text-xs text-slate-400">{PLAN_LABELS[planId]||planId} · {e.max_empleados||0}u</p>
                      </div>
                      <p className={`text-sm font-bold flex-shrink-0 ${e.suspendida?'text-red-300 line-through':'text-emerald-600'}`}>{rev.toLocaleString('es-ES',{minimumFractionDigits:2})}€</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL nueva empresa ── */}
      {modalEmp&&(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">Nueva empresa</h3>
              <button onClick={()=>setModalEmp(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-400"/></button>
            </div>
            <div className="p-6 space-y-4">
              {[{k:'nombre',l:'Nombre empresa *',ph:'ACME Corp'},{k:'email',l:'Email contacto *',ph:'admin@acme.com'}].map(f=>(
                <div key={f.k}>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">{f.l}</label>
                  <input value={formEmp[f.k]} onChange={e=>setFormEmp(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph}
                    className="w-full bg-slate-50 rounded-xl px-3.5 py-2.5 text-sm border border-slate-200 outline-none focus:border-indigo-400"/>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Plan</label>
                  <select value={formEmp.plan} onChange={e=>setFormEmp(p=>({...p,plan:e.target.value}))}
                    className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 outline-none focus:border-indigo-400">
                    {planes.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Usuarios</label>
                  <input type="number" value={formEmp.max_empleados} onChange={e=>setFormEmp(p=>({...p,max_empleados:e.target.value}))}
                    className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 outline-none focus:border-indigo-400"/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Grupo (opcional)</label>
                <select value={formEmp.grupo_id} onChange={e=>setFormEmp(p=>({...p,grupo_id:e.target.value}))}
                  className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 outline-none focus:border-indigo-400">
                  <option value="">Sin grupo</option>
                  {grupos.map(g=><option key={g.id} value={g.id}>{g.nombre}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={()=>setModalEmp(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-500 hover:bg-slate-50">Cancelar</button>
              <button onClick={crearEmpresa} disabled={savingNew}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold">
                {savingNew?'Creando...':'Crear empresa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL nuevo grupo ── */}
      {modalGrupo&&(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Layers className="w-5 h-5 text-purple-600"/> Nuevo grupo</h3>
              <button onClick={()=>setModalGrupo(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-400"/></button>
            </div>
            <div className="p-6 space-y-4">
              {[{k:'nombre',l:'Nombre del grupo *',ph:'Grupo Axen SL'},{k:'email_contacto',l:'Email contacto',ph:'admin@grupo.com'},{k:'telefono',l:'Teléfono',ph:'+34 600 000 000'}].map(f=>(
                <div key={f.k}>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">{f.l}</label>
                  <input value={formGrupo[f.k]} onChange={e=>setFormGrupo(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph}
                    className="w-full bg-slate-50 rounded-xl px-3.5 py-2.5 text-sm border border-slate-200 outline-none focus:border-purple-400"/>
                </div>
              ))}
              <p className="text-xs text-slate-400">Después del crear el grupo, puedes añadir empresas desde la vista de clientes.</p>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={()=>setModalGrupo(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-500 hover:bg-slate-50">Cancelar</button>
              <button onClick={crearGrupo} disabled={savingNew}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold">
                {savingNew?'Creando...':'Crear grupo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL suspender ── */}
      {confirmSusp&&(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className={`px-6 py-4 flex items-center gap-3 ${confirmSusp.suspendida?'bg-emerald-600':'bg-amber-500'}`}>
              {confirmSusp.suspendida?<PlayCircle className="w-6 h-6 text-white"/>:<PauseCircle className="w-6 h-6 text-white"/>}
              <div>
                <h3 className="text-white font-bold">{confirmSusp.suspendida?'Reactivar':'Suspender'} servicio</h3>
                {confirmSusp.isGrupo&&<p className="text-white/70 text-xs">Afecta a todas las empresas del grupo</p>}
              </div>
            </div>
            <div className="p-6">
              <div className="bg-slate-100 rounded-xl px-4 py-3 mb-4">
                <p className="font-bold text-slate-800">{confirmSusp.nombre}</p>
              </div>
              {!confirmSusp.suspendida&&(
                <>
                  <p className="text-slate-500 text-sm mb-3">Los usuarios verán una pantalla de impago hasta que reaktives el servicio.</p>
                  <input value={motivo} onChange={e=>setMotivo(e.target.value)} placeholder="Motivo: Factura #123 pendiente"
                    className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 outline-none focus:border-amber-400 mb-4"/>
                </>
              )}
              {confirmSusp.suspendida&&<p className="text-slate-500 text-sm mb-5">Se restablecerá el acceso completo.</p>}
              <div className="flex gap-3">
                <button onClick={()=>setConfirmSusp(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
                <button onClick={confirmarSusp}
                  className={`flex-1 py-2.5 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 ${confirmSusp.suspendida?'bg-emerald-600 hover:bg-emerald-700':'bg-amber-500 hover:bg-amber-600'}`}>
                  {confirmSusp.suspendida?<><PlayCircle className="w-4 h-4"/>Reactivar</>:<><PauseCircle className="w-4 h-4"/>Suspender</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL borrar ── */}
      {confirmDel&&(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-red-600 px-6 py-4 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-white"/>
              <div>
                <h3 className="text-white font-bold">Borrar {confirmDel.isGrupo?'grupo':'cliente'}</h3>
                {confirmDel.isGrupo&&<p className="text-white/70 text-xs">Las empresas del grupo quedan sin grupo (no se borran)</p>}
              </div>
            </div>
            <div className="p-6">
              <div className="bg-slate-100 rounded-xl px-4 py-3 mb-3">
                <p className="font-bold text-slate-800">{confirmDel.nombre}</p>
                {!confirmDel.isGrupo&&<p className="text-xs text-slate-400 mt-0.5">Los empleados quedarán inactivos.</p>}
              </div>
              <p className="text-xs text-red-500 font-semibold mb-5">⚠️ Esta acción no se puede deshacer.</p>
              <div className="flex gap-3">
                <button onClick={()=>setConfirmDel(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
                <button onClick={confirmarBorrar} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
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