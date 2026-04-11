'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Breadcrumb } from '@/components/Breadcrumb'
import { Shield, Download, Trash2, Edit3, EyeOff, AlertTriangle, CheckCircle, Clock, Loader2, X, FileText } from 'lucide-react'

type Sol={id:string;tipo:string;descripcion:string|null;estado:string;respuesta_admin:string|null;created_at:string}
type Cons={id:string;version_politica:string;acepta_politica:boolean;acepta_comunicaciones:boolean;fecha_aceptacion:string;revocado:boolean}

const TIPOS:Record<string,{label:string;icon:any;desc:string}> = {
  acceso:{label:'Derecho de acceso',icon:Download,desc:'Obtener copia de todos tus datos personales que tratamos.'},
  rectificacion:{label:'Derecho de rectificación',icon:Edit3,desc:'Corregir datos inexactos o incompletos en tu perfil.'},
  supresion:{label:'Derecho al olvido',icon:Trash2,desc:'Solicitar la eliminación de tus datos cuando ya no sean necesarios.'},
  portabilidad:{label:'Derecho de portabilidad',icon:FileText,desc:'Recibir tus datos en formato estructurado (JSON).'},
  oposicion:{label:'Derecho de oposición',icon:EyeOff,desc:'Oponerte al tratamiento para una finalidad concreta.'},
  limitacion:{label:'Derecho de limitación',icon:AlertTriangle,desc:'Limitar el tratamiento en determinadas circunstancias.'},
}
const ESTADO_S:Record<string,string>={pendiente:'badge-amber',en_proceso:'bg-blue-100 text-blue-700',completada:'badge-green',denegada:'badge-red'}

export default function PrivacidadPage(){
  const [empId,setEmpId]=useState('')
  const [sols,setSols]=useState<Sol[]>([])
  const [cons,setCons]=useState<Cons|null>(null)
  const [loading,setLoading]=useState(true)
  const [modal,setModal]=useState<string|null>(null)
  const [desc,setDesc]=useState('')
  const [enviando,setEnviando]=useState(false)
  const [exportando,setExportando]=useState(false)

  const cargar=useCallback(async()=>{
    const{data:{user}}=await supabase.auth.getUser(); if(!user)return
    const{data:emp}=await supabase.from('empleados').select('id').eq('user_id',user.id).single(); if(!emp)return
    setEmpId(emp.id)
    const[{data:s},{data:c}]=await Promise.all([
      supabase.from('solicitudes_rgpd').select('*').eq('empleado_id',emp.id).order('created_at',{ascending:false}),
      supabase.from('consentimientos_rgpd').select('*').eq('empleado_id',emp.id).eq('version_politica','1.0').maybeSingle()
    ])
    setSols(s||[]); setCons(c); setLoading(false)
  },[])
  useEffect(()=>{cargar()},[cargar])

  async function enviar(tipo:string){
    if(!empId)return; setEnviando(true)
    await supabase.from('solicitudes_rgpd').insert({empleado_id:empId,tipo,descripcion:desc.trim()||null,estado:'pendiente'})
    const{data:admin}=await supabase.from('empleados').select('id').eq('rol','admin').limit(1).maybeSingle()
    if(admin)await supabase.from('notificaciones').insert({empleado_id:admin.id,titulo:'Solicitud RGPD: '+TIPOS[tipo].label,mensaje:'Un empleado ha ejercido el '+TIPOS[tipo].label+'. Plazo: 30 días.',tipo:'advertencia',enlace:'/admin/rgpd'})
    await supabase.from('audit_log').insert({actor_id:empId,accion:'solicitud_rgpd',recurso:'solicitudes_rgpd',detalle:{tipo},resultado:'ok'})
    setEnviando(false); setModal(null); setDesc(''); cargar()
  }

  async function exportar(){
    if(!empId)return; setExportando(true)
    const[{data:emp},{data:fichs},{data:s},{data:noms}]=await Promise.all([
      supabase.from('empleados').select('nombre,email,departamento,puesto,tipo_contrato,fecha_alta').eq('id',empId).single(),
      supabase.from('fichajes').select('tipo,timestamp,fecha').eq('empleado_id',empId).order('fecha',{ascending:false}).limit(200),
      supabase.from('solicitudes').select('tipo,estado,fecha_inicio,fecha_fin').eq('empleado_id',empId).limit(100),
      supabase.from('nominas').select('mes,anio,salario_bruto,salario_neto').eq('empleado_id',empId).limit(50),
    ])
    const pkg={exportacion:{fecha:new Date().toISOString(),base_legal:'Art. 20 RGPD'},datos_personales:emp,fichajes:fichs,solicitudes:s,nominas:noms}
    const blob=new Blob([JSON.stringify(pkg,null,2)],{type:'application/json'})
    const url=URL.createObjectURL(blob), a=document.createElement('a')
    a.href=url; a.download='mis-datos-nexohr-'+new Date().toISOString().slice(0,10)+'.json'; a.click(); URL.revokeObjectURL(url)
    await supabase.from('audit_log').insert({actor_id:empId,accion:'exportacion_datos',recurso:'empleados',recurso_id:empId,resultado:'ok'})
    setExportando(false)
  }

  const tipo=modal?TIPOS[modal]:null

  return(
    <div className="p-4 pb-24 lg:pb-4 max-w-2xl mx-auto">
      <Breadcrumb/>
      <div className="pt-2 mb-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2"><Shield className="w-5 h-5 text-indigo-500"/>Privacidad y datos</h1>
        <p className="text-xs text-slate-400 mt-0.5">Gestiona tus derechos RGPD y el consentimiento para el tratamiento de tus datos</p>
      </div>
      {loading?<div className="flex justify-center py-16"><div className="w-7 h-7 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>:(<>

      <div className={"card p-4 mb-4 "+(cons&&!cons.revocado?'ring-1 ring-emerald-200 dark:ring-emerald-700':'ring-1 ring-amber-200 dark:ring-amber-700')}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {cons&&!cons.revocado?<><CheckCircle className="w-4 h-4 text-emerald-500"/>Consentimiento activo</>:<><AlertTriangle className="w-4 h-4 text-amber-500"/>Consentimiento pendiente</>}
            </p>
            {cons&&!cons.revocado&&<p className="text-xs text-slate-400 mt-0.5">Aceptado el {new Date(cons.fecha_aceptacion).toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})} · v{cons.version_politica}</p>}
          </div>
          {cons&&!cons.revocado&&(
            <button onClick={async()=>{if(!window.confirm('?¿Revocar consentimiento?'))return;await supabase.from('consentimientos_rgpd').update({revocado:true,fecha_revocacion:new Date().toISOString()}).eq('id',cons.id);cargar()}} className="text-xs text-red-500 hover:text-red-700 underline">Revocar</button>
          )}
        </div>
      </div>

      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between">
          <div><p className="font-semibold text-sm text-slate-900 dark:text-slate-100">Exportar mis datos</p><p className="text-xs text-slate-400 mt-0.5">Descarga copia de tus datos en JSON (Art. 20 RGPD)</p></div>
          <button onClick={exportar} disabled={exportando} className="btn-secondary flex items-center gap-1.5 text-sm py-2 px-4 disabled:opacity-50">
            {exportando?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<Download className="w-3.5 h-3.5"/>}{exportando?'Exportando…':'Descargar'}
          </button>
        </div>
      </div>

      <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">Ejercer mis derechos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {Object.entries(TIPOS).map(([key,d])=>{
          const Icon=d.icon, pend=sols.some(s=>s.tipo===key&&s.estado!=='completada'&&s.estado!=='denegada')
          return(
            <button key={key} onClick={()=>!pend&&setModal(key)} disabled={pend}
              className={"card p-4 text-left transition-all hover:shadow-md "+(pend?'opacity-60 cursor-not-allowed':'hover:ring-1 hover:ring-indigo-300')}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0"><Icon className="w-4 h-4 text-indigo-600"/></div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{d.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{d.desc}</p>
                  {pend?<span className="text-[10px] text-amber-500 font-semibold mt-1 block">Solicitud en curso</span>:<span className="text-[10px] text-slate-400 mt-1 block">Plazo: 30 días (Art. 12 RGPD)</span>}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {sols.length>0&&<>
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">Mis solicitudes</h2>
        <div className="space-y-2">
          {sols.map(s=>(
            <div key={s.id} className="card p-3 flex items-center justify-between gap-3">
              <div><p className="text-sm font-medium text-slate-800 dark:text-slate-200">{TIPOS[s.tipo]?.label||s.tipo}</p><p className="text-xs text-slate-400">{new Date(s.created_at).toLocaleDateString('es-ES',{day:'numeric',month:'long'})}</p>{s.respuesta_admin&&<p className="text-xs text-slate-500 mt-1 italic">"{s.respuesta_admin}"</p>}</div>
              <span className={"badge text-xs capitalize "+(ESTADO_S[s.estado]||'badge-amber')}>{s.estado.replace('_',' ')}</span>
            </div>
          ))}
        </div>
      </>}

      <div className="card p-4 mt-6 bg-slate-50 dark:bg-slate-700/30">
        <p className="text-xs text-slate-500 leading-relaxed"><strong className="text-slate-700 dark:text-slate-300">Responsable:</strong> Tu empresa · <strong className="text-slate-700 dark:text-slate-300">Encargado:</strong> Nexo HR · <strong className="text-slate-700 dark:text-slate-300">Autoridad:</strong> <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-indigo-500 underline">AEPD</a></p>
      </div>
      </>)}

      {modal&&tipo&&(
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-t-2xl w-full max-w-[460px] p-5 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">{tipo.label}</h3>
              <button onClick={()=>setModal(null)}><X className="w-4 h-4 text-slate-400"/></button>
            </div>
            <p className="text-sm text-slate-500 mb-4">{tipo.desc}</p>
            <div className="mb-4">
              <label className="label">Descripción <span className="text-slate-400 font-normal">(opcional)</span></label>
              <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Añade cualquier detalle…" rows={3} className="input w-full resize-none mt-1"/>
            </div>
            <div className="flex gap-3">
              <button onClick={()=>setModal(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={()=>enviar(modal)} disabled={enviando} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                {enviando?<Loader2 className="w-4 h-4 animate-spin"/>:<Shield className="w-4 h-4"/>}{enviando?'Enviando…':'Enviar solicitud'}
              </button>
            </div>
            <p className="text-xs text-center text-slate-400 mt-3">El responsable tiene 30 días para responder (Art. 12 RGPD)</p>
          </div>
        </div>
      )}
    </div>
  )
}