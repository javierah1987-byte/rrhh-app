'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Download, FileText, Lock } from 'lucide-react'
import { EmptyState, SkeletonTable } from '@/components/shared'
import { Breadcrumb } from '@/components/Breadcrumb'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

type Nomina = {
  id: string; mes: number; anio: number; salario_base: number
  complementos: number; irpf_pct: number; ss_pct: number; liquido: number; archivo_url: string | null
}

export default function EmpleadoNominasPage() {
  const [nominas, setNominas] = useState<Nomina[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNominas = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: emp } = await supabase.from('empleados').select('id').eq('user_id', user.id).single()
      if (!emp) return
      const { data } = await supabase.from('nominas').select('*').eq('empleado_id', emp.id).order('anio',{ascending:false}).order('mes',{ascending:false})
      setNominas(data || [])
      setLoading(false)
    }
    fetchNominas()
  }, [])

  const descargar = async (nom: Nomina) => {
    if (!nom.archivo_url) return
    const { data } = await supabase.storage.from('nominas').createSignedUrl(nom.archivo_url, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb/>
      <h1 className="page-title">💰 Mis nóminas</h1>

      <div className="card overflow-hidden">
        {loading ? <SkeletonTable rows={4}/> : nominas.length === 0 ? (
          <EmptyState icon="document" title="Sin nóminas" description="Aun no hay nóminas disponibles. RRHH las irá subiendo mensualmente."/>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Período</th>
                <th className="table-header hidden md:table-cell">Salario base</th>
                <th className="table-header hidden md:table-cell">Retención IRPF</th>
                <th className="table-header hidden md:table-cell">S.S.</th>
                <th className="table-header">Líquido</th>
                <th className="table-header">PDF</th>
              </tr>
            </thead>
            <tbody>
              {nominas.map(n => (
                <tr key={n.id} className="table-row">
                  <td className="table-cell">
                    <span className="badge badge-indigo font-semibold">{MESES[n.mes-1]} {n.anio}</span>
                  </td>
                  <td className="table-cell hidden md:table-cell tabular-nums">
                    {n.salario_base ? n.salario_base.toLocaleString('es-ES',{style:'currency',currency:'EUR'}) : '—'}
                  </td>
                  <td className="table-cell hidden md:table-cell text-red-600 dark:text-red-400 tabular-nums">
                    -{n.irpf_pct}%
                  </td>
                  <td className="table-cell hidden md:table-cell text-amber-600 dark:text-amber-400 tabular-nums">
                    -{n.ss_pct}%
                  </td>
                  <td className="table-cell">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 tabular-nums text-sm">
                      {n.liquido ? n.liquido.toLocaleString('es-ES',{style:'currency',currency:'EUR'}) : '—'}
                    </span>
                  </td>
                  <td className="table-cell">
                    {n.archivo_url ? (
                      <button onClick={()=>descargar(n)}
                        className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
                        <Download className="w-3.5 h-3.5"/> Descargar
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Lock className="w-3 h-3"/> No disponible
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800">
        <p className="text-xs text-indigo-700 dark:text-indigo-300 flex items-start gap-2">
          <Lock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"/>
          Las nóminas son confidenciales y solo tú puedes acceder a las tuyas. Los PDFs se descargan mediante enlace temporal seguro.
        </p>
      </div>
    </div>
  )
}