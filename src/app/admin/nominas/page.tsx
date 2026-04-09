'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Upload, FileText, Download, Trash2, ChevronDown, CheckCircle, AlertCircle, X } from 'lucide-react'
import { EmptyState, SkeletonTable, LoadingSpinner } from '@/components/shared'
import { Breadcrumb } from '@/components/Breadcrumb'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

type Nomina = {
  id: string; empleado_id: string; mes: number; anio: number
  salario_base: number; complementos: number; irpf_pct: number; ss_pct: number
  liquido: number; archivo_url: string | null; created_at: string
  empleados: { nombre: string; avatar_color: string; departamento: string | null }
}
type Empleado = { id: string; nombre: string; avatar_color: string; departamento: string | null }

type Toast = { id: number; tipo: 'ok' | 'err'; msg: string }

function parseNombreArchivo(nombre: string): { mes: number | null; anio: number | null; nombreEmp: string | null } {
  // Intenta extraer mes y año del nombre del archivo
  // Ejemplos: "nomina_ana_enero_2025.pdf", "Nomina_Marzo-2025_LuisMartinez.pdf", "nomina-03-2025.pdf"
  const mesesEs = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  const lower = nombre.toLowerCase().replace(/[_\-\s]+/g, ' ')
  
  let mes: number | null = null
  let anio: number | null = null
  
  // Buscar mes por nombre
  mesesEs.forEach((m, i) => { if (lower.includes(m)) mes = i + 1 })
  
  // Buscar mes por número (formato MM/YYYY o MM-YYYY)
  const numMatch = lower.match(/(\d{1,2})[\s/\-](\d{4})/) || lower.match(/(\d{4})[\s/\-](\d{1,2})/)
  if (numMatch) {
    const a = parseInt(numMatch[1]), b = parseInt(numMatch[2])
    if (a > 1900) { anio = a; if (b >= 1 && b <= 12) mes = b }
    else if (b > 1900) { anio = b; if (a >= 1 && a <= 12) mes = a }
  }
  
  // Buscar año suelto
  const anioMatch = lower.match(/(202[0-9]|203[0-9])/)
  if (!anio && anioMatch) anio = parseInt(anioMatch[1])
  
  return { mes, anio, nombreEmp: null }
}

export default function AdminNominasPage() {
  const [nominas, setNominas] = useState<Nomina[]>([])
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  
  // Estado del formulario de subida
  const [empSel, setEmpSel] = useState('')
  const [mesSel, setMesSel] = useState(new Date().getMonth() + 1)
  const [anioSel, setAnioSel] = useState(new Date().getFullYear())
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<{mes:number;anio:number;autoDetect:boolean}>({mes:new Date().getMonth()+1,anio:new Date().getFullYear(),autoDetect:false})
  
  const toast = (tipo: 'ok'|'err', msg: string) => {
    const id = Date.now()
    setToasts(t => [...t, {id,tipo,msg}])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000)
  }

  const load = async () => {
    const [{ data: noms }, { data: emps }] = await Promise.all([
      supabase.from('nominas').select('*,empleados(nombre,avatar_color,departamento)').order('anio',{ascending:false}).order('mes',{ascending:false}),
      supabase.from('empleados').select('id,nombre,avatar_color,departamento').eq('estado','activo').order('nombre'),
    ])
    setNominas((noms as any) || [])
    setEmpleados(emps || [])
    if (emps?.length && !empSel) setEmpSel(emps[0].id)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    // Autodetectar mes/año del nombre
    const { mes, anio } = parseNombreArchivo(f.name)
    if (mes || anio) {
      setPreview({ mes: mes || mesSel, anio: anio || anioSel, autoDetect: true })
      if (mes) setMesSel(mes)
      if (anio) setAnioSel(anio)
    } else {
      setPreview({ mes: mesSel, anio: anioSel, autoDetect: false })
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f?.type !== 'application/pdf') { toast('err', 'Solo se admiten archivos PDF'); return }
    setFile(f)
    const { mes, anio } = parseNombreArchivo(f.name)
    if (mes) setMesSel(mes)
    if (anio) setAnioSel(anio)
    setPreview({ mes: mes || mesSel, anio: anio || anioSel, autoDetect: !!(mes || anio) })
  }

  const handleUpload = async () => {
    if (!file || !empSel) { toast('err', 'Selecciona empleado y archivo'); return }
    setUploading(true)
    try {
      const path = `${empSel}/${anioSel}-${String(mesSel).padStart(2,'0')}.pdf`
      const { error: upErr } = await supabase.storage.from('nominas').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('nominas').getPublicUrl(path)
      
      // Calcular liquido si no hay registros previos (estimación)
      const { data: emp } = await supabase.from('empleados').select('*').eq('id', empSel).single()
      const salario_base = (emp as any)?.salario_base || 0
      const irpf = 15; const ss = 6.35
      const liquido = salario_base * (1 - (irpf + ss) / 100)

      const { error: dbErr } = await supabase.from('nominas').upsert({
        empleado_id: empSel, mes: mesSel, anio: anioSel,
        salario_base: salario_base || 0, complementos: 0,
        irpf_pct: irpf, ss_pct: ss, liquido: liquido || 0,
        archivo_url: path,
      }, { onConflict: 'empleado_id,mes,anio' })
      if (dbErr) throw dbErr

      toast('ok', '✅ Nómina subida y asignada correctamente')
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
      load()
    } catch (e: any) {
      toast('err', 'Error: ' + e.message)
    } finally { setUploading(false) }
  }

  const descargar = async (nom: Nomina) => {
    if (!nom.archivo_url) return
    const { data } = await supabase.storage.from('nominas').createSignedUrl(nom.archivo_url, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  const eliminar = async (nom: Nomina) => {
    if (!confirm('¿Eliminar esta nómina?')) return
    if (nom.archivo_url) await supabase.storage.from('nominas').remove([nom.archivo_url])
    await supabase.from('nominas').delete().eq('id', nom.id)
    toast('ok', 'Nómina eliminada')
    load()
  }

  const aniosDisp = Array.from({length:5},(_,i)=>new Date().getFullYear()-i)

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb/>
      <div className="flex items-center justify-between">
        <h1 className="page-title">💰 Nóminas</h1>
        <span className="badge badge-indigo">{nominas.length} registros</span>
      </div>

      {/* Toasts */}
      <div className="fixed top-5 right-5 z-50 space-y-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-scale-in pointer-events-auto ${t.tipo==='ok'?'bg-emerald-50 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700':'bg-red-50 dark:bg-red-900/80 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700'}`}>
            {t.tipo==='ok'?<CheckCircle className="w-4 h-4"/>:<AlertCircle className="w-4 h-4"/>}
            {t.msg}
          </div>
        ))}
      </div>

      {/* Formulario de subida */}
      <div className="card p-6 space-y-5">
        <h2 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Upload className="w-5 h-5 text-indigo-500"/> Subir nómina en PDF
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Empleado */}
          <div>
            <label className="label">Empleado</label>
            <div className="relative">
              <select value={empSel} onChange={e=>setEmpSel(e.target.value)} className="input pr-8 appearance-none">
                {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none"/>
            </div>
          </div>
          {/* Mes */}
          <div>
            <label className="label">Mes</label>
            <div className="relative">
              <select value={mesSel} onChange={e=>{setMesSel(+e.target.value);setPreview(p=>({...p,mes:+e.target.value}))}} className="input pr-8 appearance-none">
                {MESES.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none"/>
            </div>
          </div>
          {/* Año */}
          <div>
            <label className="label">Año</label>
            <div className="relative">
              <select value={anioSel} onChange={e=>{setAnioSel(+e.target.value);setPreview(p=>({...p,anio:+e.target.value}))}} className="input pr-8 appearance-none">
                {aniosDisp.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none"/>
            </div>
          </div>
        </div>

        {/* Zona drag & drop */}
        <div
          onDragOver={e=>e.preventDefault()}
          onDrop={onDrop}
          onClick={()=>fileRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${file?'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20':'border-slate-300 dark:border-slate-600 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10'}`}>
          <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={onFileChange}/>
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <FileText className="w-10 h-10 text-indigo-500"/>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{file.name}</p>
              <p className="text-xs text-slate-400">{(file.size/1024).toFixed(0)} KB</p>
              {preview.autoDetect && (
                <span className="badge badge-green mt-1">✨ Detectado: {MESES[preview.mes-1]} {preview.anio}</span>
              )}
              <button onClick={e=>{e.stopPropagation();setFile(null);if(fileRef.current)fileRef.current.value=''}}
                className="text-xs text-red-500 hover:text-red-700 mt-1 flex items-center gap-1">
                <X className="w-3 h-3"/> Quitar archivo
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                <Upload className="w-7 h-7 text-indigo-500"/>
              </div>
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">Arrastra el PDF aquí</p>
                <p className="text-sm text-slate-400 mt-1">o haz clic para seleccionarlo · Máx. 10 MB</p>
              </div>
              <p className="text-xs text-indigo-500 font-medium bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full">
                ✨ El mes y año se detectan automáticamente del nombre del archivo
              </p>
            </div>
          )}
        </div>

        <button onClick={handleUpload} disabled={!file||!empSel||uploading} className="btn-primary w-full">
          {uploading ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/>Subiendo...</> : <><Upload className="w-4 h-4"/> Subir y asignar nómina</>}
        </button>
      </div>

      {/* Lista de nóminas */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 dark:text-slate-100">Historial de nóminas</h2>
        </div>
        {loading ? <SkeletonTable rows={5}/> : nominas.length === 0 ? (
          <EmptyState icon="document" title="Sin nóminas" description="Sube el primer PDF para empezar"/>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Empleado</th>
                <th className="table-header">Período</th>
                <th className="table-header hidden md:table-cell">S. Base</th>
                <th className="table-header hidden md:table-cell">Líquido</th>
                <th className="table-header">Archivo</th>
                <th className="table-header"></th>
              </tr>
            </thead>
            <tbody>
              {nominas.map(n => (
                <tr key={n.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{backgroundColor:(n.empleados as any).avatar_color||'#6366f1'}}>
                        {(n.empleados as any).nombre.split(' ').map((x:string)=>x[0]).join('').substring(0,2)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{(n.empleados as any).nombre}</p>
                        {(n.empleados as any).departamento && <p className="text-xs text-slate-400">{(n.empleados as any).departamento}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="badge badge-indigo">{MESES[n.mes-1]} {n.anio}</span>
                  </td>
                  <td className="table-cell hidden md:table-cell tabular-nums">{n.salario_base ? n.salario_base.toLocaleString('es-ES',{style:'currency',currency:'EUR'}) : '—'}</td>
                  <td className="table-cell hidden md:table-cell tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">{n.liquido ? n.liquido.toLocaleString('es-ES',{style:'currency',currency:'EUR'}) : '—'}</td>
                  <td className="table-cell">
                    {n.archivo_url ? (
                      <span className="badge badge-green flex items-center gap-1 w-fit">
                        <FileText className="w-3 h-3"/> PDF
                      </span>
                    ) : (
                      <span className="badge badge-slate">Sin archivo</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1 justify-end">
                      {n.archivo_url && (
                        <button onClick={()=>descargar(n)} title="Descargar"
                          className="p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600 transition-colors">
                          <Download className="w-4 h-4"/>
                        </button>
                      )}
                      <button onClick={()=>eliminar(n)} title="Eliminar"
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}