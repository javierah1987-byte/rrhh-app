'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Edit2, Save, X, User, Mail, Building2, Briefcase, Calendar, CreditCard } from 'lucide-react'

type Emp = {
  id:string; nombre:string; email:string; rol:string; departamento:string; puesto:string
  jornada_horas:number; tipo_contrato:string; fecha_alta:string; estado:string; avatar_color:string
}

const COLORES = ['#6366F1','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#F97316','#EC4899']
const ESTADOS = ['activo','baja','vacaciones']
const CONTRATOS = ['indefinido','temporal','obra_servicio','practicas','formacion']
const DEPARTAMENTOS = ['Administración','Comercial','Informática','RRHH','Operaciones','Dirección','Marketing','Producción']

export default function EmpleadoDetailPage() {
  const router = useRouter()
  const { id } = useParams()
  const [emp, setEmp] = useState<Emp|null>(null)
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState<Partial<Emp>>({})
  const [saving, setSaving] = useState(false)
  const [nominas, setNominas] = useState<any[]>([])
  const [solicitudes, setSolicitudes] = useState<any[]>([])

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('empleados').select('*').eq('id', id).single(),
      supabase.from('nominas').select('*').eq('empleado_id', id).order('anio',{ascending:false}).order('mes',{ascending:false}).limit(6),
      supabase.from('solicitudes').select('*').eq('empleado_id', id).order('created_at',{ascending:false}).limit(5),
    ]).then(([{data:e},{data:n},{data:s}]) => {
      setEmp(e); setForm(e||{}); setNominas(n||[]); setSolicitudes(s||[])
    })
  }, [id])

  async function handleSave() {
    if (!emp) return
    setSaving(true)
    await supabase.from('empleados').update(form).eq('id', emp.id)
    setEmp({...emp,...form} as Emp)
    setEditando(false)
    setSaving(false)
  }

  function f(key: keyof Emp) {
    return (e: any) => setForm(prev => ({...prev, [key]: e.target.value}))
  }

  const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  const fmt = (n: number) => n.toLocaleString('es-ES',{style:'currency',currency:'EUR'})
  const ESTADO_COLOR: Record<string,string> = { activo:'badge-green', baja:'badge-red', vacaciones:'badge-amber' }
  const SOL_COLOR: Record<string,string> = { aprobada:'badge-green', pendiente:'badge-amber', rechazada:'badge-red' }

  if (!emp) return <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={()=>router.push('/admin/empleados')} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600"/>
        </button>
        <div className="flex-1">
          <h1 className="page-title">{emp.nombre}</h1>
          <p className="text-sm text-slate-500">{emp.puesto} · {emp.departamento}</p>
        </div>
        {!editando ? (
          <button onClick={()=>setEditando(true)} className="btn-secondary gap-2">
            <Edit2 className="w-4 h-4"/>Editar
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={()=>setEditando(false)} className="btn-secondary gap-2">
              <X className="w-4 h-4"/>Cancelar
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary gap-2">
              <Save className="w-4 h-4"/>{saving?'Guardando…':'Guardar'}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Ficha principal */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-6">
            <div className="flex items-center gap-4 mb-6">
              {editando ? (
                <div className="flex gap-2 flex-wrap">
                  {COLORES.map(c=>(
                    <button key={c} onClick={()=>setForm(p=>({...p,avatar_color:c}))}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${form.avatar_color===c?'border-slate-900 scale-110':'border-transparent'}`}
                      style={{backgroundColor:c}}/>
                  ))}
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold"
                  style={{backgroundColor:emp.avatar_color||'#6366F1'}}>
                  {emp.nombre.split(' ').map(n=>n[0]).join('').substring(0,2)}
                </div>
              )}
              <div>
                <span className={`badge ${ESTADO_COLOR[emp.estado]||'badge-slate'} capitalize`}>{emp.estado}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key:'nombre', label:'Nombre completo', icon:User },
                { key:'email', label:'Correo electrónico', icon:Mail },
                { key:'departamento', label:'Departamento', icon:Building2, type:'select', opts:DEPARTAMENTOS },
                { key:'puesto', label:'Puesto', icon:Briefcase },
                { key:'fecha_alta', label:'Fecha de alta', icon:Calendar, type:'date' },
                { key:'jornada_horas', label:'Jornada (horas/día)', icon:Calendar, type:'number' },
                { key:'tipo_contrato', label:'Tipo de contrato', icon:CreditCard, type:'select', opts:CONTRATOS },
                { key:'estado', label:'Estado', icon:User, type:'select', opts:ESTADOS },
              ].map(({key,label,icon:Icon,type,opts})=>(
                <div key={key}>
                  <label className="label flex items-center gap-1"><Icon className="w-3 h-3"/>{label}</label>
                  {editando ? (
                    opts ? (
                      <select value={(form as any)[key]||''} onChange={f(key as keyof Emp)} className="input capitalize">
                        {opts.map(o=><option key={o} value={o} className="capitalize">{o.replace(/_/g,' ')}</option>)}
                      </select>
                    ) : (
                      <input type={type||'text'} value={(form as any)[key]||''} onChange={f(key as keyof Emp)} className="input"/>
                    )
                  ) : (
                    <p className="text-sm text-slate-800 font-medium py-2 capitalize">{String((emp as any)[key]||'—').replace(/_/g,' ')}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panel lateral */}
        <div className="space-y-4">
          {/* Últimas nóminas */}
          <div className="card p-5">
            <h3 className="font-bold text-slate-900 mb-3 text-sm">Últimas nóminas</h3>
            {nominas.length===0 ? <p className="text-xs text-slate-400">Sin nóminas</p> : (
              <div className="space-y-2">
                {nominas.map(n=>(
                  <div key={n.id} className="flex justify-between items-center">
                    <span className="text-xs text-slate-600">{MESES[n.mes-1]} {n.anio}</span>
                    <span className="text-xs font-semibold text-emerald-600">{fmt(n.liquido)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Últimas solicitudes */}
          <div className="card p-5">
            <h3 className="font-bold text-slate-900 mb-3 text-sm">Últimas solicitudes</h3>
            {solicitudes.length===0 ? <p className="text-xs text-slate-400">Sin solicitudes</p> : (
              <div className="space-y-2">
                {solicitudes.map(s=>(
                  <div key={s.id} className="flex justify-between items-center">
                    <span className="text-xs text-slate-600 capitalize">{s.tipo.replace(/_/g,' ')}</span>
                    <span className={`badge ${SOL_COLOR[s.estado]||'badge-slate'} capitalize`}>{s.estado}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}