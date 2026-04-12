'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Download, FileText, Clock, CalendarDays, Receipt, Loader2, CheckCircle } from 'lucide-react'

const EXPORTS=[
  {id:'fichajes',title:'Control horario',desc:'Fichajes con entradas, salidas y horas trabajadas',icon:Clock,color:'#6366f1',view:'export_fichajes',filename:'control-horario',filtros:[{label:'Mes',field:'fecha',type:'month'}]},
  {id:'solicitudes',title:'Vacaciones y ausencias',desc:'Solicitudes de vacaciones, permisos y bajas',icon:CalendarDays,color:'#f59e0b',view:'export_solicitudes',filename:'vacaciones',filtros:[{label:'Estado',field:'estado',type:'select',options:['todos','pendiente','aprobada','rechazada']}]},
  {id:'gastos',title:'Gastos profesionales',desc:'Gastos por empleado con importe y categoría',icon:Receipt,color:'#0891b2',view:'gastos',filename:'gastos',filtros:[{label:'Mes',field:'fecha',type:'month'}]},
  {id:'empleados',title:'Directorio empleados',desc:'Ficha completa de todos los empleados activos',icon:FileText,color:'#10b981',view:'empleados',filename:'empleados'},
] as const

function toCSV(data:any[]){
  if(!data||data.length===0)return''
  const h=Object.keys(data[0])
  return[h.join(','),...data.map(r=>h.map(k=>{const v=r[k];if(v==null)return'';if(typeof v==='string'&&v.includes(','))return'"'+v+'"';return String(v)}).join(','))].join('
')
}
function dl(content:string,filename:string,type:string){
  const b=new Blob(['﻿'+content],{type})
  const u=URL.createObjectURL(b),a=document.createElement('a')
  a.href=u;a.download=filename+'-'+new Date().toISOString().split('T')[0]+(type.includes('json')?'.json':'.csv');a.click();URL.revokeObjectURL(u)
}

export default function InformesPage(){
  const [loading,setLoading]=useState<string|null>(null)
  const [success,setSuccess]=useState<string|null>(null)
  const [filtros,setFiltros]=useState<Record<string,Record<string,string>>>({})
  const [fmt,setFmt]=useState<'csv'|'json'>('csv')

  function setF(id:string,field:string,value:string){setFiltros(p=>({...p,[id]:{...(p[id]||{}),[field]:value}}))}

  async function exportar(exp:typeof EXPORTS[number]){
    setLoading(exp.id);setSuccess(null)
    try{
      let query=(supabase.from(exp.view as any) as any).select('*')
      const f=filtros[exp.id]||{}
      if(f.fecha&&exp.id!=='empleados'){
        const[y,m]=f.fecha.split('-').map(Number)
        if(y&&m){const ini=y+'-'+String(m).padStart(2,'0')+'-01',fin=new Date(y,m,0).toISOString().split('T')[0];query=query.gte('fecha',ini).lte('fecha',fin)}
      }
      if(f.estado&&f.estado!=='todos')query=query.eq('estado',f.estado)
      if(exp.id==='empleados')query=(supabase.from('empleados') as any).select('nombre,email,telefono,departamento,puesto,rol,estado,tipo_contrato,jornada_horas,fecha_alta').eq('estado','activo')
      const{data,error}=await query.limit(5000)
      if(error)throw error
      if(!data||data.length===0){alert('Sin datos para exportar');setLoading(null);return}
      fmt==='csv'?dl(toCSV(data),exp.filename,'text/csv'):dl(JSON.stringify(data,null,2),exp.filename,'application/json')
      setSuccess(exp.id);setTimeout(()=>setSuccess(null),3000)
    }catch(e:any){alert('Error: '+(e.message||'Error desconocido'))}
    setLoading(null)
  }

  return(
    <div>
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><Download className="w-5 h-5 text-indigo-500"/>Informes y exportación</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Descarga tus datos en CSV (Excel) o JSON</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
          {(['csv','json'] as const).map(f=>(
            <button key={f} onClick={()=>setFmt(f)} className={"px-4 py-1.5 rounded-lg text-sm font-semibold transition-all "+(fmt===f?'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm':'text-slate-500 dark:text-slate-400')}>
              .{f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {fmt==='csv'&&<div className="mb-5 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-700"><p className="text-xs text-indigo-700 dark:text-indigo-300">Los archivos CSV se abren directamente en <strong>Excel</strong> y <strong>Google Sheets</strong>. Incluyen BOM UTF-8 para caracteres especiales (áéíóúñ…).</p></div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {EXPORTS.map(exp=>{
          const Icon=exp.icon,isL=loading===exp.id,isDone=success===exp.id,f=filtros[exp.id]||{}
          return(
            <div key={exp.id} className="card p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:exp.color+'15'}}><Icon className="w-5 h-5" style={{color:exp.color}}/></div>
                <div className="flex-1 min-w-0"><h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{exp.title}</h3><p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{exp.desc}</p></div>
              </div>
              {'filtros' in exp && (exp as any).filtros&&(
                <div className="space-y-2 mb-4">
                  {(exp as any).filtros.map((filt:any)=>(
                    <div key={filt.field} className="flex items-center gap-2">
                      <label className="text-xs text-slate-500 w-14 flex-shrink-0">{filt.label}</label>
                      {filt.type==='month'&&<input type="month" value={f[filt.field]||new Date().toISOString().substring(0,7)} onChange={e=>setF(exp.id,filt.field,e.target.value)} className="input flex-1 text-sm py-1.5"/>}
                      {filt.type==='select'&&<select value={f[filt.field]||'todos'} onChange={e=>setF(exp.id,filt.field,e.target.value)} className="input flex-1 text-sm py-1.5">{filt.options.map((o:string)=><option key={o} value={o}>{o==='todos'?'Todos':o}</option>)}</select>}
                    </div>
                  ))}
                </div>
              )}
              <button onClick={()=>exportar(exp)} disabled={isL} className={"w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 "+(isDone?'bg-emerald-500 text-white':'text-white hover:opacity-90')} style={isDone?{}:{background:exp.color}}>
                {isL?<><Loader2 className="w-4 h-4 animate-spin"/>Generando…</>:isDone?<><CheckCircle className="w-4 h-4"/>¡Descargado!</>:<><Download className="w-4 h-4"/>Descargar .{fmt.toUpperCase()}</>}
              </button>
            </div>
          )
        })}
      </div>

      <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
        <p className="text-xs text-slate-400 leading-relaxed"><strong className="text-slate-600 dark:text-slate-300">Aviso:</strong> Los informes contienen datos personales protegidos por el RGPD. El acceso queda registrado en el audit log.</p>
      </div>
    </div>
  )
}