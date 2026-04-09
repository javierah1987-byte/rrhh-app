'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Clock, LogIn, LogOut, Coffee, Play } from 'lucide-react'

type Fichaje = { id: string; tipo: string; timestamp: string }

const TIPOS: Record<string, { label: string; icon: any; color: string }> = {
  entrada: { label: 'Entrada', icon: LogIn, color: 'bg-emerald-500' },
  pausa_inicio: { label: 'Inicio pausa', icon: Coffee, color: 'bg-amber-500' },
  pausa_fin: { label: 'Fin pausa', icon: Play, color: 'bg-indigo-500' },
  salida: { label: 'Salida', icon: LogOut, color: 'bg-red-500' },
}

export default function FichajePage() {
  const [fichajes, setFichajes] = useState<Fichaje[]>([])
  const [loading, setLoading] = useState(true)
  const [registrando, setRegistrando] = useState(false)
  const [empId, setEmpId] = useState<string|null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase.from('empleados').select('id').eq('user_id', data.user.id).single()
        .then(({ data: emp }) => {
          if (!emp) return
          setEmpId(emp.id)
          const hoy = new Date().toISOString().slice(0,10)
          supabase.from('fichajes').select('*').eq('empleado_id', emp.id).eq('fecha', hoy).order('timestamp')
            .then(({ data: f }) => { setFichajes(f || []); setLoading(false) })
        })
    })
  }, [])

  async function registrar(tipo: string) {
    if (!empId) return
    setRegistrando(true)
    const hoy = new Date().toISOString().slice(0,10)
    await supabase.from('fichajes').insert({ empleado_id: empId, tipo, timestamp: new Date().toISOString(), fecha: hoy })
    const { data } = await supabase.from('fichajes').select('*').eq('empleado_id', empId).eq('fecha', hoy).order('timestamp')
    setFichajes(data || [])
    setRegistrando(false)
  }

  const ultimo = fichajes[fichajes.length - 1]
  const proximos: Record<string, string> = {
    entrada: 'pausa_inicio',
    pausa_inicio: 'pausa_fin',
    pausa_fin: 'salida',
    salida: '',
  }
  const siguienteTipo = ultimo ? proximos[ultimo.tipo] : 'entrada'

  const horaActual = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  const fechaHoy = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Fichaje</h1>
          <p className="text-sm text-slate-500 mt-1 capitalize">{fechaHoy}</p>
        </div>
      </div>

      {/* Reloj */}
      <div className="card p-8 text-center mb-5">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Clock className="w-5 h-5 text-indigo-600" />
          <span className="text-sm font-medium text-indigo-600">Hora actual</span>
        </div>
        <p className="text-6xl font-bold text-slate-900 tabular-nums mb-6">{horaActual}</p>

        {siguienteTipo ? (
          <button onClick={() => registrar(siguienteTipo)} disabled={registrando}
            className={`inline-flex items-center gap-2 px-8 py-3 rounded-2xl text-white font-semibold text-lg transition-all shadow-lg disabled:opacity-50 ${TIPOS[siguienteTipo]?.color || 'bg-indigo-600'}`}>
            {registrando ? 'Registrando…' : TIPOS[siguienteTipo]?.label || 'Registrar'}
          </button>
        ) : (
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-100 text-slate-500 font-medium">
            <LogOut className="w-4 h-4" />Jornada completada
          </div>
        )}
      </div>

      {/* Historial hoy */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Fichajes de hoy</h3>
        {loading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>
        ) : fichajes.length === 0 ? (
          <p className="text-center text-slate-400 py-8 text-sm">No hay fichajes registrados hoy</p>
        ) : (
          <div className="space-y-2">
            {fichajes.map((f, i) => {
              const t = TIPOS[f.tipo]
              const Icon = t?.icon || Clock
              return (
                <div key={f.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t?.color || 'bg-slate-400'}`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{t?.label || f.tipo}</p>
                  </div>
                  <span className="text-sm font-mono text-slate-500">
                    {new Date(f.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}