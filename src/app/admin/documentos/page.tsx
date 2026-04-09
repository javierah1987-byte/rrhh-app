'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { FolderOpen, Upload, Trash2, File, Search, X } from 'lucide-react'

type Empleado = { id: string; nombre: string; avatar_color: string }
type Documento = { id: string; empleado_id: string; nombre: string; tipo: string; descripcion: string | null; url: string; created_at: string; empleados?: { nombre: string; avatar_color: string } }

const TIPOS = [
  { value:'contrato', label:'Contrato' },
  { value:'certificado', label:'Certificado' },
  { value:'formacion', label:'Formación' },
  { value:'otro', label:'Otro' },
]

const TIPO_COLOR: Record<string,string> = {
  contrato:'badge-indigo', certificado:'badge-amber', formacion:'badge-green', otro:'badge-slate'
}

export default function AdminDocumentosPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEmp, setFiltroEmp] = useState('')

  // Form state
  const [empSel, setEmpSel] = useState('')
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState('otro')
  const [descripcion, setDescripcion] = useState('')
  const [file, setFile] = useState<File|null>(null)

  useEffect(() => {
    Promise.all([
      supabase.from('empleados').select('id,nombre,avatar_color').order('nombre'),
      supabase.from('documentos').select('*,empleados(nombre,avatar_color)').order('created_at',{ascending:false})
    ]).then(([e, d]) => {
      setEmpleados(e.data || [])
      setDocumentos(d.data || [])
      setLoading(false)
    })
  }, [])

  async function handleUpload(ev: React.FormEvent) {
    ev.preventDefault()
    if (!file || !empSel) return
    setUploading(true)

    // Upload file to Supabase Storage
    const ext = file.name.split('.').pop()
    const path = `${empSel}/${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage.from('documentos').upload(path, file)
    if (uploadErr) { alert('Error al subir archivo: ' + uploadErr.message); setUploading(false); return }

    // Save metadata
    await supabase.from('documentos').insert({
      empleado_id: empSel, nombre: nombre || file.name, tipo, descripcion: descripcion || null, url: path
    })

    // Reload
    const { data } = await supabase.from('documentos').select('*,empleados(nombre,avatar_color)').order('created_at',{ascending:false})
    setDocumentos(data || [])
    setShowForm(false); setFile(null); setNombre(''); setDescripcion(''); setTipo('otro'); setEmpSel('')
    setUploading(false)
  }

  async function handleDelete(doc: Documento) {
    if (!confirm(`¿Eliminar "${doc.nombre}"?`)) return
    await supabase.storage.from('documentos').remove([doc.url])
    await supabase.from('documentos').delete().eq('id', doc.id)
    setDocumentos(prev => prev.filter(d => d.id !== doc.id))
  }

  async function handleDownload(doc: Documento) {
    const { data } = await supabase.storage.from('documentos').createSignedUrl(doc.url, 300)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  const docsFiltrados = documentos.filter(d => {
    const matchEmp = !filtroEmp || d.empleado_id === filtroEmp
    const matchSearch = !busqueda || d.nombre.toLowerCase().includes(busqueda.toLowerCase())
    return matchEmp && matchSearch
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Documentos</h1>
          <p className="text-sm text-slate-500 mt-1">{documentos.length} documento{documentos.length!==1?'s':''} en total</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Upload className="w-4 h-4"/>{showForm ? 'Cancelar' : 'Subir documento'}
        </button>
      </div>

      {/* Formulario subida */}
      {showForm && (
        <div className="card p-6 mb-5">
          <h3 className="font-semibold text-slate-900 mb-4">Subir documento para empleado</h3>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Empleado *</label>
                <select value={empSel} onChange={e=>setEmpSel(e.target.value)} className="input" required>
                  <option value="">Seleccionar empleado…</option>
                  {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Tipo de documento</label>
                <select value={tipo} onChange={e=>setTipo(e.target.value)} className="input">
                  {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Archivo *</label>
              <input type="file" onChange={e=>setFile(e.target.files?.[0]||null)} className="input py-1.5" required
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" />
              <p className="text-xs text-slate-400 mt-1">PDF, Word, Excel, imágenes — máx. 10MB</p>
            </div>
            <div>
              <label className="label">Nombre del documento</label>
              <input value={nombre} onChange={e=>setNombre(e.target.value)} className="input" placeholder="Ej: Contrato indefinido 2024 (dejar vacío para usar el nombre del archivo)" />
            </div>
            <div>
              <label className="label">Descripción (opcional)</label>
              <input value={descripcion} onChange={e=>setDescripcion(e.target.value)} className="input" placeholder="Ej: Contrato firmado el 15 de enero" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={uploading} className="btn-primary gap-2">
                <Upload className="w-4 h-4"/>{uploading ? 'Subiendo…' : 'Subir documento'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
          <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} className="input pl-9" placeholder="Buscar documento…"/>
        </div>
        <select value={filtroEmp} onChange={e=>setFiltroEmp(e.target.value)} className="input max-w-xs">
          <option value="">Todos los empleados</option>
          {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
        </select>
        {(busqueda||filtroEmp) && (
          <button onClick={()=>{setBusqueda('');setFiltroEmp('')}} className="btn-secondary gap-1.5 px-3">
            <X className="w-4 h-4"/>Limpiar
          </button>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>
      ) : docsFiltrados.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-3"/>
          <p className="text-slate-500">{documentos.length===0 ? 'No hay documentos subidos aún' : 'No hay resultados para este filtro'}</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Documento</th>
                <th className="table-header">Empleado</th>
                <th className="table-header">Tipo</th>
                <th className="table-header">Fecha</th>
                <th className="table-header"></th>
              </tr>
            </thead>
            <tbody>
              {docsFiltrados.map(doc => {
                const emp = doc.empleados as any
                return (
                  <tr key={doc.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                          <File className="w-4 h-4 text-indigo-600"/>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{doc.nombre}</p>
                          {doc.descripcion && <p className="text-xs text-slate-400 truncate max-w-xs">{doc.descripcion}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{backgroundColor: emp?.avatar_color || '#4F46E5'}}>
                          {emp?.nombre?.split(' ').map((n:string)=>n[0]).join('').substring(0,2) || '?'}
                        </div>
                        <span className="text-sm">{emp?.nombre || '—'}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${TIPO_COLOR[doc.tipo]||'badge-slate'}`}>
                        {TIPOS.find(t=>t.value===doc.tipo)?.label || doc.tipo}
                      </span>
                    </td>
                    <td className="table-cell text-slate-500">
                      {new Date(doc.created_at).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'})}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => handleDownload(doc)} className="p-2 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-colors" title="Descargar">
                          <Upload className="w-4 h-4 rotate-180"/>
                        </button>
                        <button onClick={() => handleDelete(doc)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors" title="Eliminar">
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}