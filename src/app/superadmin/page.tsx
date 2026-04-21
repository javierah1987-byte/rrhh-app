// @ts-nocheck
'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Building2, CheckCircle, XCircle, Shield, Crown, Zap, Star, ToggleLeft, ToggleRight, LogOut, RefreshCw, Settings } from 'lucide-react'

const PLAN_COLORS = { starter:'#6366f1', professional:'#10b981', enterprise:'#f59e0b' }
const PLAN_ICONS = { starter: Star, professional: Zap, enterprise: Crown }

export default function SuperAdminPage() {
  const [auth, setAuth] = useState(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [planes, setPlanes] = useState([])
  const [features, setFeatures] = useState([])
  const [planFeatures, setPlanFeatures] = useState([])
  const [empresas, setEmpresas] = useState([])
  const [configs, setConfigs] = useState([])
  const [activeTab, setActiveTab] = useState('clientes')
  const [saving, setSaving] = useState(null)

  const cargar = useCallback(async () => {
    const [p, f, pf, e, c] = await Promise.all([
      supabase.from('planes').select('*').order('orden'),
      supabase.from('features').select('*').order('categoria,nombre'),
      supabase.from('plan_features').select('*'),
      supabase.from('empresas').select('id,nombre'),
      supabase.from('empresas_config').select('*'),
    ])
    setPlanes(p.data||[])
    setFeatures(f.data||[])
    setPlanFeatures(pf.data||[])
    setEmpresas(e.data||[])
    setConfigs(c.data||[])
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(async ({data:{user}}) => {
      if (!user) { setLoading(false); return }
      setAuth(user)
      const {data} = await supabase.from('super_admins').select('*').eq('email', user.email).eq('activo', true).single()
      if (data) { setIsSuperAdmin(true); await cargar() }
      setLoading(false)
    })
  }, [cargar])

  const handleLogin = async (e) => {
    e.preventDefault(); setLoginError('')
    const {error} = await supabase.auth.signInWithPassword({email, password})
    if (error) { setLoginError('Credenciales incorrectas'); return }
    const {data:{user}} = await supabase.auth.getUser()
    const {data} = await supabase.from('super_admins').select('*').eq('email', user.email).eq('activo', true).single()
    if (!data) { setLoginError('No tienes acceso de Super Admin'); await supabase.auth.signOut(); return }
    setAuth(user); setIsSuperAdmin(true); await cargar()
  }

  const toggleEmpresaActiva = async (empresaId, activa) => {
    setSaving(empresaId)
    await supabase.from('empresas_config').upsert({empresa_id: empresaId, activa: !activa}, {onConflict:'empresa_id'})
    await cargar(); setSaving(null)
  }

  const cambiarPlan = async (empresaId, planId) => {
    setSaving(empresaId + '_plan')
    await supabase.from('empresas_config').upsert({empresa_id: empresaId, plan_id: planId}, {onConflict:'empresa_id'})
    await cargar(); setSaving(null)
  }

  const getConfig = (empresaId) => configs.find(c => c.empresa_id === empresaId)
  const getPlanFeatures = (planId) => planFeatures.filter(pf => pf.plan_id === planId).map(pf => pf.feature_id)
  const getFeaturesByCategoria = () => {
    const cats = {}
    features.forEach(f => { if (!cats[f.categoria]) cats[f.categoria] = []; cats[f.categoria].push(f) })
    return cats
  }

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><p className="text-white">Cargando...</p></div>

  if (!auth || !isSuperAdmin) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-slate-700">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><Shield className="w-8 h-8 text-white"/></div>
          <h1 className="text-2xl font-bold text-white">Nexo HR · Super Admin</h1>
          <p className="text-slate-400 mt-1">Panel de control Tryvor</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 border border-slate-600 focus:border-indigo-500 outline-none" placeholder="tu@email.com"/>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Contraseña</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 border border-slate-600 focus:border-indigo-500 outline-none" placeholder="••••••••"/>
          </div>
          {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors">Acceder</button>
        </form>
      </div>
    </div>
  )

  const cats = getFeaturesByCategoria()

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center"><Shield className="w-5 h-5"/></div>
          <div><h1 className="font-bold text-lg leading-none">Super Admin</h1><p className="text-slate-400 text-xs mt-0.5">Nexo HR · Tryvor Platform</p></div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={cargar} className="text-slate-400 hover:text-white"><RefreshCw className="w-4 h-4"/></button>
          <span className="text-slate-400 text-sm">{auth?.email}</span>
          <button onClick={()=>supabase.auth.signOut().then(()=>{setAuth(null);setIsSuperAdmin(false)})} className="flex items-center gap-1.5 text-slate-400 hover:text-red-400 text-sm">
            <LogOut className="w-4 h-4"/> Salir
          </button>
        </div>
      </header>

      <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {label:'Clientes',value:empresas.length,icon:Building2,color:'#6366f1'},
          {label:'Activos',value:configs.filter(c=>c.activa).length,icon:CheckCircle,color:'#10b981'},
          {label:'Planes',value:planes.length,icon:Crown,color:'#f59e0b'},
          {label:'Módulos',value:features.length,icon:Settings,color:'#ec4899'},
        ].map((s,i)=>{const Icon=s.icon;return(
          <div key={i} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{background:s.color+'25'}}><Icon className="w-5 h-5" style={{color:s.color}}/></div>
              <div><p className="text-2xl font-bold">{s.value}</p><p className="text-slate-400 text-xs">{s.label}</p></div>
            </div>
          </div>
        )})}
      </div>

      <div className="px-6 mb-4 flex gap-1 border-b border-slate-700">
        {[['clientes','Clientes'],['planes','Planes & Módulos']].map(([id,label])=>(
          <button key={id} onClick={()=>setActiveTab(id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${activeTab===id?'text-indigo-400 border-indigo-400':'text-slate-400 border-transparent hover:text-white'}`}>{label}</button>
        ))}
      </div>

      <div className="px-6 pb-8">
        {activeTab==='clientes' && (
          <div className="space-y-3">
            {empresas.length===0 && <p className="text-slate-400 text-center py-8">No hay clientes registrados</p>}
            {empresas.map(emp=>{
              const cfg=getConfig(emp.id)
              const plan=planes.find(p=>p.id===cfg?.plan_id)
              const PlanIcon=plan?PLAN_ICONS[plan.id]:Star
              const planColor=plan?PLAN_COLORS[plan.id]:'#64748b'
              return(
                <div key={emp.id} className={`bg-slate-800 rounded-xl p-5 border ${cfg?.activa!==false?'border-slate-700':'border-red-900/50 bg-red-950/10'}`}>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-3 flex-1 min-w-[180px]">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg" style={{background:planColor+'25',color:planColor}}>
                        {emp.nombre?.charAt(0)||'?'}
                      </div>
                      <div><p className="font-semibold">{emp.nombre}</p><p className="text-slate-500 text-xs font-mono">{emp.id.substring(0,12)}...</p></div>
                    </div>

                    <select value={cfg?.plan_id||''} onChange={e=>cambiarPlan(emp.id,e.target.value)}
                      className="bg-slate-700 text-white text-sm rounded-lg px-3 py-2 border border-slate-600 outline-none focus:border-indigo-500">
                      <option value="">Sin plan</option>
                      {planes.map(p=><option key={p.id} value={p.id}>{p.nombre} — {p.precio_mes}€/mes</option>)}
                    </select>

                    {plan&&<span className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5" style={{background:planColor+'20',color:planColor}}>
                      <PlanIcon className="w-3 h-3"/>{plan.nombre}
                    </span>}

                    <button onClick={()=>toggleEmpresaActiva(emp.id,cfg?.activa)} disabled={saving===emp.id} className="flex items-center gap-2">
                      {cfg?.activa!==false
                        ?<><ToggleRight className="w-8 h-8 text-emerald-400"/><span className="text-emerald-400 text-sm font-medium">Activa</span></>
                        :<><ToggleLeft className="w-8 h-8 text-red-400"/><span className="text-red-400 text-sm font-medium">Suspendida</span></>
                      }
                    </button>
                  </div>

                  {plan&&(
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {getPlanFeatures(plan.id).slice(0,12).map(fid=>{
                        const feat=features.find(f=>f.id===fid)
                        return feat?<span key={fid} className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">{feat.nombre}</span>:null
                      })}
                      {getPlanFeatures(plan.id).length>12&&<span className="px-2 py-0.5 bg-slate-700 text-slate-500 rounded text-xs">+{getPlanFeatures(plan.id).length-12} más</span>}
                    </div>
                  )}
                  {cfg?.notas&&<p className="text-slate-500 text-xs mt-2 italic">{cfg.notas}</p>}
                </div>
              )
            })}
          </div>
        )}

        {activeTab==='planes' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {planes.map(plan=>{
              const PlanIcon=PLAN_ICONS[plan.id]||Star
              const planFeatIds=getPlanFeatures(plan.id)
              const color=PLAN_COLORS[plan.id]||'#6366f1'
              return(
                <div key={plan.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                  <div className="p-5 border-b border-slate-700" style={{background:color+'15'}}>
                    <div className="flex items-center gap-2 mb-2">
                      <PlanIcon className="w-5 h-5" style={{color}}/>
                      <h3 className="font-bold text-lg" style={{color}}>{plan.nombre}</h3>
                    </div>
                    <p className="text-2xl font-black">{plan.precio_mes}€<span className="text-sm font-normal text-slate-400">/usuario/mes</span></p>
                    <p className="text-slate-400 text-sm mt-1">{plan.descripcion}</p>
                    <div className="text-xs text-slate-500 mt-2 flex gap-3">
                      <span>{plan.max_gb_docs} GB docs</span>
                      <span>·</span>
                      <span>{planFeatIds.length} módulos</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-0.5 max-h-96 overflow-y-auto">
                    {Object.entries(cats).map(([cat,feats])=>(
                      <div key={cat}>
                        <p className="text-slate-500 text-[10px] uppercase tracking-wider mt-3 mb-1">{cat}</p>
                        {feats.map(f=>(
                          <div key={f.id} className="flex items-center gap-2 py-0.5">
                            {planFeatIds.includes(f.id)
                              ?<CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0"/>
                              :<XCircle className="w-3 h-3 text-slate-600 flex-shrink-0"/>
                            }
                            <span className={`text-xs ${planFeatIds.includes(f.id)?'text-slate-200':'text-slate-600'}`}>{f.nombre}</span>
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
    </div>
  )
}