// @ts-nocheck
'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { Lock, ArrowUpCircle, ArrowLeft, Mail } from 'lucide-react'
import { Suspense } from 'react'

const PLAN_NAMES   = { fichaje:'Solo Fichaje', starter:'Starter', professional:'Professional', enterprise:'Enterprise' }
const PLAN_COLORS  = { fichaje:'#0891b2', starter:'#6366f1', professional:'#10b981', enterprise:'#f59e0b' }
const FEATURE_MIN_PLAN = {
  evaluaciones:'professional', organigrama:'professional', onboarding:'professional',
  people_analytics:'professional', formacion:'professional', reserva_espacios:'professional',
  tareas:'professional', fichaje_whatsapp:'professional',
  adelanto_nomina:'enterprise', api:'enterprise', ia:'enterprise',
  sso:'enterprise', retribucion_flex:'enterprise', multiempresa:'enterprise',
  // starter features
  nominas:'starter', gastos:'starter', documentos:'starter', vacaciones:'starter',
  bajas:'starter', firmas:'starter', informes:'starter', avisos:'starter',
  okr:'starter', mensajes:'starter', recordatorios:'starter', rgpd:'starter',
  denuncias:'starter', clima_laboral:'starter', reclutamiento:'starter',
  turnos:'starter', bolsa_horas:'starter',
}
const PLAN_BULLETS = {
  starter:       ['Control de ausencias y vacaciones','Nóminas y documentos','Gastos y firmas','Informes y OKR','Comunicación interna','Todo lo del plan Fichaje'],
  professional:  ['Evaluaciones de desempeño','Organigrama visual','Onboarding automatizado','People Analytics','Reserva de espacios','Todo lo del plan Starter'],
  enterprise:    ['Adelanto de nómina','API de integración','IA generativa','SSO empresarial','Retribución flexible','Todo lo de Professional'],
}

function BloqueadoContent() {
  const params = useSearchParams()
  const router = useRouter()
  const feature   = params.get('feature') || ''
  const planActual = params.get('plan') || 'fichaje'
  const planReq    = FEATURE_MIN_PLAN[feature] || 'starter'
  const reqColor   = PLAN_COLORS[planReq]  || '#6366f1'
  const curColor   = PLAN_COLORS[planActual] || '#64748b'
  const bullets    = PLAN_BULLETS[planReq] || []
  const mailSubj   = encodeURIComponent(`Quiero mejorar al plan ${PLAN_NAMES[planReq] || planReq}`)
  const mailBody   = encodeURIComponent(`Hola,\n\nMe gustaría mejorar mi plan de Nexo HR a ${PLAN_NAMES[planReq] || planReq}.\n\n¿Podéis contactarme?`)

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="px-6 py-8 text-center" style={{background:`linear-gradient(135deg,${reqColor}15,${reqColor}05)`}}>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm"
              style={{background:reqColor+'20',border:`2px solid ${reqColor}30`}}>
              <Lock className="w-10 h-10" style={{color:reqColor}}/>
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-2">Función no disponible</h2>
            <p className="text-sm text-slate-500 mb-1">
              Tu plan actual es{' '}
              <span className="font-bold px-2 py-0.5 rounded-full text-white text-xs" style={{background:curColor}}>
                {PLAN_NAMES[planActual] || planActual}
              </span>
            </p>
            <p className="text-sm text-slate-500">
              Esta sección requiere <span className="font-black" style={{color:reqColor}}>{PLAN_NAMES[planReq] || planReq}</span> o superior
            </p>
          </div>

          {bullets.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-50">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Con {PLAN_NAMES[planReq]} tendrás acceso a</p>
              <ul className="space-y-2">
                {bullets.map((b,i)=>(
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
              <ArrowUpCircle className="w-4 h-4"/> Mejorar al plan {PLAN_NAMES[planReq]}
            </a>
            <a href="mailto:hola@tryvor.es"
              className="flex items-center justify-center gap-2 w-full text-slate-500 font-medium py-2.5 px-6 rounded-2xl text-sm hover:bg-slate-50 border border-slate-200">
              <Mail className="w-4 h-4"/> Contactar con soporte
            </a>
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 mt-4">
          <button onClick={()=>router.back()} className="hover:text-slate-600 flex items-center gap-1 mx-auto">
            <ArrowLeft className="w-3 h-3"/> Volver atrás
          </button>
        </p>
      </div>
    </div>
  )
}

export default function BloqueadoFeaturePage() {
  return <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"/></div>}><BloqueadoContent/></Suspense>
}
