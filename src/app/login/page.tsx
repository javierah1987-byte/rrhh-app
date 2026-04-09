'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AlertCircle } from 'lucide-react'

const DEMO = [
  { email: 'admin@acme.com', pass: 'admin123', rol: 'Admin' },
  { email: 'ana@acme.com', pass: '1234', rol: 'Empleada' },
  { email: 'luis@acme.com', pass: '1234', rol: 'Empleado' },
]

function NexoLogo({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <circle cx="28" cy="28" r="10" fill="white"/>
      <circle cx="52" cy="28" r="10" fill="white" fillOpacity="0.7"/>
      <path d="M18 52 C18 44 22 40 28 40 C34 40 38 44 38 52" stroke="white" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M42 52 C42 44 46 40 52 40 C58 40 62 44 62 52" stroke="white" strokeWidth="5" strokeLinecap="round" fill="none" strokeOpacity="0.7"/>
      <line x1="40" y1="18" x2="40" y2="62" stroke="white" strokeWidth="2" strokeOpacity="0.35" strokeDasharray="4 4"/>
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError || !data.user) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
      return
    }
    const { data: emp } = await supabase.from('empleados').select('rol').eq('user_id', data.user.id).single()
    router.push(emp?.rol === 'admin' ? '/admin' : '/empleado')
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg,#EEF2FF 0%,#F0FDF4 60%,#F8FAFC 100%)' }}>
      {/* Panel izquierdo — marca */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg,#4F46E5 0%,#4338CA 55%,#059669 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="absolute rounded-full border border-white"
              style={{ width: i*140+'px', height: i*140+'px', top:'50%', left:'50%', transform:'translate(-50%,-50%)' }}/>
          ))}
        </div>
        <div className="relative z-10 text-white text-center">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center" style={{ background:'rgba(255,255,255,0.18)' }}>
              <NexoLogo size={56}/>
            </div>
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-2">Nexo HR</h1>
          <p className="text-lg opacity-75 mb-10">Gestión de Recursos Humanos</p>
          <div className="space-y-3 max-w-xs mx-auto text-left">
            {[
              { icon:'⏱', text:'Control de fichajes y horarios' },
              { icon:'📋', text:'Gestión de solicitudes y vacaciones' },
              { icon:'📊', text:'Informes y nóminas' },
              { icon:'🔔', text:'Avisos y comunicaciones' },
            ].map((f,i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background:'rgba(255,255,255,0.12)' }}>
                <span className="text-xl">{f.icon}</span>
                <span className="text-sm font-medium opacity-90">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo móvil */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background:'linear-gradient(135deg,#4F46E5,#10B981)' }}>
                <NexoLogo size={28}/>
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-slate-900">Nexo HR</p>
                <p className="text-xs text-slate-500">Gestión de Recursos Humanos</p>
              </div>
            </div>
          </div>

          <div className="card p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Bienvenido</h2>
            <p className="text-slate-500 text-sm mb-6">Accede a tu cuenta para continuar</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="label">Correo electrónico</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                  className="input" placeholder="tu@empresa.com" required/>
              </div>
              <div>
                <label className="label">Contraseña</label>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
                  className="input" required/>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0"/>{error}
                </div>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
                {loading ? 'Entrando…' : 'Entrar'}
              </button>
            </form>
          </div>

          <div className="mt-4 card p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Usuarios de prueba</p>
            <div className="space-y-1">
              {DEMO.map(u => (
                <button key={u.email} type="button"
                  onClick={() => { setEmail(u.email); setPassword(u.pass) }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-800">{u.email}</span>
                    <span className="text-xs text-slate-400 ml-2">/ {u.pass}</span>
                  </div>
                  <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{u.rol}</span>
                </button>
              ))}
            </div>
          </div>
          <p className="text-center text-xs text-slate-400 mt-5">Nexo HR © {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  )
}