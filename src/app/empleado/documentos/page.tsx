'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Nomina } from '@/lib/supabase'
import { MESES } from '@/lib/utils'
import { FileText, Download, X, ChevronRight } from 'lucide-react'

export default function DocumentosPage() {
  const [nominas, setNominas] = useState<Nomina[]>([])
  const [loading, setLoading] = useState(true)
  const [seleccionada, setSeleccionada] = useState<Nomina | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: emp } = await supabase.from('empleados').select('id').eq('user_id', user.id).single()
    if (!emp) return
    const { data: noms } = await supabase.from('nominas').select('*').eq('empleado_id', emp.id).order('anio', { ascending: false }).order('mes', { ascending: false })
    setNominas(noms || [])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  async function descargarPDF(n: Nomina) {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.text('ACME Corp.', 20, 25)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.text(`Nómina: ${MESES[n.mes]} ${n.anio}`, 20, 35)
    doc.setDrawColor(200, 200, 200); doc.line(20, 45, 190, 45)
    const rows = [['Salario base', `${n.salario_base.toFixed(2)} €`],['Complementos', `${n.complementos.toFixed(2)} €`],['Bruto total', `${(n.salario_base + n.complementos).toFixed(2)} €`],['Retención IRPF ' + n.irpf_pct + '%', `- ${((n.salario_base + n.complementos) * n.irpf_pct / 100).toFixed(2)} €`],['Seguridad Social ' + n.ss_pct + '%', `- ${((n.salario_base + n.complementos) * n.ss_pct / 100).toFixed(2)} €`]]
    let y = 58
    for (const [label, valor] of rows) { doc.text(label, 25, y); doc.text(valor, 165, y, { align: 'right' }); y += 10 }
    doc.line(20, y, 190, y); y += 8
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.text('Líquido a percibir', 25, y); doc.text(`${n.liquido.toFixed(2)} €`, 165, y, { align: 'right' })
    doc.save(`nomina_${MESES[n.mes]}_${n.anio}.pdf`)
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-gray-900 pt-4 mb-5">Documentos</h1>
      <h2 className="text-sm font-semibold text-gray-600 mb-3">Mis nóminas</h2>
      {loading ? <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-16 w-full rounded-xl" />)}</div>
        : nominas.length === 0 ? <div className="text-center py-12 text-gray-400">No hay nóminas disponibles</div>
        : <div className="space-y-2">{nominas.map(n => (<button key={n.id} onClick={() => setSeleccionada(n)} className="w-full card p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"><div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0"><FileText className="w-5 h-5 text-indigo-600" /></div><div className="flex-1 min-w-0"><p className="font-medium text-gray-900">Nómina {MESES[n.mes]} {n.anio}</p><p className="text-sm text-gray-500">{n.liquido.toFixed(2)} € netos</p></div><ChevronRight className="w-4 h-4 text-gray-300" /></button>))}</div>}
      {seleccionada && (<div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50"><div className="bg-white rounded-t-2xl w-full max-w-[420px] p-5 pb-8"><div className="flex items-center justify-between mb-5"><h3 className="font-semibold text-gray-900">Nómina {MESES[seleccionada.mes]} {seleccionada.anio}</h3><button onClick={() => setSeleccionada(null)}><X className="w-5 h-5 text-gray-400" /></button></div><div className="space-y-3 mb-5">{[{label:'Salario base',valor:seleccionada.salario_base,tipo:'suma'},{label:'Complementos',valor:seleccionada.complementos,tipo:'suma'},{label:`Retención IRPF (${seleccionada.irpf_pct}%)`,valor:(seleccionada.salario_base+seleccionada.complementos)*seleccionada.irpf_pct/100,tipo:'resta'},{label:`Seguridad Social (${seleccionada.ss_pct}%)`,valor:(seleccionada.salario_base+seleccionada.complementos)*seleccionada.ss_pct/100,tipo:'resta'}].map(item => (<div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50"><span className="text-sm text-gray-600">{item.label}</span><span className={`text-sm font-medium ${item.tipo==='resta'?'text-red-600':'text-gray-900'}`}>{item.tipo==='resta'?'- ':''}{item.valor.toFixed(2)} €</span></div>))}<div className="flex items-center justify-between pt-2"><span className="font-semibold text-gray-900">Líquido a percibir</span><span className="text-xl font-bold text-indigo-600">{seleccionada.liquido.toFixed(2)} €</span></div></div><button onClick={() => descargarPDF(seleccionada)} className="btn-primary w-full flex items-center justify-center gap-2 py-3"><Download className="w-4 h-4" /> Descargar PDF</button></div></div>)}
    </div>
  )
}