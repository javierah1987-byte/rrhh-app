'use client'
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { ChevronLeft, ChevronRight, Calendar, CalendarDays, Sun, Star, CheckCircle, Clock } from 'lucide-react'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS  = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']

type Vac = { id: string; fecha_inicio: string; fecha_fin: string; tipo: string; estado: string }
type Festivo = { id: string; fecha: string; nombre: string; tipo: string }

const ESTADO_COLOR: Record<string,string> = { aprobada:'bg-emerald-400', pendiente:'bg-amber-400', rechazada:'bg-red-400' }
const ESTADO_BG: Record<string,string> = {
  aprobada:'bg-emerald-50 ring-1 ring-emerald-200 dark:bg-emerald-900/20 dark:ring-emerald-700',
  pendiente:'bg-amber-50 ring-1 ring-amber-200 dark:bg-amber-900/20 dark:ring-amber-700',
  rechazada:'bg-red-50 ring-1 ring-red-200 dark:bg-red-900/20 dark:ring-red-700',
}
const ESTADO_LABEL: Record<string,string> = { aprobada:'Aprobada', pendiente:'Pendiente', rechazada:'Rechazada' }

function diasEntreFechas(ini: string, fin: string) {
  return Math.round((new Date(fin).getTime()-new Date(ini).getTime())/86400000)+1
}

export default function EmpleadoCalendario() {
  const [hoy]   = useState(new Date())
  const [mes, setMes]   = useState(new Date().getMonth())
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [vista, setVista] = useState<'mes'|'semana'>('mes')
  const [semana, setSemana] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - ((d.getDay()||7) - 1)); return d
  })
  const [vacs, setVacs]         = useState<Vac[]>([])
  const [festivos, setFestivos] = useState<Festivo[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase.from('empleados').select('id').eq('user_id', data.user.id).single().then(({ data: emp }) => {
        if (!emp) return
        Promise.all([
          supabase.from('solicitudes').select('id,fecha_inicio,fecha_fin,tipo,estado')
            .eq('empleado_id', emp.id).in('tipo', ['vacaciones','asuntos_propios','permiso'])
            .then(({ data: vs }) => setVacs((vs as Vac[]) || [])),
          supabase.from('festivos').select('id,fecha,nombre,tipo')
            .then(({ data: fs }) => setFestivos((fs as Festivo[]) || [])),
        ]).then(() => setLoading(false))
      })
    })
  }, [])

  function vacsEnDia(fecha: Date) {
    const s = fecha.toISOString().slice(0, 10)
    return vacs.filter(v => v.fecha_inicio <= s && v.fecha_fin >= s)
  }
  function festivosEnDia(fecha: Date) {
    const s = fecha.toISOString().slice(0, 10)
    return festivos.filter(f => f.fecha === s)
  }

  // ---- Vista mes ----
  function renderMes() {
    const primerDia = new Date(anio, mes, 1)
    const diasEnMes = new Date(anio, mes + 1, 0).getDate()
    let startDow = primerDia.getDay(); if (startDow === 0) startDow = 7; startDow--
    const celdas: (Date | null)[] = [...Array(startDow).fill(null)]
    for (let d = 1; d <= diasEnMes; d++) celdas.push(new Date(anio, mes, d))
    while (celdas.length % 7 !== 0) celdas.push(null)
    const hoyStr = hoy.toISOString().slice(0, 10)

    return (
      <div>
        <div className="grid grid-cols-7 mb-1">
          {DIAS.map(d => <div key={d} className="text-center text-xs font-semibold text-slate-400 py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {celdas.map((dia, i) => {
            if (!dia) return <div key={i} className="h-20 rounded-xl" />
            const s = dia.toISOString().slice(0, 10)
            const esHoy = s === hoyStr
            const vs = vacsEnDia(dia)
            const fests = festivosEnDia(dia)
            const esFestivo = fests.length > 0
            const bgClass = esFestivo
              ? 'bg-rose-50 ring-1 ring-rose-200 dark:bg-rose-900/20 dark:ring-rose-800'
              : vs.length > 0 ? ESTADO_BG[vs[0].estado]
              : esHoy ? 'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
              : 'bg-slate-50 dark:bg-slate-700/30 hover:bg-white dark:hover:bg-slate-700'
            return (
              <div key={i} className={`h-20 rounded-xl p-1.5 flex flex-col transition-colors ${bgClass}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0
                    ${esHoy ? 'bg-indigo-600 text-white' : esFestivo ? 'text-rose-700 dark:text-rose-300' : vs.length > 0 ? 'text-slate-700 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
                    {dia.getDate()}
                  </span>
                  {esFestivo && <Star className="w-2.5 h-2.5 text-rose-400 flex-shrink-0" fill="currentColor"/>}
                </div>
                {esFestivo && (
                  <div className="text-[9px] text-rose-600 dark:text-rose-400 font-medium leading-tight mt-0.5 truncate">{fests[0].nombre}</div>
                )}
                {!esFestivo && vs.length > 0 && (
                  <div className="mt-1 flex items-center gap-1">
                    <Sun className={`w-3 h-3 flex-shrink-0 ${vs[0].estado === 'aprobada' ? 'text-emerald-500' : vs[0].estado === 'pendiente' ? 'text-amber-500' : 'text-red-400'}`}/>
                    <span className="text-[10px] text-slate-600 dark:text-slate-300 capitalize leading-tight">{vs[0].tipo.replace('_', ' ')}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ---- Vista semana ----
  function renderSemana() {
    const dias7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(semana); d.setDate(d.getDate() + i); return d
    })
    const hoyStr = hoy.toISOString().slice(0, 10)
    return (
      <div className="grid grid-cols-7 gap-2">
        {dias7.map((dia, i) => {
          const s = dia.toISOString().slice(0, 10)
          const esHoy = s === hoyStr
          const vs = vacsEnDia(dia)
          const fests = festivosEnDia(dia)
          const esFestivo = fests.length > 0
          const bgClass = esFestivo
            ? 'bg-rose-50 ring-1 ring-rose-200 dark:bg-rose-900/20 dark:ring-rose-800'
            : vs.length > 0 ? ESTADO_BG[vs[0].estado]
            : esHoy ? 'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
            : 'bg-slate-50 dark:bg-slate-700/30'
          return (
            <div key={i} className={`rounded-2xl p-3 flex flex-col gap-2 min-h-[180px] ${bgClass}`}>
              <div className="text-center">
                <p className="text-xs font-semibold text-slate-400 uppercase">{DIAS[i]}</p>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mt-1 text-sm font-bold
                  ${esHoy ? 'bg-indigo-600 text-white' : esFestivo ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300' : 'text-slate-700 dark:text-slate-200'}`}>
                  {dia.getDate()}
                </div>
                {esFestivo && (
                  <p className="text-[10px] text-rose-500 dark:text-rose-400 font-medium mt-0.5 leading-tight">
                    <Star className="w-2.5 h-2.5 inline mr-0.5" fill="currentColor"/>{fests[0].nombre}
                  </p>
                )}
              </div>
              {vs.map(v => (
                <div key={v.id} className={`${ESTADO_COLOR[v.estado]} text-white text-xs font-medium px-2 py-1.5 rounded-lg text-center`}>
                  <Sun className="w-3 h-3 mx-auto mb-0.5"/>
                  <span className="capitalize text-[10px]">{v.tipo.replace('_', ' ')}</span>
                </div>
              ))}
              {vs.length === 0 && !esFestivo && <p className="text-xs text-slate-300 dark:text-slate-600 text-center mt-6">&mdash;</p>}
            </div>
          )
        })}
      </div>
    )
  }

  // Stats
  const stats = useMemo(() => {
    const aprobadas = vacs.filter(v => v.estado === 'aprobada')
    return {
      totalDias: aprobadas.reduce((a, v) => a + diasEntreFechas(v.fecha_inicio, v.fecha_fin), 0),
      pendientes: vacs.filter(v => v.estado === 'pendiente').length,
      total: vacs.length,
    }
  }, [vacs])

  // Próximas aprobadas
  const proximas = useMemo(() => {
    const hoyStr = hoy.toISOString().slice(0, 10)
    return vacs.filter(v => v.estado === 'aprobada' && v.fecha_fin >= hoyStr)
      .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio)).slice(0, 3)
  }, [vacs, hoy])

  // Recientes
  const recientes = useMemo(() => {
    const hoyStr = hoy.toISOString().slice(0, 10)
    return vacs.filter(v => v.estado === 'aprobada' && v.fecha_fin < hoyStr)
      .sort((a, b) => b.fecha_inicio.localeCompare(a.fecha_inicio)).slice(0, 3)
  }, [vacs, hoy])

  // Próximos festivos
  const proxFestivos = useMemo(() => {
    const hoyStr = hoy.toISOString().slice(0, 10)
    return festivos.filter(f => f.fecha >= hoyStr).sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 4)
  }, [festivos, hoy])

  function navAnterior() {
    if (vista === 'mes') { if (mes === 0) { setMes(11); setAnio(a => a - 1) } else setMes(m => m - 1) }
    else { const d = new Date(semana); d.setDate(d.getDate() - 7); setSemana(d) }
  }
  function navSiguiente() {
    if (vista === 'mes') { if (mes === 11) { setMes(0); setAnio(a => a + 1) } else setMes(m => m + 1) }
    else { const d = new Date(semana); d.setDate(d.getDate() + 7); setSemana(d) }
  }
  function irHoy() {
    setMes(hoy.getMonth()); setAnio(hoy.getFullYear())
    const d = new Date(); d.setDate(d.getDate() - ((d.getDay()||7) - 1)); setSemana(d)
  }

  const titulo = vista === 'mes'
    ? `${MESES[mes]} ${anio}`
    : (() => {
        const fin = new Date(semana.getTime() + 6 * 86400000)
        return `${semana.getDate()} ${MESES[semana.getMonth()]} – ${fin.getDate()} ${MESES[fin.getMonth()]} ${anio}`
      })()

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mi calendario</h1>
          <p className="text-sm text-slate-500 mt-1">Tus vacaciones, festivos y días libres</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={irHoy} className="btn-secondary text-xs px-3 py-1.5">Hoy</button>
          <div className="flex rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden">
            <button onClick={() => setVista('mes')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${vista === 'mes' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              <Calendar className="w-3.5 h-3.5"/>Mes
            </button>
            <button onClick={() => setVista('semana')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${vista === 'semana' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              <CalendarDays className="w-3.5 h-3.5"/>Semana
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:'Días aprobados', value:stats.totalDias, color:'text-emerald-600' },
          { label:'Pendientes', value:stats.pendientes, color:'text-amber-600' },
          { label:'Próximos festivos', value:proxFestivos.length, color:'text-rose-600' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <span className={`stat-value ${s.color}`}>{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Calendario */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <button onClick={navAnterior} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"><ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300"/></button>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 capitalize">{titulo}</h2>
          <button onClick={navSiguiente} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"><ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300"/></button>
        </div>
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>
        ) : vista === 'mes' ? renderMes() : renderSemana()}
      </div>

      {/* Paneles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Próximas vacaciones */}
        <div className="card p-4">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500"/>Próximas vacaciones
          </h3>
          {proximas.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">Sin próximas vacaciones aprobadas</p>
          ) : (
            <div className="space-y-2">
              {proximas.map(v => (
                <div key={v.id} className="flex items-center justify-between p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                  <div>
                    <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 capitalize">{v.tipo.replace('_', ' ')}</p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      {new Date(v.fecha_inicio+'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short'})} – {new Date(v.fecha_fin+'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short'})}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-800/40 px-2 py-1 rounded-lg">
                    {diasEntreFechas(v.fecha_inicio, v.fecha_fin)}d
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vacaciones disfrutadas */}
        <div className="card p-4">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-500"/>Vacaciones disfrutadas
          </h3>
          {recientes.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">Sin vacaciones pasadas aún</p>
          ) : (
            <div className="space-y-2">
              {recientes.map(v => (
                <div key={v.id} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
                  <div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 capitalize">{v.tipo.replace('_', ' ')}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {new Date(v.fecha_inicio+'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short'})} – {new Date(v.fecha_fin+'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short'})}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-600/40 px-2 py-1 rounded-lg">
                    {diasEntreFechas(v.fecha_inicio, v.fecha_fin)}d
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Próximos festivos */}
        <div className="card p-4">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-rose-500" fill="currentColor"/>Próximos festivos
          </h3>
          {proxFestivos.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">Sin festivos próximos</p>
          ) : (
            <div className="space-y-2">
              {proxFestivos.map(f => (
                <div key={f.id} className="flex items-center justify-between p-2.5 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
                  <div>
                    <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">{f.nombre}</p>
                    <p className="text-[10px] text-rose-500 dark:text-rose-400 capitalize">{f.tipo}</p>
                  </div>
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    {new Date(f.fecha+'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short'})}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Leyenda */}
      <div className="card p-4 flex flex-wrap items-center gap-5">
        {Object.entries(ESTADO_LABEL).map(([k, v]) => (
          <div key={k} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${ESTADO_COLOR[k]}`}/>
            <span className="text-xs text-slate-600 dark:text-slate-400">{v}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <Star className="w-3 h-3 text-rose-400" fill="currentColor"/>
          <span className="text-xs text-slate-600 dark:text-slate-400">Festivo</span>
        </div>
      </div>
    </div>
  )
}