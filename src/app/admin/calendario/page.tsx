'use client'
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { ChevronLeft, ChevronRight, Calendar, CalendarDays } from 'lucide-react'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS = ['Lun','Mar','MiÃ©','Jue','Vie','SÃ¡b','Dom']

const COLORS = [
  'bg-indigo-400','bg-emerald-400','bg-amber-400','bg-rose-400',
  'bg-violet-400','bg-cyan-400','bg-orange-400','bg-teal-400',
]

type Vacacion = {
  id: string; empleado_id: string; fecha_inicio: string; fecha_fin: string
  estado: string; tipo: string; empleados: { nombre: string; avatar_color: string }
}

export default function AdminCalendario() {
  const [hoy] = useState(new Date())
  const [mes, setMes] = useState(hoy.getMonth())
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [vista, setVista] = useState<'mes'|'semana'>('mes')
  const [semana, setSemana] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - (d.getDay()||7) + 1); return d
  })
  const [vacs, setVacs] = useState<Vacacion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('solicitudes').select('id,empleado_id,fecha_inicio,fecha_fin,estado,tipo,empleados(nombre,avatar_color)')
      .in('tipo', ['vacaciones','asuntos_propios']).eq('estado','aprobada')
      .then(({ data }) => { setVacs((data as any[]) || []); setLoading(false) })
  }, [])

  // Mapa empleado â color
  const empColors = useMemo(() => {
    const ids = Array.from(new Set(vacs.map(v => v.empleado_id)))
    return Object.fromEntries(ids.map((id, i) => [id, COLORS[i % COLORS.length]]))
  }, [vacs])

  function vacsEnDia(fecha: Date) {
    const s = fecha.toISOString().slice(0,10)
    return vacs.filter(v => v.fecha_inicio <= s && v.fecha_fin >= s)
  }

  // ---- VISTA MES ----
  function renderMes() {
    const primerDia = new Date(anio, mes, 1)
    const diasEnMes = new Date(anio, mes+1, 0).getDate()
    let startDow = primerDia.getDay(); if (startDow===0) startDow=7; startDow--
    const celdas: (Date|null)[] = [...Array(startDow).fill(null)]
    for (let d=1; d<=diasEnMes; d++) celdas.push(new Date(anio, mes, d))
    while (celdas.length % 7 !== 0) celdas.push(null)

    const hoyStr = hoy.toISOString().slice(0,10)

    return (
      <div>
        <div className="grid grid-cols-7 mb-1">
          {DIAS.map(d => <div key={d} className="text-center text-xs font-semibold text-slate-400 py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {celdas.map((dia, i) => {
            if (!dia) return <div key={i} className="h-24 rounded-xl"/>
            const s = dia.toISOString().slice(0,10)
            const esHoy = s === hoyStr
            const vs = vacsEnDia(dia)
            return (
              <div key={i} className={`h-24 rounded-xl p-1.5 flex flex-col ${esHoy ? 'ring-2 ring-indigo-500 bg-indigo-50' : 'bg-slate-50 hover:bg-white'} transition-colors`}>
                <span className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${esHoy ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}>
                  {dia.getDate()}
                </span>
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  {vs.slice(0,2).map(v => (
                    <div key={v.id} className={`${empColors[v.empleado_id]} text-white text-[10px] font-medium px-1 rounded truncate`}>
                      {(v.empleados as any).nombre.split(' ')[0]}
                    </div>
                  ))}
                  {vs.length > 2 && <div className="text-[10px] text-slate-400">+{vs.length-2} mÃ¡s</div>}
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
    const dias7 = Array.from({length:7}, (_,i) => {
      const d = new Date(semana); d.setDate(d.getDate()+i); return d
    })
    const hoyStr = hoy.toISOString().slice(0,10)
    return (
      <div className="grid grid-cols-7 gap-2">
        {dias7.map((dia, i) => {
          const s = dia.toISOString().slice(0,10)
          const esHoy = s === hoyStr
          const vs = vacsEnDia(dia)
          return (
            <div key={i} className={`rounded-2xl p-3 flex flex-col gap-2 min-h-[200px] ${esHoy ? 'ring-2 ring-indigo-500 bg-indigo-50' : 'bg-slate-50'}`}>
              <div className="text-center">
                <p className="text-xs font-semibold text-slate-400 uppercase">{DIAS[i]}</p>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mt-1 text-sm font-bold ${esHoy ? 'bg-indigo-600 text-white' : 'text-slate-700'}`}>
                  {dia.getDate()}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                {vs.map(v => (
                  <div key={v.id} className={`${empColors[v.empleado_id]} text-white text-xs font-medium px-2 py-1 rounded-lg`}>
                    {(v.empleados as any).nombre.split(' ').map((n:string)=>n[0]).join('')}
                    <span className="ml-1 opacity-80 text-[10px]">{(v.empleados as any).nombre.split(' ')[0]}</span>
                  </div>
                ))}
                {vs.length === 0 && <p className="text-xs text-slate-300 text-center mt-4">â</p>}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Leyenda empleados
  const empleadosUnicos = useMemo(() => {
    const map = new Map()
    vacs.forEach(v => { if (!map.has(v.empleado_id)) map.set(v.empleado_id, (v.empleados as any).nombre) })
    return Array.from(map.entries())
  }, [vacs])

  function navAnterior() {
    if (vista==='mes') { if (mes===0) { setMes(11); setAnio(a=>a-1) } else setMes(m=>m-1) }
    else { const d=new Date(semana); d.setDate(d.getDate()-7); setSemana(d) }
  }
  function navSiguiente() {
    if (vista==='mes') { if (mes===11) { setMes(0); setAnio(a=>a+1) } else setMes(m=>m+1) }
    else { const d=new Date(semana); d.setDate(d.getDate()+7); setSemana(d) }
  }
  function irHoy() {
    setMes(hoy.getMonth()); setAnio(hoy.getFullYear())
    const d=new Date(); d.setDate(d.getDate()-(d.getDay()||7)+1); setSemana(d)
  }

  const titulo = vista==='mes'
    ? `${MESES[mes]} ${anio}`
    : `${semana.getDate()} ${MESES[semana.getMonth()]} â ${new Date(semana.getTime()+6*86400000).getDate()} ${MESES[new Date(semana.getTime()+6*86400000).getMonth()]} ${anio}`

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Calendario de vacaciones</h1>
          <p className="text-sm text-slate-500 mt-1">Solicitudes aprobadas de todo el equipo</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={irHoy} className="btn-secondary text-xs px-3 py-1.5">Hoy</button>
          <div className="flex rounded-xl border border-slate-200 overflow-hidden">
            <button onClick={()=>setVista('mes')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${vista==='mes' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Calendar className="w-3.5 h-3.5"/>Mes
            </button>
            <button onClick={()=>setVista('semana')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${vista==='semana' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
              <CalendarDays className="w-3.5 h-3.5"/>Semana
            </button>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <button onClick={navAnterior} className="p-2 rounded-xl hover:bg-slate-100 transition-colors"><ChevronLeft className="w-4 h-4 text-slate-600"/></button>
          <h2 className="text-lg font-bold text-slate-900 capitalize">{titulo}</h2>
          <button onClick={navSiguiente} className="p-2 rounded-xl hover:bg-slate-100 transition-colors"><ChevronRight className="w-4 h-4 text-slate-600"/></button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>
        ) : vista==='mes' ? renderMes() : renderSemana()}
      </div>

      {empleadosUnicos.length > 0 && (
        <div className="mt-4 card p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Leyenda</p>
          <div className="flex flex-wrap gap-2">
            {empleadosUnicos.map(([id, nombre]) => (
              <div key={id} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${empColors[id]}`}/>
                <span className="text-xs text-slate-600">{nombre}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
