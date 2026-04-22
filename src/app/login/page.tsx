// @ts-nocheck
'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, LogIn } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const router = useRouter()

  const doLogin = async (em, pw) => {
    setLoading(true); setError('')
    const { data, error: err } = await supabase.auth.signInWithPassword({ email: em, password: pw })
    if (err) { setError('Email o contraseña incorrectos'); setLoading(false); return }
    const user = data?.user
    if (!user) { setError('Error de autenticación'); setLoading(false); return }

    // Obtener rol + empresa + plan
    const { data: emp } = await supabase
      .from('empleados')
      .select('rol, empresa_id, empresas(plan)')
      .eq('user_id', user.id)
      .single()

    const rol  = emp?.rol || 'empleado'
    const plan = emp?.empresas?.plan || 'professional'
    const esAdmin = ['owner','admin','manager'].includes(rol)

    // Redirect según plan y rol
    if (esAdmin && plan === 'fichaje') {
      router.push('/fichaje')
    } else if (esAdmin) {
      router.push('/admin')
    } else {
      router.push('/empleado')
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    await doLogin(email, password)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-900/50">
            <span className="text-white text-2xl font-black">N</span>
          </div>
          <h1 className="text-3xl font-black text-white">Nexo HR</h1>
          <p className="text-indigo-300 mt-1">Tu plataforma de Recursos Humanos</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-white font-bold text-lg mb-6">Iniciar sesión</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-indigo-200 text-sm mb-1.5">Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
                placeholder="tu@empresa.com" autoComplete="email"
                className="w-full bg-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 border border-white/20 focus:border-indigo-400 outline-none text-sm"/>
            </div>
            <div>
              <label className="block text-indigo-200 text-sm mb-1.5">Contraseña</label>
              <div className="relative">
                <input type={show?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} required
                  placeholder="••••••••" autoComplete="current-password"
                  className="w-full bg-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 pr-11 border border-white/20 focus:border-indigo-400 outline-none text-sm"/>
                <button type="button" onClick={()=>setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                  {show?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                </button>
              </div>
            </div>
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-2.5 text-red-300 text-sm">{error}</div>
            )}
            <button type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-900/50">
              <LogIn className="w-4 h-4"/>
              {loading?'Entrando...':'Entrar'}
            </button>
          </form>

          {/* Demo acceso rápido */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <p className="text-indigo-300 text-xs text-center mb-3">Acceso rápido demo</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={()=>doLogin('admin@acme.com','admin123')}
                className="bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl px-3 py-2.5 text-left transition-colors">
                <p className="text-white text-xs font-semibold">👤 Admin</p>
                <p className="text-indigo-300 text-[10px]">Panel administrador</p>
              </button>
              <button onClick={()=>doLogin('luis@acme.com','1234')}
                className="bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl px-3 py-2.5 text-left transition-colors">
                <p className="text-white text-xs font-semibold">👷 Empleado</p>
                <p className="text-indigo-300 text-[10px]">Portal empleado</p>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          Nexo HR by Tryvor · v2026
        </p>
      </div>
    </div>
  )
}