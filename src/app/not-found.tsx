import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-8">
      <div className="text-center max-w-md animate-fade-in">
        <div className="flex justify-center mb-6">
          <svg width="160" height="140" viewBox="0 0 160 140" fill="none">
            <circle cx="80" cy="75" r="55" fill="#EEF2FF"/>
            <rect x="52" y="30" width="56" height="72" rx="6" fill="white" stroke="#E2E8F0" strokeWidth="2"/>
            <path d="M84 30 L84 52 L108 52" fill="#EEF2FF"/>
            <rect x="62" y="60" width="28" height="4" rx="2" fill="#E2E8F0"/>
            <rect x="62" y="70" width="20" height="4" rx="2" fill="#E2E8F0"/>
            <rect x="62" y="80" width="24" height="4" rx="2" fill="#E2E8F0"/>
            <text x="80" y="115" textAnchor="middle" fontSize="26" fontWeight="800" fill="#6366F1" fontFamily="system-ui">404</text>
            <circle cx="36" cy="42" r="5" fill="#FCA5A5"/>
            <circle cx="124" cy="36" r="4" fill="#FCD34D"/>
            <circle cx="130" cy="95" r="6" fill="#6EE7B7"/>
          </svg>
        </div>
        <div className="flex items-center justify-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:'linear-gradient(135deg,#4F46E5,#10B981)'}}>
            <svg width="18" height="18" viewBox="0 0 80 80" fill="none">
              <circle cx="28" cy="28" r="10" fill="white"/>
              <circle cx="52" cy="28" r="10" fill="white" fillOpacity="0.7"/>
              <path d="M18 52 C18 44 22 40 28 40 C34 40 38 44 38 52" stroke="white" strokeWidth="5" strokeLinecap="round" fill="none"/>
              <path d="M42 52 C42 44 46 40 52 40 C58 40 62 44 62 52" stroke="white" strokeWidth="5" strokeLinecap="round" fill="none" strokeOpacity="0.7"/>
            </svg>
          </div>
          <span className="font-bold text-slate-900 dark:text-slate-100">Nexo HR</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">PÃ¡gina no encontrada</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">La pÃ¡gina que buscas no existe o ha sido movida.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/admin" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors">
            Ir al Dashboard
          </Link>
          <Link href="/" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl border border-slate-200 dark:border-slate-700 transition-colors">
            Iniciar sesiÃ³n
          </Link>
        </div>
      </div>
    </div>
  )
}