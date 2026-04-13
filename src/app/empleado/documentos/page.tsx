'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { FileText, Download, FolderOpen, Loader2, PenLine, CheckCircle } from 'lucide-react'

type Doc = {
  id: string; nombre: string; tipo: string|null; descripcion: string|null
  url: string|null; size_bytes: number|null; created_at: string
  solicitudes_firma?: { estado: string }[]
}

function formatBytes(b: number|null) {
  if (!b) return ''
  if (b < 1024) return b + ' B'
  if (b < 1048576) return (b/1024).toFixed(1) + ' KB'
  return (b/1048576).toFixed(1) + ' MB'
}

const TIPO_COLOR: Record<string,string> = {
  Contrato:'bg-indigo-100 text-indigo-700',
  Acta:'bg-amber-100 text-amber-700',
  Plantilla:'bg-emerald-100 text-emerald-700',
  N\u00f3mina:'bg-blue-100 text-blue-700',
  Certificado:'bg-purple-100 text-purple-700',
  Formaci\u00f3n:'bg-pink-100 text-pink-700',
  RGPD:'bg-slate-100 text-slate-600',
  Otro:'bg-gray-100 text-gray-600',
}

export default function MisDocumentosPage() {
  const [docs, setDocs]       = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [empId, setEmpId]     = useState('')

  const cargar = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: emp } = await supabase.from('empleados').select('id').eq('user_id', user.id).single()
    if (!emp) return
    const id = (emp as any).id
    setEmpId(id)
    const { data } = await supabase.from('documentos')
      .select('*,solicitudes_firma(estado)')
      .or(`empleado_id.eq.${id},visibilidad.eq.empresa`)
      .order('created_at', { ascending: false })
    setDocs((data || []) as Doc[])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  async function descargar(doc: Doc) {
    if (!doc.url) return
    const { data } = await supabase.storage.from('documentos').download(doc.url)
    if (!data) return
    const url = URL.createObjectURL(data)
    const a = document.createElement('a'); a.href = url; a.download = doc.nombre; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="page-header mb-5">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-indigo-500"/>Mis documentos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Documentos asignados y de empresa disponibles</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>
      ) : docs.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderOpen className="w-10 h-10 text-slate-200 mx-auto mb-3"/>
          <p className="text-slate-500">No tienes documentos disponibles</p>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map(doc => {
            const firma = doc.solicitudes_firma?.[0]
            return (
              <div key={doc.id} className="card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-indigo-500"/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{doc.nombre}</p>
                    {doc.tipo && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${TIPO_COLOR[doc.tipo] || TIPO_COLOR['Otro']}`}>{doc.tipo}</span>
                    )}
                    {firma?.estado === 'firmado' && (
                      <span className="badge badge-green text-[10px] flex items-center gap-0.5">
                        <CheckCircle className="w-3 h-3"/>Firmado
                      </span>
                    )}
                    {firma?.estado === 'pendiente' && (
                      <span className="badge badge-amber text-[10px] flex items-center gap-0.5">
                        <PenLine className="w-3 h-3"/>Pendiente firma
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {doc.descripcion && <span>{doc.descripcion} · </span>}
                    {formatBytes(doc.size_bytes)}
                    {doc.size_bytes ? ' · ' : ''}
                    {new Date(doc.created_at).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'})}
                  </p>
                </div>
                {doc.url && (
                  <button onClick={() => descargar(doc)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 flex-shrink-0 transition-colors">
                    <Download className="w-4 h-4"/>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}