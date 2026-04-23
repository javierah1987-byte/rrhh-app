// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import dynamic from 'next/dynamic'
import { Lock, TrendingUp, Zap, Crown } from 'lucide-react'

const OriginalPage = dynamic(() => import('./_page'), { ssr: false })

const FEAT = 'organigrama'
const MIN_PLAN = 'professional'
const PLAN_LABELS = { fichaje:'Solo Fichaje', starter:'Starter', professional:'Professional', enterprise:'Enterprise' }
const PLAN_COLORS = { professional:'indigo', enterprise:'amber' }

function UpsellModal({ minPlan, currentPlan, onClose }) {
  const color = minPlan === 'enterprise' ? 'amber' : 'indigo'
  const Icon = minPlan === 'enterprise' ? Crown : Zap
  const label = PLAN_LABELS[minPlan] || minPlan

  const benefits = minPlan === 'enterprise'
    ? ['Todo Professional', 'IA integrada', 'SSO corporativo', 'API OAuth', 'Retribución flexible', 'Multiempresa']
    : ['Evaluación de desempeño', 'Onboarding y offboarding', 'Organigrama visual', 'Gestión de formación', 'People Analytics', 'Reserva de espacios']

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e=>e.stopPropagation()}>
        <div className={`bg-${color}-600 px-6 py-5`}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <Icon className="w-7 h-7 text-white"/>
            </div>
            <div>
              <p className="text-white/80 text-sm">Actualiza a</p>
              <h2 className="text-white font-black text-2xl">{label}</h2>
            </div>
          </div>
        </div>
        <div className="p-6">
          <p className="text-slate-600 text-sm mb-4">
            Tu plan actual es <strong>{PLAN_LABELS[currentPlan] || currentPlan}</strong>.
            Actualiza para desbloquear esta función y más:
          </p>
          <ul className="space-y-2 mb-6">
            {benefits.map((b,i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                <div className={`w-5 h-5 bg-${color}-600 rounded-full flex items-center justify-center flex-shrink-0`}>
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                {b}
              </li>
            ))}
          </ul>
          <div className="space-y-3">
            <a href="mailto:hola@tryvor.es?subject=Quiero mejorar mi plan Nexo HR a professional"
              className={`flex items-center justify-center gap-2 bg-${color}-600 hover:bg-${color}-700 text-white font-bold py-3 rounded-xl w-full transition-colors`}>
              <Icon className="w-5 h-5"/>
              Mejorar a {label}
            </a>
            <button onClick={onClose}
              className="w-full py-3 border border-slate-200 rounded-xl text-sm text-slate-500 hover:bg-slate-50">
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function GatedPage() {
  const [status, setStatus] = useState('loading')
  const [plan, setPlan]     = useState('starter')
  const [modal, setModal]   = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setStatus('blocked'); return }

        const { data: emp } = await supabase
          .from('empleados')
          .select('empresa_id, empresas(plan)')
          .eq('user_id', user.id)
          .single()

        const empPlan = emp?.empresas?.plan || 'starter'
        const empId   = emp?.empresa_id
        setPlan(empPlan)

        const [{ data: pf }, { data: ov }] = await Promise.all([
          supabase.from('plan_features').select('feature_id')
            .eq('plan_id', empPlan).eq('feature_id', FEAT),
          supabase.from('empresas_features_override').select('activa')
            .eq('empresa_id', empId).eq('feature_id', FEAT).single()
        ])

        const inPlan   = (pf||[]).length > 0
        const override = ov ? ov.activa : null
        setStatus((override !== null ? override : inPlan) ? 'allowed' : 'blocked')
      } catch {
        setStatus('allowed') // Si hay error, dejar pasar
      }
    })()
  }, [])

  if (status === 'loading') return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  if (status === 'blocked') return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center">
      <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-indigo-100 rounded-3xl flex items-center justify-center mb-6">
        <Lock className="w-12 h-12 text-indigo-400"/>
      </div>
      <h2 className="text-2xl font-black text-slate-800 mb-3">
        Función no disponible en tu plan
      </h2>
      <p className="text-slate-500 max-w-sm mb-2">
        Necesitas el plan <strong className="text-indigo-600">{PLAN_LABELS[MIN_PLAN]}</strong> o superior para acceder.
      </p>
      <p className="text-slate-400 text-sm mb-8">
        Plan actual: <strong>{PLAN_LABELS[plan] || plan}</strong>
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={() => setModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 rounded-xl flex items-center gap-2 transition-colors shadow-lg">
          <TrendingUp className="w-5 h-5"/>
          Ver cómo mejorar
        </button>
        <a href="mailto:hola@tryvor.es"
          className="border-2 border-slate-200 text-slate-600 font-semibold px-8 py-3 rounded-xl hover:bg-slate-50 transition-colors">
          Contactar soporte
        </a>
      </div>
      {modal && <UpsellModal minPlan={MIN_PLAN} currentPlan={plan} onClose={() => setModal(false)}/>}
    </div>
  )

  return <OriginalPage />
}
