'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

type Sol={id:string;tipo:string;descripcion:string|null;estado:string;respuesta_admin:string|null;created_at:string;empleados:{nombre:string;email:string;avatar_color:string}}
type Audit={id:number;timestamp:string;accion:string;recurso:string;resultado:string;empleados:{nombre:string}|null}
type Trat={id:string;actividad:string;finalidad:string;base_juridica:string;categorias_datos:string[];plazo_supresion:string}
type Cons={empleados:{nombre:string;email:string};fecha_aceptacion:string;version_politica:string;revocado:boolean}

const TIPOS_L:Record<string,string>={acceso:'Acceso',rectificacion:'Rectificación',supresion:'Supresión',portabilidad:'Portabilidad',oposicion:'Oposición',limitacion:'Limitación'}

export default function AdminRGPDPage(){
  const [tab,setTab]=useState<'solicitudes'|'consentimientos'|'auditoria'|'tratamiento'>('solicitudes')
  const [sols,setSols]=useState<Sol[]>([])
  const [audit,setAudit]=useState<Audit[]>([])
  const [trat,setTrat]=useState<Trat[]>([])
  const [cons,setCons]=useState<Cons[]>([])
  const [loading,setLoading]=useState(true)
  const [pro,setPro]=useState<string|null>(null)
  const [resp,setResp]=useState<Record<string,string>>({})

  const cargar=useCallback(async()=>{
    setLoading(true)
    const[s,a,t,c]=await Promise.all([
      supabase.from('solicitudes_rgpd').select('*,empleados(nombre,email,avatar_color)').order('created_at',{ascending:false}),
      supabase.from('audit_log').select('*,empleados(nombre)').order('timestamp',{ascending:false}).limit(50),
      supabase.from('registro_tratamiento').select('*').eq('activo',true).order('created_at'),
      supabase.from('consentimientos_rgpd').select('*,empleados(nombre,email)').order('fecha_aceptacion',{ascending:false}),
    ])
    setSols((s.data as Sol[])||[]); setAudit((a.data as Audit[])||[])
    setTrat((t.data as Trat[])||[]); setCons((c.data as Cons[])||[])
    setLoading(false)
  },[])
  useEffect(()=>{cargar()},[cargar])

  async function gestionar(id:string,estado:'completada'|'denegada'|'en_proceso'){
    setPro(id)
    const sol=sols.find(s=>s.id===id)
    await supabase.from('solicitudes_rgpd').update({estado,respuesta_admin:resp[id]||null,updated_at:new Date().toISOString()}).eq('id',id)
    const{data:ed}=await supabase.from('solicitudes_rgpd').select('empleado_id').eq('id',id).single()
    if(ed)await supabase.from('notificaciones').insert({empleado_id:(ed as any).empleado_id,titulo:'Solicitud RGPD '+estado,mensaje:resp[id]||'Tu solicitud de '+(TIPOS_L[sol?.tipo||'']||sol?.tipo||'')+' ha sido '+estado+'.',tipo:estado==='completada'?'exito':estado==='denegada'?'advertencia':'info',enlace:'/empleado/privacidad'})
    setSols(p=>p.map(s=>s.id===id?{...s,estado,respuesta_admin:resp[id]||null}:s)); setPro(null)
  }

  const pendientes=sols.filter(s=>s.estado==='pendiente').length
  const urgentes=sols.filter(s=>{const d=Math.floor((new Date(s.created_at).getTime()+30*86400000-Date.now())/86400000);return s.estado==='pendiente'&&d<=5}).length

  return(
    <div>
      <div className="page-header mb-5">
        <div>
          <h1 className="page-title flex items-center gap-2"><Shield className="w-5 h-5 text-indigo-500"/>Panel RGPD</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Derechos de los interesados y cumplimiento normativo</p>
        </div>
        {urgentes>0&&<div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200"><AlertTriangle className="w-4 h-4 text-red-500"/><span className="text-sm text-red-700 font-semibold">{urgentes} solicitud(es) vencen pronto</span></div>}
      </div>

      <div className="flex gap-2 flex-wrap mb-5">
        {[{k:'solicitudes',l:'Solicitudes',b:pendientes},{k:'consentimientos',l:'Consentimientos'},{k:'auditoria',l:'Auditoría'},{k:'tratamiento',l:'Registro tratamiento'}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k as any)} className={"flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-colors "+(tab===t.k?'bg-indigo-600 text-white':'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300')}>
            {t.l}{t.b!=null&&t.b>0&&<span className={"text-xs px-1.5 py-0.5 rounded-full "+(tab===t.k?'bg-white/20':'bg-indigo-100 text-indigo-700')}>{t.b}</span>}
          </button>
        ))}
      </div>

      {loading?<div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>:(<>

      {tab==='solicitudes'&&<div className="space-y-3">
        {sols.length===0&&<div className="card p-12 text-center"><Shield className="w-10 h-10 text-slate-300 mx-auto mb-3"/><p className="text-slate-500">Sin solicitudes RGPD</p></div>}
        {sols.map(s=>{
          const emp=s.empleados as any
          const dias=Math.floor((new Date(s.created_at).getTime()+30*86400000-Date.now())/86400000)
          const urgente=dias<=5&&s.estado==='pendiente'
          return(
            <div key={s.id} className={"card p-5 "+(urgente?'ring-1 ring-red-300':s.estado==='pendiente'?'ring-1 ring-amber-200 dark:ring-amber-700':'')}>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{backgroundColor:emp?.avatar_color||'#6366f1'}}>{emp?.nombre?.split(' ').map((n:string)=>n[0]).join('').substring(0,2)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{emp?.nombre}</span>
                      <span className={"badge text-xs "+(s.estado==='pendiente'?'badge-amber':s.estado==='completada'?'badge-green':s.estado==='denegada'?'badge-red':'bg-blue-100 text-blue-700')}>{s.estado.replace('_',' ')}</span>
                      {urgente&&<span className="badge badge-red text-xs">⚠️ Vence en {dias}d</span>}
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">{TIPOS_L[s.tipo]||s.tipo}</p>
                    {s.descripcion&&<p className="text-xs text-slate-400 mt-0.5 italic">"{s.descripcion}"</p>}
                    <p className="text-xs text-slate-400 mt-1">Recibida: {new Date(s.created_at).toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})}</p>
                    {s.respuesta_admin&&s.estado!=='pendiente'&&<p className="text-xs text-slate-500 mt-1">Respuesta: {s.respuesta_admin}</p>}
                  </div>
                </div>
                {(s.estado==='pendiente'||s.estado==='en_proceso')&&(
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    <input type="text" placeholder="Respuesta (opcional)" value={resp[s.id]||''} onChange={e=>setResp(p=>({...p,[s.id]:e.target.value}))} className="input text-xs py-1.5"/>
                    <div className="flex gap-1.5">
                      {s.estado==='pendiente'&&<button onClick={()=>gestionar(s.id,'en_proceso')} disabled={pro===s.id} className="flex-1 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 disabled:opacity-50">En proceso</button>}
                      <button onClick={()=>gestionar(s.id,'denegada')} disabled={pro===s.id} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 disabled:opacity-50"><XCircle className="w-3 h-3"/>Denegar</button>
                      <button onClick={()=>gestionar(s.id,'completada')} disabled={pro===s.id} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 disabled:opacity-50"><CheckCircle className="w-3 h-3"/>Completar</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>}

      {tab==='consentimientos'&&<div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700"><p className="text-sm text-slate-500">Total: {cons.length} · Activos: {cons.filter(c=>!c.revocado).length}</p></div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {cons.map((c,i)=>{const emp=c.empleados as any;return(<div key={i} className="flex items-center justify-between p-4"><div><p className="text-sm font-medium text-slate-900 dark:text-slate-100">{emp?.nombre}</p><p className="text-xs text-slate-400">{emp?.email} · v{c.version_politica} · {new Date(c.fecha_aceptacion).toLocaleDateString('es-ES')}</p></div><span className={"badge text-xs "+(c.revocado?'badge-red':'badge-green')}>{c.revocado?'Revocado':'Activo'}</span></div>)})}
          {cons.length===0&&<div className="p-8 text-center text-slate-400 text-sm">Sin consentimientos registrados</div>}
        </div>
      </div>}

      {tab==='auditoria'&&<div className="card overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {audit.map(a=>(<div key={a.id} className="flex items-center gap-3 p-3"><div className={"w-2 h-2 rounded-full flex-shrink-0 "+(a.resultado==='ok'?'bg-emerald-400':a.resultado==='denegado'?'bg-red-400':'bg-amber-400')}/><div className="flex-1 min-w-0"><p className="text-xs font-medium text-slate-700 dark:text-slate-300">{(a.empleados as any)?.nombre||'Sistema'} — <span className="text-indigo-500">{a.accion}</span> en {a.recurso}</p><p className="text-[10px] text-slate-400">{new Date(a.timestamp).toLocaleString('es-ES')}</p></div></div>))}
          {audit.length===0&&<div className="p-8 text-center text-slate-400 text-sm">Sin eventos de auditoría</div>}
        </div>
      </div>}

      {tab==='tratamiento'&&<div className="space-y-3">
        <div className="card p-4 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200"><p className="text-sm text-indigo-700 dark:text-indigo-300"><strong>Art. 30 RGPD</strong> — Registro de actividades de tratamiento de datos personales.</p></div>
        {trat.map(t=>(<div key={t.id} className="card p-5">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2">{t.actividad}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div><span className="text-slate-400">Finalidad:</span><p className="text-slate-700 dark:text-slate-300 mt-0.5">{t.finalidad}</p></div>
            <div><span className="text-slate-400">Base jurídica:</span><p className="text-slate-700 dark:text-slate-300 mt-0.5">{t.base_juridica}</p></div>
            <div><span className="text-slate-400">Categorías:</span><p className="text-slate-700 dark:text-slate-300 mt-0.5">{t.categorias_datos?.join(' · ')}</p></div>
            <div><span className="text-slate-400">Plazo:</span><p className="text-slate-700 dark:text-slate-300 mt-0.5">{t.plazo_supresion}</p></div>
          </div>
        </div>))}
      </div>}
      </>)}
    </div>
  )
}