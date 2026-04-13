'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { FileText, Download, Loader2, Calendar, Clock } from 'lucide-react'

type Fichaje={tipo:string;timestamp:string;fecha:string}
type Resumen={fecha:string;entrada:string;salida:string;horas:number;minutos:number}

export default function InformeJornadaPage(){
  const [mes,setMes]=useState(()=>new Date().toISOString().substring(0,7))
  const [fichajes,setFichajes]=useState<Fichaje[]>([])
  const [resumen,setResumen]=useState<Resumen[]>([])
  const [empInfo,setEmpInfo]=useState<{nombre:string;email:string;empresa:string}>({nombre:'',email:'',empresa:''})
  const [loading,setLoading]=useState(false)
  const [generating,setGenerating]=useState(false)
  const [totalHoras,setTotalHoras]=useState(0)

  const cargar=useCallback(async()=>{
    setLoading(true)
    const{data:{user}}=await supabase.auth.getUser()
    if(!user)return
    const{data:emp}=await supabase.from('empleados').select('id,nombre,empresas(nombre)').eq('user_id',user.id).single()
    if(!emp)return
    setEmpInfo({nombre:(emp as any).nombre,email:user.email||'',empresa:(emp as any).empresas?.nombre||'Empresa'})

    const inicio=mes+'-01', fin=mes+'-31'
    const{data:fs}=await supabase.from('fichajes').select('tipo,timestamp,fecha')
      .eq('empleado_id',(emp as any).id).gte('fecha',inicio).lte('fecha',fin).order('timestamp',{ascending:true})
    setFichajes(fs||[])

    // Calcular resumen por día
    const byDay=new Map<string,{entrada?:string;salida?:string}>()
    fs?.forEach(f=>{
      const d=byDay.get(f.fecha)||{}
      if(f.tipo==='entrada'&&!d.entrada)d.entrada=f.timestamp
      if(f.tipo==='salida')d.salida=f.timestamp
      byDay.set(f.fecha,d)
    })

    let totalMin=0
    const res:Resumen[]=[]
    byDay.forEach((v,fecha)=>{
      if(v.entrada){
        const entrada=new Date(v.entrada)
        const salida=v.salida?new Date(v.salida):null
        const mins=salida?Math.round((salida.getTime()-entrada.getTime())/60000):0
        totalMin+=mins
        res.push({
          fecha,
          entrada:entrada.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}),
          salida:salida?salida.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}):'-',
          horas:Math.floor(mins/60),minutos:mins%60
        })
      }
    })
    res.sort((a,b)=>a.fecha.localeCompare(b.fecha))
    setResumen(res)
    setTotalHoras(totalMin)
    setLoading(false)
  },[mes])

  useEffect(()=>{cargar()},[cargar])

  async function generarPDF(){
    setGenerating(true)
    // Generar PDF usando el API de window.print() con estilos específicos
    const [anio,mesNum]=mes.split('-')
    const nombreMes=new Date(mes+'-01').toLocaleDateString('es-ES',{month:'long',year:'numeric'})

    const html=`<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Informe Jornada ${nombreMes}</title>
<style>
  @page{size:A4;margin:2cm}
  body{font-family:Arial,sans-serif;font-size:11pt;color:#1f2937;margin:0}
  .header{text-align:center;border-bottom:2px solid #6366f1;padding-bottom:12px;margin-bottom:20px}
  .header h1{font-size:18pt;color:#6366f1;margin:0}
  .header p{color:#6b7280;margin:4px 0}
  .info{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px;background:#f9fafb;padding:12px;border-radius:6px}
  .info-item{font-size:10pt}
  .info-item strong{color:#374151}
  table{width:100%;border-collapse:collapse;margin-bottom:16px}
  th{background:#6366f1;color:white;padding:8px 10px;text-align:left;font-size:10pt}
  td{padding:7px 10px;border-bottom:1px solid #e5e7eb;font-size:10pt}
  tr:nth-child(even)td{background:#f9fafb}
  .total{background:#f0f4ff;font-weight:bold;border-top:2px solid #6366f1}
  .firma{margin-top:40px;display:grid;grid-template-columns:1fr 1fr;gap:40px}
  .firma-box{border-top:1px solid #374151;padding-top:8px;text-align:center;font-size:10pt;color:#6b7280}
  .legal{margin-top:20px;font-size:8pt;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:8px}
</style></head>
<body>
<div class="header">
  <h1>Registro de Jornada Laboral</h1>
  <p>${nombreMes} · ${empInfo.empresa}</p>
</div>
<div class="info">
  <div class="info-item"><strong>Empleado:</strong> ${empInfo.nombre}</div>
  <div class="info-item"><strong>Email:</strong> ${empInfo.email}</div>
  <div class="info-item"><strong>Período:</strong> ${nombreMes}</div>
  <div class="info-item"><strong>Total horas:</strong> ${Math.floor(totalHoras/60)}h ${totalHoras%60}m</div>
</div>
<table>
  <thead><tr><th>Fecha</th><th>Entrada</th><th>Salida</th><th>Horas trabajadas</th></tr></thead>
  <tbody>
    ${resumen.map(r=>`<tr><td>${new Date(r.fecha+'T12:00:00').toLocaleDateString('es-ES',{weekday:'short',day:'numeric',month:'short'})}</td><td>${r.entrada}</td><td>${r.salida}</td><td>${r.horas}h ${r.minutos}m</td></tr>`).join('')}
    <tr class="total"><td colspan="3">TOTAL ${nombreMes}</td><td>${Math.floor(totalHoras/60)}h ${totalHoras%60}m</td></tr>
  </tbody>
</table>
<div class="firma">
  <div class="firma-box"><br><br><br>Firma del empleado<br><strong>${empInfo.nombre}</strong></div>
  <div class="firma-box"><br><br><br>Firma de la empresa<br><strong>${empInfo.empresa}</strong></div>
</div>
<div class="legal">
  Documento generado el ${new Date().toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})} · 
  Registro de jornada conforme al art. 34.9 del Estatuto de los Trabajadores (RDLeg 2/2015) · 
  Nexo HR · ${empInfo.empresa}
</div>
</body></html>`

    const win=window.open('','_blank')
    if(win){
      win.document.write(html)
      win.document.close()
      setTimeout(()=>{win.print()},500)
    }
    setGenerating(false)
  }

  const [anio,mesNum]=mes.split('-')
  const nombreMes=new Date(mes+'-01').toLocaleDateString('es-ES',{month:'long',year:'numeric'})

  return(
    <div className="max-w-3xl">
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-500"/>Informe de jornada</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Registro conforme al art. 34.9 ET</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="month" value={mes} onChange={e=>setMes(e.target.value)} className="input text-sm"/>
          <button onClick={generarPDF} disabled={generating||resumen.length===0} className="btn-primary flex items-center gap-2 disabled:opacity-50">
            {generating?<><Loader2 className="w-4 h-4 animate-spin"/>Generando...</>:<><Download className="w-4 h-4"/>Descargar PDF</>}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl font-black text-indigo-600">{resumen.length}</p>
          <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1"><Calendar className="w-3 h-3"/>Días trabajados</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-black text-emerald-600">{Math.floor(totalHoras/60)}h {totalHoras%60}m</p>
          <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1"><Clock className="w-3 h-3"/>Total {nombreMes}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-black text-slate-600">
            {resumen.length>0?Math.round(totalHoras/resumen.length/60*10)/10:0}h
          </p>
          <p className="text-xs text-slate-500 mt-1">Media diaria</p>
        </div>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700">
          <p className="font-semibold text-slate-900 dark:text-slate-100 capitalize">{nombreMes}</p>
        </div>
        {loading?<div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin"/></div>
        :resumen.length===0?<div className="p-12 text-center"><FileText className="w-10 h-10 text-slate-200 mx-auto mb-2"/><p className="text-slate-500">Sin registros en {nombreMes}</p></div>
        :<table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Fecha</th>
              <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Entrada</th>
              <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Salida</th>
              <th className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Horas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {resumen.map(r=>(
              <tr key={r.fecha} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100 capitalize">
                  {new Date(r.fecha+'T12:00:00').toLocaleDateString('es-ES',{weekday:'short',day:'numeric',month:'short'})}
                </td>
                <td className="px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400 font-mono">{r.entrada}</td>
                <td className="px-4 py-3 text-sm text-red-500 dark:text-red-400 font-mono">{r.salida}</td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100 text-right">
                  {r.horas}h {r.minutos>0?`${r.minutos}m`:''}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-indigo-50 dark:bg-indigo-900/20 border-t-2 border-indigo-200 dark:border-indigo-700">
            <tr>
              <td colSpan={3} className="px-4 py-3 text-sm font-bold text-indigo-700 dark:text-indigo-300">TOTAL {nombreMes.toUpperCase()}</td>
              <td className="px-4 py-3 text-sm font-black text-indigo-700 dark:text-indigo-300 text-right">{Math.floor(totalHoras/60)}h {totalHoras%60}m</td>
            </tr>
          </tfoot>
        </table>}
      </div>
      <p className="text-xs text-slate-400 mt-3 text-center">Conforme al art. 34.9 del Estatuto de los Trabajadores (RDLeg 2/2015) · Conservar 4 años</p>
    </div>
  )
}