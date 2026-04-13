'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Upload, Trash2, FileText, Search, Plus, PenLine,
  Download, Eye, Loader2, X, CheckCircle, AlertCircle,
  FolderOpen, File, FileSignature
} from 'lucide-react'

type Documento = {
  id: string; nombre: string; tipo: string|null; descripcion: string|null
  url: string|null; size_bytes: number|null; created_at: string
  empleado_id: string|null; empleados?: { nombre: string }|null
}
type Empleado = { id: string; nombre: string }

const TIPOS = ['Contrato','Acta','Plantilla','Nómina','Certificado','Formación','RGPD','Otro']
const TIPO_COLOR: Record<string,string> = {
  Contrato:'bg-indigo-100 text-indigo-700',
  Acta:'bg-amber-100 text-amber-700',
  Plantilla:'bg-emerald-100 text-emerald-700',
  Nómina:'bg-blue-100 text-blue-700',
  Certificado:'bg-purple-100 text-purple-700',
  Formación:'bg-pink-100 text-pink-700',
  RGPD:'bg-slate-100 text-slate-600',
  Otro:'bg-gray-100 text-gray-600',
}

function formatBytes(b: number|null) {
  if (!b) return ''
  if (b < 1024) return b + ' B'
  if (b < 1048576) return (b/1024).toFixed(1) + ' KB'
  return (b/1048576).toFixed(1) + ' MB'
}

export default function DocumentosPage() {
  const [docs, setDocs]         = useState<Documento[]>([])
  const [emps, setEmps]         = useState<Empleado[]>([])
  const [loading, setLoading]   = useState(true)
  const [uploading, setUploading] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [filtro, setFiltro]     = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [modal, setModal]       = useState(false)
  const [firmaModal, setFirmaModal] = useState<Documento|null>(null)
  const [firmaEmpId, setFirmaEmpId] = useState('')
  const [firmaMsg, setFirmaMsg] = useState('')
  const [firmando, setFirmando] = useState(false)
  const [uploadErr, setUploadErr] = useState('')
  const [uploadOk, setUploadOk] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formDoc, setFormDoc]   = useState({ nombre: '', tipo: 'Contrato', descripcion: '', empleado_id: '', file: null as File|null })

  const cargar = useCallback(async () => {
    const [{ data: ds }, { data: es }] = await Promise.all([
      supabase.from('documentos').select('*,empleados(nombre)').order('created_at', { ascending: false }),
      supabase.from('empleados').select('id,nombre').in('rol',['empleado','manager']).eq('estado','activo').order('nombre'),
    ])
    setDocs((ds || []) as Documento[])
    setEmps(es || [])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files)
    if (!list.length) return
    setUploading(true); setUploadErr(''); setUploadOk('')
    for (let i = 0; i < list.length; i++) {
      const file = list[i]
      setProgreso(Math.round(((i) / list.length) * 100))
      const path = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`
      const { error: storageErr } = await supabase.storage.from('documentos').upload(path, file)
      if (storageErr) { setUploadErr('Error al subir ' + file.name + ': ' + storageErr.message); continue }
      const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(path)
      await supabase.from('documentos').insert({
        nombre: formDoc.nombre || file.name,
        tipo: formDoc.tipo,
        descripcion: formDoc.descripcion || null,
        url: path,
        size_bytes: file.size,
        empleado_id: formDoc.empleado_id || null,
      })
    }
    setProgreso(100)
    setUploadOk(list.length === 1 ? 'Documento subido correctamente' : list.length + ' documentos subidos')
    setModal(false)
    setFormDoc({ nombre:'', tipo:'Contrato', descripcion:'', empleado_id:'', file:null })
    await cargar()
    setTimeout(() => setUploadOk(''), 4000)
    setUploading(false); setProgreso(0)
  }

  async function eliminar(doc: Documento) {
    if (!confirm('¿Eliminar "' + doc.nombre + '"? Esta acción no se puede deshacer.')) return
    if (doc.url) await supabase.storage.from('documentos').remove([doc.url])
    await supabase.from('documentos').delete().eq('id', doc.id)
    await cargar()
  }

  async function descargar(doc: Documento) {
    if (!doc.url) return
    const { data } = await supabase.storage.from('documentos').download(doc.url)
    if (!data) return
    const url = URL.createObjectURL(data)
    const a = document.createElement('a'); a.href = url; a.download = doc.nombre; a.click()
    URL.revokeObjectURL(url)
  }

  async function solicitarFirma() {
    if (!firmaModal || !firmaEmpId) return
    setFirmando(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: solicitante } = await supabase.from('empleados').select('id').eq('user_id', user!.id).single()
    await supabase.from('solicitudes_firma').insert({
      documento_id: firmaModal.id,
      empleado_id: firmaEmpId,
      solicitante_id: (solicitante as any)?.id,
      mensaje: firmaMsg.trim() || null,
    })
    setFirmaModal(null); setFirmaEmpId(''); setFirmaMsg('')
    setFirmando(false)
    setUploadOk('Solicitud de firma enviada')
    setTimeout(() => setUploadOk(''), 3000)
  }

  const filtrados = docs.filter(d => {
    const matchText = !filtro || d.nombre.toLowerCase().includes(filtro.toLowerCase()) || d.descripcion?.toLowerCase().includes(filtro.toLowerCase())
    const matchTipo = filtroTipo === 'todos' || d.tipo === filtroTipo
    return matchText && matchTipo
  })

  return (
    <div>
      {/* Header */}
      <div className="page-header mb-5">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-indigo-500"/>Documentos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {docs.length} documentos · Almacenados en Supabase Storage
          </p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4"/>Subir documento
        </button>
      </div>

      {/* Feedback */}
      {uploadOk && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 rounded-xl mb-4 text-sm text-emerald-700">
          <CheckCircle className="w-4 h-4 flex-shrink-0"/>{uploadOk}
        </div>
      )}
      {uploadErr && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl mb-4 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0"/>{uploadErr}
        </div>
      )}

      {/* Drag & Drop zona global */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
        className={`border-2 border-dashed rounded-2xl p-5 mb-5 text-center transition-all ${dragOver ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/20'}`}>
        <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1"/>
        <p className="text-sm text-slate-500">Arrastra archivos aquí para subirlos directamente</p>
        <p className="text-xs text-slate-400 mt-0.5">PDF, Word, Excel... · Máx. 50 MB por archivo</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
          <input value={filtro} onChange={e => setFiltro(e.target.value)}
            placeholder="Buscar documentos..." className="input pl-9 w-full"/>
        </div>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="input w-auto">
          <option value="todos">Todos los tipos</option>
          {TIPOS.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Lista documentos */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>
      ) : filtrados.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderOpen className="w-12 h-12 text-slate-200 mx-auto mb-3"/>
          <p className="font-semibold text-slate-500">
            {docs.length === 0 ? 'Sube tu primer documento' : 'Sin resultados para esa búsqueda'}
          </p>
          {docs.length === 0 && (
            <p className="text-xs text-slate-400 mt-1">
              Usa el botón "Subir documento" o arrastra archivos al área de arriba
            </p>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {filtrados.map(doc => {
              const emp = (doc as any).empleados
              return (
                <div key={doc.id} className="flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-indigo-500"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{doc.nombre}</p>
                      {doc.tipo && (
                        <span className={`badge text-[10px] px-2 py-0.5 rounded-full font-semibold ${TIPO_COLOR[doc.tipo] || TIPO_COLOR['Otro']}`}>
                          {doc.tipo}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {doc.descripcion && <span>{doc.descripcion} · </span>}
                      {emp && <span>📎 {emp.nombre} · </span>}
                      {formatBytes(doc.size_bytes)}
                      {doc.size_bytes ? ' · ' : ''}
                      {new Date(doc.created_at).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'})}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setFirmaModal(doc)} title="Solicitar firma"
                      className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-400 hover:text-indigo-600 transition-colors">
                      <PenLine className="w-4 h-4"/>
                    </button>
                    <button onClick={() => descargar(doc)} title="Descargar"
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors">
                      <Download className="w-4 h-4"/>
                    </button>
                    <button onClick={() => eliminar(doc)} title="Eliminar"
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* MODAL UPLOAD */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Subir documento</h3>
              <button onClick={() => setModal(false)}><X className="w-4 h-4 text-slate-400"/></button>
            </div>

            {/* Drop zone en modal */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault(); setDragOver(false)
                const f = e.dataTransfer.files[0]
                if (f) setFormDoc(p => ({ ...p, file: f, nombre: p.nombre || f.name }))
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center mb-4 cursor-pointer transition-all ${dragOver || formDoc.file ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-600 hover:border-indigo-300'}`}>
              <input ref={fileInputRef} type="file" className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) setFormDoc(p => ({ ...p, file: f, nombre: p.nombre || f.name }))
                }}/>
              {formDoc.file ? (
                <div>
                  <FileText className="w-8 h-8 text-indigo-500 mx-auto mb-2"/>
                  <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">{formDoc.file.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatBytes(formDoc.file.size)}</p>
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2"/>
                  <p className="text-sm text-slate-500">Arrastra o haz clic para seleccionar</p>
                </div>
              )}
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="label">Nombre del documento</label>
                <input value={formDoc.nombre} onChange={e => setFormDoc(p=>({...p,nombre:e.target.value}))}
                  placeholder="Acta de entrega de llaves" className="input w-full mt-1"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Tipo</label>
                  <select value={formDoc.tipo} onChange={e => setFormDoc(p=>({...p,tipo:e.target.value}))} className="input mt-1 w-full">
                    {TIPOS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Empleado <span className="text-slate-400 font-normal">(opcional)</span></label>
                  <select value={formDoc.empleado_id} onChange={e => setFormDoc(p=>({...p,empleado_id:e.target.value}))} className="input mt-1 w-full">
                    <option value="">General</option>
                    {emps.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Descripción <span className="text-slate-400 font-normal">(opcional)</span></label>
                <input value={formDoc.descripcion} onChange={e => setFormDoc(p=>({...p,descripcion:e.target.value}))}
                  placeholder="Descripción breve del documento" className="input w-full mt-1"/>
              </div>
            </div>

            {uploading && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Subiendo...</span><span>{progreso}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all rounded-full" style={{width:progreso+'%'}}/>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setModal(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={() => formDoc.file && handleFiles([formDoc.file])}
                disabled={uploading || !formDoc.file}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                {uploading ? <><Loader2 className="w-4 h-4 animate-spin"/>Subiendo…</> : <><Upload className="w-4 h-4"/>Subir</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SOLICITAR FIRMA */}
      {firmaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={e => e.target === e.currentTarget && setFirmaModal(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">Solicitar firma</h3>
                <p className="text-xs text-slate-400 mt-0.5">{firmaModal.nombre}</p>
              </div>
              <button onClick={() => setFirmaModal(null)}><X className="w-4 h-4 text-slate-400"/></button>
            </div>
            <div className="space-y-3 mb-4">
              <div>
                <label className="label">Empleado *</label>
                <select value={firmaEmpId} onChange={e => setFirmaEmpId(e.target.value)} className="input mt-1 w-full">
                  <option value="">Seleccionar empleado…</option>
                  {emps.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Mensaje <span className="text-slate-400 font-normal">(opcional)</span></label>
                <textarea value={firmaMsg} onChange={e => setFirmaMsg(e.target.value)}
                  placeholder="Instrucciones para el empleado..." rows={2} className="input w-full mt-1 resize-none"/>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setFirmaModal(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={solicitarFirma} disabled={firmando || !firmaEmpId}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                {firmando ? <><Loader2 className="w-4 h-4 animate-spin"/>Enviando…</> : <><PenLine className="w-4 h-4"/>Solicitar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}