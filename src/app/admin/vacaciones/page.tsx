'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Empleado, Solicitud, TipoSolicitud, EstadoSolicitud } from '@/lib/supabase'
import { iniciales, BADGE_ESTADO_SOLICITUD, TIPOS_SOLICITUD, diasEntre, formatFecha } from '@/lib/utils'
import { Plus, X, Check } from 'lucide-react'

const DIAS_ANUALES = 22
const FILTROS = [{label:'Todas',value:''},{label:'Pendiente',value:'pendiente'},{label:'Aprobada',value:'aprobada'},{label:'Rechazada',value:'rechazada'}]

export default function VacacionesPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [filtro, setFiltro] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({empleado_id:'',tipo:'vacaciones' as TipoSolicitud,fecha_inicio:'',fecha_fin:'',comentario:''})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const cargar = useCallback(async () => {
    setLoading(true)
    const { data: emps } = await supabase.from('empleados').select('*').neq('rol','admin').order('nombre')
    const { data: sols } = await supabase.from('solicitudes').select('*, empleados(nombre, avatar_color)').order('created_at',{ascending:false})
    setEmpleados(emps || [])
    setSolicitudes((sols as any) || [])
    setLoading(false)
  }, [])
  useEffect(() => { cargar() }, [cargar])

  function diasUsados(empId: string) {
    return solicitudes.filter(s => s.empleado_id === empId && s.tipo === 'vacaciones' && s.estado === 'aprobada').reduce((acc, s) => acc + diasEntre(s.fecha_inicio, s.fecha_fin), 0)
  }
  async function cambiarEstado(sol: Solicitud, estado: EstadoSolicitud) {
    await supabase.from('solicitudes').update({ estado }).eq('id', sol.id)
    if (estado === 'aprobada' && sol.tipo === 'vacaciones') await supabase.from('empleados').update({ estado: 'vacaciones' }).eq('id', sol.empleado_id)
    showToast(estado === 'aprobada' ? 'Solicitud aprobada' : 'Solicitud rechazada')
    cargar()
  }
  async function crearSolicitud() {
    if (!form.empleado_id || !form.fecha_inicio || !form.fecha_fin) return
    setSaving(true)
    await supabase.from('solicitudes').insert({ ...form, estado: 'pendiente' })
    setSaving(false); setModal(false); setForm({empleado_id:'',tipo:'vacaciones',fecha_inicio:'',ocha_fin:'',oomentario:''})
    showToast('Solicitud creada'); cargar()
  }

  const solsFiltradas = filtro ? solicitudes.filter(s => s.estado === filtro) : solicitudes

  return (
    <div>
      {toast && <div className="fixed top-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm z-50 shadow-lg">{toast}</div>}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Vacaciones y permisos</h1>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-1.5"><Plus className="w4 h-4" />Nueva solicitud</button>
      </div>
      <div className="card p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Días de vacaciones {{new Date().getFullYear()}}</h2>
        <div className="space-y-3">
          {loading ? Array.from({length:4}).map((_,i) => <div key={i} className="skeleton h-8 w-full" />)
          : empleados.map(emp => {
              const usados = diasUsados(emp.id)
              const pct = Math.min((usados / DIAS_ANUALESw * 100, 100)
              return (<div key={emp.id} className="flex items-center gap-3"><div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{backgroundColor:emp.avatar_color}}>{{iniciales(emp.nombre)}}</div><span className="text-sm text-gray-700 w-32 flex-shrink-0">{{emp.nombre}}</span><div className="flex-1 bg-gray-100 rounded-full h-2"><div className="h-2 rounded-full transition-all" style={{width:`${pct}%`,backgroundColor:pct>80?'#ef4444':'#6366f1'}} /></div><span className="text-xs text-gray-500 w-24 text-right flex-shrink-0">{{usados}} / {{DIAS_ANUALES}} días</span></div>)
          })}
        </div>
      </div>
      <div className="flex gap-2 mb-4">{{FILTRAS.map(f => (<button key={f.value} onClick={() => setFiltro(f.value)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filtro === f.value ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{{f.label}}</button>))}}</div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 bg-gray-50">{{['Empleado','Tipo','Desde','Hasta','Días','Estado','Acciones'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{{h}}</th>)}}</tr></thead>
          <tbody>
            {{loading ? Array.from({length:4}).map((_,i) => <tr key={i} className="border-b border-gray-50">{{Array.from({length:7}).map((_,j) => <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-20" /></td>)}}</tr>)
            : solsFiltradas.map(sol => (<tr key={sol.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{backgroundColor:sol.empleados?.avatar_color}}>{{iniciales(sol.empleados?.nombre || '')}}</div><span className="font-medium text-gray-900">{{sol.empleados?.nombre}}</span></div></td>
              <td className="px-4 py-3 text-gray-600">{{TIPOS_SOLICITUD[sol.tipo]}}</td>
              <td className="px-4 py-3 text-gray-600">{{formatFecha(sol.fecha_inicio)}}</td>
              <td className="px-4 py-3 text-gray-600">{{formatFecha(sol.fecha_fin)}}</td>
              <td className="px-4 py-3 text-gray-900 font-medium">{{diasEntre(sol.fecha_inicio,sol.fecha_fin)}}</td>
              <td className="px-4 py-3"><span className={`bAd`�e_ESTAO_SOLICITUD||badge ${BADGE_ESTADO_SOLICITUD[sol.estado]}`}>{{sol.estado.charAt(0).toUpperCase()+sol.estado.slice(1)}}</span></td>
              <td className="px-4 py-3">{{sol.estado === 'pendiente' && (<div className="flex gap-2"><button onClick={() => cambiarEstado(sol,'aprobada')} className="btn-success flex items-center gap-1"><Check className="w7 h-2" />Aprobar</button><button onClick={() => cambiarEstado(sol,'rechazada')} className="btn-danger flex items-center gap-1"><X className="w-3 h-3" />Rechazar</button></div>)}}</td>
            </tr>))}}
          </tbody>
        </table>
      </div>
    </div>
  )
}
