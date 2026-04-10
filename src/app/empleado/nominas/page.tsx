'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Download, FileText, Lock, TrendingDown, Wallet, PiggyBank, BadgeEuro } from 'lucide-react'
import { EmptyState, SkeletonTable } from '@/components/shared'
import { Breadcrumb } from '@/components/Breadcrumb'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

type Nomina = {
  id: string; mes: number; anio: number; salario_base: number
  complementos: number; irpf_pct: number; ss_pct: number; liquido: number; archivo_url: string | null
}
type Documento = { id: string; nombre: string; tipo: string; archivo_url: string; created_at: string }

function fmt(v: number | null | undefined) {
  if (v == null) return '—'
  return Number(v).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
}

export default function EmpleadoNominasPage() {
  const [nominas, setNominas]       = useState<Nomina[]>([])
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [loading, setLoading]       = useState(true)
  const [loadingDocs, setLoadingDocs] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: emp } = await supabase.from('empleados').select('id').eq('user_id', user.id).single()
      if (!emp) return
      const { data: noms } = await supabase.from('nominas').select('*').eq('empleado_id', emp.id).order('anio',{ascending:false}).order('mes',{ascending:false})
      setNominas(noms || []); setLoading(false)
      const { data: docs } = await supabase.from('documentos').select('*').eq('empleado_id', emp.id).order('created_at',{ascending:false})
      setDocumentos(docs || []); setLoadingDocs(false)
    }
    init()
  }, [])

  const descargar = async (bucket: string, path: string) => {
    const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  const ultima = nominas[0]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb/>
      <h1 className="page-title">Nóminas y documentos</h1>

      {ultima && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Nómina más reciente</p>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">{MESES[ultima.mes-1]} {ultima.anio}</h2>
            </div>
            {ultima.archivo_url && (
              <button onClick={()=>descargar('nominas',ultima.archivo_url!)} className="btn-primary text-xs px-4 py-2 flex items-center gap-2">
                <Download className="w-3.5 h-3.5"/> Descargar PDF
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-slate-500 mb-1"><BadgeEuro className="w-4 h-4"/><span className="text-xs font-medium">Salario bruto</span></div>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">{fmt(ultima.salario_base)}</span>
              {ultima.complementos > 0 && <span className="text-xs text-emerald-600">+ {fmt(ultima.complementos)} complementos</span>}
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-red-500 mb-1"><TrendingDown className="w-4 h-4"/><span className="text-xs font-medium">Retención IRPF</span></div>
              <span className="text-lg font-bold text-red-600 dark:text-red-400 tabular-nums">-{ultima.irpf_pct||0}%</span>
              <span className="text-xs text-red-400 tabular-nums">{fmt((ultima.salario_base+(ultima.complementos||0))*(ultima.irpf_pct||0)/100)}</span>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-amber-600 mb-1"><PiggyBank className="w-4 h-4"/><span className="text-xs font-medium">Seguridad Social</span></div>
              <span className="text-lg font-bold text-amber-600 dark:text-amber-400 tabular-nums">-{ultima.ss_pct||0}%</span>
              <span className="text-xs text-amber-400 tabular-nums">{fmt((ultima.salario_base+(ultima.complementos||0))*(ultima.ss_pct||0)/100)}</span>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-emerald-600 mb-1"><Wallet className="w-4 h-4"/><span className="text-xs font-medium">Líquido neto</span></div>
              <span className="text-xl font-black text-emerald-700 dark:text-emerald-400 tabular-nums">{fmt(ultima.liquido)}</span>
              <span className="text-[10px] text-emerald-500">A recibir en cuenta</span>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Historial de nóminas</h2>
        <div className="card overflow-hidden">
          {loading ? <SkeletonTable rows={4}/> : nominas.length===0 ? (
            <EmptyState icon="document" title="Sin nóminas" description="RRHH irá subiendo tus nóminas mensualmente."/>
          ) : (
            <table className="w-full">
              <thead><tr>
                <th className="table-header">Período</th>
                <th className="table-header hidden md:table-cell">Salario base</th>
                <th className="table-header hidden md:table-cell">IRPF</th>
                <th className="table-header hidden md:table-cell">S.S.</th>
                <th className="table-header">Líquido</th>
                <th className="table-header">PDF</th>
              </tr></thead>
              <tbody>
                {nominas.map(n => (
                  <tr key={n.id} className="table-row">
                    <td className="table-cell"><span className="badge badge-indigo font-semibold">{MESES[n.mes-1]} {n.anio}</span></td>
                    <td className="table-cell hidden md:table-cell tabular-nums text-sm">{fmt(n.salario_base)}</td>
                    <td className="table-cell hidden md:table-cell text-red-600 dark:text-red-400 tabular-nums text-sm">-{n.irpf_pct||0}%</td>
                    <td className="table-cell hidden md:table-cell text-amber-600 dark:text-amber-400 tabular-nums text-sm">-{n.ss_pct||0}%</td>
                    <td className="table-cell"><span className="font-bold text-emerald-700 dark:text-emerald-400 tabular-nums text-sm">{fmt(n.liquido)}</span></td>
                    <td className="table-cell">
                      {n.archivo_url ? (
                        <button onClick={()=>descargar('nominas',n.archivo_url!)} className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
                          <Download className="w-3.5 h-3.5"/> Descargar
                        </button>
                      ) : <span className="flex items-center gap-1 text-xs text-slate-400"><Lock className="w-3 h-3"/> No disponible</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Mis documentos</h2>
        <div className="card overflow-hidden">
          {loadingDocs ? <SkeletonTable rows={3}/> : documentos.length===0 ? (
            <EmptyState icon="folder" title="Sin documentos" description="RRHH puede subir documentos a tu expediente (contratos, certificados, etc.)."/>
          ) : (
            <table className="w-full">
              <thead><tr>
                <th className="table-header">Documento</th>
                <th className="table-header hidden md:table-cell">Tipo</th>
                <th className="table-header hidden md:table-cell">Fecha</th>
                <th className="table-header">Descargar</th>
              </tr></thead>
              <tbody>
                {documentos.map(d => (
                  <tr key={d.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0"/>
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{d.nombre}</span>
                      </div>
                    </td>
                    <td className="table-cell hidden md:table-cell"><span className="badge badge-slate capitalize">{d.tipo||'Documento'}</span></td>
                    <td className="table-cell hidden md:table-cell text-sm text-slate-500">{new Date(d.created_at).toLocaleDateString('es-ES')}</td>
                    <td className="table-cell">
                      {d.archivo_url ? (
                        <button onClick={()=>descargar('documents',d.archivo_url)} className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
                          <Download className="w-3.5 h-3.5"/> Descargar
                        </button>
                      ) : <span className="text-xs text-slate-400">No disponible</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800">
        <p className="text-xs text-indigo-700 dark:text-indigo-300 flex items-start gap-2">
          <Lock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"/>
          Tus nóminas y documentos son confidenciales. Los archivos se descargan mediante enlace temporal seguro que caduca en 60 segundos.
        </p>
      </div>
    </div>
  )
}