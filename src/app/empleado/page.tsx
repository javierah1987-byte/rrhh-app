'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Empleado, Fichaje, Solicitud, Aviso } from '@/lib/supabase'
import { estadoFichaje, calcularMinutosTrabajados, minutosAHHMM, formatHora, BADGE_ESTADO_SOLICITUD, TIPOS_SOLICITUD } from '@/lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { LogIn, Coffee, LogOut, Bell } from 'lucide-react'

export default function EmpleadoPage() {
  const [empleado, setEmpleado] = useState<Empleado | null>(null)
  const [fichajesHoy, setFichajesHoy] = useState<Fichaje[]>([])
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const [hora, setHora] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [fichando, setFichando] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const cargar = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: emp } = await supabase.from('empleados').select('*').eq('user_id', user.id).single()
    if (!emp) return
    setEmpleado(emp)
    const hoy = new Date().toISOString().slice(0, 10)
    const { data: fichs } = await supabase.from('fichajes').select('*').eq('empleado_id', emp.id).eq('fecha', hoy).order('timestamp')
    const { data: sols } = await supabase.from('solicitudes').select('*').eq('empleado_id', emp.id).order('created_at', { ascending: false }).limit(3)
    const { data: avs } = await supabase.from('avisos').select('*').eq('activo', true).order('fecha', { ascending: false }).limit(3)
    setFichajesHoy(fichs || [])
    setSolicitudes(sols || [])
    setAvisos(avs || [])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])
  useEffect(() => { const t = setInterval(() => setHora(new Date()), 1000); return () => clearInterval(t) }, [])

  const estado = estadoFichaje(fichajesHoy)
  const minutosTrabajados = calcularMinutosTrabajados(fichajesHoy)
  const jornadaMin = (empleado?.jornada_horas || 8) * 60

  async function fichar(tipo: 'entrada' | 'pausa_inicio' | 'pausa_fin' | 'salida') {
    if (!empleado) return
    setFichando(true)
    const labels: Record<string, string> = { entrada: 'Entrada registrada', pausa_inicio: 'Pausa iniciada', pausa_fin: 'Pausa finalizada', salida: 'Salida registrada' }
    await supabase.from('fichajes').insert({ empleado_id: empleado.id, tipo })
    showToast(labels[tipo])
    await cargar()
    setFichando(false)
  }

  const saludoHora = hora.getHours() < 12 ? 'Buenos días' : hora.getHours() < 20 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="p-4 space-y-4">
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full text-sm z-50 shadow-lg whitespace-nowrap">{toast}</div>}
      <div className="pt-4">
        <p className="text-gray-500 text-sm">{saludoHora},</p>
        <h1 className="text-2xl font-bold text-gray-900">{loading ? '…' : empleado?.nombre.split(' ')[0]}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{format(hora, "EEEE, d 'de' MMMM", { locale: es })}</p>
      </div>
      <div className="text-center py-2">
        <span className="text-5xl font-mono font-bold text-indigo-600 tabular-nums">{hora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
      </div>
      <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-700">Control de presencia</span>
          <span className={`badge ${estado === 'trabajando' ? 'bg-emerald-100 text-emerald-700' : estado === 'pausa' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>{estado === 'trabajando' ? 'Trabajando' : estado === 'pausa' ? 'En pausa' : estado === 'finalizado' ? 'Finalizado' : 'Sin fichar'}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button onClick={() => fichar('entrada')} disabled={fichando || estado === 'trabajando' || estado === 'finalizado'} className={`flex flex-col items-center gap-1 py-4 rounded-xl border-2 transition-all ${estado === 'sin_fichar' || estado === 'pausa' ? 'border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:scale-95' : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'}`}><LogIn className="w-5 h-5" /><span className="text-xs font-medium">{estado === 'pausa' ? 'Reanudar' : 'Entrada'}</span></button>
          <button onClick={() => fichar('pausa_inicio')} disabled={fichando || estado !== 'trabajando'} className={`flex flex-col items-center gap-1 py-4 rounded-xl border-2 transition-all ${estado === 'trabajando' ? 'border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100 active:scale-95' : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'}`}><Coffee className="w-5 h-5" /><span className="text-xs font-medium">Pausa</span></button>
          <button onClick={() => fichar('salida')} disabled={fichando || (estado !== 'trabajando' && estado !== 'pausa')} className={`flex flex-col items-center gap-1 py-4 rounded-xl border-2 transition-all ${estado === 'trabajando' || estado === 'pausa' ? 'border-red-400 bg-red-50 text-red-700 hover:bg-red-100 active:scale-95' : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'}`}><LogOut className="w-5 h-5" /><span className="text-xs font-medium">Salida</span></button>
        </div>
        <div className="flex justify-between text-sm bg-white rounded-xl p-3 border border-gray-100">
          <div className="text-center"><p className="text-xs text-gray-400">Trabajado</p><p className="font-mono font-bold text-gray-900">{minutosAHHMM(minutosTrabajados)}</p></div>
          <div className="text-center"><p className="text-xs text-gray-400">Restante</p><p className={`font-mono font-bold ${Math.max(0, jornadaMin - minutosTrabajados) > 0 ? 'text-gray-600' : 'text-emerald-600'}`}>{Math.max(0, jornadaMin - minutosTrabajados) > 0 ? minutosAHHMM(jornadaMin - minutosTrabajados) : '¡Completado!'}</p></div>
          <div className="text-center"><p className="text-xs text-gray-400">Jornada</p><p className="font-mono font-bold text-gray-600">{minutosAHHMM(jornadaMin)}</p></div>
        </div>
      </div>
      {avisos.length > 0 && <div className="card p-4"><div className="flex items-center gap-2 mb-3"><Bell className="w-4 h-4 text-indigo-500" /><h3 className="text-sm font-semibold text-gray-700">Avisos de empresa</h3></div><div className="space-y-2">{avisos.map(a => (<div key={a.id} className="bg-indigo-50 rounded-lg p-3"><p className="text-sm font-medium text-indigo-900">{a.titulo}</p>{a.contenido && <p className="text-xs text-indigo-600 mt-0.5">{a.contenido}</p>}</div>))}</div></div>}
    </div>
  )
}