'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Lock, Eye, EyeOff, CheckCircle, Loader2, AlertCircle } from 'lucide-react'

export function CambioPasswordSection() {
  const [actual, setActual]   = useState('')
  const [nueva, setNueva]     = useState('')
  const [confirma, setConfirma] = useState('')
  const [showA, setShowA]     = useState(false)
  const [showN, setShowN]     = useState(false)
  const [saving, setSaving]   = useState(false)
  const [resultado, setRes]   = useState<{ok:boolean;msg:string}|null>(null)

  const fortaleza = () => {
    if (nueva.length < 6) return {label:'Muy corta',color:'bg-red-400',pct:25}
    if (nueva.length < 8) return {label:'Débil',color:'bg-orange-400',pct:50}
    if (!/[A-Z]/.test(nueva) || !/[0-9]/.test(nueva)) return {label:'Media',color:'bg-amber-400',pct:75}
    return {label:'Fuerte',color:'bg-emerald-500',pct:100}
  }

  async function cambiar() {
    if (nueva !== confirma) { setRes({ok:false,msg:'Las contraseñas no coinciden'}); return }
    if (nueva.length < 6)   { setRes({ok:false,msg:'Mínimo 6 caracteres'}); return }
    setSaving(true); setRes(null)
    const { error } = await supabase.auth.updateUser({ password: nueva })
    if (error) {
      setRes({ok:false,msg:error.message})
    } else {
      setRes({ok:true,msg:'Contraseña actualizada correctamente'})
      setActual(''); setNueva(''); setConfirma('')
    }
    setSaving(false)
  }

  const f = fortaleza()

  return (
    <div className="card p-5">
      <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
        <Lock className="w-4 h-4 text-indigo-500"/>Cambiar contraseña
      </h3>

      {resultado && (
        <div className={`flex items-center gap-2 p-3 rounded-xl mb-4 text-sm ${resultado.ok?'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 border border-emerald-200':'bg-red-50 dark:bg-red-900/20 text-red-700 border border-red-200'}`}>
          {resultado.ok ? <CheckCircle className="w-4 h-4 flex-shrink-0"/> : <AlertCircle className="w-4 h-4 flex-shrink-0"/>}
          {resultado.msg}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="label">Nueva contraseña *</label>
          <div className="relative mt-1">
            <input type={showN?'text':'password'} value={nueva} onChange={e=>{setNueva(e.target.value);setRes(null)}}
              placeholder="Mínimo 8 caracteres" className="input w-full pr-9"/>
            <button type="button" onClick={()=>setShowN(p=>!p)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
              {showN?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
            </button>
          </div>
          {nueva && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-slate-400">Fortaleza</span>
                <span className={`text-[10px] font-semibold ${f.pct===100?'text-emerald-600':f.pct>=75?'text-amber-600':'text-red-500'}`}>{f.label}</span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${f.color}`} style={{width:f.pct+'%'}}/>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="label">Confirmar contraseña *</label>
          <div className="relative mt-1">
            <input type={showN?'text':'password'} value={confirma} onChange={e=>{setConfirma(e.target.value);setRes(null)}}
              placeholder="Repite la contraseña" className={`input w-full ${confirma&&nueva!==confirma?'border-red-300':''}`}/>
          </div>
          {confirma && nueva !== confirma && (
            <p className="text-[10px] text-red-500 mt-1">Las contraseñas no coinciden</p>
          )}
        </div>

        <button onClick={cambiar}
          disabled={saving || !nueva || !confirma || nueva !== confirma}
          className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-50">
          {saving?<><Loader2 className="w-4 h-4 animate-spin"/>Actualizando…</>:<><Lock className="w-4 h-4"/>Cambiar contraseña</>}
        </button>
      </div>
    </div>
  )
}