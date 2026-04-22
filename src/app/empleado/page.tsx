// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Clock, Calendar, FileText, DollarSign, ChevronRight, Timer } from 'lucide-react'

export default function EmpleadoHome() {
  const [empleado, setEmpleado]   = useState(null)
  const [fichajes, setFichajes]   = useState([])
  const [solicitudes, setSolicitudes] = useState([])
  const [nominas, setNominas]     = useState([])
  const [tiempo, setTiempo]       = useState(new Date())
  const [loading, setLoading]     = useState(true)
  const router = useRouter()

  useEffect(() => {
    const timer = setInterval(() => setTiempo(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // 1. Obtener empleado
      const { data: emp } = await supabase.from('empleados').select('*').eq('user_id', user.id).single()
      if (!emp) { setLoading(false); return }
      setEmpleado(emp)

      // 2. Cargar datos en paralelo usando el id del empleado
      const eid = emp.id
      const hoy = new Date().toISOString().split('T')[0]
      const [r_fich, r_sols, r_noms] = await Promise.all([
        supabase.from('fichajes').select('*').eq('empleado_id', eid).eq('fecha', hoy).order('timestamp', {ascending:false}),
        supabase.from('solicitudes').select('*').eq('empleado_id', eid).order('created_at', {ascending:false}).limit(5),
        supabase.from('nominas').select('*').eq('empleado_id', eid).order('anio', {ascending:false}).order('mes', {ascending:false}).limit(3),
      ])
      setFichajes(r_fich.data || [])
      setSolicitudes(r_sols.data || [])
      setNominas(r_noms.data || [])
      setLoading(false)
    }
    cargar()
  }, [])

  const fichadoHoy = fichajes.find(f => f.tipo === 'entrada')
  const salidaHoy  = fichajes.find(f => f.tipo === 'salida')
  const horasHoy   = fichadoHoy
    ? salidaHoy
      ? Math.floor((new Date(salidaHoy.timestamp) - new Date(fichadoHoy.timestamp)) / 3600000)
      : Math.floor((new Date() - new Date(fichadoHoy.timestamp)) / 3600000)
    : 0

  const hora  = tiempo.toLocaleTimeString('es-ES', {hour:'2-digit',minute:'2-digit',second:'2-digit'})
  const fecha = tiempo.toLocaleDateString('es-ES', {weekday:'long',day:'numeric',month:'long'})

  if (loading) return <div className="p-8 text-slate-400 text-sm animate-pulse">Cargando tu portal...</div>

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-4">
      {/* Bienvenida con reloj */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-indigo-200 text-sm capitalize">{fecha}</p>
            <h1 className="text-2xl font-bold mt-1">Hola, {empleado?.nombre?.split(' ')[0]} 👋</h1>
            <p className="text-indigo-200 text-sm mt-0.5">{empleado?.puesto} · {empleado?.departamento}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-mono font-black tabular-nums tracking-tight">{hora}</p>
            {fichadoHoy && (
              <p className="text-indigo-200 text-xs mt-1">
                Entrada: {new Date(fichadoHoy.timestamp).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${fichadoHoy && !salidaHoy ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`}/>
          <span className="text-sm text-indigo-100">
            {fichadoHoy && !salidaHoy
              ? `Trabajando · ${horasHoy}h acumuladas hoy`
              : salidaHoy
              ? `Jornada completada · ${horasHoy}h`
              : 'Sin fichar hoy'}
          </span>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'Fichar',      icon:Clock,     href:'/empleado/fichaje',    color:'#6366f1', bg:'#6366f115', desc: fichadoHoy ? (salidaHoy ? 'Completado ✓' : 'Marcar salida') : 'Marcar entrada' },
          { label:'Vacaciones',  icon:Calendar,  href:'/empleado/solicitudes',color:'#10b981', bg:'#10b98115', desc:'Solicitar días' },
          { label:'Nóminas',     icon:DollarSign,href:'/empleado/nominas',    color:'#f59e0b', bg:'#f59e0b15', desc: nominas.length > 0 ? nominas[0].periodo : 'Ver historial' },
          { label:'Documentos',  icon:FileText,  href:'/empleado/documentos', color:'#8b5cf6', bg:'#8b5cf615', desc:'Mi carpeta' },
        ].map((a,i) => (
          <button key={i} onClick={() => router.push(a.href)}
            className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all text-left">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{background:a.bg}}>
              <a.icon className="w-5 h-5" style={{color:a.color}}/>
            </div>
            <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{a.label}</p>
            <p className="text-slate-400 text-xs mt-0.5">{a.desc}</p>
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-slate-400 text-xs mb-1">Horas hoy</p>
          <p className="text-2xl font-black text-indigo-600">{horasHoy}h</p>
          <p className="text-slate-400 text-xs">{fichadoHoy ? 'en oficina' : 'sin registrar'}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-slate-400 text-xs mb-1">Solicitudes</p>
          <p className="text-2xl font-black text-emerald-600">{solicitudes.filter(s=>s.estado==='aprobada').length}</p>
          <p className="text-slate-400 text-xs">{solicitudes.filter(s=>s.estado==='pendiente').length} pendientes</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-slate-400 text-xs mb-1">Última nómina</p>
          <p className="text-lg font-black text-amber-600">{nominas[0] ? (nominas[0].mes+'/'+nominas[0].anio) : '—'}</p>
          <p className="text-slate-400 text-xs">{nominas[0] ? ((nominas[0].liquido || 0).toFixed(0) + '€ neto') : 'Sin registros'}</p>
        </div>
      </div>

      {/* Solicitudes recientes */}
      {solicitudes.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500"/> Mis solicitudes recientes
            </h3>
            <button onClick={()=>router.push('/empleado/solicitudes')} className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-0.5">
              Ver todas <ChevronRight className="w-3 h-3"/>
            </button>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {solicitudes.slice(0,3).map(s => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.estado==='aprobada'?'bg-emerald-400':s.estado==='pendiente'?'bg-amber-400':'bg-red-400'}`}/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 dark:text-slate-200 truncate capitalize">
                    {(s.tipo||'').replace(/_/g,' ')} — {new Date(s.fecha_inicio).toLocaleDateString('es-ES',{day:'numeric',month:'short'})}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${s.estado==='aprobada'?'bg-emerald-100 text-emerald-700':s.estado==='pendiente'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}`}>
                  {s.estado}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Informe de jornada */}
      <button onClick={()=>router.push('/empleado/jornada')}
        className="w-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-3 hover:shadow-md transition-all">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
          <Timer className="w-5 h-5 text-slate-500"/>
        </div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Informe de jornada</p>
          <p className="text-slate-400 text-xs">Descarga tu registro Art. 34.9 ET</p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400"/>
      </button>
    </div>
  )
}