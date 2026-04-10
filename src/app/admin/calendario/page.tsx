'use client'
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { ChevronLeft, ChevronRight, Calendar, CalendarDays, Sun, Star } from 'lucide-react'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS  = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']

const EMP_COLORS = [
  'bg-indigo-400','bg-emerald-400','bg-amber-400','bg-rose-400',
  'bg-violet-400','bg-cyan-400','bg-orange-400','bg-teal-400',
  'bg-pink-400','bg-lime-400','bg-sky-400','bg-fuchsia-400',
]

type Vacacion = {
  id: string; empleado_id: string; fecha_inicio: string; fecha_fin: string
  estado: string; tipo: string
  empleados: { nombre: string; avatar_color: string }
}
type Festivo = { id: string; fecha: string; nombre: string; tipo: string }

export default function AdminCalendario() {
  const [hoy]   = useState(new Date())
  const [mes, setMes]   = useState(hoy.getMonth())
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [vista, setVista] = useState<'mes'|'semana'>('mes')
  const [semana, setSemana] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - ((d.getDay()||7) - 1)); return d
  })
  const [vacs, setVacs]         = useState<Vacacion[]>([])
  const [festivos, setFestivos] = useState<Festivo[]>([])
  const [loading, setLoading]   = useState(true)
  const [filtro, setFiltro]     = useState<'todos'|'aprobada'|'pendiente'>('aprobada')

  useEffect(() => {
    Promise.all([
      supabase.from('solicitudes')
        .select('id,empleado_id,fecha_inicio,fecha_fin,estado,tipo,empleados(nombre,avatar_color)')
        .in('tipo', ['vacaciones','asuntos_propios','permiso'])
        .then(({ data }) => setVacs((data as any[]) || [])),
      supabase.from('festivos').select('id,fecha,nombre,tipo')
        .then(({ data }) => setFestivos((data as Festivo[]) || [])),
    ]).then(() => setLoading(false))
  }, [])

  const vacsFiltradas = useMemo(() =>
    filtro === 'todos' ? vacs : vacs.filter(v => v.estado === filtro)
  , [vacs, filtro])

  // Asignar color consistente por empleado
  const empColorMap = useMemo(() => {
    const ids = Array.from(new Set(vacs.map(v => v.empleado_id)))
    return Object.fromEntries(ids.map((id, i) => [id, EMP_COLORS[i % EMP_COLORS.length]]))
  }, [vacs])

  function vacsEnDia(fecha: Date) {
    const s = fecha.toISOString().slice(0, 10)
    return vacsFiltradas.filter(v => v.fecha_inicio <= s && v.fecha_fin >= s)
  }
  function festivosEnDia(fecha: Date) {
    const s = fecha.toISOString().slice(0, 10)
    return festivos.filter(f => f.fecha === s)
  }

  // ---- VISTA MES ----
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
            if (!dia) return <div key={i} className="h-28 rounded-xl" />
            const s = dia.toISOString().slice(0, 10)
            const esHoy = s === hoyStr
            const vs = vacsEnDia(dia)
            const fests = festivosEnDia(dia)
            const esFestivo = fests.length > 0
            return (
              <div key={i} className={`h-28 rounded-xl p-1.5 flex flex-col transition-colors overflow-hidden
                ${esFestivo ? 'bg-rose-50 dark:bg-rose-900/20 ring-1 ring-rose-200 dark:ring-rose-800' :
                  esHoy ? 'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' :
                  'bg-slate-50 dark:bg-slate-700/30 hover:bg-white dark:hover:bg-slate-700'}`}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0
                    ${esHoy ? 'bg-indigo-600 text-white' : esFestivo ? 'text-rose-700 dark:text-rose-300 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                    {dia.getDate()}
                  </span>
                  {esFestivo && <Star className="w-2.5 h-2.5 text-rose-400 flex-shrink-0" fill="currentColor"/>}
                </div>
                {esFestivo && (
                  <div className="text-[9px] text-rose-600 dark:text-rose-400 font-medium leading-tight mb-0.5 truncate">
                    {fests[0].nombre}
                  </div>
                )}
                <div className="flex-1 overflow-hidden space-y-0.5">
                  {vs.slice(0, 3).map(v => (
                    <div key={v.id} className={`${empColorMap[v.empleado_id]} text-white text-[9px] font-medium px-1 py-0.5 rounded truncate flex items-center gap-0.5`}>
                      <Sun className="w-2 h-2 flex-shrink-0"/>
                      <span className="truncate">{(v.empleados as any)?.nombre?.split(' ')[0] || '?'}</span>
                      {v.estado === 'pendiente' && <span className="text-[8px] opacity-75">(p)</span>}
                    </div>
                  ))}
                  {vs.length > 3 && <div className="text-[9px] text-slate-400 pl-1">+{vs.length - 3} más</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ---- VISTA SEMANA ----
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
          return (
            <div key={i} className={`rounded-2xl p-3 flex flex-col gap-1.5 min-h-[200px]
              ${esFestivo ? 'bg-rose-50 dark:bg-rose-900/20 ring-1 ring-rose-200 dark:ring-rose-800' :
                esHoy ? 'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' :
                'bg-slate-50 dark:bg-slate-700/30'}`}>
              <div className="text-center">
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">{DIAS[i]}</p>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mt-1 text-sm font-bold
                  ${esHoy ? 'bg-indigo-600 text-white' : esFestivo ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300' : 'text-slate-700 dark:text-slate-200'}`}>
                  {dia.getDate()}
                </div>
                {esFestivo && (
                  <div className="text-[10px] text-rose-500 dark:text-rose-400 font-medium mt-0.5 leading-tight px-1">
                    <Star className="w-2.5 h-2.5 inline mr-0.5" fill="currentColor"/>{fests[0].nombre}
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-1">
                {vs.map(v => (
                  <div key={v.id} className={`${empColorMap[v.empleado_id]} text-white text-[10px] font-medium px-2 py-1 rounded-lg`}>
                    <div className="flex items-center gap-1">
                      <Sun className="w-2.5 h-2.5 flex-shrink-0"/>
                      <span className="truncate">{(v.empleados as any)?.nombre?.split(' ').slice(0, 2).join(' ')}</span>
                    </div>
                    <div className="text-[9px] opacity-80 capitalize">{v.tipo.replace('_', ' ')} {v.estado === 'pendiente' ? '(pend.)' : ''}</div>
                  </div>
                ))}
                {vs.length === 0 && !esFestivo && <p className="text-xs text-slate-300 dark:text-slate-600 text-center mt-4">&mdash;</p>}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ---- STATS ----
  const stats = useMemo(() => {
    const hoyStr = hoy.toISOString().slice(0, 10)
    const proxFest = festivos.filter(f => f.fecha >= hoyStr).sort((a,b) => a.fecha.localeCompare(b.fecha))[0]
    return {
      ausentes: Array.from(new Set(vacsFiltradas.filter(v => v.fecha_inicio <= hoyStr && v.fecha_fin >= hoyStr).map(v => v.empleado_id))).length,
      pendientes: vacs.filter(v => v.estado === 'pendiente').length,
      proxFest,
    }
  }, [vacsFiltradas, vacs, festivos, hoy])

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

  // Empleados con vacaciones en el mes actual
  const empsMes = useMemo(() => {
    const ids = new Set(vacs.filter(v => {
      const ini = new Date(v.fecha_inicio), fin = new Date(v.fecha_fin)
      return (ini.getFullYear() === anio && ini.getMonth() === mes) ||
             (fin.getFullYear() === anio && fin.getMonth() === mes)
    }).map(v => v.empleado_id))
    return vacs.filter((v, _, arr) => ids.has(v.empleado_id)).reduce((acc: any[], v) => {
      if (!acc.find(a => a.id === v.empleado_id)) {
        acc.push({ id: v.empleado_id, nombre: (v.empleados as any)?.nombre || 'Empleado', color: empColorMap[v.empleado_id] })
      }
      return acc
    }, [])
  }, [vacs, anio, mes, empColorMap])

  // Festivos del mes
  const festivosMes = useMemo(() => {
    return festivos.filter(f => {
      const d = new Date(f.fecha)
      return d.getFullYear() === anio && d.getMonth() === mes
    }).sort((a,b) => a.fecha.localeCompare(b.fecha))
  }, [festivos, anio, mes])

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Calendario del equipo</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Vacaciones, permisos y festivos de todos los empleados</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtro estado */}
          <select value={filtro} onChange={e => setFiltro(e.target.value as any)}
            className="input text-xs px-3 py-1.5 w-auto">
            <option value="aprobada">Solo aprobadas</option>
            <option value="pendiente">Solo pendientes</option>
            <option value="todos">Todas</option>
          </select>
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

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card">
          <span className="stat-value text-indigo-600">{stats.ausentes}</span>
          <span className="stat-label">Ausentes hoy</span>
        </div>
        <div className="stat-card">
          <span className="stat-value text-amber-600">{stats.pendientes}</span>
          <span className="stat-label">Pendientes de aprobar</span>
        </div>
        <div className="stat-card">
          <span className="stat-value text-rose-600">{festivosMes.length}</span>
          <span className="stat-label">Festivos este mes</span>
        </div>
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

      {/* Panel inferior: leyenda empleados + festivos del mes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Leyenda empleados */}
        <div className="card p-4">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Empleados con ausencias este mes</h3>
          {empsMes.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">Nadie ausente este mes</p>
          ) : (
            <div className="space-y-1.5">
              {empsMes.map(e => (
                <div key={e.id} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${e.color}`}/>
                  <span className="text-sm text-slate-700 dark:text-slate-300">{e.nombre}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Festivos del mes */}
        <div className="card p-4">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-rose-400" fill="currentColor"/>Festivos este mes
          </h3>
          {festivosMes.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">Sin festivos este mes</p>
          ) : (
            <div className="space-y-1.5">
              {festivosMes.map(f => (
                <div key={f.id} className="flex items-center justify-between p-2 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
                  <div>
                    <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">{f.nombre}</p>
                    <p className="text-[10px] text-rose-500 dark:text-rose-400 capitalize">{f.tipo}</p>
                  </div>
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    {new Date(f.fecha + 'T12:00:00').toLocaleDateString('es-ES', {day:'numeric', month:'short'})}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Leyenda estados */}
      <div className="card p-3 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-400"/><span className="text-xs text-slate-600 dark:text-slate-400">Aprobada</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-400"/><span className="text-xs text-slate-600 dark:text-slate-400">Pendiente</span></div>
        <div className="flex items-center gap-2"><Star className="w-3 h-3 text-rose-400" fill="currentColor"/><span className="text-xs text-slate-600 dark:text-slate-400">Festivo nacional</span></div>
      </div>
    </div>
  )
}