'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Breadcrumb } from '@/components/Breadcrumb'
import { SkeletonStats } from '@/components/shared'
import { Download, TrendingUp, Users, AlertTriangle, Clock } from 'lucide-react'
import * as XLSX from 'xlsx'

const MESES=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

type KPI={activos:number;bajas:number;tasaBaja:number;vacacionesActivas:number;mediaHoras:number;nominaTotal:number;nominaMedia:number}

function KpiCard({label,value,desc,icon,color}:{label:string;value:string;desc?:string;icon:React.ReactNode;color:string}){
  return(
    <div className="card p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>{icon}</div>
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">{value}</p>
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1">{label}</p>
      {desc&&<p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
    </div>
  )
}

function MiniBar({pct,color}:{pct:number;color:string}){
  return <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-700" style={{width:`${Math.min(pct,100)}%`,background:color}}/></div>
}

export default function AdminInformesPage(){
  const [kpis,setKpis]=useState<KPI|null>(null)
  const [depStats,setDepStats]=useState<{dep:string;count:number}[]>([])
  const [loading,setLoading]=useState(true)
  const [exporting,setExporting]=useState(false)
  const [mesExport,setMesExport]=useState(new Date().getMonth()+1)
  const [anioExport,setAnioExport]=useState(new Date().getFullYear())

  useEffect(()=>{
    const hoy=new Date().toISOString().slice(0,10)
    Promise.all([
      supabase.from('empleados').select('id,departamento,estado'),
      supabase.from('bajas').select('id').eq('activa',true),
      supabase.from('solicitudes').select('id').eq('estado','aprobada').lte('fecha_inicio',hoy).gte('fecha_fin',hoy),
      supabase.from('nominas').select('liquido,salario_base').gte('anio',new Date().getFullYear()-1),
      supabase.from('fichajes').select('fecha,tipo').eq('tipo','entrada').gte('fecha',new Date(new Date().setDate(1)).toISOString().slice(0,10)),
    ]).then(([{data:emps},{data:bajas},{data:vacs},{data:noms},{data:fichs}])=>{
      const total=emps?.length||0
      const activos=emps?.filter(e=>e.estado==='activo').length||0
      const bajasN=bajas?.length||0
      const tasaBaja=total>0?Math.round((bajasN/total)*1000)/10:0
      const vacHoy=vacs?.length||0
      const nominaTotal=noms?.reduce((s,n)=>s+(n.liquido||0),0)||0
      const nominaMedia=noms?.length?Math.round(nominaTotal/noms.length):0
      const diasFichs=new Set(fichs?.map(f=>f.fecha)||[]).size
      setKpis({activos,bajas:bajasN,tasaBaja,vacacionesActivas:vacHoy,mediaHoras:Math.round(diasFichs*8),nominaTotal,nominaMedia})
      // Stats por departamento
      const byDep:Record<string,number>={}
      emps?.filter(e=>e.estado==='activo').forEach(e=>{ if(e.departamento) byDep[e.departamento]=(byDep[e.departamento]||0)+1 })
      setDepStats(Object.entries(byDep).sort((a,b)=>b[1]-a[1]).map(([dep,count])=>({dep,count})))
      setLoading(false)
    })
  },[])

  const exportExcel=async()=>{
    setExporting(true)
    const {data}=await supabase.from('nominas').select('*,empleados(nombre,departamento,puesto,email)').eq('mes',mesExport).eq('anio',anioExport)
    if(!data?.length){alert('No hay nóminas para ese período');setExporting(false);return}
    const rows=data.map(n=>({
      'Nombre':(n.empleados as any).nombre,'Email':(n.empleados as any).email,'Departamento':(n.empleados as any).departamento||'',
      'Mes':MESES[n.mes-1],'Año':n.anio,'Salario Base':n.salario_base,'Complementos':n.complementos,
      'IRPF %':n.irpf_pct,'SS %':n.ss_pct,'Líquido':n.liquido
    }))
    const ws=XLSX.utils.json_to_sheet(rows)
    const wb=XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb,ws,`Nóminas ${MESES[mesExport-1]}`)
    XLSX.writeFile(wb,`nominas_${anioExport}_${String(mesExport).padStart(2,'0')}.xlsx`)
    setExporting(false)
  }

  const exportEmpleados=async()=>{
    const {data}=await supabase.from('empleados').select('nombre,email,departamento,puesto,estado,tipo_contrato,fecha_alta,telefono,fecha_nacimiento')
    const ws=XLSX.utils.json_to_sheet(data||[])
    const wb=XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb,ws,'Empleados')
    XLSX.writeFile(wb,'empleados_nexohr.xlsx')
  }

  const maxDep=Math.max(...depStats.map(d=>d.count),1)

  if(loading) return <div className="space-y-5"><SkeletonStats cols={4}/><SkeletonStats cols={3}/></div>

  return(
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb/>
      <h1 className="page-title">📊 Informes y KPIs</h1>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 stagger">
        <KpiCard label="Empleados activos" value={String(kpis?.activos||0)} icon={<Users className="w-5 h-5 text-indigo-600"/>} color="bg-indigo-50 dark:bg-indigo-900/30"/>
        <KpiCard label="Tasa de absentismo" value={`${kpis?.tasaBaja||0}%`} desc={`${kpis?.bajas||0} bajas activas`} icon={<AlertTriangle className="w-5 h-5 text-red-500"/>} color="bg-red-50 dark:bg-red-900/30"/>
        <KpiCard label="De vacaciones hoy" value={String(kpis?.vacacionesActivas||0)} icon={<TrendingUp className="w-5 h-5 text-emerald-600"/>} color="bg-emerald-50 dark:bg-emerald-900/30"/>
        <KpiCard label="Coste nómina medio" value={(kpis?.nominaMedia||0).toLocaleString('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:0})} desc="Líquido por empleado" icon={<Clock className="w-5 h-5 text-amber-600"/>} color="bg-amber-50 dark:bg-amber-900/30"/>
      </div>

      {/* Por departamento */}
      {depStats.length>0&&(
        <div className="card p-5">
          <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Distribución por departamento</h2>
          <div className="space-y-3">
            {depStats.map(d=>(
              <div key={d.dep} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{d.dep}</span>
                  <span className="text-slate-500 dark:text-slate-400 tabular-nums">{d.count} empleados</span>
                </div>
                <MiniBar pct={(d.count/maxDep)*100} color="#6366f1"/>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exportaciones */}
      <div className="card p-5">
        <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2"><Download className="w-4 h-4 text-indigo-500"/>Exportar datos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-700/40 rounded-xl space-y-3">
            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Nóminas por período</p>
            <div className="flex gap-2">
              <select value={mesExport} onChange={e=>setMesExport(+e.target.value)} className="input flex-1 text-sm">
                {MESES.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
              </select>
              <select value={anioExport} onChange={e=>setAnioExport(+e.target.value)} className="input w-24 text-sm">
                {[2025,2026,2027].map(a=><option key={a}>{a}</option>)}
              </select>
            </div>
            <button onClick={exportExcel} disabled={exporting} className="btn-primary w-full text-sm">
              {exporting?<div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/>:<><Download className="w-4 h-4"/>Exportar Excel</>}
            </button>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-700/40 rounded-xl space-y-3">
            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Listado de empleados</p>
            <p className="text-xs text-slate-400">Exporta toda la plantilla con datos de contacto y contrato.</p>
            <button onClick={exportEmpleados} className="btn-secondary w-full text-sm"><Download className="w-4 h-4"/>Exportar empleados</button>
          </div>
        </div>
      </div>
    </div>
  )
}