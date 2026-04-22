'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, Clock, CalendarDays, TrendingUp, TrendingDown, AlertCircle, CheckCircle, BarChart2, Activity, Building2, Receipt, UserCheck, Wifi } from 'lucide-react'

type KA={fecha:string;presentes:number;total_activos:number}
type KH={id:string;nombre:string;departamento:string;avatar_color:string;horas_semana:number;dias_fichados_mes:number;horas_mes_aprox:number}
type KB={departamento:string;empleados:number;con_baja:number;de_vacaciones:number}
type KG={total_empleados:number;activos_hoy:number;solicitudes_pendientes:number;gastos_mes:number;bajas_activas:number;de_vacaciones:number}

export default function AdminDashboardPage(){

  const [cumpleanos, setCumpleanos] = useState([])
  const [alertas, setAlertas] = useState([])

  useEffect(() => {
    // Cumpleaños próximos 30 días
    supabase.from('empleados').select('id,nombre,fecha_nacimiento,departamento').not('fecha_nacimiento','is',null)
      .then(({data}) => {
        if(!data) return
        const hoy = new Date()
        const prox = data.map(e => {
          const d = new Date(e.fecha_nacimiento); d.setFullYear(hoy.getFullYear())
          if(d < hoy) d.setFullYear(hoy.getFullYear() + 1)
          return {...e, dias: Math.floor((d - hoy) / 86400000)}
        }).filter(e => e.dias <= 30).sort((a,b) => a.dias - b.dias)
        setCumpleanos(prox)
      })
    // Alertas
    Promise.all([
      supabase.from('empleados').select('nombre,fecha_fin_contrato').not('fecha_fin_contrato','is',null)
        .gte('fecha_fin_contrato', new Date().toISOString().split('T')[0])
        .lte('fecha_fin_contrato', new Date(Date.now()+30*86400000).toISOString().split('T')[0]),
      supabase.from('gastos').select('id',{count:'exact',head:true}).eq('estado','pendiente'),
    ]).then(([c, g]) => {
      const a = []
      c.data?.forEach(x => a.push({icono:'📋', mensaje:'Contrato de '+x.nombre+' vence pronto', detalle: new Date(x.fecha_fin_contrato).toLocaleDateString('es-ES')}))
      if((g.count||0) > 0) a.push({icono:'💰', mensaje:(g.count||0)+' gasto'+(g.count>1?'s':'')+' pendiente'+(g.count>1?'s':'')+' de aprobar', detalle:'Ir a Administración'})
      setAlertas(a)
    })
  }, [])

  const [asistencia,setAsistencia]=useState<KA[]>([])
  const [horas,setHoras]=useState<KH[]>([])
  const [absentismo,setAbsentismo]=useState<KB[]>([])
  const [kpis,setKpis]=useState<KG|null>(null)
  const [loading,setLoading]=useState(true)
  const [nombre,setNombre]=useState('Admin')

  const cargar=useCallback(async()=>{
    const{data:{user}}=await supabase.auth.getUser()
    if(user){const{data:emp}=await supabase.from('empleados').select('nombre').eq('user_id',user.id).single();if(emp)setNombre((emp as any).nombre.split(' ')[0])}
    const[a,h,ab,emps,sols,gastos,bajas]=await Promise.all([
      supabase.from('kpi_asistencia_diaria').select('*').limit(30),
      supabase.from('kpi_horas_mes').select('*'),
      supabase.from('kpi_absentismo').select('*'),
      supabase.from('empleados').select('id,estado,rol').in('rol',['empleado','manager']),
      supabase.from('solicitudes').select('id').eq('estado','pendiente'),
      supabase.from('gastos').select('importe').gte('fecha',new Date(new Date().getFullYear(),new Date().getMonth(),1).toISOString().split('T')[0]),
      supabase.from('solicitudes').select('id').eq('tipo','baja').eq('estado','aprobada'),
    ])
    setAsistencia(a.data||[]);setHoras(h.data||[]);setAbsentismo(ab.data||[])
    const empList=emps.data||[]
    const presenciaHoy=(a.data||[]).find(d=>d.fecha===new Date().toISOString().split('T')[0])
    setKpis({total_empleados:empList.length,activos_hoy:presenciaHoy?.presentes||0,solicitudes_pendientes:sols.data?.length||0,gastos_mes:(gastos.data||[]).reduce((s,g)=>s+(g.importe||0),0),bajas_activas:bajas.data?.length||0,de_vacaciones:empList.filter(e=>e.estado==='vacaciones').length})
    setLoading(false)
  },[])
  useEffect(()=>{cargar()},[cargar])

  const maxPresentes=Math.max(...asistencia.map(d=>d.presentes),1)
  const ultimosDias=asistencia.slice(-14)
  const promedioAsistencia=asistencia.length>0?Math.round(asistencia.reduce((s,d)=>s+d.presentes,0)/asistencia.length):0
  const hoy=asistencia.find(d=>d.fecha===new Date().toISOString().split('T')[0])
  const ayer=asistencia.slice(-2)[0]
  const tendencia=hoy&&ayer?hoy.presentes-ayer.presentes:0

  if(loading)return(<div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>)

  return(
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Buenos días, {nombre} 👋</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {icon:Users,label:'Empleados',value:kpis?.total_empleados||0,sub:(kpis?.activos_hoy||0)+' fichados hoy',color:'text-indigo-500',bg:'bg-indigo-50 dark:bg-indigo-900/20'},
          {icon:Wifi,label:'Fichados hoy',value:kpis?.activos_hoy||0,sub:'de '+(kpis?.total_empleados||0)+' total',color:'text-emerald-500',bg:'bg-emerald-50 dark:bg-emerald-900/20'},
          {icon:CalendarDays,label:'Solicitudes',value:kpis?.solicitudes_pendientes||0,sub:'pendientes de aprobar',color:(kpis?.solicitudes_pendientes??0)>0?'text-amber-500':'text-slate-400',bg:(kpis?.solicitudes_pendientes??0)>0?'bg-amber-50 dark:bg-amber-900/20':'bg-slate-50 dark:bg-slate-700/30'},
          {icon:Receipt,label:'Gastos mes',value:(kpis?.gastos_mes?.toFixed(0)||0)+'€',sub:'registrados este mes',color:'text-blue-500',bg:'bg-blue-50 dark:bg-blue-900/20'},
        ].map((k,i)=>{const Icon=k.icon;return(
          <div key={i} className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{k.label}</p>
              <div className={"w-8 h-8 rounded-xl "+k.bg+" flex items-center justify-center"}><Icon className={"w-4 h-4 "+k.color}/></div>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-none">{k.value}</p>
            <p className="text-xs text-slate-400 mt-1">{k.sub}</p>
          </div>
        )})}
      </div>

      {((kpis?.bajas_activas||0)+(kpis?.solicitudes_pendientes||0))>0&&(
        <div className="flex gap-3 flex-wrap">
          {(kpis?.solicitudes_pendientes||0)>0&&<div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl text-sm text-amber-700 dark:text-amber-300"><AlertCircle className="w-4 h-4 flex-shrink-0"/><span><strong>{kpis?.solicitudes_pendientes}</strong> solicitud(es) esperando tu aprobación</span></div>}
          {(kpis?.bajas_activas||0)>0&&<div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-sm text-red-700 dark:text-red-300"><AlertCircle className="w-4 h-4 flex-shrink-0"/><span><strong>{kpis?.bajas_activas}</strong> empleado(s) de baja actualmente</span></div>}
        </div>
      )}

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div><h2 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2"><Activity className="w-4 h-4 text-indigo-500"/>Asistencia diaria</h2><p className="text-xs text-slate-400 mt-0.5">Últimas 2 semanas · Promedio: {promedioAsistencia} personas/día</p></div>
          <div className={"flex items-center gap-1 text-sm font-semibold "+(tendencia>=0?'text-emerald-600':'text-red-500')}>
            {tendencia>=0?<TrendingUp className="w-4 h-4"/>:<TrendingDown className="w-4 h-4"/>}{tendencia>=0?'+':''}{tendencia} hoy
          </div>
        </div>
        <div className="flex items-end gap-0.5 h-32 px-1 border-b border-slate-100 dark:border-slate-700 mb-1">
          {ultimosDias.map((d,i)=>{
            const barPx=maxPresentes>0?Math.max(Math.round((d.presentes/maxPresentes)*120),d.presentes>0?8:3):3
            const isHoy=d.fecha===new Date().toISOString().split('T')[0]
            const dia=new Date(d.fecha+'T12:00:00').toLocaleDateString('es-ES',{weekday:'narrow'})
            const clr=d.presentes===0?"rgb(226,232,240)":`rgba(99,102,241,${(0.35+d.presentes/maxPresentes*0.65).toFixed(2)})`
            return(<div key={i} title={d.presentes+" presentes"} className="flex-1 flex flex-col justify-end items-center group cursor-default">
              {d.presentes>0&&<span className="text-[8px] text-slate-400 opacity-0 group-hover:opacity-100 mb-0.5 transition-opacity leading-none">{d.presentes}</span>}
              <div className="w-full rounded-t transition-all" style={{height:barPx+"px",background:clr}}/>
              <span className={"text-[9px] mt-1 "+(isHoy?"text-indigo-600 font-bold":"text-slate-400")}>{dia}</span>
            </div>)
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4"><Clock className="w-4 h-4 text-indigo-500"/>Horas este mes</h2>
          <div className="space-y-2">
            {horas.slice(0,6).map(emp=>{
              const pct=Math.min(Math.round((emp.horas_mes_aprox/Math.max(emp.horas_semana*Math.max(emp.dias_fichados_mes,1)/5,1))*100),120)
              return(<div key={emp.id} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{backgroundColor:emp.avatar_color||'#6366f1'}}>{emp.nombre.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{emp.nombre.split(' ')[0]}</span>
                    <span className="text-xs text-slate-400 flex-shrink-0 ml-2">{emp.horas_mes_aprox}h</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{width:Math.min(pct,100)+'%',background:pct>=90?'#10b981':pct>=70?'#f59e0b':'#ef4444'}}/>
                  </div>
                </div>
              </div>)
            })}
            {horas.length===0&&<p className="text-sm text-slate-400 text-center py-4">Sin datos de fichaje este mes</p>}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4"><BarChart2 className="w-4 h-4 text-indigo-500"/>Situación por departamento</h2>
          <div className="space-y-3">
            {absentismo.map(dept=>{
              const pctP=Math.round(((dept.empleados-dept.con_baja-dept.de_vacaciones)/Math.max(dept.empleados,1))*100)
              return(<div key={dept.departamento}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{dept.departamento}</span>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    {dept.con_baja>0&&<span className="text-red-500">{dept.con_baja} baja</span>}
                    {dept.de_vacaciones>0&&<span className="text-sky-500">{dept.de_vacaciones} vacaciones</span>}
                    <span>{dept.empleados} total</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
                  <div className="h-full bg-emerald-400" style={{width:pctP+'%'}}/>
                  <div className="h-full bg-sky-300" style={{width:Math.round((dept.de_vacaciones/Math.max(dept.empleados,1))*100)+'%'}}/>
                  <div className="h-full bg-red-400" style={{width:Math.round((dept.con_baja/Math.max(dept.empleados,1))*100)+'%'}}/>
                </div>
              </div>)
            })}
            {absentismo.length===0&&<p className="text-sm text-slate-400 text-center py-4">Sin departamentos configurados</p>}
          </div>
          <div className="flex gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            {[{c:'bg-emerald-400',l:'Presentes'},{c:'bg-sky-300',l:'Vacaciones'},{c:'bg-red-400',l:'Baja'}].map(x=>(
              <div key={x.l} className="flex items-center gap-1.5"><div className={"w-2.5 h-2.5 rounded-full "+x.c}/><span className="text-[10px] text-slate-400">{x.l}</span></div>
            ))}
          </div>
        </div>
      </div>


      {/* Cumpleaños y alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-slate-700">
            <span className="text-lg">🎂</span>
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Próximos cumpleaños</h3>
            {cumpleanos.length>0&&<span className="ml-auto bg-pink-100 text-pink-700 text-xs px-2 py-0.5 rounded-full font-medium">{cumpleanos.length}</span>}
          </div>
          {cumpleanos.length===0
            ? <p className="text-slate-400 text-sm p-5">Sin cumpleaños en los próximos 30 días</p>
            : <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {cumpleanos.map(e=>(
                  <div key={e.id} className="flex items-center gap-3 px-5 py-2.5">
                    <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-sm font-bold text-pink-600 flex-shrink-0">{e.nombre?.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{e.nombre}</p>
                      <p className="text-xs text-slate-400">{e.departamento}</p>
                    </div>
                    <span className={"text-xs font-semibold flex-shrink-0 "+(e.dias===0?'text-pink-600':e.dias<=7?'text-amber-600':'text-slate-400')}>
                      {e.dias===0?'🎉 Hoy':e.dias===1?'Mañana':('en '+e.dias+'d')}
                    </span>
                  </div>
                ))}
              </div>}
        </div>
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-slate-700">
            <span className="text-lg">⚠️</span>
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Alertas del equipo</h3>
            {alertas.length>0&&<span className="ml-auto bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">{alertas.length}</span>}
          </div>
          {alertas.length===0
            ? <div className="p-5 flex items-center gap-2"><span>✅</span><p className="text-sm font-medium text-emerald-600">Todo en orden</p></div>
            : <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {alertas.map((a,i)=>(
                  <div key={i} className="flex items-start gap-3 px-5 py-2.5">
                    <span className="text-base flex-shrink-0 mt-0.5">{a.icono}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{a.mensaje}</p>
                      <p className="text-xs text-slate-400 truncate">{a.detalle}</p>
                    </div>
                  </div>
                ))}
              </div>}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {icon:Wifi,label:"Who's In",href:'/admin/whois',color:'#10b981'},
          {icon:UserCheck,label:'Empleados',href:'/admin/empleados',color:'#6366f1'},
          {icon:CalendarDays,label:'Solicitudes',href:'/admin/vacaciones',color:'#f59e0b',badge:kpis?.solicitudes_pendientes},
          {icon:Building2,label:'Centros',href:'/admin/centros',color:'#0891b2'},
        ].map(a=>{const Icon=a.icon;return(
          <a key={a.href} href={a.href} className="card p-4 flex flex-col items-center gap-2 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer relative">
            {(a as any).badge>0&&<span className="absolute top-2 right-2 text-[9px] font-bold bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center">{(a as any).badge}</span>}
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:a.color+'15'}}><Icon className="w-5 h-5" style={{color:a.color}}/></div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{a.label}</span>
          </a>
        )})}
      </div>
    </div>
  )
}