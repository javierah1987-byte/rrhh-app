'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Empleado } from '@/lib/supabase'
import { iniciales, BADGE_ESTADO_EMPLEADO } from '@/lib/utils'
import { Plus, Search, X } from 'lucide-react'

const DEPTS = ['Tecnologia','Marketing','Ventas','RRHH','Finanzas','Operaciones']
const PUESTOS = ['Desarrollador','Diseñador','Analista','Manager','Director','Coordinador']
const COLORES = ['#6366f1','#8b5cf6','#ec4899','#f43f5e','#f97316','#eab308','#22c55e','#14b8a6','#0ea5e9','#64748b']

export default function EmpleadosPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ nombre:'', email:'', departamento:'Tecnologia', puesto:'Desarrollador', jornada_horas:8, tipo_contrato:'indefinido', fecha_alta:new Date().toISOString().slice(0,10), avatar_color:'#6366f1' })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const cargar = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('empleados').select('*').order('nombre')
    setEmpleados(data || [])
    setLoading(false)
  }, [])
  useEffect(() => { cargar() }, [cargar])

  async function crearEmpleado() {
    if (!form.nombre || !form.email) return
    setSaving(true)
    const { data: authData } = await supabase.auth.admin.createUser({ email: form.email, password: Math.random().toString(36).slice(-8), email_confirm: true })
    if (authData.user) {
      await supabase.from('empleados').insert({ ...form, user_id: authData.user.id, rol: 'empleado', estado: 'activo' })
    }
    setSaving(false); setModal(false)
    showToast('Empleado creado'); cargar()
  }

  async function cambiarEstado(emp: Empleado, estado: string) {
    await supabase.from('empleados').update({ estado }).eq('id', emp.id)
    showToast('Estado actualizado'); cargar()
  }

  const filtrados = busqueda ? empleados.filter(e => e.nombre.toLowerCase().includes(busqueda.toLowerCase()) || e.departamento.toLowerCase().includes(busqueda.toLowerCase())) : empleados

  return (
    <div>
      {toast && <div className="fixed top-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm z-50">{toast}</div>}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-xl font-bold text-gray-900">Empleados</h1><p className="text-sm text-gray-500 mt-0.5">{empleados.filter(e=>e.estado==='activo').length} activos de {empleados.length}</p></div>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-1.5"><Plus className="w-4 h-4" />Nuevo empleado</button>
      </div>
      <div className="relative mb-4"><Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" /><input type="text" placeholder="Buscar por nombre o departamento..." value={busqueda} onChange={e=>setBusqueda(e.target.value)} className="input pl-9" /></div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50">{['Empleado','Departamento','Puesto','Tipo contrato','Alta','Estado','Acciones'].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>)}</tr></thead>
            <tbody>
              {loading?Array.from({length:5}).map((_,i)=><tr key={i} className="border-b border-gray-50">{Array.from({length:7}).map((_,j)=><td key={j} className="px-4 py-3"><div className="skeleton h-4 w-20"/></td>)}</tr>)
              :filtrados.map(emp=>(<tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{backgroundColor:emp.avatar_color}}>{iniciales(emp.nombre)}</div><div><p className="font-medium text-gray-900">{emp.nombre}</p><p className="text-xs text-gray-400">{emp.email}</p></div></div></td>
                <td className="px-4 py-3 text-gray-600">{emp.departamento}</td>
                <td className="px-4 py-3 text-gray-600">{emp.puesto}</td>
                <td className="px-4 py-3 text-gray-600">{emp.tipo_contrato}</td>
                <td className="px-4 py-3 text-gray-600">{emp.fecha_alta}</td>
                <td className="px-4 py-3"><span className={`badge ${BADGE_ESTADO_EMPLEADO[emp.estado]}`}>{emp.estado.charAt(0).toUpperCase()+emp.estado.slice(1)}</span></td>
                <td className="px-4 py-3"><select value={emp.estado} onChange={e=>cambiarEstado(emp,e.target.value)} className="text-xs border border-gray-200 rounded-md px-2 py-1"><option value="activo">Activo</option><option value="baja">Baja</option><option value="vacaciones">Vacaciones</option></select></td>
              </tr>))}
            </tbody>
          </table>
        </div>
      </div>
      {modal && (<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"><div className="bg-white rounded-2xl w-full max-w-md p-6 m-4 max-h-[90vh] overflow-y-auto"><div className="flex items-center justify-between mb-5"><h3 className="font-semibold text-gray-900">Nuevo empleado</h3><button onClick={()=>setModal(false)}><X className="w-5 h-5 text-gray-400"/></button></div><div className="space-y-4"><div><label className="label">Nombre completo</label><input type="text" value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} className="input"/></div><div><label className="label">Email</label><input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} className="input"/></div><div><label className="label">Departamento</label><select value={form.departamento} onChange={e=>setForm(f=>({...f,departamento:e.target.value}))} className="input">{DEPTS.map(d=><option key={d}>{d}</option>)}</select></div><div><label className="label">Puesto</label><select value={form.puesto} onChange={e=>setForm(f=>({...f,puesto:e.target.value}))} className="input">{PUESTOS.map(p=><option key={p}>{p}</option>)}</select></div><div className="grid grid-cols-2 gap-3"><div><label className="label">Jornada (h/dia)</label><input type="number" value={form.jornada_horas} onChange={e=>setForm(f=>({...f,jornada_horas:Number(e.target.value)}))} className="input" min={1} max={12}/></div><div><label className="label">Tipo contrato</label><select value={form.tipo_contrato} onChange={e=>setForm(f=>({...f,tipo_contrato:e.target.value}))} className="input"><option value="indefinido">Indefinido</option><option value="temporal">Temporal</option><option value="practicas">Practicas</option></select></div></div><div><label className="label">Color avatar</label><div className="flex gap-2 flex-wrap">{COLORES.map(c=><button key={c} type="button" onClick={()=>setForm(f=>({...f,avatar_color:c}))} className={`w-7 h-7 rounded-full transition-all ${form.avatar_color===c?'ring-2 ring-offset-2 ring-gray-400':''}`} style={{backgroundColor:c}}/>)}</div></div></div><div className="flex gap-3 mt-6"><button onClick={()=>setModal(false)} className="btn-secondary flex-1">Cancelar</button><button onClick={crearEmpleado} disabled={saving} className="btn-primary flex-1">{saving?'Creando...':'Crear empleado'}</button></div></div></div>)}
    </div>
  )
}