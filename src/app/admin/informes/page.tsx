'use client'
import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'
import { Download, FileSpreadsheet, FileText, TrendingUp, Users, Clock, Calendar } from 'lucide-react'

type Emp = { id:string; nombre:string; departamento:string; puesto:string; estado:string; fecha_alta:string; jornada_horas:number; tipo_contrato:string; avatar_color:string }
type Nomina = { empleado_id:string; mes:number; anio:number; salario_base:number; complementos:number; liquido:number }
type Sol = { empleado_id:string; tipo:string; fecha_inicio:string; fecha_fin:string; estado:string }
type Fichaje = { empleado_id:string; tipo:string; fecha:string; timestamp:string }

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const fmt = (n:number) => n.toLocaleString('es-ES',{style:'currency',currency:'EUR'})

export default function InformesPage() {
  const [empleados, setEmpleados] = useState<Emp[]>([])
  const [nominas, setNominas] = useState<Nomina[]>([])
  const [solicitudes, setSolicitudes] = useState<Sol[]>([])
  const [fichajes, setFichajes] = useState<Fichaje[]>([])
  const [loading, setLoading] = useState(true)
  const [anio, setAnio] = useState(new Date().getFullYear())

  useEffect(() => {
    Promise.all([
      supabase.from('empleados').select('*').order('nombre'),
      supabase.from('nominas').select('*'),
      supabase.from('solicitudes').select('*'),
      supabase.from('fichajes').select('*').order('fecha',{ascending:false}).limit(500),
    ]).then(([{data:e},{data:n},{data:s},{data:f}]) => {
      setEmpleados(e||[]); setNominas(n||[]); setSolicitudes(s||[]); setFichajes(f||[]); setLoading(false)
    })
  }, [])

  function getNombre(id:string) { return empleados.find(e=>e.id===id)?.nombre||id }

  // EstadÃ­sticas
  const nominasAnio = nominas.filter(n=>n.anio===anio)
  const costeTotalAnio = nominasAnio.reduce((s,n)=>s+(n.salario_base+n.complementos),0)
  const liquidoTotalAnio = nominasAnio.reduce((s,n)=>s+n.liquido,0)
  const vacacionesAprobadas = solicitudes.filter(s=>s.tipo==='vacaciones'&&s.estado==='aprobada')
  const diasVacaciones = vacacionesAprobadas.reduce((s,sol)=>{
    const d=(new Date(sol.fecha_fin).getTime()-new Date(sol.fecha_inicio).getTime())/86400000+1
    return s+d
  },0)

  async function exportExcel(tipo: string) {
    let ws: any, titulo = ''

    if (tipo==='empleados') {
      titulo = 'Empleados'
      const rows = [['Nombre','Email','Departamento','Puesto','Contrato','Jornada','Estado','Alta'],
        ...empleados.map(e=>[e.nombre,'',e.departamento,e.puesto,e.tipo_contrato,e.jornada_horas,e.estado,e.fecha_alta])]
      ws = XLSX.utils.aoa_to_sheet(rows)
    } else if (tipo==='nominas') {
      titulo = 'Nominas_'+anio
      const rows = [['Empleado','Mes','AÃ±o','Salario base','Complementos','IRPF%','SS%','LÃ­quido'],
        ...nominasAnio.map(n=>[getNombre(n.empleado_id),MESES[n.mes-1],n.anio,n.salario_base,n.complementos,'',n.liquido])]
      ws = XLSX.utils.aoa_to_sheet(rows)
    } else if (tipo==='solicitudes') {
      titulo = 'Solicitudes'
      const rows = [['Empleado','Tipo','Inicio','Fin','Estado'],
        ...solicitudes.map(s=>[getNombre(s.empleado_id),s.tipo,s.fecha_inicio,s.fecha_fin,s.estado])]
      ws = XLSX.utils.aoa_to_sheet(rows)
    } else {
      titulo = 'Fichajes'
      const rows = [['Empleado','Tipo','Fecha','Hora'],
        ...fichajes.map(f=>[getNombre(f.empleado_id),f.tipo,f.fecha,new Date(f.timestamp).toLocaleTimeString('es-ES')])]
      ws = XLSX.utils.aoa_to_sheet(rows)
    }

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, titulo)
    XLSX.writeFile(wb, `NexoHR_${titulo}_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  function exportPDF(tipo: string) {
    const w = window.open('','_blank')!
    let html = '<html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;padding:20px}h1{color:#4F46E5}table{border-collapse:collapse;width:100%}th{background:#EEF2FF;color:#4F46E5;padding:8px;text-align:left;font-size:12px}td{padding:8px;border-bottom:1px solid #E2E8F0;font-size:12px}.footer{margin-top:20px;font-size:10px;color:#94A3B8}</style></head><body>'
    html += `<h1>Nexo HR â ${tipo.charAt(0).toUpperCase()+tipo.slice(1)}</h1>`
    html += `<p style="color:#64748B;font-size:12px">Generado: ${new Date().toLocaleDateString('es-ES')}</p><table>`
    
    if (tipo==='empleados') {
      html += '<tr><th>Nombre</th><th>Departamento</th><th>Puesto</th><th>Contrato</th><th>Estado</th></tr>'
      empleados.forEach(e=>{ html+=`<tr><td>${e.nombre}</td><td>${e.departamento}</td><td>${e.puesto}</td><td>${e.tipo_contrato?.replace(/_/g,' ')}</td><td>${e.estado}</td></tr>` })
    } else if (tipo==='nominas') {
      html += '<tr><th>Empleado</th><th>PerÃ­odo</th><th>Bruto</th><th>Neto</th></tr>'
      nominasAnio.forEach(n=>{ html+=`<tr><td>${getNombre(n.empleado_id)}</td><td>${MESES[n.mes-1]} ${n.anio}</td><td>${fmt(n.salario_base+n.complementos)}</td><td>${fmt(n.liquido)}</td></tr>` })
    } else {
      html += '<tr><th>Empleado</th><th>Tipo</th><th>Inicio</th><th>Fin</th><th>Estado</th></tr>'
      solicitudes.forEach(s=>{ html+=`<tr><td>${getNombre(s.empleado_id)}</td><td>${s.tipo.replace(/_/g,' ')}</td><td>${s.fecha_inicio}</td><td>${s.fecha_fin}</td><td>${s.estado}</td></tr>` })
    }
    html += `</table><p class="footer">Nexo HR Â© ${new Date().getFullYear()} â ACME Corp</p></body></html>`
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(()=>w.print(),500)
  }

  const INFORMES_DISP = [
    { id:'empleados', titulo:'Empleados', desc:'Lista completa del equipo con sus datos', icon:Users, color:'text-indigo-600', bg:'bg-indigo-50' },
    { id:'nominas', titulo:`NÃ³minas ${anio}`, desc:'Detalle de todas las nÃ³minas del aÃ±o seleccionado', icon:TrendingUp, color:'text-emerald-600', bg:'bg-emerald-50' },
    { id:'solicitudes', titulo:'Solicitudes', desc:'Vacaciones, permisos y solicitudes del equipo', icon:Calendar, color:'text-amber-600', bg:'bg-amber-50' },
    { id:'fichajes', titulo:'Fichajes', desc:'Registro de entradas y salidas recientes', icon:Clock, color:'text-violet-600', bg:'bg-violet-50' },
  ]

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Informes</h1>
          <p className="text-sm text-slate-500 mt-1">Exporta los datos del equipo en Excel o PDF</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">AÃ±o:</label>
          <select value={anio} onChange={e=>setAnio(+e.target.value)} className="input w-24">
            {[2023,2024,2025,2026].map(a=><option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {/* Resumen rÃ¡pido */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { label:'Empleados activos', value:empleados.filter(e=>e.estado==='activo').length, color:'text-indigo-600' },
          { label:'Coste bruto '+anio, value:fmt(costeTotalAnio), color:'text-slate-900' },
          { label:'Total lÃ­quido '+anio, value:fmt(liquidoTotalAnio), color:'text-emerald-600' },
          { label:'DÃ­as vacaciones aprobados', value:diasVacaciones, color:'text-amber-600' },
        ].map((s,i)=>(
          <div key={i} className="stat-card">
            <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Informes disponibles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {INFORMES_DISP.map(inf=>(
          <div key={inf.id} className="card p-6">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl ${inf.bg} flex items-center justify-center flex-shrink-0`}>
                <inf.icon className={`w-6 h-6 ${inf.color}`}/>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900">{inf.titulo}</h3>
                <p className="text-sm text-slate-500 mt-0.5 mb-4">{inf.desc}</p>
                <div className="flex gap-2">
                  <button onClick={()=>exportExcel(inf.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium text-xs transition-colors">
                    <FileSpreadsheet className="w-3.5 h-3.5"/>Excel
                  </button>
                  <button onClick={()=>exportPDF(inf.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 font-medium text-xs transition-colors">
                    <FileText className="w-3.5 h-3.5"/>PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}