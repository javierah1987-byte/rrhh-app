'use client'
import { useRouter } from 'next/navigation'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const router = useRouter()
  return (
    <div className="min-h-screen flex items-center justify-center p-8"
      style={{background:'linear-gradient(135deg,#EEF2FF 0%,#F0FDF4 60%,#F8FAFC 100%)'}}>
      <div className="text-center max-w-md animate-fade-in">
        {/* Ilustración SVG */}
        <div className="flex justify-center mb-8">
          <svg width="200" height="160" viewBox="0 0 200 160" fill="none">
            {/* Fondo */}
            <rect x="30" y="20" width="140" height="100" rx="16" fill="#EEF2FF"/>
            {/* Pantalla */}
            <rect x="50" y="35" width="100" height="70" rx="8" fill="white" stroke="#E0E7FF" strokeWidth="1.5"/>
            {/* 404 */}
            <text x="100" y="78" textAnchor="middle" fontSize="28" fontWeight="800" fill="#6366F1" fontFamily="system-ui">404</text>
            {/* Cara triste */}
            <circle cx="85" cy="92" r="2.5" fill="#A5B4FC"/>
            <circle cx="115" cy="92" r="2.5" fill="#A5B4FC"/>
            <path d="M88 100 Q100 96 112 100" stroke="#A5B4FC" strokeWidth="2" strokeLinecap="round" fill="none"/>
            {/* Soporte monitor */}
            <rect x="90" y="120" width="20" height="8" rx="2" fill="#C7D2FE"/>
            <rect x="75" y="128" width="50" height="6" rx="3" fill="#C7D2FE"/>
            {/* Detalles decorativos */}
            <circle cx="40" cy="30" r="6" fill="#A5B4FC" opacity="0.4"/>
            <circle cx="165" cy="115" r="8" fill="#6EE7B7" opacity="0.4"/>
            <circle cx="170" cy="35" r="4" fill="#FCD34D" opacity="0.5"/>
          </svg>
        </div>

        <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">Página no encontrada</h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          La página que buscas no existe o ha sido movida.<br/>
          Vuelve al panel y continúa trabajando.
        </p>

        <div className="flex gap-3 justify-center">
          <button onClick={() => router.back()}
            className="btn-secondary gap-2 px-5 py-2.5">
            <ArrowLeft className="w-4 h-4"/>Volver atrás
          </button>
          <button onClick={() => router.push('/admin')}
            className="btn-primary gap-2 px-5 py-2.5">
            <Home className="w-4 h-4"/>Ir al dashboard
          </button>
        </div>

        <p className="text-xs text-slate-300 mt-8">Nexo HR · Error 404</p>
      </div>
    </div>
  )
}
