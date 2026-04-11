'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Breadcrumb } from '@/components/Breadcrumb'
import { Users, CheckCircle, XCircle, Loader2 } from 'lucide-react'

type Emp={id:string;nombre:string;avatar_color:string;departamento:string|null;puesto:string|null;estado:string;email:string}
type Sol={id:string;tipo:string;estado:string;fecha_inicio:string;fecha_fin:string;comentario:string|null;created_at:string;empleados:{nombre:string;avatar_color:string};empleado_id?:string}

const ESTADO_DOT:Record<string,string>={activo:'bg-emerald-500',baja:'bg-red-400',vacaciones:'bg-sky-400',inactivo:'bg-slate-300'}

export default function ManagerEquipoPage(){
  const [equipo,setEquipo]=useState<Emp[]>([])
  const [sols,setSols]=useState<Sol[]>([])
  const [loading,setLoading]=useState(true)
  const [tab,setTab]=useState<'solicitudes'|'equipo'>('solicitudes')
  const [pro,setPro]=useState<string|null>(null)

  const cargar=useCallback(async()=>{
    const{data:{user}}=await supabase.auth.getUser(); if(!user)return
    const{data:mgr}=await supabase.from('empleados').select('id').eq('user_id',user.id).single(); if(!mgr)return
    const{data:eq}=await supabase.from('empleados').select('id,nombre,avatar_color,departamento,puesto,estado,email').eq('manager_id',mgr.id).order('nombre')
    const ids=(eq||[]).map(e=>e.id)
    const{data:s}=ids.length>0
      ? await supabase.from('solicitudes').select('*,empleados(nombre,avatar_color)').in('empleado_id',ids).eq('estado','pendiente').order('created_at',{ascending:false})
      : {data:[]}
    setEquipo(eq||[]); setSols((s as Sol[])||[]); setLoading(false)
  },[])
  useEffect(()=>{cargar()},[cargar])

  async function gestionar(id:string,estado:'aprobada'|'rechazada'){
    setPro(id)
    const sol=sols.find(s=>s.id===id)
    await supabase.from('solicitudes').update({estado}).eq('id',id)
    if(sol?.empleado_id)await supabase.from('notificaciones').insert({empleado_id:sol.empleado_id,titulo:'Solicitud '+estado,mensaje:'Tu solicitud de '+sol.tipo.replace('_',' ')+' ha sido '+estado+' por tu manager.',tipo:estado==='aprobada'?'exito':'advertencia'})
    setSols(p=>p.filter(s=>s.id!==id)); setPro(null)
  }

  return(
    <div className="p-4 pb-24 lg:pb-4 max-w-2xl mx-auto">
      <Breadcrumb/>
      <div className="pt-2 mb-5">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2"><Users className="w-5 h-5 text-indigo-500"/>Mi Equipo</h1>
        <p className="text-xs text-slate-400 mt-0.5">Gestiona las solicitudes y el estado de tu equipo</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card p-4 text-center"><p className="text-2xl font-black text-slate-900 dark:text-slate-100">{equipo.length}</p><p className="text-xs text-slate-400 mt-0.5">En mi equipo</p></div>
        <div className="card p-4 text-center"><p className="text-2xl font-black text-emerald-600">{equipo.filter(e=>e.estado==='activo').length}</p><p className="text-xs text-slate-400 mt-0.5">Activos</p></div>
        <div className="card p-4 text-center"><p className="text-2xl font-black text-amber-600">{sols.length}</p><p className="text-xs text-slate-400 mt-0.5">Pendientes</p></div>
      </div>

      <div className="flex gap-2 mb-5">
        {[{k:'solicitudes',l:'Solicitudes',b:sols.length},{k:'equipo',l:'Mi equipo'}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k as any)}
            className={"flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-colors "+(tab===t.k?'bg-indigo-600 text-white':'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300')}>
            {t.l}{t.b!=null&&t.b>0&&<span className={"text-xs px-1.5 py-0.5 rounded-full "+(tab===t.k?'bg-white/20':'bg-amber-100 text-amber-700')}>{t.b}</span>}
          </button>
        ))}
      </div>

      {loading?(<div className="flex justify-center py-12"><div className="w-7 h-7 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>):(<>

      {tab==='solicitudes'&&<div className="space-y-3">
        {sols.length===0&&<div className="card p-12 text-center"><CheckCircle className="w-10 h-10 text-emerald-300 mx-auto mb-3"/><p className="text-slate-500 font-medium">Sin solicitudes pendientes</p></div>}
        {sols.map(s=>{const emp=s.empleados as any;return(
          <div key={s.id} className="card p-4 ring-1 ring-amber-200 dark:ring-amber-700">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{backgroundColor:emp?.avatar_color||'#6366f1'}}>{emp?.nombre?.split(' ').map((n:string)=>n[0]).join('').substring(0,2)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{emp?.nombre}</p>
                <p className="text-xs text-slate-500 capitalize">{s.tipo.replace('_',' ')} · {new Date(s.fecha_inicio+'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short'})} – {new Date(s.fecha_fin+'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short'})}</p>
                {s.comentario&&<p className="text-xs text-slate-400 mt-0.5 italic">"{s.comentario}"</p>}
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={()=>gestionar(s.id,'rechazada')} disabled={pro===s.id} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 font-semibold text-sm hover:bg-red-100 disabled:opacity-50"><XCircle className="w-3.5 h-3.5"/>Rechazar</button>
              <button onClick={()=>gestionar(s.id,'aprobada')} disabled={pro===s.id} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 disabled:opacity-50">{pro===s.id?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<CheckCircle className="w-3.5 h-3.5"/>}Aprobar</button>
            </div>
          </div>
        )})}
      </div>}

      {tab==='equipo'&&<div className="space-y-2">
        {equipo.length===0&&<div className="card p-12 text-center"><Users className="w-10 h-10 text-slate-300 mx-auto mb-3"/><p className="text-slate-500">Aún no tienes empleados asignados</p></div>}
        {equipo.map(e=>(
          <div key={e.id} className="card p-4 flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{backgroundColor:e.avatar_color||'#6366f1'}}>{e.nombre.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}</div>
              <div className={"absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 "+(ESTADO_DOT[e.estado]||'bg-slate-300')}/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{e.nombre}</p>
              <p className="text-xs text-slate-400">{e.puesto||e.departamento||e.email}</p>
            </div>
            <span className={"badge text-xs capitalize "+(e.estado==='activo'?'badge-green':e.estado==='baja'?'badge-red':'badge-amber')}>{e.estado}</span>
          </div>
        ))}
      </div>}
      </>)}
    </div>
  )
}