// @ts-nocheck
'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Shield } from 'lucide-react'
import SuperAdminMain from './SuperAdminMain'

export default function SuperAdmin() {
  const [isAuth, setIsAuth] = useState(false)
  const [pin, setPin]       = useState('')
  const [pinErr, setPinErr] = useState(false)
  const PIN = 'Tryvor2024!'

  const [empresas,  setEmpresas]  = useState([])
  const [grupos,    setGrupos]    = useState([])
  const [planes,    setPlanes]    = useState([])
  const [features,  setFeatures]  = useState([])
  const [planFeats, setPlanFeats] = useState([])
  const [configs,   setConfigs]   = useState([])
  const [overrides, setOverrides] = useState([])
  const [loading,   setLoading]   = useState(true)

  const cargar = useCallback(async () => {
    setLoading(true)
    const [e,g,pl,ft,pf,cf,ov] = await Promise.all([
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

  const tryLogin = () => {
    if (pin === PIN) { setIsAuth(true) }
    else { setPinErr(true); setTimeout(() => setPinErr(false), 2000) }
  }

  if (!isAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Shield className="w-8 h-8 text-white"/>
          </div>
          <h1 className="text-white text-2xl font-black text-center mb-1">Super Admin</h1>
          <p className="text-indigo-300 text-sm text-center mb-7">Nexo HR · Tryvor</p>
          <input
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') tryLogin() }}
            placeholder="Contraseña de acceso"
            className="w-full bg-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 border border-white/20 focus:border-indigo-400 outline-none text-sm mb-3"
          />
          {pinErr && <p className="text-red-400 text-xs text-center mb-3">Contraseña incorrecta</p>}
          <button onClick={tryLogin} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 font-bold text-sm transition-colors">
            Acceder
          </button>
        </div>
      </div>
    )
  }

  return (
    <SuperAdminMain
      empresas={empresas}
      grupos={grupos}
      planes={planes}
      features={features}
      planFeats={planFeats}
      configs={configs}
      overrides={overrides}
      loading={loading}
      cargar={cargar}
      onLogout={() => setIsAuth(false)}
    />
  )
}