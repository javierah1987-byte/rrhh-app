// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { UpsellModal } from '@/components/FeatureGate'
import { Lock, TrendingUp } from 'lucide-react'
import OriginalContent from './_page'

const FEAT = 'onboarding'
const MIN_PLAN = 'professional'
const PLAN_LABELS = { starter:'Starter', professional:'Professional', enterprise:'Enterprise' }

export default function GatedPage() {
  const [status, setStatus] = useState('loading') // loading | allowed | blocked
  const [plan, setPlan]     = useState('starter')
  const [modal, setModal]   = useState(false)

  useEffect(() => {
    ;(async () => {
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
      // Check en plan_features
      const { data: pf } = await supabase
        .from('plan_features')
        .select('feature_id')
        .eq('plan_id', empPlan)
        .eq('feature_id', FEAT)
      // Check override empresa
      const { data: ov } = await supabase
        .from('empresas_features_override')
        .select('activa')
        .eq('empresa_id', empId)
        .eq('feature_id', FEAT)
        .single()
      const inPlan   = (pf||[]).length > 0
      const override = ov ? ov.activa : null
      const canAccess = override !== null ? override : inPlan
      setStatus(canAccess ? 'allowed' : 'blocked')
    })()
  }, [])

  if (status === 'loading') return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  if (status === 'blocked') return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center">
      <div className="w-24 h-24 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
        <Lock className="w-12 h-12 text-indigo-400"/>
      </div>
      <h2 className="text-2xl font-black text-slate-800 mb-3">
        Función no disponible en tu plan
      </h2>
      <p className="text-slate-500 max-w-md mb-2">
        Para acceder a esta sección necesitas el plan{' '}
        <strong className="text-indigo-600">{PLAN_LABELS[MIN_PLAN] || MIN_PLAN}</strong> o superior.
      </p>
      <p className="text-slate-400 text-sm mb-8">
        Tu plan actual: <strong>{PLAN_LABELS[plan] || plan}</strong>
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => setModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3.5 rounded-xl flex items-center gap-2 shadow-lg transition-colors text-base">
          <TrendingUp className="w-5 h-5"/>
          Ver cómo mejorar mi plan
        </button>
        <a
          href="mailto:hola@tryvor.es?subject=Quiero mejorar mi plan Nexo HR"
          className="border-2 border-slate-200 text-slate-600 font-semibold px-8 py-3.5 rounded-xl hover:bg-slate-50 transition-colors text-base">
          Contactar con soporte
        </a>
      </div>
      {modal && (
        <UpsellModal
          feature={FEAT}
          minPlan={MIN_PLAN}
          currentPlan={plan}
          onClose={() => setModal(false)}
        />
      )}
    </div>
  )

  return <OriginalContent />
}
