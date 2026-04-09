'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, Clock, FileText, Calendar, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { EmptyState, SkeletonStats, SkeletonCard } from '@/components/shared'

const MESES_CORTO=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function BarChart({data,color='#6366f1'}:{data:{label:string;value:number}[];color?:string}){
  const max=Math.max(...data.map(d=>d.value),1)
  return(
    <div className="flex items-end gap-1.5 h-28 pt-2">
      {data.map((d,i)=>(
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-medium">{d.value}</span>
          <div className="w-full rounded-t-md transition-all duration-500" style={{height:`${Math.max((d.value/max)*80,2)}px`,background:color,opacity:d.value===0?0.2:1}}/>
          <span className="text-[9px] text-slate-400 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

function MiniStat({label,value,delta,icon,color}:{label:string;value:number;delta?:string;icon:React.ReactNode;color:string}){
  const router=useRouter()
  return(
    <div className="stat-card card-hover" onClick={()=>{}}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${color}`}>{icon}</div>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      {delta&&<span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{delta}</span>}
    </div>
  )
}

export default function AdminDashboard(){
  const [stats,setStats]=useState({activos:0,pendientes:0,bajas:0,vacHoy:0})
  const [fichMes,setFichMes]=useState<{label:string;value:number}[]>([])
  const [solMes,setSolMes]=useState<{label:string;value:number}[]>([])
  const [loading,setLoading]=useState(true)
  const router=useRouter()

  useEffect(()=>{
    const hoy=new Date()
    const iso=hoy.toISOString().slice(0,10)
    Promise.all([
      supabase.from('empleados').select('id',{count:'exact',head:true}).eq('estado','activo'),
      supabase.from('solicitudes').select('id',{count:'exact',head:true}).eq('estado','pendiente'),
      supabase.from('bajas').select('id',{count:'exact',head:true}).eq('activa',true),
      supabase.from('solicitudes').select('id',{count:'exact',head:true}).eq('estado','aprobada').lte('fecha_inicio',iso).gte('fecha_fin',iso),
    ]).then(([{count:a},{count:p},{count:b},{count:v}])=>{
      setStats({activos:a||0,pendientes:p||0,bajas:b||0,vacHoy:v||0})
    })
    // Fichajes últimos 6 meses
    const hace6=new Date(hoy); hace6.setMonth(hace6.getMonth()-5)
    supabase.from('fichajes').select('fecha').gte('fecha',hace6.toISOString().slice(0,10)).eq('tipo','entrada').then(({data})=>{
      const counts:Record<string,number>={}
      for(let i=5;i>=0;i--){ const d=new Date(hoy); d.setMonth(d.getMonth()-i); counts[MESES_CORTO[d.getMonth()]]=0 }
      data?.forEach(f=>{ const m=MESES_CORTO[new Date(f.fecha).getMonth()]; if(m in counts) counts[m]++ })
      setFichMes(Object.entries(counts).map(([label,value])=>({label,value})))
    })
    // Solicitudes últimos 6 meses
    supabase.from('solicitudes').select('created_at').gte('created_at',hace6.toISOString()).then(({data})=>{
      const counts:Record<string,number>={}
      for(let i=5;i>=0;i--){ const d=new Date(hoy); d.setMonth(d.getMonth()-i); counts[MESES_CORTO[d.getMonth()]]=0 }
      data?.forEach(s=>{ const m=MESES_CORTO[new Date(s.created_at).getMonth()]; if(m in counts) counts[m]++ })
      setSolMes(Object.entries(counts).map(([label,value])=>({label,value})))
      setLoading(false)
    })
  },[])

  const fechaHoy=new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'})

  if(loading) return(
    <div className="space-y-5 animate-fade-in">
      <div><div className="skeleton h-8 w-48 mb-2"/><div className="skeleton h-4 w-64"/></div>
      <SkeletonStats cols={4}/><div className="grid grid-cols-1 xl:grid-cols-2 gap-5"><SkeletonCard/><SkeletonCard/></div>
    </div>
  )

  return(
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 capitalize">{fechaHoy}</p>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 stagger">
        <MiniStat label="Empleados activos" value={stats.activos} icon={<Users className="w-5 h-5 text-indigo-600"/>} color="bg-indigo-50 dark:bg-indigo-900/30"/>
        <MiniStat label="Solicitudes pendientes" value={stats.pendientes} icon={<Clock className="w-5 h-5 text-amber-600"/>} color="bg-amber-50 dark:bg-amber-900/30"/>
        <MiniStat label="Bajas activas" value={stats.bajas} icon={<FileText className="w-5 h-5 text-red-600"/>} color="bg-red-50 dark:bg-red-900/30"/>
        <MiniStat label="De vacaciones hoy" value={stats.vacHoy} icon={<Calendar className="w-5 h-5 text-emerald-600"/>} color="bg-emerald-50 dark:bg-emerald-900/30"/>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="card p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-indigo-500"/>Fichajes / mes</h2>
            <span className="text-xs text-slate-400">Últimos 6 meses</span>
          </div>
          {fichMes.every(d=>d.value===0)?<EmptyState icon="chart" title="Sin datos de fichajes"/>:<BarChart data={fichMes} color="#6366f1"/>}
        </div>
        <div className="card p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2"><Calendar className="w-4 h-4 text-emerald-500"/>Solicitudes / mes</h2>
            <span className="text-xs text-slate-400">Últimos 6 meses</span>
          </div>
          {solMes.every(d=>d.value===0)?<EmptyState icon="calendar" title="Sin solicitudes"/>:<BarChart data={solMes} color="#10b981"/>}
        </div>
      </div>
    </div>
  )
}