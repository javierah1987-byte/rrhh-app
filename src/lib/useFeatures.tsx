// @ts-nocheck
'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const FeaturesCtx = createContext({ features: [], plan: null, loading: true })

// Mapa feature_id → plan mínimo necesario (para mostrar en el upsell)
const PLAN_ORDER = ['fichaje', 'starter', 'professional', 'enterprise']
const PLAN_LABELS = { fichaje:'Solo Fichaje', starter:'Starter', professional:'Professional', enterprise:'Enterprise' }
const PLAN_PRICES = { fichaje:'2.50', starter:'6.00', professional:'6.75', enterprise:'9.00' }

export function FeaturesProvider({ children, empresaId, plan }) {
  const [features, setFeatures] = useState([])
  const [loading, setLoading]   = useState(true)

  const cargar = useCallback(async () => {
    if (!empresaId) return
    setLoading(true)
    // Features del plan base
    const { data: pf } = await supabase
      .from('plan_features')
      .select('feature_id')
      .eq('plan_id', plan || 'starter')
    // Overrides de la empresa
    const { data: ov } = await supabase
      .from('empresas_features_override')
      .select('feature_id, activa')
      .eq('empresa_id', empresaId)

    const base = new Set((pf||[]).map(r=>r.feature_id))
    const overrideActiva = new Set((ov||[]).filter(r=>r.activa!==false).map(r=>r.feature_id))
    const overrideDesact = new Set((ov||[]).filter(r=>r.activa===false).map(r=>r.feature_id))

    // Unión: base + overrides activos - overrides desactivados
    const activas = [...new Set([...base, ...overrideActiva])].filter(f=>!overrideDesact.has(f))
    setFeatures(activas)
    setLoading(false)
  }, [empresaId, plan])

  useEffect(() => { cargar() }, [cargar])

  return (
    <FeaturesCtx.Provider value={{ features, plan: plan||'starter', loading, reload: cargar }}>
      {children}
    </FeaturesCtx.Provider>
  )
}

export function useFeatures() {
  return useContext(FeaturesCtx)
}

export function useHasFeature(featureId) {
  const { features, loading } = useFeatures()
  return { hasAccess: features.includes(featureId), loading }
}

export { PLAN_ORDER, PLAN_LABELS, PLAN_PRICES }
