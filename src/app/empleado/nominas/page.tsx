'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { FileText, TrendingUp, Download } from 'lucide-react'

type Nomina = { id: string; mes: number; anio: number; salario_base: number; complementos: number; irpf_pct: number; ss_pct: number; liquido: number }

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function fmt(n: number) { return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) }

export default function NominasPage() {
  const [nominas, setNominas] = useState<Nomina[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Nomina|null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase.from('empleados').select('id').eq('user_id', data.user.id).single()
        .then(({ data: emp }) => {
          if (!emp) return
          supabase.from('nominas').select('*').eq('empleado_id', emp.id).order('anio', { ascending: false }).order('mes', { ascending: false })
            .then(({ data: n }) => { setNominas(n || []); if (n?.length) setSelected(n[0]); setLoading(false) })
        })
    })
  }, [])

  if (loading) return (
    <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mis nóminas</h1>
          <p className="text-sm text-slate-500 mt-1">Historial de nóminas</p>
        </div>
      </div>

      {nominas.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No hay nóminas disponibles</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Lista */}
          <div className="card p-4 space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-2 mb-3">Historial</p>
            {nominas.map(n => (
              <button key={n.id} onClick={() => setSelected(n)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors flex items-center justify-between
                  ${selected?.id===n.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-700'}`}>
                <div>
                  <p className="text-sm font-semibold">{MESES[n.mes-1]} {n.anio}</p>
                  <p className="text-xs text-slate-500">{fmt(n.liquido)} neto</p>
                </div>
                <TrendingUp className="w-4 h-4 opacity-40" />
              </button>
            ))}
          </div>

          {/* Detalle */}
          {selected && (
            <div className="lg:col-span-2 card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Nómina de {MESES[selected.mes-1]} {selected.anio}</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Período: 1–{new Date(selected.anio, selected.mes, 0).getDate()} de {MESES[selected.mes-1]}</p>
                </div>
                <button className="btn-secondary text-xs gap-1.5" onClick={() => window.print()}>
                  <Download className="w-3.5 h-3.5" />Imprimir
                </button>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Salario base</span>
                  <span className="text-sm font-semibold text-slate-900">{fmt(selected.salario_base)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Complementos</span>
                  <span className="text-sm font-semibold text-emerald-600">+{fmt(selected.complementos)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">IRPF ({selected.irpf_pct}%)</span>
                  <span className="text-sm font-semibold text-red-600">-{fmt((selected.salario_base + selected.complementos) * selected.irpf_pct / 100)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Seg. Social ({selected.ss_pct}%)</span>
                  <span className="text-sm font-semibold text-red-600">-{fmt((selected.salario_base + selected.complementos) * selected.ss_pct / 100)}</span>
                </div>
              </div>

              <div className="bg-indigo-50 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Líquido a percibir</p>
                  <p className="text-3xl font-bold text-indigo-900 mt-1">{fmt(selected.liquido)}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}