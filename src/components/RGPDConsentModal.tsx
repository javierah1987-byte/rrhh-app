'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Shield, CheckCircle, Loader2, ExternalLink } from 'lucide-react'

interface Props { empleadoId: string; onAceptado: () => void }

export function RGPDConsentModal({ empleadoId, onAceptado }: Props) {
  const [acepta, setAcepta] = useState(false)
  const [aceptaCom, setAceptaCom] = useState(false)
  const [loading, setLoading] = useState(false)
  const [leido, setLeido] = useState(false)

  async function aceptar() {
    if (!acepta || loading) return
    setLoading(true)
    await supabase.from('consentimientos_rgpd').upsert({
      empleado_id: empleadoId, version_politica: '1.0',
      acepta_politica: true, acepta_comunicaciones: aceptaCom,
      fecha_aceptacion: new Date().toISOString(),
    }, { onConflict: 'empleado_id,version_politica' })
    await supabase.from('audit_log').insert({
      actor_id: empleadoId, accion: 'consentimiento_rgpd',
      recurso: 'consentimientos_rgpd', detalle: { version: '1.0', acepta_comunicaciones: aceptaCom }, resultado: 'ok',
    })
    setLoading(false)
    onAceptado()
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="bg-indigo-600 rounded-t-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-7 h-7"/>
            <h2 className="text-xl font-bold">Protección de datos</h2>
          </div>
          <p className="text-indigo-200 text-sm">Antes de continuar necesitamos tu consentimiento según el RGPD.</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-4 space-y-2">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3">Qué datos tratamos y para qué</p>
            {[
              {e:'⏱️',t:'Registro de jornada laboral (RD-ley 8/2019)',b:'Obligación legal'},
              {e:'💳',t:'Datos de nómina y retribución',b:'Ejecución de contrato'},
              {e:'📅',t:'Gestión de vacaciones y ausencias',b:'Ejecución de contrato'},
              {e:'📄',t:'Acceso a tus documentos laborales',b:'Interés legítimo'},
            ].map((t,i)=>(
              <div key={i} className="flex items-start gap-2 text-sm">
                <span>{t.e}</span>
                <div><span className="text-slate-700 dark:text-slate-300">{t.t}</span><span className="text-xs text-slate-400 ml-2">({t.b})</span></div>
              </div>
            ))}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
            <p className="font-semibold text-blue-700 dark:text-blue-300 mb-1">Tus derechos RGPD</p>
            <p>Tienes derecho a <strong>acceder, rectificar, suprimir y portar</strong> tus datos en cualquier momento desde Perfil → Privacidad.</p>
          </div>
          <div className="h-28 overflow-y-auto text-xs text-slate-400 border border-slate-200 dark:border-slate-600 rounded-xl p-3 leading-relaxed"
            onScroll={e=>{const el=e.currentTarget;if(el.scrollTop+el.clientHeight>=el.scrollHeight-5)setLeido(true)}}>
            <p className="font-semibold text-slate-600 dark:text-slate-400 mb-1">Responsable del tratamiento</p>
            <p>Nexo HR actúa como encargado del tratamiento en nombre de tu empresa. Los datos se almacenan en servidores dentro de la Unión Europea cumpliendo el RGPD (UE) 2016/679 y la LOPDGDD 3/2018.</p>
            <p className="mt-2 font-semibold text-slate-600 dark:text-slate-400">Plazo de conservación</p>
            <p>Los fichajes se conservan 4 años mínimo (RD-ley 8/2019). Los datos de nómina 10 años. El resto durante la vigencia de la relación laboral.</p>
            <p className="mt-2 font-semibold text-slate-600 dark:text-slate-400">Seguridad</p>
            <p>Aplicamos cifrado AES-256 en datos sensibles (DNI, número SS, cuenta bancaria), TLS en tránsito y audit log de todos los accesos a datos personales.</p>
            <p className="mt-2 text-indigo-500">← Deslízate hasta aquí para continuar</p>
          </div>
          {!leido && <p className="text-xs text-center text-amber-500">↑ Lee el aviso completo antes de continuar</p>}
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={acepta} onChange={e=>setAcepta(e.target.checked)} className="mt-0.5 w-4 h-4 rounded accent-indigo-600"/>
            <span className="text-sm text-slate-700 dark:text-slate-300">
              <strong>Acepto</strong> la{' '}
              <a href="/privacidad" target="_blank" className="text-indigo-600 underline inline-flex items-center gap-0.5">
                Política de privacidad <ExternalLink className="w-3 h-3"/>
              </a>{' '}y el tratamiento de mis datos personales. <span className="text-red-500">*</span>
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={aceptaCom} onChange={e=>setAceptaCom(e.target.checked)} className="mt-0.5 w-4 h-4 rounded accent-indigo-600"/>
            <span className="text-sm text-slate-500">Acepto comunicaciones internas de la empresa. <span className="text-slate-400">(Opcional)</span></span>
          </label>
        </div>
        <div className="px-6 pb-6">
          <button onClick={aceptar} disabled={!acepta||!leido||loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {loading?<Loader2 className="w-4 h-4 animate-spin"/>:<CheckCircle className="w-4 h-4"/>}
            {loading?'Registrando consentimiento…':'Aceptar y continuar'}
          </button>
          <p className="text-xs text-center text-slate-400 mt-2">Puedes retirar tu consentimiento en Perfil → Privacidad</p>
        </div>
      </div>
    </div>
  )
}

export function useConsentimientoRGPD(empleadoId: string | null) {
  const [necesita, setNecesita] = useState(false)
  const [cargando, setCargando] = useState(true)
  useEffect(() => {
    if (!empleadoId) { setCargando(false); return }
    supabase.from('consentimientos_rgpd').select('id')
      .eq('empleado_id', empleadoId).eq('version_politica', '1.0').eq('revocado', false)
      .maybeSingle().then(({ data }) => { setNecesita(!data); setCargando(false) })
  }, [empleadoId])
  return { necesita, cargando }
}