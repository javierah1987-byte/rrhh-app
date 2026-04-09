'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetMode, setResetMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const router = useRouter()

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (err) { setError('Email o contraseña incorrectos'); setLoading(false); return }
    const { data: emp } = await supabase.from('empleados').select('rol').eq('user_id', data.user.id).single()
    router.push((emp as any)?.rol === 'admin' ? '/admin' : '/empleado')
  }

  const reset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (err) { setError('Error al enviar el email'); setLoading(false); return }
    setResetSent(true); setLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo — ilustración */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {Array.from({length:20}).map((_,i)=>(
            <div key={i} className="absolute rounded-full bg-white"
              style={{width:Math.random()*120+20,height:Math.random()*120+20,top:Math.random()*100+'%',left:Math.random()*100+'%',opacity:Math.random()*0.5+0.1}}/>
          ))}
        </div>
        <div className="relative z-10 text-center text-white">
          <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <span className="text-3xl font-black text-white">N</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">Nexo HR</h1>
          <p className="text-indigo-200 text-lg max-w-xs leading-relaxed">La plataforma de recursos humanos pensada para equipos modernos</p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[['📋','Nóminas'],['📅','Solicitudes'],['⏱','Fichajes']].map(([icon,label])=>(
              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-xs text-indigo-200 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-900">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-black text-sm">N</span>
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-lg">Nexo HR</span>
          </div>

          {!resetMode ? (
            <>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Bienvenido</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">Accede a tu portal de RRHH</p>
              <form onSubmit={login} className="space-y-4">
                <div>
                  <label className="label">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                    <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
                      placeholder="tu@empresa.com" className="input pl-9"/>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="label mb-0">Contraseña</label>
                    <button type="button" onClick={()=>setResetMode(true)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                    <input type={show?'text':'password'} value={pass} onChange={e=>setPass(e.target.value)} required
                      placeholder="••••••••" className="input pl-9 pr-10"/>
                    <button type="button" onClick={()=>setShow(s=>!s)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                      {show ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2.5 rounded-xl">
                    <AlertCircle className="w-4 h-4 flex-shrink-0"/>
                    {error}
                  </div>
                )}
                <button type="submit" disabled={loading} className="btn-primary w-full mt-2 h-11">
                  {loading
                    ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/>
                    : <><span>Entrar</span><ArrowRight className="w-4 h-4"/></>}
                </button>
              </form>
            </>
          ) : resetSent ? (
            <div className="text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-emerald-600"/>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Email enviado</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.</p>
              <button onClick={()=>{setResetMode(false);setResetSent(false)}} className="btn-secondary w-full">Volver al inicio de sesión</button>
            </div>
          ) : (
            <>
              <button onClick={()=>setResetMode(false)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
                ← Volver
              </button>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Recuperar contraseña</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">Te enviamos un link para restablecer tu contraseña.</p>
              <form onSubmit={reset} className="space-y-4">
                <div>
                  <label className="label">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                    <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="tu@empresa.com" className="input pl-9"/>
                  </div>
                </div>
                {error && <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2.5 rounded-xl"><AlertCircle className="w-4 h-4"/>{error}</div>}
                <button type="submit" disabled={loading} className="btn-primary w-full h-11">
                  {loading ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/> : 'Enviar link de recuperación'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}