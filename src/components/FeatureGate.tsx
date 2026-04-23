// @ts-nocheck
'use client'
import { useHasFeature, useFeatures, PLAN_LABELS, PLAN_PRICES } from '@/lib/useFeatures'
import { Lock, Zap, Crown, Star, ArrowRight, X } from 'lucide-react'
import { useState } from 'react'

// Mapa de feature → plan mínimo que la incluye
const FEATURE_MIN_PLAN = {
  people_analytics: 'professional',
  evaluaciones: 'professional',
  onboarding: 'professional',
  organigrama: 'professional',
  formacion: 'professional',
  reserva_espacios: 'professional',
  adelanto_nomina: 'enterprise',
  api: 'enterprise',
  comunidad: 'enterprise',
  ia: 'enterprise',
  multiempresa: 'enterprise',
  retribucion_flex: 'enterprise',
  sso: 'enterprise',
}

const PLAN_ICONS = {
  starter: Star,
  professional: Zap,
  enterprise: Crown,
}

// Colores por plan
const PLAN_COLORS = {
  starter: { bg:'bg-indigo-600', light:'bg-indigo-50', text:'text-indigo-600', border:'border-indigo-200' },
  professional: { bg:'bg-emerald-600', light:'bg-emerald-50', text:'text-emerald-600', border:'border-emerald-200' },
  enterprise: { bg:'bg-amber-500', light:'bg-amber-50', text:'text-amber-600', border:'border-amber-200' },
}

export function FeatureGate({ feature, children, mode = 'overlay' }) {
  const { hasAccess, loading } = useHasFeature(feature)
  const { plan } = useFeatures()
  const [showModal, setShowModal] = useState(false)

  if (loading) return null
  if (hasAccess) return children

  const minPlan = FEATURE_MIN_PLAN[feature] || 'professional'
  const Icon = PLAN_ICONS[minPlan] || Zap
  const colors = PLAN_COLORS[minPlan] || PLAN_COLORS.professional
  const planLabel = PLAN_LABELS[minPlan] || minPlan
  const planPrice = PLAN_PRICES[minPlan]

  if (mode === 'overlay') {
    return (
      <div className="relative">
        {/* Contenido borroso */}
        <div className="pointer-events-none select-none" style={{filter:'blur(3px)',opacity:0.4}}>
          {children}
        </div>
        {/* Overlay de bloqueo */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <button
            onClick={()=>setShowModal(true)}
            className={`flex flex-col items-center gap-3 bg-white border ${colors.border} rounded-2xl shadow-xl px-8 py-6 hover:shadow-2xl transition-all hover:scale-105 cursor-pointer max-w-xs w-full mx-4`}>
            <div className={`w-14 h-14 ${colors.bg} rounded-xl flex items-center justify-center shadow-lg`}>
              <Lock className="w-7 h-7 text-white"/>
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-800 text-base">Función no disponible</p>
              <p className="text-slate-500 text-sm mt-1">Requiere plan <span className={`font-bold ${colors.text}`}>{planLabel}</span></p>
            </div>
            <div className={`flex items-center gap-2 ${colors.bg} text-white text-sm font-bold px-5 py-2.5 rounded-xl w-full justify-center`}>
              <Icon className="w-4 h-4"/>
              Mejorar plan
              <ArrowRight className="w-4 h-4"/>
            </div>
          </button>
        </div>
        {/* Modal upsell */}
        {showModal && <UpsellModal feature={feature} minPlan={minPlan} currentPlan={plan} onClose={()=>setShowModal(false)}/>}
      </div>
    )
  }

  // mode === 'button' — solo botón sin overlay
  return (
    <>
      <button
        onClick={()=>setShowModal(true)}
        className={`flex items-center gap-2 ${colors.light} ${colors.text} ${colors.border} border text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-80 transition-opacity`}>
        <Lock className="w-4 h-4"/>
        {planLabel} →
      </button>
      {showModal && <UpsellModal feature={feature} minPlan={minPlan} currentPlan={plan} onClose={()=>setShowModal(false)}/>}
    </>
  )
}

export function UpsellModal({ feature, minPlan, currentPlan, onClose }) {
  const Icon = PLAN_ICONS[minPlan] || Zap
  const colors = PLAN_COLORS[minPlan] || PLAN_COLORS.professional
  const planLabel = PLAN_LABELS[minPlan] || minPlan
  const planPrice = PLAN_PRICES[minPlan]

  const PLAN_BENEFITS = {
    professional: [
      'Todo lo del plan Starter',
      'Evaluación de desempeño',
      'Onboarding y offboarding',
      'Organigrama visual',
      'Gestión de formación',
      'People Analytics',
    ],
    enterprise: [
      'Todo lo del plan Professional',
      'IA integrada en RRHH',
      'Retribución flexible',
      'API OAuth avanzada',
      'SSO corporativo',
      'Multiempresa',
      'Adelanto de nómina',
    ],
    starter: [
      'Gestión de empleados',
      'Control de fichaje',
      'Vacaciones y ausencias',
      'Nóminas',
      'Informes básicos',
    ],
  }

  const benefits = PLAN_BENEFITS[minPlan] || []

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className={`${colors.bg} px-6 py-5 relative`}>
          <button onClick={onClose} className="absolute right-4 top-4 p-1 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
            <X className="w-4 h-4 text-white"/>
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <Icon className="w-7 h-7 text-white"/>
            </div>
            <div>
              <p className="text-white/80 text-sm">Actualiza a</p>
              <h2 className="text-white font-black text-2xl">{planLabel}</h2>
              <p className="text-white/90 text-sm">{planPrice}€/usuario/mes</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-slate-600 text-sm mb-4">
            Esta función no está incluida en tu plan actual. Mejora a <strong>{planLabel}</strong> para desbloquearla junto con estas ventajas:
          </p>
          <ul className="space-y-2 mb-6">
            {benefits.map((b,i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                <div className={`w-5 h-5 ${colors.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                {b}
              </li>
            ))}
          </ul>
          <div className="space-y-3">
            <a href="mailto:hola@tryvor.es?subject=Quiero mejorar mi plan Nexo HR"
              className={`flex items-center justify-center gap-2 ${colors.bg} text-white font-bold py-3 rounded-xl w-full hover:opacity-90 transition-opacity`}>
              <Icon className="w-5 h-5"/>
              Contactar para mejorar plan
              <ArrowRight className="w-4 h-4"/>
            </a>
            <button onClick={onClose}
              className="w-full py-3 border border-slate-200 rounded-xl text-sm text-slate-500 hover:bg-slate-50 transition-colors">
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
