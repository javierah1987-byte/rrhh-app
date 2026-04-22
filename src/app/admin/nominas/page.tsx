// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { DollarSign, Download, Search, ChevronDown, TrendingUp } from 'lucide-react'

const MESES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function NominasPage() {
  const [nominas, setNominas]       = useState([])
  const [empleados, setEmpleados]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [filtroEmp, setFiltroEmp]   = useState('')
  const [filtroMes, setFiltroMes]   = useState('')
  const [filtroAnio, setFiltroAnio] = useState('2026')
  const [expanded, setExpanded]     = useState(null)

  useEffect(() => {
    Promise.all([
      supabase.from('nominas').select('*, empleado:empleados(id,nombre,puesto,departamento,avatar_color)').order('anio',{ascending:false}).order('mes',{ascending:false}),
      supabase.from('empleados').select('id,nombre').eq('estado','activo').order('nombre'),
    ]).then(([n, e]) => {
      setNominas(n.data||[])
      setEmpleados(e.data||[])
      setLoading(false)
    })
  }, [])

  const nominasFiltradas = nominas.filter(n => {
    if (filtroEmp && n.empleado_id !== filtroEmp) return false
    if (filtroMes && n.mes !== parseInt(filtroMes)) return false
    if (filtroAnio && n.anio !== parseInt(filtroAnio)) return false
    return true
  })

  const totalLiquido = nominasFiltradas.reduce((s,n) => s+(n.liquido||0), 0)
  const totalBase    = nominasFiltradas.reduce((s,n) => s+(n.salario_base||0), 0)

  if (loading) return <div className="p-8 text-slate-400 text-sm">Cargando nóminas...</div>

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-indigo-600"/> Nóminas
          </h1>
          <p className="text-slate-500 text-sm mt-1">{nominasFiltradas.length} registros · {totalLiquido.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g,',')}€ neto total</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-slate-400 text-xs mb-1">Masa salarial bruta</p>
          <p className="text-xl font-black text-slate-700 dark:text-white">{totalBase.toLocaleString('es-ES')}€</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-slate-400 text-xs mb-1">Total líquido</p>
          <p className="text-xl font-black text-emerald-600">{totalLiquido.toLocaleString('es-ES',{minimumFractionDigits:0,maximumFractionDigits:0})}€</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-slate-400 text-xs mb-1">Media por empleado</p>
          <p className="text-xl font-black text-indigo-600">
            {nominasFiltradas.length > 0 ? (totalLiquido / new Set(nominasFiltradas.map(n=>n.empleado_id)).size).toLocaleString('es-ES',{minimumFractionDigits:0,maximumFractionDigits:0}) : 0}€
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <select value={filtroEmp} onChange={e=>setFiltroEmp(e.target.value)}
          className="border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:bg-slate-800 dark:text-white">
          <option value="">Todos los empleados</option>
          {empleados.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}
        </select>
        <select value={filtroMes} onChange={e=>setFiltroMes(e.target.value)}
          className="border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:bg-slate-800 dark:text-white">
          <option value="">Todos los meses</option>
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(m=><option key={m} value={m}>{MESES[m]}</option>)}
        </select>
        <select value={filtroAnio} onChange={e=>setFiltroAnio(e.target.value)}
          className="border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:bg-slate-800 dark:text-white">
          <option value="2026">2026</option>
          <option value="2025">2025</option>
        </select>
      </div>

      {/* Lista de nóminas */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-4 px-5 py-3 border-b border-slate-100 dark:border-slate-700 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <span>Empleado</span>
          <span>Período</span>
          <span>Salario base</span>
          <span>IRPF + SS</span>
          <span>Líquido</span>
          <span/>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
          {nominasFiltradas.length === 0
            ? <p className="text-slate-400 text-sm p-6 text-center">Sin resultados para los filtros aplicados</p>
            : nominasFiltradas.map(n => {
                const emp = n.empleado
                const isOpen = expanded === n.id
                const irpf = (n.salario_base||0) * (n.irpf_pct||18) / 100
                const ss   = (n.salario_base||0) * (n.ss_pct||6.35) / 100
                return (
                  <div key={n.id}>
                    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-4 px-5 py-3 items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30"
                      onClick={()=>setExpanded(isOpen?null:n.id)}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{background: emp?.avatar_color||'#6366f1'}}>
                          {emp?.nombre?.charAt(0)||'?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{emp?.nombre}</p>
                          <p className="text-xs text-slate-400 truncate">{emp?.departamento}</p>
                        </div>
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-300">{MESES[n.mes]} {n.anio}</span>
                      <span className="text-sm text-slate-600 dark:text-slate-300">{(n.salario_base||0).toLocaleString('es-ES')}€</span>
                      <span className="text-sm text-red-500">-{(irpf+ss).toFixed(0)}€</span>
                      <span className="text-sm font-bold text-emerald-600">{(n.liquido||0).toFixed(0)}€</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen?'rotate-180':''}`}/>
                    </div>
                    {isOpen && (
                      <div className="px-5 pb-4 pt-1 bg-slate-50 dark:bg-slate-700/20">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                          <div><p className="text-slate-400 text-xs">Salario base</p><p className="font-semibold text-slate-700 dark:text-slate-200">{(n.salario_base||0).toLocaleString('es-ES')}€</p></div>
                          <div><p className="text-slate-400 text-xs">Complementos</p><p className="font-semibold text-slate-700 dark:text-slate-200">{(n.complementos||0).toLocaleString('es-ES')}€</p></div>
                          <div><p className="text-slate-400 text-xs">IRPF ({n.irpf_pct||18}%)</p><p className="font-semibold text-red-500">-{irpf.toFixed(2)}€</p></div>
                          <div><p className="text-slate-400 text-xs">SS ({n.ss_pct||6.35}%)</p><p className="font-semibold text-red-500">-{ss.toFixed(2)}€</p></div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600 flex items-center justify-between">
                          <span className="text-sm text-slate-500">Total neto a cobrar</span>
                          <span className="text-lg font-black text-emerald-600">{(n.liquido||0).toFixed(2)}€</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
          }
        </div>
      </div>
    </div>
  )
}