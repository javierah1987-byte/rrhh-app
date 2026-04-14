'use client'
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Clock, TrendingUp, TrendingDown, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

type Fichaje = { id:string; empleado_id:string; tipo:string; fecha:string; timestamp:string }
type Emp = { id:string; nombre:string; avatar_color:string; jornada_horas:number }

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function minutosAHHMM(m:number) {
  const h=Math.floor(Math.abs(m)/60), min=Math.floor(Math.abs(m)%60)
  return `${m<0?'-':''}${h}h ${min>0?min+'min':''}`
}

function calcularHorasDia(fichajes: Fichaje[]): number {
  let mins = 0
  const sorted = [...fichajes].sort((a,b)=>new Date(a.timestamp).getTime()-new Date(b.timestamp).getTime())
  let entradaTs: number|null = null
  let pausaTs: number|null = null
  for (const f of sorted) {
    if (f.tipo==='entrada') entradaTs = new Date(f.timestamp).getTime()
    else if (f.tipo==='pausa_inicio' && entradaTs) { mins += (new Date(f.timestamp).getTime()-entradaTs)/60000; entradaTs=null; pausaTs=new Date(f.timestamp).getTime() }
    else if (f.tipo==='pausa_fin') { entradaTs=new Date(f.timestamp).getTime(); pausaTs=null }
    else if (f.tipo==='salida' && entradaTs) { mins += (new Date(f.timestamp).getTime()-entradaTs)/60000; entradaTs=null }
  }
  if (entradaTs) mins += (Date.now()-entradaTs)/60000
  return mins
}

export default function ControlHorasPage() {
  const [empleados, setEmpleados] = useState<Emp[]>([])
  const [fichajes, setFichajes] = useState<Fichaje[]>([])
  const [loading, setLoading] = useState(true)
  const [mes, setMes] = useState(new Date().getMonth())
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [empFiltro, setEmpFiltro] = useState('todos')

  useEffect(() => {
    Promise.all([
      supabase.from('empleados').select('id,nombre,avatar_color,jornada_horas').eq('estado','activo').order('nombre'),
      supabase.from('fichajes').select('*'),
    ]).then(([{data:e},{data:f}]) => { setEmpleados(e||[]); setFichajes(f||[]); setLoading(false) })
  }, [])

  const resumen = useMemo(() => {
    const primerDia = new Date(anio, mes, 1)
    const ultimoDia = new Date(anio, mes+1, 0)
    const diasLaborables = Array.from({length:ultimoDia.getDate()},(_,i)=>new Date(anio,mes,i+1))
      .filter(d=>d.getDay()!==0 && d.getDay()!==6).length

    return empleados
      .filter(e=>empFiltro==='todos'||e.id===empFiltro)
      .map(e=>{
        const fichajesEmp = fichajes.filter(f=>{
          const d=new Date(f.fecha||f.timestamp)
          return f.empleado_id===e.id && d.getMonth()===mes && d.getFullYear()===anio
        })
        // Agrupar por día
        const porDia: Record<string,Fichaje[]> = {}
        fichajesEmp.forEach(f=>{ const k=f.fecha||(f.timestamp.slice(0,10)); porDia[k]=(porDia[k]||[]).concat(f) })
        const diasTrabajados = Object.keys(porDia).length
        const minsTotales = Object.values(porDia).reduce((s,fs)=>s+calcularHorasDia(fs),0)
        const horasEsperadas = (e.jornada_horas||8)*diasLaborables*60
        const horasExtra = Math.round(minsTotales) - horasEsperadas
        return { emp:e, diasTrabajados, minsTotales:Math.round(minsTotales), horasEsperadas, horasExtra, diasLaborables }
      })
  }, [empleados, fichajes, mes, anio, empFiltro])

  function navMes(d:number) {
    let m=mes+d, a=anio
    if(m<0){m=11;a--} else if(m>11){m=0;a++}
    setMes(m); setAnio(a)
  }

  const totalEquipo = resumen.reduce((s,r)=>s+r.minsTotales,0)
  const promedioDias = resumen.length>0?resumen.reduce((s,r)=>s+r.diasTrabajados,0)/resumen.length:0

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Control de horas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Horas trabajadas por empleado</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>navMes(-1)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"><ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300"/></button>
          <span className="font-bold text-slate-900 dark:text-slate-100 min-w-[140px] text-center">{MESES[mes]} {anio}</span>
          <button onClick={()=>navMes(1)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"><ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300"/></button>
        </div>
      </div>

      {/* Resumen global */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        {[
          {label:'Empleados activos',value:empleados.length,color:'text-indigo-600',icon:Clock},
          {label:'Horas totales equipo',value:minutosAHHMM(totalEquipo),color:'text-emerald-600',icon:TrendingUp},
          {label:'Media días trabajados',value:Math.round(promedioDias)+' días',color:'text-amber-600',icon:Calendar},
          {label:'Días laborables mes',value:resumen[0]?.diasLaborables||0,color:'text-slate-700 dark:text-slate-300',icon:Calendar},
        ].map((s,i)=>(
          <div key={i} className="stat-card">
            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700 flex items-center justify-center mb-2">
              <s.icon className={`w-4 h-4 ${s.color}`}/>
            </div>
            <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filtro */}
      <div className="mb-4">
        <select value={empFiltro} onChange={e=>setEmpFiltro(e.target.value)} className="input w-56">
          <option value="todos">Todos los empleados</option>
          {empleados.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead><tr>
              <th className="table-header">Empleado</th>
              <th className="table-header text-center">Días trab.</th>
              <th className="table-header text-right">Horas trabajadas</th>
              <th className="table-header text-right">Horas esperadas</th>
              <th className="table-header text-right">Diferencia</th>
              <th className="table-header text-center">Progreso</th>
            </tr></thead>
            <tbody>
              {resumen.map(({emp,diasTrabajados,minsTotales,horasEsperadas,horasExtra})=>{
                const pct = horasEsperadas>0?Math.min(100,Math.round(minsTotales/horasEsperadas*100)):0
                return (
                  <tr key={emp.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{backgroundColor:emp.avatar_color||'#6366f1'}}>
                          {emp.nombre.split(' ').map((n:string)=>n[0]).join('').substring(0,2)}
                        </div>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{emp.nombre}</span>
                      </div>
                    </td>
                    <td className="table-cell text-center font-semibold text-slate-700 dark:text-slate-300">{diasTrabajados}</td>
                    <td className="table-cell text-right font-semibold text-indigo-600">{minutosAHHMM(minsTotales)}</td>
                    <td className="table-cell text-right text-slate-500 dark:text-slate-400">{minutosAHHMM(horasEsperadas)}</td>
                    <td className="table-cell text-right">
                      <span className={`font-semibold ${horasExtra>=0?'text-emerald-600':'text-red-500'}`}>
                        {horasExtra>=0?'+':''}{minutosAHHMM(horasExtra)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                          <div className={`h-2 rounded-full transition-all ${pct>=100?'bg-emerald-500':pct>=70?'bg-indigo-500':'bg-amber-500'}`} style={{width:pct+'%'}}/>
                        </div>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 w-8">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {resumen.length===0 && <div className="text-center py-12 text-slate-400">No hay datos de fichajes para este período</div>}
        </div>
      )}
    </div>
  )
}