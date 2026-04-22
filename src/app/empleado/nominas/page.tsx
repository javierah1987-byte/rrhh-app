// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { DollarSign, ChevronDown, ChevronUp, FileText, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

const MESES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function NominasEmpleadoPage() {
  const [nominas, setNominas] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandida, setExpandida] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const cargar = async () => {
      const { data:{ user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: emp } = await supabase.from('empleados').select('id,nombre,puesto,departamento').eq('user_id', user.id).single()
      if (!emp) { setLoading(false); return }
      const { data: noms } = await supabase.from('nominas').select('*').eq('empleado_id', emp.id).order('anio', {ascending:false}).order('mes', {ascending:false})
      setNominas(noms || [])
      setLoading(false)
    }
    cargar()
  }, [])

  if (loading) return <div className="p-8 text-slate-400 animate-pulse text-sm">Cargando nóminas...</div>

  const totalAnio = nominas.filter(n=>n.anio===2026).reduce((s,n)=>(s+(n.liquido||0)),0)

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-4">
      <button onClick={()=>router.back()} className="flex items-center gap-2 text-slate-400 hover:text-slate-700 text-sm mb-2">
        <ArrowLeft className="w-4 h-4"/> Volver
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Mis nóminas</h1>
          <p className="text-slate-400 text-sm">Historial de pagos</p>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl px-4 py-2.5 text-right">
          <p className="text-xs text-indigo-400">Total cobrado 2026</p>
          <p className="text-xl font-black text-indigo-600">{totalAnio.toLocaleString('es-ES',{minimumFractionDigits:0})}€</p>
        </div>
      </div>

      {nominas.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
          <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3"/>
          <p className="text-slate-500">No hay nóminas registradas</p>
        </div>
      )}

      <div className="space-y-2">
        {nominas.map(n => {
          const isOpen = expandida === n.id
          const bruto = n.salario_base + (n.complementos||0)
          const irpf = bruto * ((n.irpf_pct||0)/100)
          const ss = bruto * ((n.ss_pct||0)/100)
          const liquido = n.liquido || (bruto - irpf - ss)

          return (
            <div key={n.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <button onClick={()=>setExpandida(isOpen?null:n.id)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors text-left">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-5 h-5 text-indigo-600"/>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-700 dark:text-slate-200">{MESES[n.mes]} {n.anio}</p>
                  <p className="text-xs text-slate-400">Salario base: {n.salario_base?.toLocaleString('es-ES')}€</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-black text-emerald-600">{liquido.toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2})}€</p>
                  <p className="text-xs text-slate-400">neto</p>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0"/> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0"/>}
              </button>

              {isOpen && (
                <div className="border-t border-slate-100 dark:border-slate-700 px-5 py-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {label:'Salario base',       val: n.salario_base,         color:'text-slate-700 dark:text-slate-200'},
                      {label:'Complementos',       val: n.complementos||0,      color:'text-slate-700 dark:text-slate-200'},
                      {label:'Total bruto',        val: bruto,                  color:'text-slate-700 dark:text-slate-200', bold:true},
                      {label:'IRPF ('+((n.irpf_pct)||0)+'%)',val:-irpf,       color:'text-red-500'},
                      {label:'Seg. Social ('+((n.ss_pct)||0)+'%)',val:-ss,    color:'text-red-500'},
                      {label:'Líquido a cobrar',   val: liquido,               color:'text-emerald-600', bold:true, big:true},
                    ].map((r,i) => (
                      <div key={i} className={`p-3 rounded-lg ${r.big?'col-span-2 bg-emerald-50 dark:bg-emerald-900/20':'bg-slate-50 dark:bg-slate-700/30'}`}>
                        <p className="text-xs text-slate-400 mb-0.5">{r.label}</p>
                        <p className={`font-bold ${r.color} ${r.big?'text-xl':r.bold?'text-base':'text-sm'}`}>
                          {r.val >= 0 ? '+' : ''}{r.val.toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2})}€
                        </p>
                      </div>
                    ))}
                  </div>
                  <button onClick={()=>window.print()}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <FileText className="w-4 h-4"/> Descargar / Imprimir
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}