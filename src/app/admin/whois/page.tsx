'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { MapPin, Clock, Users, RefreshCw, Building2, Wifi, WifiOff } from 'lucide-react'

type Presencia = {
  id: string; nombre: string; avatar_color: string; departamento: string|null
  centro: string|null; centro_color: string|null; desde: string
  latitud: number|null; longitud: number|null; direccion: string|null
  horas_desde_entrada: number
}

function HorasBadge({ h }: { h: number }) {
  const color = h < 6 ? 'text-emerald-600 bg-emerald-50' : h < 9 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50'
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{Math.floor(h)}h {Math.round((h%1)*60)}m</span>
}

export default function WhoisPage() {
  const [presentes, setPresentes] = useState<Presencia[]>([])
  const [ausentes,  setAusentes]  = useState<{id:string;nombre:string;avatar_color:string;departamento:string|null}[]>([])
  const [loading,   setLoading]   = useState(true)
  const [refreshing,setRefreshing]= useState(false)
  const [lastUpdate,setLastUpdate]= useState(new Date())
  const [tab, setTab]             = useState<'presentes'|'ausentes'>('presentes')

  const cargar = useCallback(async (silent=false) => {
    if (!silent) setLoading(true); else setRefreshing(true)
    
    // Empleados presentes (con datos de geolocalización si disponibles)
    const { data: pres } = await supabase.from('presencia_actual').select('*')
    const presIds = (pres || []).map((p:any) => p.id)
    
    // Todos los empleados activos para calcular ausentes
    const { data: todos } = await supabase.from('empleados')
      .select('id,nombre,avatar_color,departamento')
      .eq('estado','activo')
    
    const aus = (todos || []).filter((e:any) => !presIds.includes(e.id))
    
    setPresentes((pres || []) as Presencia[])
    setAusentes(aus)
    setLastUpdate(new Date())
    setLoading(false); setRefreshing(false)
  }, [])

  useEffect(() => {
    cargar()
    // Auto-refresh cada 2 minutos
    const t = setInterval(() => cargar(true), 120000)
    return () => clearInterval(t)
  }, [cargar])

  const total = presentes.length + ausentes.length
  const pct = total > 0 ? Math.round((presentes.length / total) * 100) : 0

  return (
    <div>
      <div className="page-header mb-5">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Wifi className="w-5 h-5 text-emerald-500"/>Who's In
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Presencia a tiempo real · Actualizado {lastUpdate.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}
          </p>
        </div>
        <button onClick={()=>cargar(true)} disabled={refreshing}
          className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw className={`w-4 h-4 ${refreshing?'animate-spin':''}`}/>Actualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card p-4 text-center bg-emerald-50 dark:bg-emerald-900/20">
          <p className="text-3xl font-black text-emerald-600">{presentes.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">En oficina</p>
        </div>
        <div className="card p-4 text-center bg-slate-50 dark:bg-slate-700/20">
          <p className="text-3xl font-black text-slate-500">{ausentes.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Ausentes</p>
        </div>
        <div className="card p-4 text-center bg-indigo-50 dark:bg-indigo-900/20">
          <div className="relative w-12 h-12 mx-auto mb-1">
            <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-200 dark:text-slate-600"/>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3"
                strokeDasharray={`${pct} ${100-pct}`} className="text-indigo-500"/>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-indigo-600">{pct}%</span>
          </div>
          <p className="text-xs text-slate-500">Asistencia</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {(['presentes','ausentes'] as const).map(t => (
          <button key={t} onClick={()=>setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${tab===t?'bg-indigo-600 text-white':'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
            {t==='presentes'?`✅ Presentes (${presentes.length})`:`🔴 Ausentes (${ausentes.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>
      ) : tab === 'presentes' ? (
        presentes.length === 0 ? (
          <div className="card p-12 text-center">
            <WifiOff className="w-10 h-10 text-slate-200 mx-auto mb-3"/>
            <p className="text-slate-500">Nadie ha fichado hoy todavía</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {presentes.map(p => (
                <div key={p.id} className="p-4 flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{backgroundColor:p.avatar_color||'#6366f1'}}>
                      {p.nombre.charAt(0)}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-800"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{p.nombre}</p>
                      <HorasBadge h={p.horas_desde_entrada}/>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1 flex-wrap">
                      <Clock className="w-3 h-3 flex-shrink-0"/>
                      {new Date(p.desde).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}
                      {p.centro && <><span className="opacity-40">·</span><Building2 className="w-3 h-3 flex-shrink-0"/>{p.centro}</>}
                      {p.departamento && <><span className="opacity-40">·</span>{p.departamento}</>}
                    </p>
                    {p.direccion && (
                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-0.5 truncate">
                        <MapPin className="w-3 h-3 flex-shrink-0 text-indigo-400"/>{p.direccion}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        ausentes.length === 0 ? (
          <div className="card p-12 text-center">
            <Users className="w-10 h-10 text-slate-200 mx-auto mb-3"/>
            <p className="text-slate-500">¡Todo el equipo está presente!</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {ausentes.map(a => (
                <div key={a.id} className="p-4 flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm opacity-50"
                      style={{backgroundColor:a.avatar_color||'#6366f1'}}>
                      {a.nombre.charAt(0)}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-slate-300 rounded-full border-2 border-white dark:border-slate-800"/>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-500 dark:text-slate-400">{a.nombre}</p>
                    {a.departamento && <p className="text-xs text-slate-400">{a.departamento}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  )
}