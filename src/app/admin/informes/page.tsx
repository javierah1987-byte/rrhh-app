'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { iniciales, minutosAHHMM, MESES, calcularMinutosTrabajados } from '@/lib/utils'
import { Download, BarChart3 } from 'lucide-react'

export default function InformesPage() {
  const [empleados, setEmpleados] = useState<any[]>([])
  const [resumen, setResumen] = useState<any[]>([])
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async () => {
    setLoading(true)
    const { data: emps } = await supabase.from('empleados').select('*').neq('rol','admin').order('nombre')
    if (!emps) { setLoading(false); return }
    const desde = `${anio}-${String(mes).padStart(2,'0')}-01`
    const hasta = `${anio}-${String(mes).padStart(2,'0')}-31`
    const { data: fichs } = await supabase.from('fichajes').select('*').gte('fecha',desde).lte('fecha',hasta)
    const { data: noms } = await supabase.from('nominas').select('*').eq('mes',mes).eq('anio',anio)
    const { data: sols } = await supabase.from('solicitudes').select('*').eq('estado','aprobada').gte('fecha_inicio',desde).lte('fecha_inicio',hasta)
    const data = emps.map(emp => {
      const empFichs = (fichs||[]).filter(f=>f.empleado_id===emp.id)
      const empFichsByDay = empFichs.reduce((acc: Record<string,any[]>,f)=>{ (acc[f.fecha]||(acc[f.fecha]=[])).push(f); return acc },{})
      const diasTrabajados = Object.keys(empFichsByDay).length
      const totalMin = Object.values(empFichsByDay).reduce((acc,fs)=>acc+calcularMinutosTrabajados(fs),0)
      const nomina = (noms||[]).find(n=>n.empleado_id===emp.id)
      const vacSols = (sols||[]).filter(s=>s.empleado_id===emp.id&&s.tipo==='vacaciones')
      return { emp, diasTrabajados, totalMin, nomina, vacaciones: vacSols.length }
    })
    setEmpleados(emps)
    setResumen(data)
    setLoading(false)
  }, [mes, anio])

  useEffect(() => { cargar() }, [cargar])

  async function exportarExcel() {
    const { utils, writeFileXLSX } = await import('xlsx')
    const rows = [['Empleado','Departamento','Dias trabajados','Horas totales','Salario base','IRPF','SS','Liquido','Vacaciones']]
    for (const r of resumen) {
      rows.push([r.emp.nombre,r.emp.departamento,r.diasTrabajados,minutosAHHMM(r.totalMin),r.nomina?.salario_base||0,r.nomina?.irpf_pct||0,r.nomina?.ss_pct||0,r.nomina?.liquido||0,r.vacaciones])
    }
    const ws = utils.aoa_to_sheet(rows)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'Informe')
    writeFileXLSX(wb, `informe_${MESES[mes]}_${anio}.xlsx`)
  }

  const totales = resumen.reduce((acc,r)=>({ dias:acc.dias+r.diasTrabajados, min:acc.min+r.totalMin, liquido:acc.liquido+(r.nomina?.liquido||0) }),{dias:0,min:0,liquido:0})

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-xl font-bold text-gray-900">Informes y nominas</h1><p className="text-sm text-gray-500 mt-0.5">{MESES[mes]} {anio}</p></div>
        <div className="flex items-center gap-3">
          <select value={mes} onChange={e=>setMes(Number(e.target.value))} className="input w-36">{MESES.slice(1).map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}</select>
          <select value={anio} onChange={e=>setAnio(Number(e.target.value))} className="input w-24">{[2024,2025,2026].map(y=><option key={y}>{y}</option>)}</select>
          <button onClick={exportarExcel} className="btn-primary flex items-center gap-1.5"><Download className="w-4 h-4" />Exportar</button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[{label:'Dias totales trabajados',value:totales.dias+' dias',icon:BarChart3},{label:'Horas trabajadas',value:minutosAHHMM(totales.min)},{label:'Masa salarial neta',value:totales.liquido.toFixed(0)+' €'}].map((k,i)=>(<div key={i} className="card p-5 bg-indigo-50"><p className="text-xs text-gray-500">{k.label}</p><p className="text-2xl font-bold text-indigo-700 mt-1">{k.value}</p></div>))}
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50">{['Empleado','Depto','Dias','Horas','S. Base','IRPF','S.S.','Liquido'].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>)}</tr></thead>
            <tbody>
              {loading?Array.from({length:4}).map((_,i)=><tr key={i} className="border-b border-gray-50">{Array.from({length:8}).map((_,j)=><td key={j} className="px-4 py-3"><div className="skeleton h-4 w-16"/></td>)}</tr>)
              :resumen.map(({emp,diasTrabajados,totalMin,nomina})=>(<tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{backgroundColor:emp.avatar_color}}>{iniciales(emp.nombre)}</div><span className="font-medium text-gray-900">{emp.nombre}</span></div></td>
                <td className="px-4 py-3 text-gray-600">{emp.departamento}</td>
                <td className="px-4 py-3 text-gray-900 font-medium">{diasTrabajados}</td>
                <td className="px-4 py-3 font-mono text-gray-900">{minutosAHHMM(totalMin)}</td>
                <td className="px-4 py-3 text-gray-600">{nomina?.salario_base?.toFixed(0)||'—'} €</td>
                <td className="px-4 py-3 text-gray-600">{nomina?nomina.irpf_pct+'%':'—'}</td>
                <td className="px-4 py-3 text-gray-600">{nomina?nomina.ss_pct+'%':'—'}</td>
                <td className="px-4 py-3 font-bold text-indigo-700">{nomina?.liquido?.toFixed(0)||'—'} €</td>
              </tr>))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}