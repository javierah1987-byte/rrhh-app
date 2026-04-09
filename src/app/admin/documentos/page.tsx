'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Upload, Trash2, FolderOpen, File, Search, ChevronDown } from 'lucide-react'

type Empleado = { id: string; nombre: string; avatar_color: string }
type Documento = { id: string; empleado_id: string; nombre: string; descripcion: string|null; tipo: string; archivo_url: string; archivo_nombre: string; created_at: string }

const TIPOS = [
  { value: 'nomina', label: '💰 Nómina' },
  { value: 'contrato', label: '📋 Contrato' },
  { value: 'certificado', label: '🏆 Certificado' },
  { value: 'irpf', label: '📊 Certificado IRPF' },
  { value: 'otro', label: '📄 Otro documento' },
]

export default function AdminDocumentosPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [empFiltro, setEmpFiltro] = useState<string>('todos')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Form state
  const [form, setForm] = useState({ empleado_id: '', nombre: '', descripcion: '', tipo: 'otro' })
  const [archivo, setArchivo] = useState<File|null>(null)

  useEffect(() => {
    Promise.all([
      supabase.from('empleados').select('id,nombre,avatar_color').order('nombre'),
      supabase.from('documentos').select('*').order('created_at',{ascending:false}),
    ]).then(([{data:e},{data:d}]) => {
      setEmpleados(e || [])
      setDocumentos(d || [])
      setLoading(false)
    })
  }, [])

  async function handleUpload(ev: React.FormEvent) {
    ev.preventDefault()
    if (!archivo || !form.empleado_id) return
    setUploading(true)

    const ext = archivo.name.split('.').pop()
    const path = `${form.empleado_id}/${Date.now()}.${ext}`

    const { error: upErr } = await supabase.storage.from('documentos').upload(path, archivo)
    if (upErr) { alert('Error al subir: ' + upErr.message); setUploading(false); return }

    const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(path)

    await supabase.from('documentos').insert({
      empleado_id: form.empleado_id,
      nombre: form.nombre || archivo.name,
      descripcion: form.descripcion || null,
      tipo: form.tipo,
      archivo_url: urlData.publicUrl,
      archivo_nombre: archivo.name,
      subido_por: 'admin',
    })

    const { data: d } = await supabase.from('documentos').select('*').order('created_at',{ascending:false})
    setDocumentos(d || [])
    setForm({ empleado_id: '', nombre: '', descripcion: '', tipo: 'otro' })
    setArchivo(null)
    if (fileRef.current) fileRef.current.value = ''
    setShowForm(false)
    setUploading(false)
  }

  async function handleDelete(doc: Documento) {
    if (!confirm(`¿Eliminar "${doc.nombre}"?`)) return
    const path = doc.archivo_url.split('/documentos/')[1]
    await supabase.storage.from('documentos').remove([path])
    await supabase.from('documentos').delete().eq('id', doc.id)
    setDocumentos(prev => prev.filter(d => d.id !== doc.id))
  }

  const docsFiltrados = documentos.filter(d => {
    const porEmp = empFiltro === 'todos' || d.empleado_id === empFiltro
    const porBusq = !busqueda || d.nombre.toLowerCase().includes(busqueda.toLowerCase())
    return porEmp && porBusq
  })

  function getNombre(id: string) { return empleados.find(e=>e.id===id)?.nombre || '—' }
  function getColor(id: string) { return empleados.find(e=>e.id===id)?.avatar_color || '#6366f1' }
  function getInitials(id: string) { const n=getNombre(id); return n.split(' ').map((p:string)=>p[0]).join('').substring(0,2) }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Documentos</h1>
          <p className="text-sm text-slate-500 mt-1">Gestiona los documentos de cada empleado</p>
        </div>
        <button onClick={()=>setShowForm(!showForm)} className="btn-primary">
          <Upload className="w-4 h-4"/>{showForm ? 'Cancelar' : 'Subir documento'}
        </button>
      </div>

      {/* Formulario subida */}
      {showForm && (
        <div className="card p-6 mb-5">
          <h3 className="font-semibold text-slate-900 mb-4">Subir nuevo documento</h3>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Empleado *</label>
                <select value={form.empleado_id} onChange={e=>setForm(f=>({...f,empleado_id:e.target.value}))} className="input" required>
                  <option value="">Selecciona un empleado</option>
                  {empleados.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Tipo de documento *</label>
                <select value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))} className="input">
                  {TIPOS.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Nombre del documento</label>
                <input value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} className="input" placeholder="Ej: Nómina enero 2025"/>
              </div>
              <div>
                <label className="label">Descripción (opcional)</label>
                <input value={form.descripcion} onChange={e=>setForm(f=>({...f,descripcion:e.target.value}))} className="input" placeholder="Breve descripción"/>
              </div>
            </div>
            <div>
              <label className="label">Archivo * (PDF, Word, Excel, imagen)</label>
              <input ref={fileRef} type="file" onChange={e=>setArchivo(e.target.files?.[0]||null)}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                required/>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={uploading} className="btn-primary">
                <Upload className="w-4 h-4"/>{uploading ? 'Subiendo…' : 'Subir documento'}
              </button>
              <button type="button" onClick={()=>setShowForm(false)} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
          <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} className="input pl-9 w-52" placeholder="Buscar documento…"/>
        </div>
        <select value={empFiltro} onChange={e=>setEmpFiltro(e.target.value)} className="input w-52">
          <option value="todos">Todos los empleados</option>
          {empleados.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}
        </select>
        <span className="text-sm text-slate-500">{docsFiltrados.length} documento{docsFiltrados.length!==1?'s':''}</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>
      ) : docsFiltrados.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-3"/>
          <p className="text-slate-500">No hay documentos{empFiltro!=='todos' ? ' para este empleado' : ''}</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header rounded-tl-2xl">Empleado</th>
                <th className="table-header">Documento</th>
                <th className="table-header">Tipo</th>
                <th className="table-header">Fecha</th>
                <th className="table-header rounded-tr-2xl">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {docsFiltrados.map(doc => (
                <tr key={doc.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{backgroundColor:getColor(doc.empleado_id)}}>
                        {getInitials(doc.empleado_id)}
                      </div>
                      <span className="font-medium text-slate-800">{getNombre(doc.empleado_id)}</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <p className="font-medium text-slate-900">{doc.nombre}</p>
                    {doc.descripcion && <p className="text-xs text-slate-400 truncate max-w-xs">{doc.descripcion}</p>}
                  </td>
                  <td className="table-cell">
                    <span className="badge badge-indigo">{TIPOS.find(t=>t.value===doc.tipo)?.label || doc.tipo}</span>
                  </td>
                  <td className="table-cell text-slate-500">
                    {new Date(doc.created_at).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'})}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <a href={doc.archivo_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Ver</a>
                      <button onClick={()=>handleDelete(doc)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}