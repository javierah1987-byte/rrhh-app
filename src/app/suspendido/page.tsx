// @ts-nocheck
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { AlertOctagon, Mail, LogOut } from 'lucide-react'

export default function SuspendidoPage() {
  const [email, setEmail] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setEmail(user.email || '')
    })
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-900/50">
          <AlertOctagon className="w-10 h-10 text-white"/>
        </div>
        <h1 className="text-3xl font-black text-white mb-2">Servicio suspendido</h1>
        <p className="text-red-300 mb-8 text-lg">Tu cuenta está temporalmente suspendida</p>

        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-6 text-left">
          <p className="text-white text-sm leading-relaxed mb-4">
            El acceso a Nexo HR ha sido suspendido por un impago pendiente en tu cuenta.
          </p>
          <p className="text-white/70 text-sm leading-relaxed">
            Para restablecer el servicio, regulariza el pago y contacta con nosotros:
          </p>
          <div className="mt-4 flex items-center gap-2 bg-white/10 rounded-xl px-4 py-3">
            <Mail className="w-4 h-4 text-red-300 flex-shrink-0"/>
            <a href="mailto:hola@tryvor.es" className="text-red-200 text-sm font-medium hover:text-white transition-colors">
              hola@tryvor.es
            </a>
          </div>
        </div>

        <button onClick={logout}
          className="flex items-center gap-2 mx-auto text-white/50 hover:text-white/80 text-sm transition-colors">
          <LogOut className="w-4 h-4"/>
          Cerrar sesión
        </button>

        <p className="text-white/20 text-xs mt-8">Nexo HR by Tryvor · Soporte: hola@tryvor.es</p>
      </div>
    </div>
  )
}