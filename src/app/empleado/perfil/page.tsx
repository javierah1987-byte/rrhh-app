// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User, Mail, Phone, MapPin, Calendar, Building2, Briefcase, Clock, Award, ArrowLeft, Edit3, Save, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function MiPerfilPage() {
  const [emp, setEmp]         = useState(null)
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(false)
  const [form, setForm]       = useState({})
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const router = useRouter()

  useEffect(() => {
    const cargar = async () => {
      const { data:{ user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('empleados').select('*').eq('user_id', user.id).single()
      if (data) { setEmp(data); setForm({ telefono: data.telefono||'', direccion: data.direccion||'', ciudad: data.ciudad||'' }) }
      setLoading(false)
    }
    cargar()
  }, [])

  const guardar = async () => {
    setSaving(true)
    await supabase.from('empleados').update(form).eq('id', emp.id)
    setEmp({...emp, ...form})
    setSaving(false); setSaved(true); setEditando(false)
    setTimeout(()=>setSaved(false), 3000)
  }

  const antiguedad = () => {
    if (!emp?.fecha_alta) return '—'
    const d = Math.floor((new Date() - new Date(emp.fecha_alta)) / (1000*60*60*24))
    if (d < 30) return d + ' días'
    if (d < 365) return Math.floor(d/30) + ' meses'
    return Math.floor(d/365) + ' año' + (Math.floor(d/365)>1?'s':'')
  }

  if (loading) return <div className="p-8 text-slate-400 animate-pulse text-sm">Cargando perfil...</div>
  if (!emp) return <div className="p-8 text-slate-400 text-sm">No se encontró perfil</div>

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-4">
      <button onClick={()=>router.back()} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 text-sm">
        <ArrowLeft className="w-4 h-4"/> Volver
      </button>

      {/* Cabecera */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black shadow-lg flex-shrink-0"
          style={{background:'rgba(255,255,255,0.2)'}}>
          {emp.nombre?.charAt(0)||'?'}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{emp.nombre}</h1>
          <p className="text-indigo-200">{emp.puesto} · {emp.departamento}</p>
          <p className="text-indigo-300 text-sm mt-1">{emp.email}</p>
        </div>
        <button onClick={()=>setEditando(!editando)}
          className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-xl px-3 py-2 text-sm font-medium transition-colors flex-shrink-0">
          <Edit3 className="w-4 h-4"/>{editando?'Cancelar':'Editar'}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {label:'Antigüedad',   val:antiguedad(),  icon:'⏱️'},
          {label:'Contrato',     val:emp.tipo_contrato||'—', icon:'📋'},
          {label:'Jornada',      val:emp.jornada_horas?emp.jornada_horas+'h/sem':'—', icon:'🕐'},
          {label:'Salario base', val:emp.salario_base?(+emp.salario_base).toLocaleString('es-ES')+'€':'—', icon:'💰'},
        ].map((k,i)=>(
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center">
            <p className="text-xl">{k.icon}</p>
            <p className="font-bold text-slate-700 dark:text-slate-200 text-sm mt-1">{k.val}</p>
            <p className="text-slate-400 text-xs">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Info personal */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-500"/> Información personal
          </h3>
          {saved && <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><Save className="w-3.5 h-3.5"/> Guardado</span>}
        </div>

        <div className="space-y-3">
          {/* Email — solo lectura */}
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-slate-400 flex-shrink-0"/>
            <div className="flex-1">
              <p className="text-xs text-slate-400">Email</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">{emp.email}</p>
            </div>
            <span className="text-xs text-slate-300 dark:text-slate-600">solo lectura</span>
          </div>

          {/* Teléfono — editable */}
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-slate-400 flex-shrink-0"/>
            <div className="flex-1">
              <p className="text-xs text-slate-400">Teléfono</p>
              {editando
                ? <input value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})}
                    placeholder="+34 600 000 000"
                    className="w-full bg-slate-50 dark:bg-slate-700 rounded-lg px-3 py-1.5 text-sm border border-indigo-300 outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-200 mt-0.5"/>
                : <p className="text-sm text-slate-700 dark:text-slate-200">{emp.telefono||'—'}</p>
              }
            </div>
          </div>

          {/* Ciudad — editable */}
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0"/>
            <div className="flex-1">
              <p className="text-xs text-slate-400">Ciudad</p>
              {editando
                ? <input value={form.ciudad} onChange={e=>setForm({...form,ciudad:e.target.value})}
                    placeholder="Madrid"
                    className="w-full bg-slate-50 dark:bg-slate-700 rounded-lg px-3 py-1.5 text-sm border border-indigo-300 outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-200 mt-0.5"/>
                : <p className="text-sm text-slate-700 dark:text-slate-200">{emp.ciudad||'—'}</p>
              }
            </div>
          </div>

          {/* Fecha de alta */}
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0"/>
            <div>
              <p className="text-xs text-slate-400">Fecha de alta</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">
                {emp.fecha_alta ? new Date(emp.fecha_alta).toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'}) : '—'}
              </p>
            </div>
          </div>
        </div>

        {editando && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button onClick={()=>setEditando(false)} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700">Cancelar</button>
            <button onClick={guardar} disabled={saving}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
              <Save className="w-4 h-4"/>{saving?'Guardando...':'Guardar cambios'}
            </button>
          </div>
        )}
      </div>

      {/* Info laboral */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        <h3 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-4">
          <Briefcase className="w-4 h-4 text-indigo-500"/> Información laboral
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            {label:'Departamento', val:emp.departamento||'—', icon:Building2},
            {label:'Puesto',       val:emp.puesto||'—', icon:Briefcase},
            {label:'Rol',          val:emp.rol||'—', icon:Award},
            {label:'Manager',      val:emp.manager_nombre||'—', icon:User},
          ].map((f,i)=>{
            const Icon=f.icon
            return(
              <div key={i} className="flex items-start gap-2">
                <Icon className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5"/>
                <div>
                  <p className="text-xs text-slate-400">{f.label}</p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{f.val}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}