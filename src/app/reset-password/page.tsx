'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const [pass, setPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pass !== confirm) { setError('Las contraseñas no coinciden'); return }
    if (pass.length < 6) { setError('Mínimo 6 caracteres'); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.updateUser({ password: pass })
    if (err) { setError(err.message); setLoading(false); return }
    setDone(true)
    setTimeout(() => router.push('/'), 3000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-8">
      <div className="w-full max-w-md card p-8 animate-fade-in">
        {!done ? (
          <>
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mb-5">
              <Lock className="w-6 h-6 text-indigo-600"/>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">Nueva contraseña</h1>
            <p className="text-sm text-slate-500 mb-6">Elige una contraseña segura para tu cuenta.</p>
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="label">Nueva contraseña</label>
                <div className="relative">
                  <input type={show?'text':'password'} value={pass} onChange={e=>setPass(e.target.value)} required className="input pr-10" placeholder="Mín. 6 caracteres"/>
                  <button type="button" onClick={()=>setShow(s=>!s)} className="absolute right-3 top-2.5 text-slate-400">{show?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button>
                </div>
              </div>
              <div>
                <label className="label">Confirmar contraseña</label>
                <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required className="input" placeholder="Repite la contraseña"/>
              </div>
              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full h-11">
                {loading ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/> : 'Cambiar contraseña'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center animate-scale-in">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4"/>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">¡Contraseña actualizada!</h2>
            <p className="text-sm text-slate-500">Redirigiendo al inicio de sesión...</p>
          </div>
        )}
      </div>
    </div>
  )
}