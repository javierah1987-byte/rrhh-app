'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Empleado, Fichaje } from '@/lib/supabase'
import { iniciales, calcularMinutosTrabajados, minutosAHHMM, formatHora } from '@/lib/utils'
import { format, startOfWeek, addDays, subWeeks, addWeeks } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'

const DIAS = ['Lun','Mar','Mié','Jue','Vie']
function getInicioSemana(fecha: Date) { return startOfWeek(fecha, { weekStartsOn: 1 }) }

export default function HorariosPage() {
  const [semana, setSemana] = useState(getInicioSemana(new Date()))
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [fichajes, setFichajes] = useState<Fichaje[]>([])
  const [filtroEmp, setFiltroEmp] = useState('')
  const [loading, setLoading] = useState(true)
  const dias = Array.from({length:5}, (_,i) => addDays(semana, i))
  const labelSemana = `${format(semana,'d MMM',{locale:es})} – ${format(addDays(semana,4),'d MMM yyyy',{locale:es})}`

  const cargar = useCallback(async () => {
    setLoading(true)
    const desde = format(semana, 'yyyy-MM-dd')
    const hasta = format(addDays(semana, 6), 'yyyy-MM-dd')
    const {data:emps} = await supabase.from('empleados').select('*').neq('rol','admin').order('nombre')
    const {data:fichs} = await supabase.from('fichajes').select('*').gte('fecha',desde).lte('fecha',hasta)
    setEmpleados(emps || [])
    setFichajes(fichs || [])
    setLoading(false)
  }, [semana])

  useEffect(() => { cargar() }, [cargar])

  function fichajesDia(empId: string, fecha: Date) {
    const dateStr = format(fecha,'yyyy-MM-dd')
    return fichajes.filter(f => f.empleado_id === empId && f.fecha === dateStr).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }
  function entradaSalida(fs: Fichaje[]) {
    const entrada = fs.find(f => f.tipo === 'entrada')
    const salida = fs.find(f => f.tipo === 'salida')
    if (!entrada) return null
    return { entrada: formatHora(entrada.timestamp), salida: salida ? formatHora(salida.timestamp) : '—' }
  }
  async function exportarExcel() {
    const { utils, writeFileXLSX } = await import('xlsx')
    const rows: unknown[] = [['Empleado', ...DIAS.map((_,i) => format(addDays(semana,i),"EEEE d/M",{locale:es})), 'Total', 'Extra/Déficit']]
    for (const emp of empleados) {
      const row: unknown[] = [emp.nombre]
      let totalMin = 0
      for (const dia of dias) { const fs = fichajesDia(emp.id,dia); const mins = calcularMinutosTrabajados(fs); totalMin += mins; const es_ = entradaSalida(fs); row.push(es_ ? `${es_.entrada}–${es_.salida}` : '') }
      const jornada = emp.jornada_horas * 5 * 60
      row.push(minutosAHHMM(totalMin)); row.push(minutosAHHMM(totalMin - jornada)); rows.push(row)
    }
    const ws = utils.aoa_to_sheet(rows); const wb = utils.book_new(); utils.book_append_sheet(wb,ws,'Horarios'); writeFileXLSX(wb, `horarios_${format(semana,'yyyy-MM-dd')}.xlsx`)
  }

  const empsFiltrados = filtroEmp ? empleados.filter(e => e.id === filtroEmp) : empleados

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-xl font-bold text-gray-900">Horarios semanales</h1><p className="text-sm text-gray-500 mt-0.5">{labelSemana}</p></div>
        <div className="flex items-center gap-3">
          <select value={filtroEmp} onChange={e => setFiltroEmp(e.target.value)} className="input w-44"><option value="">Todos los empleados</option>{empleados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}</select>
          <div className="flex items-center gap-1">
            <button onClick={() => setSemana(s => subWeeks(s,1))} className="btn-secondary p-2"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setSemana(getInicioSemana(new Date()))} className="btn-secondary px-3 py-2 text-xs">Hoy</button>
            <button onClick={() => setSemana(s => addWeeks(s,1))} className="btn-secondary p-2"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <button onClick={exportarExcel} className="btn-primary flex items-center gap-1.5"><Download className="w-4 h-4" />Exportar Excel</button>
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50"><th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-40">Empleado</th>{dias.map((dia,i) => (<th key={i} className="text-center px-3 py-3 text-xs font-medium text-gray-500 min-w-[120px]"><div>{DIAS[i]}</div><div className="text-gray-400 font-normal">{format(dia,'d/M')}</div></th>))}<th className="text-center px-3 py-3 text-xs font-medium text-gray-500">Total</th><th className="text-center px-3 py-3 text-xs font-medium text-gray-500">Extra/Def.</th></tr></thead>
            <tbody>
              {loading ? Array.from({length:4}).map((_,i) => (<tr key={i} className="border-b border-gray-50">{Array.from({length:8}).map((_,j) => (<td key={j} className="px-4 py-4"><div className="skeleton h-4 w-20 mx-auto" /></td>))}</tr>))
              : empsFiltrados.map(emp => {
                let totalMin = 0
                const celdas = dias.map(dia => { const fs = fichajesDia(emp.id,dia); const mins = calcularMinutosTrabajados(fs); totalMin += mins; return {fs, mins, es: entradaSalida(fs)} })
                const extra = totalMin - emp.jornada_horas * 5 * 60
                return (<tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{backgroundColor:emp.avatar_color}}>{iniciales(emp.nombre)}</div><span className="font-medium text-gray-900 text-xs">{emp.nombre}</span></div></td>
                  {celdas.map((c,i) => (<td key={i} className="px-3 py-3 text-center">{c.es ? (<div className="font-mono text-xs"><span className="text-gray-900">{c.es.entrada}</span><span className="text-gray-400"> – </span><span className="text-gray-900">{c.es.salida}</span></div>) : (<span className="text-gray-300">—</span>)}</td>))}
                  <td className="px-3 py-3 text-center font-mono text-sm font-medium text-gray-900">{minutosAHHMM(totalMin)}</td>
                  <td className="px-3 py-3 text-center font-mono text-sm font-medium"><span className={extra >= 0 ? 'text-emerald-600' : 'text-red-500'}>{extra >= 0 ? '+' : ''}{minutosAHHMM(extra)}</span></td>
                </tr>)
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}