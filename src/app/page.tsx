'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react'

function validateEmail(v: string) {
  if (!v) return 'El email es obligatorio'
  if (!/^[^s@]+@[^s@]+.[^s@]+$/.test(v)) return 'Introduce un email válido'
  return ''
}
function validatePassword(v: string) {
  if (!v) return 'La contraseña es obligatoria'
  if (v.length < 6) return 'Mínimo 6 caracteres'
  return ''
}

const DEMO_USERS = [
  { label: 'Carlos Director', email: 'admin@acme.com',  password: 'admin123', role: 'Owner',    color: '#6366f1' },
  { label: 'María García',    email: 'maria@acme.com',  password: 'admin123', role: 'Admin',    color: '#8b5cf6' },
  { label: 'Ana García',      email: 'ana@acme.com',    password: '1234',     role: 'Manager',  color: '#10b981' },
  { label: 'Luis Martínez',   email: 'luis@acme.com',   password: '1234',     role: 'Empleado', color: '#f59e0b' },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetMode, setResetMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [touched, setTouched] = useState({ email: false, pass: false })
  const router = useRouter()

  const emailErr = touched.email ? validateEmail(email) : ''
  const passErr = touched.pass && !resetMode ? validatePassword(pass) : ''

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ email: true, pass: true })
    if (validateEmail(email) || validatePassword(pass)) return
    setLoading(true); setError('')
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (err) { setError('Email o contraseña incorrectos'); setLoading(false); return }
    const { data: emp } = await supabase.from('empleados').select('rol').eq('user_id', data.user.id).single()
    router.push((emp as any)?.rol === 'admin' ? '/admin' : '/empleado')
  }

  const quickLogin = async (u: typeof DEMO_USERS[0]) => {
    setEmail(u.email); setPass(u.password); setError('')
    setLoading(true)
    const { data, error: err } = await supabase.auth.signInWithPassword({ email: u.email, password: u.password })
    if (err) { setError('Error al iniciar sesión: ' + err.message); setLoading(false); return }
    const { data: emp } = await supabase.from('empleados').select('rol').eq('user_id', data.user.id).single()
    router.push((emp as any)?.rol === 'admin' ? '/admin' : '/empleado')
  }

  const reset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validateEmail(email)) return
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
    if (err) { setError('Error al enviar el email'); setLoading(false); return }
    setResetSent(true); setLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 flex-col items-center justify-center p-12 relative overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white"
              style={{ width: Math.random() * 100 + 20, height: Math.random() * 100 + 20, top: Math.random() * 100 + '%', left: Math.random() * 100 + '%', opacity: Math.random() * 0.4 + 0.1 }} />
          ))}
        </div>
        <div className="relative z-10 text-center text-white">
          <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <span className="text-3xl font-black text-white">N</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">Nexo HR</h1>
          <p className="text-indigo-200 text-lg max-w-xs leading-relaxed">La plataforma de RRHH pensada para equipos modernos</p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[['📋', 'Nóminas'], ['📅', 'Solicitudes'], ['⏱', 'Fichajes']].map(([icon, label]) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-xs text-indigo-200 font-medium">{label}</div>
              </div>
            ))}
          </div>

          {/* Accesos demo */}
          <div className="mt-10 text-left">
            <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-3 text-center">Accesos de demostración</p>
            <div className="space-y-2">
              {DEMO_USERS.map(u => (
                <div key={u.email} className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-white text-xs font-semibold">{u.label}</p>
                    <p className="text-indigo-200 text-[11px] font-mono">{u.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-indigo-300 text-[10px] font-semibold uppercase tracking-wide">{u.role}</span>
                    <p className="text-indigo-200 text-[11px] font-mono">pass: <span className="text-white">{u.password}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho */}
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
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Bienvenido</h1>
              <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Accede a tu portal de RRHH</p>

              {/* Acceso rápido demo */}
              <div className="mb-6">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Acceso rápido</p>
                <div className="grid grid-cols-3 gap-2">
                  {DEMO_USERS.map(u => (
                    <button key={u.email} onClick={() => quickLogin(u)} disabled={loading}
                      className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-center disabled:opacity-50 active:scale-95">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                        style={{ backgroundColor: u.color }}>
                        {u.label.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-tight">{u.label}</span>
                      <span className="text-[10px] text-slate-400 leading-tight">{u.role}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"/>
                <span className="text-xs text-slate-400">o accede con email</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"/>
              </div>

              <form onSubmit={login} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="login-email" className="label">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" aria-hidden="true"/>
                    <input id="login-email" type="email" value={email}
                      onChange={e => setEmail(e.target.value)}
                      onBlur={() => setTouched(t => ({ ...t, email: true }))}
                      required aria-required="true" aria-invalid={!!emailErr}
                      placeholder="tu@empresa.com"
                      className={`${emailErr ? 'input-error' : 'input'} pl-9`}/>
                    {touched.email && !emailErr && email && <CheckCircle className="absolute right-3 top-2.5 w-4 h-4 text-emerald-500" aria-hidden="true"/>}
                  </div>
                  {emailErr && <p className="field-error" role="alert"><AlertCircle className="w-3 h-3"/>{emailErr}</p>}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="login-pass" className="label mb-0">Contraseña</label>
                    <button type="button" onClick={() => setResetMode(true)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" aria-hidden="true"/>
                    <input id="login-pass" type={show ? 'text' : 'password'} value={pass}
                      onChange={e => setPass(e.target.value)}
                      onBlur={() => setTouched(t => ({ ...t, pass: true }))}
                      required placeholder="••••••••"
                      className={`${passErr ? 'input-error' : 'input'} pl-9 pr-10`}/>
                    <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? 'Ocultar' : 'Mostrar'} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                      {show ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                    </button>
                  </div>
                  {passErr && <p className="field-error" role="alert"><AlertCircle className="w-3 h-3"/>{passErr}</p>}
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2.5 rounded-xl" role="alert">
                    <AlertCircle className="w-4 h-4 flex-shrink-0"/>
                    {error}
                  </div>
                )}
                <button type="submit" disabled={loading} className="btn-primary w-full h-11" aria-busy={loading}>
                  {loading
                    ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/>
                    : <><span>Entrar</span><ArrowRight className="w-4 h-4"/></>}
                </button>
              </form>

              {/* Móvil: mostrar accesos demo */}
              <div className="lg:hidden mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl">
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-2">Accesos demo</p>
                {DEMO_USERS.map(u => (
                  <div key={u.email} className="flex justify-between text-xs py-1 border-b border-indigo-100 dark:border-indigo-800 last:border-0">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{u.label} ({u.role})</span>
                    <span className="font-mono text-slate-500">{u.email} / {u.password}</span>
                  </div>
                ))}
              </div>
            </>
          ) : resetSent ? (
            <div className="text-center animate-fade-in" role="status">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-emerald-600"/>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Email enviado</h2>
              <p className="text-slate-500 text-sm mb-6">Revisa tu bandeja de entrada para restablecer tu contraseña.</p>
              <button onClick={() => { setResetMode(false); setResetSent(false) }} className="btn-secondary w-full">Volver al inicio de sesión</button>
            </div>
          ) : (
            <>
              <button onClick={() => setResetMode(false)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">← Volver</button>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Recuperar contraseña</h2>
              <p className="text-slate-500 mb-8 text-sm">Te enviamos un link para restablecer tu contraseña.</p>
              <form onSubmit={reset} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="reset-email" className="label">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                    <input id="reset-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                      onBlur={() => setTouched(t => ({ ...t, email: true }))}
                      required placeholder="tu@empresa.com"
                      className={`${emailErr ? 'input-error' : 'input'} pl-9`}/>
                  </div>
                  {emailErr && <p className="field-error" role="alert"><AlertCircle className="w-3 h-3"/>{emailErr}</p>}
                </div>
                {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2.5 rounded-xl" role="alert">{error}</div>}
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