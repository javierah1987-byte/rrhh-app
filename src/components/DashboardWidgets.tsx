// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Cake, AlertTriangle, Clock, TrendingUp, Users } from 'lucide-react'

export function CumpleañosWidget() {
  const [cumples, setCumples] = useState([])
  
  useEffect(() => {
    supabase.from('empleados')
      .select('id,nombre,fecha_nacimiento,departamento')
      .not('fecha_nacimiento', 'is', null)
      .then(({data}) => {
        if(!data) return
        const hoy = new Date()
        const proximos = data
          .map(e => {
            const cumple = new Date(e.fecha_nacimiento)
            cumple.setFullYear(hoy.getFullYear())
            if(cumple < hoy) cumple.setFullYear(hoy.getFullYear()+1)
            const dias = Math.floor((cumple - hoy) / 86400000)
            return {...e, dias, edad: hoy.getFullYear() - new Date(e.fecha_nacimiento).getFullYear() + (dias > 0 ? 0 : 1)}
          })
          .filter(e => e.dias <= 30)
          .sort((a,b) => a.dias - b.dias)
        setCumples(proximos)
      })
  }, [])

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
        <Cake className="w-4 h-4 text-pink-500"/>
        <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Próximos cumpleaños</h3>
        {cumples.length > 0 && <span className="ml-auto bg-pink-100 text-pink-700 text-xs px-2 py-0.5 rounded-full font-medium">{cumples.length}</span>}
      </div>
      {cumples.length === 0 ? (
        <p className="text-slate-400 text-sm p-4">No hay cumpleaños en los próximos 30 días</p>
      ) : (
        <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
          {cumples.map(e => (
            <div key={e.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-sm font-bold text-pink-600 flex-shrink-0">
                {e.nombre?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{e.nombre}</p>
                <p className="text-xs text-slate-400">{e.departamento} · {e.edad} años</p>
              </div>
              <span className={`text-xs font-semibold flex-shrink-0 ${e.dias === 0 ? 'text-pink-600' : e.dias <= 7 ? 'text-amber-600' : 'text-slate-400'}`}>
                {e.dias === 0 ? '🎂 Hoy' : e.dias === 1 ? 'Mañana' : `en ${e.dias}d`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function AlertasWidget() {
  const [alertas, setAlertas] = useState([])
  
  useEffect(() => {
    const load = async () => {
      const alerts = []
      
      // Contratos próximos a vencer (30 días)
      const {data: contratos} = await supabase.from('empleados')
        .select('nombre,fecha_fin_contrato,tipo_contrato')
        .not('fecha_fin_contrato', 'is', null)
        .gte('fecha_fin_contrato', new Date().toISOString().split('T')[0])
        .lte('fecha_fin_contrato', new Date(Date.now() + 30*86400000).toISOString().split('T')[0])
      
      contratos?.forEach(c => {
        const dias = Math.floor((new Date(c.fecha_fin_contrato) - new Date()) / 86400000)
        alerts.push({ tipo: 'contrato', nombre: c.nombre, mensaje: `Contrato vence en ${dias} días`, nivel: dias <= 7 ? 'alta' : 'media' })
      })
      
      // Empleados sin fichar hoy
      const {data: empTotal} = await supabase.from('empleados').select('id,nombre').eq('estado','activo')
      const {data: fichHoy} = await supabase.from('fichajes').select('empleado_id').eq('fecha', new Date().toISOString().split('T')[0]).eq('tipo','entrada')
      const sinFichar = empTotal?.filter(e => !fichHoy?.some(f => f.empleado_id === e.id)) || []
      if (sinFichar.length > 0) {
        alerts.push({ tipo: 'fichaje', nombre: sinFichar.map(e=>e.nombre.split(' ')[0]).join(', '), mensaje: `${sinFichar.length} empleado${sinFichar.length>1?'s':''} sin fichar hoy`, nivel: 'baja' })
      }
      
      // Gastos pendientes de aprobar
      const {count: gastosPend} = await supabase.from('gastos').select('id', {count:'exact',head:true}).eq('estado','pendiente')
      if (gastosPend > 0) {
        alerts.push({ tipo: 'gasto', nombre: 'Gastos', mensaje: `${gastosPend} gasto${gastosPend>1?'s':''} pendiente${gastosPend>1?'s':''} de aprobar`, nivel: 'baja' })
      }
      
      setAlertas(alerts)
    }
    load()
  }, [])

  const colorNivel = { alta:'text-red-600 bg-red-50', media:'text-amber-600 bg-amber-50', baja:'text-blue-600 bg-blue-50' }
  const iconoTipo = { contrato:'📋', fichaje:'⏰', gasto:'💰' }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
        <AlertTriangle className="w-4 h-4 text-amber-500"/>
        <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Alertas del equipo</h3>
        {alertas.length > 0 && <span className="ml-auto bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">{alertas.length}</span>}
      </div>
      {alertas.length === 0 ? (
        <div className="p-4 flex items-center gap-2 text-emerald-600">
          <span className="text-lg">✅</span>
          <p className="text-sm font-medium">Todo en orden</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
          {alertas.map((a, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-2.5">
              <span className="text-lg flex-shrink-0 mt-0.5">{iconoTipo[a.tipo]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{a.mensaje}</p>
                <p className="text-xs text-slate-400 truncate">{a.nombre}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${colorNivel[a.nivel]}`}>
                {a.nivel.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}