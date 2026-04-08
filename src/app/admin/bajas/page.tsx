'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Baja } from '@/lib/supabase'
import { iniciales, TIPOS_BAJA, formatFecha } from '@/lib/utils'
import { Plus, X, HeartPulse } from 'lucide-react'

export default function BajasPage() {
  const [bajas, setBajas] = useState<any[]>([])
  const [empleados, setEmpleados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ empleado_id:'', tipo:'enfermedad_comun', fecha_inicio:'', fecha_fin_prevista:'', numero_parte:'', observaciones:'' })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const cargar = useCallback(async () => {
    setLoading(true)
    const { data: emps } = await supabase.from('empleados').select('*').neq('rol','admin').order('nombre')
    const { data: bs } = await supabase.from('bajas').select('*, empleados(nombre, avatar_color, departamento)').order('created_at', { ascending: false })
    setEmpleados(emps || [])
    setBajas(bs || [])
    setLoading(false)
  }, [])
  useEffect(() => { cargar() }, [cargar])

  async function crearBaja() {
    if (!form.empleado_id || !form.fecha_inicio) return
    setSaving(true)
    await supabase.from('bajas').insert({ ...form, activa: true })
    await supabase.from('empleados').update({ estado: 'baja' }).eq('id', form.empleado_id)
    setSaving(false); setModal(false)
    showToast('Baja registrada'); cargar()
  }
  async function darAlta(baja: any) {
    await supabase.from('bajas').update({ activa: false, fecha_alta: new Date().toISOString().slice(0,10) }).eq('id', baja.id)
    await supabase.from('empleados').update({ estado: 'activo' }).eq('id', baja.empleado_id)
    showToast('Alta concedida'); cargar()
  }

  const activas = bajas.filter(b => b.activa)
  const historico = bajas.filter(b => !b.activa)

  return (
    <div>
      {toast && <div className="fixed top-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm z-50">{toast}</div>}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-xl font-bold text-gray-900">Bajas medicas</h1><p className="text-sm text-gray-500 mt-0.5">{activas.length} baja{activas.length!==1?'s':''} activa{activas.length!==1?'s':''}</p></div>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-1.5"><Plus className="w-4 h-4" />Registrar baja</button>
      </div>
      {activas.length > 0 && (<div className="mb-6"><h2 className="text-sm font-semibold text-gray-600 mb-3">Bajas activas</h2><div className="space-y-3">{activas.map((b:any) => (<div key={b.id} className="card p-4 border-l-4 border-red-400"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{backgroundColor:b.empleados?.avatar_color}}>{iniciales(b.empleados?.nombre||'')}</div><div><p className="font-medium text-gray-900">{b.empleados?.nombre}</p><p className="text-xs text-gray-500">{TIPOS_BAJA[b.tipo as keyof typeof TIPOS_BAJA]} · Desde {formatFecha(b.fecha_inicio)}</p></div></div><button onClick={() => darAlta(b)} className="btn-success">Dar alta</button></div>{b.observaciones && <p className="text-sm text-gray-500 mt-2 pl-12">{b.observaciones}</p>}</div>))}</div></div>)}
      <div><h2 className="text-sm font-semibold text-gray-600 mb-3">Historico</h2><div className="card overflow-hidden"><table className="w-full text-sm"><thead><tr className="border-b border-gray-100 bg-gray-50">{['Empleado','Tipo','Inicio','Alta','N. Parte'].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>)}</tr></thead><tbody>{loading?Array.from({length:3}).map((_,i)=><tr key={i} className="border-b border-gray-50">{Array.from({length:5}).map((_,j)=><td key={j} className="px-4 py-3"><div className="skeleton h-4 w-20"/></td>)}</tr>):historico.map((b:any)=>(<tr key={b.id} className="border-b border-gray-50"><td className="px-4 py-3 font-medium text-gray-900">{b.empleados?.nombre}</td><td className="px-4 py-3 text-gray-600">{TIPOS_BAJA[b.tipo as keyof typeof TIPOS_BAJA]}</td><td className="px-4 py-3 text-gray-600">{formatFecha(b.fecha_inicio)}</td><td className="px-4 py-3 text-gray-600">{b.fecha_alta?formatFecha(b.fecha_alta):'—'}</td><td className="px-4 py-3 text-gray-500">{b.numero_parte||'—'}</td></tr>))}</tbody></table></div></div>
      {modal && (<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"><div className="bg-white rounded-2xl w-full max-w-md p-6 m-4"><div className="flex items-center justify-between mb-5"><h3 className="font-semibold text-gray-900">Registrar baja</h3><button onClick={()=>setModal(false)}><X className="w-5 h-5 text-gray-400"/></button></div><div className="space-y-4"><div><label className="label">Empleado</label><select value={form.empleado_id} onChange={e=>setForm(f=>({...f,empleado_id:e.target.value}))} className="input"><option value="">Selecciona...</option>{empleados.filter(e=>e.estado==='activo').map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}</select></div><div><label className="label">Tipo de baja</label><select value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))} className="input">{Object.entries(TIPOS_BAJA).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div><div className="grid grid-cols-2 gap-3"><div><label className="label">Fecha inicio</label><input type="date" value={form.fecha_inicio} onChange={e=>setForm(f=>({...f,fecha_inicio:e.target.value}))} className="input"/></div><div><label className="label">Fin previsto</label><input type="date" value={form.fecha_fin_prevista} onChange={e=>setForm(f=>({...f,fecha_fin_prevista:e.target.value}))} className="input"/></div></div><div><label className="label">Numero de parte</label><input type="text" value={form.numero_parte} onChange={e=>setForm(f=>({...f,numero_parte:e.target.value}))} className="input" placeholder="Opcional"/></div><div><label className="label">Observaciones</label><textarea value={form.observaciones} onChange={e=>setForm(f=>({...f,observaciones:e.target.value}))} className="input" rows={2}/></div></div><div className="flex gap-3 mt-6"><button onClick={()=>setModal(false)} className="btn-secondary flex-1">Cancelar</button><button onClick={crearBaja} disabled={saving} className="btn-primary flex-1">{saving?'Guardando...':'Registrar baja'}</button></div></div></div>)}
    </div>
  )
}