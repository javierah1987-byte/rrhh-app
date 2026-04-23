// @ts-nocheck
'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Lock, ArrowUpCircle, Mail, Loader2 } from 'lucide-react'

const PLAN_NAMES   = { fichaje:'Solo Fichaje', starter:'Starter', professional:'Professional', enterprise:'Enterprise' }
const PLAN_COLORS  = { fichaje:'#0891b2', starter:'#6366f1', professional:'#10b981', enterprise:'#f59e0b' }
const PLAN_BULLETS = {
  professional: ['Evaluaciones de desempeño','Organigrama visual','Onboarding automatizado','People Analytics','Reserva de espacios','Formación interna'],
  enterprise:   ['Todo lo de Professional','Adelanto de nómina','API de integración','IA generativa','SSO / Single Sign-On','Retribución flexible'],
}
const FEATURE_MIN_PLAN: Record<string,string> = {
  evaluaciones:'professional', organigrama:'professional', onboarding:'professional',
  people_analytics:'professional', formacion:'professional', reserva_espacios:'professional',
  tareas:'professional', fichaje_whatsapp:'professional',
  adelanto_nomina:'enterprise', api:'enterprise', ia:'enterprise',
  sso:'enterprise', retribucion_flex:'enterprise', multiempresa:'enterprise', comunidad:'enterprise',
}

export default function FeatureGate({ featureId, children }: { featureId: string; children: React.ReactNode }) {
  // Empezamos en 'loading' y NUNCA mostramos children hasta confirmar acceso
  const [status, setStatus] = useState<'loading'|'ok'|'blocked'>('loading')
  const [empresaPlan, setEmpresaPlan] = useState<string>('starter')
  const [requiredPlan, setRequiredPlan] = useState<string>('professional')
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    const check = async () => {
      try {
        const { data:{ user } } = await supabase.auth.getUser()
        if (!mounted.current) return

        // Sin sesión → redirigir a login (no mostrar contenido)
        if (!user) { window.location.href = '/'; return }

        // Buscar el empleado y su empresa
        const { data: emp, error: empErr } = await supabase
          .from('empleados')
          .select('empresa_id, rol')
          .eq('user_id', user.id)
          .single()

        if (!mounted.current) return

        // Si no tiene empresa_id → es superadmin u otro, dejar pasar
        if (empErr || !emp?.empresa_id) {
          setStatus('ok')
          return
        }

        // Cargar plan de la empresa
        const { data: empresa } = await supabase
          .from('empresas')
          .select('plan, suspendida')
          .eq('id', emp.empresa_id)
          .single()

        if (!mounted.current) return

        const plan = empresa?.plan || 'starter'
        setEmpresaPlan(plan)

        // ¿Tiene la feature en su plan?
        const { data: pf } = await supabase
          .from('plan_features')
          .select('feature_id')
          .eq('plan_id', plan)
          .eq('feature_id', featureId)
          .maybeSingle()

        if (!mounted.current) return

        const inPlan = pf != null

        // ¿Hay override activo para esta empresa?
        const { data: ov } = await supabase
          .from('empresas_features_override')
          .select('activa')
          .eq('empresa_id', emp.empresa_id)
          .eq('feature_id', featureId)
          .maybeSingle()

        if (!mounted.current) return

        // Override gana siempre
        let hasAccess: boolean
        if (ov != null) {
          hasAccess = ov.activa === true
        } else {
          hasAccess = inPlan
        }

        if (hasAccess) {
          setStatus('ok')
        } else {
          setRequiredPlan(FEATURE_MIN_PLAN[featureId] || 'professional')
          setStatus('blocked')
        }
      } catch (err) {
        console.error('[FeatureGate] error:', err)
        // En caso de error de red, mantener loading para no exponer contenido
        if (mounted.current) setStatus('ok') // fallback permisivo solo si hay error técnico
      }
    }
    check()
    return () => { mounted.current = false }
  }, [featureId])

  // CRÍTICO: nunca renderizar children hasta que status !== 'loading'
  if (status === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin"/>
          <p className="text-xs text-slate-400">Verificando acceso...</p>
        </div>
      </div>
    )
  }

  if (status === 'blocked') {
    const reqColor  = PLAN_COLORS[requiredPlan] || '#6366f1'
    const curColor  = PLAN_COLORS[empresaPlan]  || '#6366f1'
    const bullets   = PLAN_BULLETS[requiredPlan] || []
    const mailSubj  = encodeURIComponent(`Quiero mejorar al plan ${PLAN_NAMES[requiredPlan] || requiredPlan}`)
    const mailBody  = encodeURIComponent(`Hola,\n\nMe gustaría mejorar mi plan de Nexo HR a ${PLAN_NAMES[requiredPlan] || requiredPlan} para acceder a más funcionalidades.\n\n¿Podéis contactarme?`)

    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50/50 min-h-[400px]">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="px-6 py-8 text-center" style={{background:`linear-gradient(135deg,${reqColor}15,${reqColor}05)`}}>
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm"
                style={{background:reqColor+'20', border:`2px solid ${reqColor}30`}}>
                <Lock className="w-10 h-10" style={{color:reqColor}}/>
              </div>
              <h2 className="text-xl font-black text-slate-800 mb-2">Función no disponible</h2>
              <p className="text-sm text-slate-500 mb-1">
                Tu plan actual es{' '}
                <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-white text-xs" style={{background:curColor}}>
                  {PLAN_NAMES[empresaPlan] || empresaPlan}
                </span>
              </p>
              <p className="text-sm text-slate-500">
                Esta sección requiere{" "}
                <span className="font-black" style={{color:reqColor}}>
                  {PLAN_NAMES[requiredPlan] || requiredPlan}
                </span>
                {" "}o superior
              </p>
            </div>
            {bullets.length > 0 && (
              <div className="px-6 py-4 border-t border-slate-50">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Con {PLAN_NAMES[requiredPlan]} tendrás acceso a
                </p>
                <ul className="space-y-2">
                  {bullets.map((b,i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white" style={{background:reqColor}}>✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="px-6 py-5 space-y-2 border-t border-slate-50">
              <a href={`mailto:hola@tryvor.es?subject=${mailSubj}&body=${mailBody}`}
                className="flex items-center justify-center gap-2 w-full text-white font-bold py-3 px-6 rounded-2xl text-sm hover:opacity-90 transition-opacity shadow-sm"
                style={{background:reqColor}}>
                <ArrowUpCircle className="w-4 h-4"/>
                Mejorar al plan {PLAN_NAMES[requiredPlan]}
              </a>
              <a href="mailto:hola@tryvor.es"
                className="flex items-center justify-center gap-2 w-full text-slate-500 font-medium py-2.5 px-6 rounded-2xl text-sm hover:bg-slate-50 transition-colors border border-slate-200">
                <Mail className="w-4 h-4"/>
                Contactar con soporte
              </a>
            </div>
          </div>
          <p className="text-center text-xs text-slate-400 mt-4">
            <button onClick={()=>window.history.back()} className="hover:text-slate-600 transition-colors">
              ← Volver atrás
            </button>
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
