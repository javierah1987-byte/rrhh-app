'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Baja, TipoBaja } from '@/lib/supabase'
import { iniciales, TIPOS_BAJA, formatFecha } from '@/lib/utils'
import { Plus, X, HeartPulse } from 'lucide-react'

const TIPOS = Object.entries(TIPOS_BAJA) as [TipoBaja, string][]

export default function BajasPage() {
  const [bajas, setBajas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [empleados, setEmpleados] = useState<any[]>([])
  const [form, setForm] = useState({ empleado_id: '', tipo: 'enfermedad_comun' as TipoBaja, fecha_inicio: '', numero_parte: '', observaciones: '' })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  const cargar = useCallback(async () => {
    setLoading(true)
    const { data: bs } = await supabase.from('bajas').select('*, empleados(nombre, avatar_color, departamento)').eq('activa', true).order('fecha_inicio', { ascending: false })
    const { data: emps } = await supabase.from('empleados').select('id, nombre').neq('rol', 'admin').order('nombre')
    setBajas((bs as any) || [])
    setEmpleados(emps || [])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  async function registrarBaja() {
    if (!form.empleado_id || !form.fecha_inicio) return
    setSaving(true)
    await supabase.from('bajas').insert({ ...form, activa: true })
    await supabase.from('empleados').update({ estado: 'baja' }).eq('id', form.empleado_id)
    setSaving(false); setModal(false)
    setForm({ empleado_id: '', tipo: 'enfermedad_comun', fecha_inicio: '', numero_parte: '', observaciones: '' })
    showToast('Baja registrada'); cargar()
  }

  async function darAlta(baja: Baja) {
    await supabase.from('bajas').update({ activa: false, fecha_alta: new Date().toISOString().slice(0, 10) }).eq('id', baja.id)
    await supabase.from('empleados').update({ estado: 'activo' }).eq('id', baja.empleado_id)
    showToast('Alta médica registrada'); cargar()
  }

  return (
    <div>
      {toast && <div className="fixed top-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm z-50">{toast}</div>}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-xl font-bold text-gray-900">Bajas médicas</h1><p className="text-sm text-gray-500 mt-0.5">{bajas.length} baja{bajas.length !== 1 ? 's' : ''} activa{bajas.length !== 1 ? 's' : ''}</p></div>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-1.5"><Plus className="w-4 h-4" />Registrar baja</button>
      </div>

      {loading ? <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}</div>
      : bajas.length === 0 ? <div className="card p-12 text-center text-gray-400"><HeartPulse className="w-10 h-10 mx-auto mb-3 text-gray-300" /><p>No hay bajas activas</p></div>
      : <div className="space-y-3">
          {bajas.map((b: any) => (
            <div key={b.id} className="card p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: b.empleados?.avatar_color }}>
                  {iniciales(b.empleados?.nombre || '')}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{b.empleados?.nombre}</p>
                  <p className="text-xs text-gray-500">{b.empleados?.departamento} · {TIPOS_BAJA[b.tipo as TipoBaja]}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Desde {formatFecha(b.fecha_inicio)}{b.numero_parte && <span> · Parte: {b.numero_parte}</span>}</p>
                </div>
                <button onClick={() => darAlta(b)} className="btn-success flex-shrink-0">Dar alta</button>
              </div>
            </div>
          ))}
        </div>}

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">Registrar baja médica</h3>
              <button onClick={() => setModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="label">Empleado</label>
                <select value={form.empleado_id} onChange={e => setForm(f => ({ ...f, empleado_id: e.target.value }))} className="input">
                  <option value="">Seleccionar...</option>
                  {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>
              <div><label className="label">Tipo de baja</label>
                <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as TipoBaja }))} className="input">
                  {TIPOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div><label className="label">Fecha de inicio</label>
                <input type="date" value={form.fecha_inicio} onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))} className="input" />
              </div>
              <div><label className="label">Número de parte (opcional)</label>
                <input type="text" value={form.numero_parte} onChange={e => setForm(f => ({ ...f, numero_parte: e.target.value }))} className="input" placeholder="P-2024-XXXXX" />
              </div>
              <div><label className="label">Observaciones</label>
                <textarea value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} className="input h-20 resize-none" />
              </div>
              <button onClick={registrarBaja} disabled={saving || !form.empleado_id || !form.fecha_inicio} className="btn-primary w-full py-3">
                {saving ? 'Registrando…' : 'Registrar baja'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}