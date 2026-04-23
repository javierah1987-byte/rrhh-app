// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Lock, ArrowUp } from 'lucide-react'

const PLAN_NAMES = { fichaje:'Solo Fichaje', starter:'Starter', professional:'Professional', enterprise:'Enterprise' }
const PLAN_ORDER = { fichaje:0, starter:1, professional:2, enterprise:3 }

const FEATURE_MIN_PLAN = {
  evaluaciones:'professional', organigrama:'professional', onboarding:'professional',
  people_analytics:'professional', formacion:'professional', reserva_espacios:'professional',
  tareas:'professional', fichaje_whatsapp:'professional',
  adelanto_nomina:'enterprise', api:'enterprise', ia:'enterprise',
  sso:'enterprise', retribucion_flex:'enterprise', multiempresa:'enterprise', comunidad:'enterprise',
}

const PLAN_COLORS = { fichaje:'#0891b2', starter:'#6366f1', professional:'#10b981', enterprise:'#f59e0b' }

export default function FeatureGate({ featureId, children }) {
  const [status, setStatus]       = useState('loading')
  const [empresaPlan, setEmpresaPlan] = useState(null)
  const [requiredPlan, setRequiredPlan] = useState(null)

  useEffect(() => {
    const check = async () => {
      try {
        const { data:{ user } } = await supabase.auth.getUser()
        if (!user) { setStatus('ok'); return }

        const { data: emp } = await supabase.from('empleados')
          .select('empresa_id, rol').eq('user_id', user.id).single()
        if (!emp?.empresa_id) { setStatus('ok'); return }

        // Admins/owners always see all (plan decision is commercial, not UX)
        // Actually no — we want to enforce the gate for everyone including owner
        // But check plan
        const { data: empresa } = await supabase.from('empresas')
          .select('plan').eq('id', emp.empresa_id).single()
        const plan = empresa?.plan || 'starter'
        setEmpresaPlan(plan)

        // 1. Is feature in plan?
        const { data: pf } = await supabase.from('plan_features')
          .select('feature_id').eq('plan_id', plan).eq('feature_id', featureId)
        const inPlan = pf && pf.length > 0

        // 2. Override?
        const { data: ov } = await supabase.from('empresas_features_override')
          .select('activa').eq('empresa_id', emp.empresa_id).eq('feature_id', featureId).maybeSingle()

        const hasAccess = ov
          ? ov.activa !== false   // override always wins
          : inPlan

        if (hasAccess) {
          setStatus('ok')
        } else {
          const min = FEATURE_MIN_PLAN[featureId] || 'professional'
          setRequiredPlan(min)
          setStatus('blocked')
        }
      } catch(e) {
        setStatus('ok') // en caso de error no bloqueamos
      }
    }
    check()
  }, [featureId])

  if (status === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"/>
      </div>
    )
  }

  if (status === 'blocked') {
    const reqColor = PLAN_COLORS[requiredPlan] || '#6366f1'
    const curColor = PLAN_COLORS[empresaPlan] || '#64748b'
    return (
      <div className="flex-1 flex items-center justify-center min-h-96 p-8 bg-slate-50/50">
        <div className="text-center max-w-sm w-full">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg"
            style={{background: reqColor + '15', border: '2px solid ' + reqColor + '30'}}>
            <Lock className="w-12 h-12" style={{color: reqColor}}/>
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Función bloqueada</h2>
          <p className="text-slate-500 text-sm mb-1">
            Tu plan actual: <span className="font-bold px-2 py-0.5 rounded-full text-white text-xs" style={{background:curColor}}>{PLAN_NAMES[empresaPlan]||empresaPlan}</span>
          </p>
          <p className="text-slate-500 text-sm mb-6">
            Esta sección requiere el plan{' '}
            <span className="font-black" style={{color:reqColor}}>{PLAN_NAMES[requiredPlan]||requiredPlan}</span>
            {' '}o superior
          </p>
          <a
            href={`mailto:hola@tryvor.es?subject=Quiero mejorar al plan ${PLAN_NAMES[requiredPlan]||requiredPlan}&body=Hola, me gustaría mejorar mi plan de Nexo HR para acceder a esta función.`}
            className="flex items-center justify-center gap-2 w-full text-white font-bold py-3 px-6 rounded-2xl text-sm mb-3 shadow-md hover:opacity-90 transition-opacity"
            style={{background:reqColor}}>
            <ArrowUp className="w-4 h-4"/> Mejorar mi plan
          </a>
          <a href="/admin" className="text-slate-400 hover:text-slate-600 text-sm transition-colors">
            ← Volver al panel
          </a>
        </div>
      </div>
    )
  }

  return children
}
