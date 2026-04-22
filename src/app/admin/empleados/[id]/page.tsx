// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, User, Clock, DollarSign, FileText, Star, Calendar, Edit2, Save, X, Phone, Mail, MapPin, Briefcase, Building2, CheckCircle } from 'lucide-react'

const MESES = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export default function FichaEmpleadoPage() {
  const { id } = useParams()
  const router = useRouter()
  const [empleado, setEmpleado]     = useState(null)
  const [fichajes, setFichajes]     = useState([])
  const [nominas, setNominas]       = useState([])
  const [evaluaciones, setEval]     = useState([])
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading]       = useState(true)
  const [tab, setTab]               = useState('info')
  const [editing, setEditing]       = useState(false)
  const [form, setForm]             = useState({})
  const [saving, setSaving]         = useState(false)

  useEffect(() => {
    if (!id) return
    const cargar = async () => {
      const [emp, fich, noms, evs, sols] = await Promise.all([
        supabase.from('empleados').select('*').eq('id', id).single(),
        supabase.from('fichajes').select('*').eq('empleado_id', id).order('fecha',{ascending:false}).limit(20),
        supabase.from('nominas').select('*').eq('empleado_id', id).order('anio',{ascending:false}).order('mes',{ascending:false}),
        supabase.from('evaluaciones').select('*').eq('empleado_id', id).order('created_at',{ascending:false}),
        supabase.from('solicitudes').select('*').eq('empleado_id', id).order('created_at',{ascending:false}).limit(10),
      ])
      setEmpleado(emp.data)
      setForm(emp.data||{})
      setFichajes(fich.data||[])
      setNominas(noms.data||[])
      setEval(evs.data||[])
      setSolicitudes(sols.data||[])
      setLoading(false)
    }
    cargar()
  }, [id])

  const guardar = async () => {
    setSaving(true)
    await supabase.from('empleados').update({
      nombre: form.nombre,
      email: form.email,
      telefono: form.telefono,
      puesto: form.puesto,
      departamento: form.departamento,
      salario_base: form.salario_base,
      tipo_contrato: form.tipo_contrato,
      jornada_horas: form.jornada_horas,
    }).eq('id', id)
    setEmpleado(form)
    setEditing(false)
    setSaving(false)
  }

  if (loading) return <div className="p-8 text-slate-400 text-sm">Cargando ficha...</div>
  if (!empleado) return <div className="p-8 text-slate-400 text-sm">Empleado no encontrado</div>

  const antigüedad = empleado.fecha_alta
    ? Math.floor((new Date() - new Date(empleado.fecha_alta)) / (365.25 * 86400000 * 1000)) + ' años'
    : '—'

  const tabs = [
    {id:'info',    label:'Información', icon: User},
    {id:'fichajes',label:'Fichajes',    icon: Clock,      badge: fichajes.length},
    {id:'nominas', label:'Nóminas',     icon: DollarSign, badge: nominas.length},
    {id:'eval',    label:'Evaluaciones',icon: Star,        badge: evaluaciones.length},
    {id:'ausencias',label:'Ausencias',  icon: Calendar,   badge: solicitudes.length},
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back + Header */}
      <button onClick={()=>router.push('/admin/empleados')} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm mb-5">
        <ArrowLeft className="w-4 h-4"/> Volver a empleados
      </button>

      {/* Perfil header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-5">
        <div className="flex items-center gap-5 flex-wrap">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-black flex-shrink-0"
            style={{background: empleado.avatar_color||'#6366f1'}}>
            {empleado.nombre?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{empleado.nombre}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                empleado.estado==='activo'?'bg-emerald-100 text-emerald-700':
                empleado.estado==='baja'?'bg-red-100 text-red-700':
                'bg-slate-100 text-slate-600'}`}>{empleado.estado}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-100 text-indigo-700`}>{empleado.rol}</span>
            </div>
            <p className="text-slate-500 mt-1">{empleado.puesto} · {empleado.departamento}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 flex-wrap">
              {empleado.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3"/>{empleado.email}</span>}
              {empleado.telefono && <span className="flex items-center gap-1"><Phone className="w-3 h-3"/>{empleado.telefono}</span>}
              {empleado.fecha_alta && <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/>Alta: {new Date(empleado.fecha_alta).toLocaleDateString('es-ES')}</span>}
            </div>
          </div>
          <button onClick={()=>setEditing(!editing)}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
            {editing?<><X className="w-4 h-4"/>Cancelar</>:<><Edit2 className="w-4 h-4"/>Editar</>}
          </button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100 dark:border-slate-700">
          {[
            {label:'Salario base', val:(empleado.salario_base||0).toLocaleString('es-ES')+'€'},
            {label:'Tipo contrato', val:empleado.tipo_contrato||'—'},
            {label:'Jornada', val:(empleado.jornada_horas||40)+'h/semana'},
            {label:'Antigüedad', val: empleado.fecha_alta ? Math.floor((new Date()-new Date(empleado.fecha_alta))/(365.25*86400000))+'+ años':'—'},
          ].map((s,i)=>(
            <div key={i}>
              <p className="text-xs text-slate-400">{s.label}</p>
              <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm mt-0.5">{s.val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700 mb-5 flex gap-1 overflow-x-auto">
        {tabs.map(t=>{
          const Icon=t.icon
          return(
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${tab===t.id?'text-indigo-600 border-indigo-600':'text-slate-400 border-transparent hover:text-slate-600'}`}>
              <Icon className="w-4 h-4"/>
              {t.label}
              {t.badge>0&&<span className="bg-slate-100 dark:bg-slate-700 text-slate-500 text-xs px-1.5 py-0.5 rounded-full">{t.badge}</span>}
            </button>
          )
        })}
      </div>

      {/* Tab: Información / Edición */}
      {tab==='info' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {label:'Nombre completo', field:'nombre'},
                  {label:'Email', field:'email', type:'email'},
                  {label:'Teléfono', field:'telefono'},
                  {label:'Puesto', field:'puesto'},
                  {label:'Departamento', field:'departamento'},
                  {label:'Salario base (€)', field:'salario_base', type:'number'},
                  {label:'Tipo contrato', field:'tipo_contrato'},
                  {label:'Jornada (horas/semana)', field:'jornada_horas', type:'number'},
                ].map(f=>(
                  <div key={f.field}>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">{f.label}</label>
                    <input type={f.type||'text'} value={form[f.field]||''} onChange={e=>setForm(fm=>({...fm,[f.field]:e.target.value}))}
                      className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:bg-slate-700 dark:text-white"/>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={()=>setEditing(false)} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-500">Cancelar</button>
                <button onClick={guardar} disabled={saving}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                  <Save className="w-4 h-4"/> {saving?'Guardando...':'Guardar cambios'}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {[
                {label:'Email', val:empleado.email, icon:Mail},
                {label:'Teléfono', val:empleado.telefono||'—', icon:Phone},
                {label:'Puesto', val:empleado.puesto, icon:Briefcase},
                {label:'Departamento', val:empleado.departamento, icon:Building2},
                {label:'Tipo de contrato', val:empleado.tipo_contrato||'—', icon:FileText},
                {label:'Jornada', val:(empleado.jornada_horas||40)+'h/semana', icon:Clock},
                {label:'Salario base', val:(empleado.salario_base||0).toLocaleString('es-ES')+'€', icon:DollarSign},
                {label:'Fecha de alta', val:empleado.fecha_alta?new Date(empleado.fecha_alta).toLocaleDateString('es-ES'):'—', icon:Calendar},
              ].map((f,i)=>{
                const Icon=f.icon
                return(
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                    <Icon className="w-4 h-4 text-slate-400 flex-shrink-0"/>
                    <div>
                      <p className="text-xs text-slate-400">{f.label}</p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{f.val||'—'}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Fichajes */}
      {tab==='fichajes' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_1fr_80px] gap-3 px-5 py-3 border-b border-slate-100 dark:border-slate-700 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Fecha</span><span>Tipo</span><span>Hora</span><span>Dirección</span>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-700/50 max-h-[400px] overflow-y-auto">
            {fichajes.map(f=>(
              <div key={f.id} className="grid grid-cols-[1fr_1fr_1fr_80px] gap-3 px-5 py-2.5 items-center text-sm">
                <span className="text-slate-600 dark:text-slate-300">{new Date(f.fecha).toLocaleDateString('es-ES')}</span>
                <span className={`inline-flex items-center gap-1 text-xs font-medium ${f.tipo==='entrada'?'text-emerald-600':'text-red-500'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${f.tipo==='entrada'?'bg-emerald-500':'bg-red-500'}`}/>
                  {f.tipo}
                </span>
                <span className="text-slate-500">{f.timestamp?new Date(f.timestamp).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}):'—'}</span>
                <span className="text-slate-400 text-xs truncate">{f.direccion?'📍 GPS':'—'}</span>
              </div>
            ))}
            {fichajes.length===0&&<p className="text-slate-400 text-sm p-5 text-center">Sin fichajes registrados</p>}
          </div>
        </div>
      )}

      {/* Tab: Nóminas */}
      {tab==='nominas' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-3 px-5 py-3 border-b border-slate-100 dark:border-slate-700 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Período</span><span>Bruto</span><span>Deducciones</span><span>Líquido</span>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {nominas.map(n=>{
              const irpf=(n.salario_base||0)*(n.irpf_pct||18)/100
              const ss=(n.salario_base||0)*(n.ss_pct||6.35)/100
              return(
                <div key={n.id} className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-3 px-5 py-3 text-sm items-center">
                  <span className="font-medium text-slate-700 dark:text-slate-200">{MESES[n.mes]} {n.anio}</span>
                  <span className="text-slate-600 dark:text-slate-300">{(n.salario_base||0).toLocaleString('es-ES')}€</span>
                  <span className="text-red-500">-{(irpf+ss).toFixed(0)}€</span>
                  <span className="font-bold text-emerald-600">{(n.liquido||0).toFixed(0)}€</span>
                </div>
              )
            })}
            {nominas.length===0&&<p className="text-slate-400 text-sm p-5 text-center">Sin nóminas registradas</p>}
          </div>
          {nominas.length>0&&(
            <div className="flex items-center justify-between px-5 py-3 bg-slate-50 dark:bg-slate-700/30 border-t border-slate-100 dark:border-slate-700">
              <span className="text-sm text-slate-500">{nominas.length} nóminas · Total anual</span>
              <span className="font-black text-emerald-600">{nominas.reduce((s,n)=>s+(n.liquido||0),0).toFixed(0)}€</span>
            </div>
          )}
        </div>
      )}

      {/* Tab: Evaluaciones */}
      {tab==='eval' && (
        <div className="space-y-3">
          {evaluaciones.length===0&&<p className="text-slate-400 text-sm bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">Sin evaluaciones</p>}
          {evaluaciones.map(ev=>(
            <div key={ev.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">{ev.periodo}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{ev.fecha?new Date(ev.fecha).toLocaleDateString('es-ES'):''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5,6,7,8,9,10].map(n=>(
                      <div key={n} className={`w-5 h-5 rounded text-xs font-bold flex items-center justify-center ${n<=(ev.puntuacion||0)?'bg-amber-400 text-white':'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>{n}</div>
                    ))}
                  </div>
                  <span className={`text-lg font-black ${(ev.puntuacion||0)>=9?'text-emerald-600':(ev.puntuacion||0)>=7?'text-amber-500':'text-red-500'}`}>{ev.puntuacion}/10</span>
                </div>
              </div>
              {ev.comentarios&&<p className="text-sm text-slate-500 mt-2 italic">"{ev.comentarios}"</p>}
            </div>
          ))}
        </div>
      )}

      {/* Tab: Ausencias */}
      {tab==='ausencias' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_1fr_90px] gap-3 px-5 py-3 border-b border-slate-100 dark:border-slate-700 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Tipo</span><span>Desde</span><span>Hasta</span><span>Estado</span>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {solicitudes.map(s=>(
              <div key={s.id} className="grid grid-cols-[1fr_1fr_1fr_90px] gap-3 px-5 py-3 text-sm items-center">
                <span className="capitalize text-slate-700 dark:text-slate-200">{(s.tipo||'').replace(/_/g,' ')}</span>
                <span className="text-slate-500">{new Date(s.fecha_inicio).toLocaleDateString('es-ES')}</span>
                <span className="text-slate-500">{s.fecha_fin?new Date(s.fecha_fin).toLocaleDateString('es-ES'):'—'}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${s.estado==='aprobada'?'bg-emerald-100 text-emerald-700':s.estado==='pendiente'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}`}>
                  {s.estado}
                </span>
              </div>
            ))}
            {solicitudes.length===0&&<p className="text-slate-400 text-sm p-5 text-center">Sin solicitudes registradas</p>}
          </div>
        </div>
      )}
    </div>
  )
}