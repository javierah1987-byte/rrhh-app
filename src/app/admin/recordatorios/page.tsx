'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Bell, AlertTriangle, Calendar, Award, Clock, CheckCircle } from 'lucide-react'

type Emp = { id:string; nombre:string; avatar_color:string; puesto:string; fecha_alta:string; tipo_contrato:string; jornada_horas:number }
type Alerta = { id:string; tipo:string; titulo:string; descripcion:string; urgencia:'alta'|'media'|'baja'; fecha:string; empleado:Emp }

function diasHasta(fechaStr: string): number {
  return Math.round((new Date(fechaStr).getTime()-Date.now())/86400000)
}
function diasDesde(fechaStr: string): number {
  return Math.round((Date.now()-new Date(fechaStr).getTime())/86400000)
}
function addAnio(fecha: string, n: number): string {
  const d = new Date(fecha); d.setFullYear(d.getFullYear()+n); return d.toISOString().slice(0,10)
}

export default function RecordatoriosPage() {
  const [empleados, setEmpleados] = useState<Emp[]>([])
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todas'|'alta'|'media'|'baja'>('todas')

  useEffect(() => {
    supabase.from('empleados').select('id,nombre,avatar_color,puesto,fecha_alta,tipo_contrato,jornada_horas')
      .eq('estado','activo').order('nombre')
      .then(({ data }) => {
        const emps = data||[]
        setEmpleados(emps)
        generarAlertas(emps)
        setLoading(false)
      })
  }, [])

  function generarAlertas(emps: Emp[]) {
    const alerts: Alerta[] = []
    const hoy = new Date().toISOString().slice(0,10)

    emps.forEach(e => {
      if (!e.fecha_alta) return

      // Aniversarios de empresa (próximos 30 días)
      const anios = Math.floor(diasDesde(e.fecha_alta)/365)
      const proxAniversario = addAnio(e.fecha_alta, anios+1)
      const diasAniv = diasHasta(proxAniversario)
      if (diasAniv >= 0 && diasAniv <= 30) {
        alerts.push({
          id: e.id+'-aniv', tipo:'aniversario',
          titulo: `🎂 ${anios+1}° aniversario — ${e.nombre}`,
          descripcion: diasAniv===0 ? '¡Hoy es su aniversario!' : `En ${diasAniv} días cumple ${anios+1} año${anios+1!==1?'s':''} en la empresa`,
          urgencia: diasAniv<=7?'alta':diasAniv<=15?'media':'baja',
          fecha: proxAniversario, empleado: e
        })
      }

      // Fin período de prueba (contratos temporales o prácticas: 2-6 meses)
      if (['temporal','practicas','formacion'].includes(e.tipo_contrato)) {
        const mesesPrueba = e.tipo_contrato==='practicas'?6:3
        const finPrueba = new Date(e.fecha_alta)
        finPrueba.setMonth(finPrueba.getMonth()+mesesPrueba)
        const finPruebaStr = finPrueba.toISOString().slice(0,10)
        const diasFin = diasHasta(finPruebaStr)
        if (diasFin >= 0 && diasFin <= 45) {
          alerts.push({
            id: e.id+'-prueba', tipo:'prueba',
            titulo: `⏱️ Fin período de prueba — ${e.nombre}`,
            descripcion: `Contrato ${e.tipo_contrato.replace(/_/g,' ')}. ${diasFin===0?'¡Vence hoy!':'Vence en '+diasFin+' días'}`,
            urgencia: diasFin<=7?'alta':diasFin<=20?'media':'baja',
            fecha: finPruebaStr, empleado: e
          })
        }
      }

      // Contratos temporales que llevan +1 año (posible conversión a indefinido)
      if (e.tipo_contrato==='temporal') {
        const diasContrato = diasDesde(e.fecha_alta)
        if (diasContrato > 365 && diasContrato < 730) {
          alerts.push({
            id: e.id+'-conversion', tipo:'conversion',
            titulo: `📋 Posible conversión a indefinido — ${e.nombre}`,
            descripcion: `Lleva ${Math.floor(diasContrato/30)} meses con contrato temporal. Revisar si procede conversión.`,
            urgencia: 'media',
            fecha: hoy, empleado: e
          })
        }
      }

      // Ausencias largas (sin fichajes recientes - más de 5 días sin actividad, no contando vacaciones)
      // Nota: simplificado sin cruzar con fichajes para no complicar
    })

    // Ordenar por urgencia y fecha
    const orden = {alta:0,media:1,baja:2}
    alerts.sort((a,b)=>(orden[a.urgencia]-orden[b.urgencia])||a.fecha.localeCompare(b.fecha))
    setAlertas(alerts)
  }

  const URGENCIA_STYLE = {
    alta: { card:'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20', badge:'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300', dot:'bg-red-500' },
    media: { card:'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20', badge:'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300', dot:'bg-amber-500' },
    baja: { card:'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50', badge:'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300', dot:'bg-slate-400' },
  }

  const filtradas = alertas.filter(a=>filtro==='todas'||a.urgencia===filtro)
  const counts = { alta:alertas.filter(a=>a.urgencia==='alta').length, media:alertas.filter(a=>a.urgencia==='media').length, baja:alertas.filter(a=>a.urgencia==='baja').length }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Recordatorios automáticos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Alertas generadas automáticamente a partir de los datos del equipo</p>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          {key:'alta',label:'Alta prioridad',count:counts.alta,color:'text-red-600',bg:'bg-red-50 dark:bg-red-900/30'},
          {key:'media',label:'Media prioridad',count:counts.media,color:'text-amber-600',bg:'bg-amber-50 dark:bg-amber-900/30'},
          {key:'baja',label:'Baja prioridad',count:counts.baja,color:'text-slate-600 dark:text-slate-400',bg:'bg-slate-50 dark:bg-slate-800'},
        ].map(s=>(
          <button key={s.key} onClick={()=>setFiltro(s.key as any)}
            className={`stat-card text-left transition-all ${filtro===s.key?'ring-2 ring-indigo-500':''}`}>
            <span className={`text-2xl font-bold ${s.color}`}>{s.count}</span>
            <span className="stat-label">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        {(['todas','alta','media','baja'] as const).map(f=>(
          <button key={f} onClick={()=>setFiltro(f)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium capitalize transition-colors ${filtro===f?'bg-indigo-600 text-white':'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
            {f}
          </button>
        ))}
        <button onClick={()=>window.location.reload()} className="ml-auto btn-secondary text-xs px-3 py-1.5">↻ Actualizar</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>
      ) : filtradas.length===0 ? (
        <div className="card p-12 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3"/>
          <p className="text-slate-700 dark:text-slate-300 font-medium">¡Todo en orden!</p>
          <p className="text-slate-400 text-sm mt-1">No hay recordatorios pendientes {filtro!=='todas'?'de prioridad '+filtro:''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map(alerta => {
            const s = URGENCIA_STYLE[alerta.urgencia]
            return (
              <div key={alerta.id} className={`rounded-2xl border p-5 ${s.card}`}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{backgroundColor:alerta.empleado.avatar_color||'#6366f1'}}>
                    {alerta.empleado.nombre.split(' ').map((n:string)=>n[0]).join('').substring(0,2)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{alerta.titulo}</span>
                      <span className={`badge ${s.badge} capitalize`}>{alerta.urgencia} prioridad</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{alerta.descripcion}</p>
                    <p className="text-xs text-slate-400 mt-1">{alerta.empleado.puesto} · {new Date(alerta.fecha).toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}