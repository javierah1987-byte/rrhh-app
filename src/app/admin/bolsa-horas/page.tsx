'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Clock, TrendingUp, TrendingDown, Minus, BarChart2 } from 'lucide-react'

type BolsaH={id:string;nombre:string;departamento:string;avatar_color:string;horas_semana:number;dias_laborables_mes:number;horas_contrato_mes:number;horas_reales_mes:number;saldo_horas_mes:number}

export default function AdminBolsaHorasPage(){
  const [datos,setDatos]=useState<BolsaH[]>([])
  const [loading,setLoading]=useState(true)

  const cargar=useCallback(async()=>{
    const{data}=await supabase.from('bolsa_horas_empleados').select('*')
    setDatos(data||[]);setLoading(false)
  },[])
  useEffect(()=>{cargar()},[cargar])

  const totalSaldo=datos.reduce((s,d)=>s+d.saldo_horas_mes,0)
  const conExtra=datos.filter(d=>d.saldo_horas_mes>0).length
  const conDeficit=datos.filter(d=>d.saldo_horas_mes<0).length
  const mes=new Date().toLocaleDateString('es-ES',{month:'long',year:'numeric'})

  return(
    <div>
      <div className="page-header mb-5">
        <div>
          <h1 className="page-title flex items-center gap-2"><Clock className="w-5 h-5 text-indigo-500"/>Bolsa de horas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Balance de horas mes actual · {mes}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          {label:'Saldo total equipo',value:(totalSaldo>=0?'+':'')+totalSaldo.toFixed(1)+'h',color:totalSaldo>=0?'text-emerald-600':'text-red-500',icon:totalSaldo>=0?TrendingUp:TrendingDown},
          {label:'Con horas extra',value:conExtra,color:'text-emerald-600',icon:TrendingUp},
          {label:'Con déficit',value:conDeficit,color:conDeficit>0?'text-red-500':'text-slate-400',icon:TrendingDown},
        ].map((k,i)=>{const Icon=k.icon;return(
          <div key={i} className="card p-4 text-center">
            <p className="text-xs text-slate-400 mb-1">{k.label}</p>
            <div className="flex items-center justify-center gap-1">
              <Icon className={`w-4 h-4 ${k.color}`}/>
              <span className={`text-xl font-black ${k.color}`}>{k.value}</span>
            </div>
          </div>
        )})}
      </div>

      {loading?<div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>
      :<div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-indigo-500"/>
          <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">Detalle por empleado</span>
          <span className="ml-auto text-xs text-slate-400">{datos[0]?.dias_laborables_mes||0} días laborables hasta hoy</span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {datos.map(emp=>{
            const saldo=emp.saldo_horas_mes
            const pctReal=emp.horas_contrato_mes>0?Math.min((emp.horas_reales_mes/emp.horas_contrato_mes)*100,130):0
            return(
              <div key={emp.id} className="p-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{backgroundColor:emp.avatar_color||'#6366f1'}}>
                  {emp.nombre.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{emp.nombre}</p>
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                      {saldo>0.1&&<TrendingUp className="w-3.5 h-3.5 text-emerald-500"/>}
                      {saldo<-0.1&&<TrendingDown className="w-3.5 h-3.5 text-red-500"/>}
                      {Math.abs(saldo)<=0.1&&<Minus className="w-3.5 h-3.5 text-slate-400"/>}
                      <span className={`text-sm font-bold ${saldo>0.1?'text-emerald-600':saldo<-0.1?'text-red-500':'text-slate-400'}`}>
                        {saldo>=0?'+':''}{saldo.toFixed(1)}h
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{width:Math.min(pctReal,100)+'%',background:pctReal>=95?'#10b981':pctReal>=80?'#f59e0b':'#ef4444'}}/>
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0 w-28 text-right">
                      {emp.horas_reales_mes}h / {emp.horas_contrato_mes}h contrato
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
          {datos.length===0&&<div className="p-12 text-center"><Clock className="w-10 h-10 text-slate-300 mx-auto mb-3"/><p className="text-slate-500">Sin datos de fichaje este mes</p></div>}
        </div>
      </div>}

      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
        <p className="text-xs text-slate-400">
          <strong className="text-slate-600 dark:text-slate-300">Cálculo:</strong> Horas contrato = (jornada semanal / 5) × días laborables del mes hasta hoy.
          Horas reales = suma de (hora salida - hora entrada) de cada día fichado.
          Los días sin fichar cuentan como 0h.
        </p>
      </div>
    </div>
  )
}