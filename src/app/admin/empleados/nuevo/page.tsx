// @ts-nocheck
'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { UserPlus, ArrowLeft, CheckCircle, Shield, User, Users } from 'lucide-react'

const DEPTOS = ['Dirección','Ventas','RRHH','Tecnología','Operaciones','Marketing','Finanzas','Producción','Logística','Administración']
const COLORES = ['#6366f1','#8b5cf6','#ec4899','#f43f5e','#f97316','#eab308','#22c55e','#14b8a6','#3b82f6','#06b6d4']
const SURL = 'https://mmujjxoywrfolbvmotya.supabase.co'

const ROLES = [
  {
    id: 'empleado',
    label: 'Empleado',
    icon: User,
    color: '#6366f1',
    bg: '#6366f115',
    descripcion: 'Acceso solo a su propio portal: fichar, solicitudes, nóminas y documentos propios.',
    permisos: ['Ver su propio horario y fichajes','Solicitar ausencias y vacaciones','Ver sus nóminas y documentos','No tiene acceso al panel de administración'],
  },
  {
    id: 'admin',
    label: 'Administrador',
    icon: Shield,
    color: '#10b981',
    bg: '#10b98115',
    descripcion: 'Acceso completo al panel de administración. Puede gestionar todo el equipo.',
    permisos: ['Panel de administración completo','Gestionar empleados y contratos','Aprobar solicitudes y ausencias','Ver informes y nóminas de todo el equipo'],
  },
]

export default function NuevoEmpleadoPage() {
  const [form, setForm] = useState({
    nombre:'', email:'', password:'', puesto:'', departamento:'Ventas',
    rol:'empleado', tipo_contrato:'indefinido', jornada_horas:'40',
    salario_base:'', telefono:'', avatar_color: COLORES[0]
  })
  const [loading, setLoading] = useState(false)
  const [ok, setOk]           = useState(false)
  const [error, setError]     = useState('')
  const router = useRouter()

  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const guardar = async () => {
    if (!form.nombre || !form.email || !form.password) { setError('Nombre, email y contraseña son obligatorios'); return }
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setLoading(true); setError('')

    const { data:{ session } } = await supabase.auth.getSession()
    const { data: adminEmp }   = await supabase.from('empleados').select('empresa_id').eq('user_id', session?.user?.id).single()

    const res = await fetch(`${SURL}/functions/v1/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-superadmin-key': 'nexohr-superadmin-2024'
      },
      body: JSON.stringify({
        ...form,
        jornada_horas: +form.jornada_horas || 40,
        salario_base: form.salario_base ? +form.salario_base : null,
        empresa_id: adminEmp?.empresa_id,
        use_invite: false,
      })
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Error al crear empleado'); setLoading(false); return }
    setOk(true); setLoading(false)
  }

  if (ok) return (
    <div className="p-6 max-w-lg mx-auto text-center py-16">
      <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <CheckCircle className="w-10 h-10 text-emerald-600"/>
      </div>
      <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">¡Empleado creado!</h2>
      <p className="text-slate-400 text-sm mb-5">{form.nombre} ya tiene acceso a Nexo HR</p>
      <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 my-4 text-left border border-slate-200 dark:border-slate-700 space-y-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Credenciales — envíaselas al empleado</p>
        <div className="flex justify-between items-center"><span className="text-xs text-slate-500">URL</span><span className="text-xs font-mono font-bold text-indigo-600">pruebasgrupoaxen.com/login</span></div>
        <div className="flex justify-between items-center"><span className="text-xs text-slate-500">Email</span><span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{form.email}</span></div>
        <div className="flex justify-between items-center"><span className="text-xs text-slate-500">Contraseña</span><span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{form.password}</span></div>
        <div className="flex justify-between items-center"><span className="text-xs text-slate-500">Rol</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{background: form.rol==='admin'?'#10b981':'#6366f1'}}>
            {form.rol==='admin'?'Administrador':'Empleado'}
          </span>
        </div>
      </div>
      <div className="flex gap-3 justify-center">
        <button onClick={()=>{setOk(false);setForm(f=>({...f,nombre:'',email:'',password:'',puesto:'',telefono:'',salario_base:''}))}}
          className="px-5 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-500 hover:bg-slate-50">
          Añadir otro
        </button>
        <button onClick={()=>router.push('/admin/empleados')}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold">
          Ver lista
        </button>
      </div>
    </div>
  )

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-5">
      <button onClick={()=>router.back()} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 text-sm">
        <ArrowLeft className="w-4 h-4"/> Volver
      </button>
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-indigo-500"/> Nuevo empleado
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Añade un miembro al equipo</p>
      </div>

      {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 text-sm">{error}</div>}

      {/* ─── ROL — lo más importante, primero y grande ─── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-1">Nivel de acceso *</h3>
        <p className="text-xs text-slate-400 mb-4">Define qué puede hacer este usuario en la aplicación</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ROLES.map(rol => {
            const Icon = rol.icon
            const selected = form.rol === rol.id
            return (
              <button key={rol.id} onClick={()=>set('rol', rol.id)}
                className={`text-left p-4 rounded-2xl border-2 transition-all ${selected ? 'shadow-md' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
                style={selected ? {borderColor: rol.color, background: rol.bg} : {}}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{background: selected ? rol.color : '#f1f5f9', color: selected ? 'white' : '#64748b'}}>
                    <Icon className="w-5 h-5"/>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{rol.label}</p>
                    {selected && <p className="text-[10px] font-semibold mt-0.5" style={{color: rol.color}}>Seleccionado</p>}
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{rol.descripcion}</p>
                <ul className="space-y-1">
                  {rol.permisos.map((p,i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="mt-0.5 flex-shrink-0" style={{color: selected ? rol.color : '#94a3b8'}}>
                        {p.startsWith('No') ? '✗' : '✓'}
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              </button>
            )
          })}
        </div>
      </div>

      {/* ─── DATOS DE ACCESO ─── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
        <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Datos de acceso</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Nombre completo *</label>
            <input value={form.nombre} onChange={e=>set('nombre',e.target.value)} placeholder="Juan García López"
              className="w-full bg-slate-50 dark:bg-slate-700 rounded-xl px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 outline-none focus:border-indigo-400 text-slate-700 dark:text-slate-200"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Email *</label>
            <input type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="juan@empresa.com"
              className="w-full bg-slate-50 dark:bg-slate-700 rounded-xl px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 outline-none focus:border-indigo-400 text-slate-700 dark:text-slate-200"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Contraseña inicial *</label>
            <input type="text" value={form.password} onChange={e=>set('password',e.target.value)} placeholder="Min. 6 caracteres"
              className="w-full bg-slate-50 dark:bg-slate-700 rounded-xl px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 outline-none focus:border-indigo-400 text-slate-700 dark:text-slate-200"/>
          </div>
        </div>
      </div>

      {/* ─── DATOS LABORALES ─── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
        <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Datos laborales</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Puesto</label>
            <input value={form.puesto} onChange={e=>set('puesto',e.target.value)} placeholder="Ej: Comercial"
              className="w-full bg-slate-50 dark:bg-slate-700 rounded-xl px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 outline-none focus:border-indigo-400 text-slate-700 dark:text-slate-200"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Departamento</label>
            <select value={form.departamento} onChange={e=>set('departamento',e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-700 rounded-xl px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 outline-none focus:border-indigo-400 text-slate-700 dark:text-slate-200">
              {DEPTOS.map(d=><option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Tipo contrato</label>
            <select value={form.tipo_contrato} onChange={e=>set('tipo_contrato',e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-700 rounded-xl px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 outline-none focus:border-indigo-400 text-slate-700 dark:text-slate-200">
              <option value="indefinido">Indefinido</option>
              <option value="temporal">Temporal</option>
              <option value="practicas">Prácticas</option>
              <option value="obra">Obra y servicio</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Horas / semana</label>
            <input type="number" value={form.jornada_horas} onChange={e=>set('jornada_horas',e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-700 rounded-xl px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 outline-none focus:border-indigo-400 text-slate-700 dark:text-slate-200"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Teléfono</label>
            <input value={form.telefono} onChange={e=>set('telefono',e.target.value)} placeholder="+34 600 000 000"
              className="w-full bg-slate-50 dark:bg-slate-700 rounded-xl px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 outline-none focus:border-indigo-400 text-slate-700 dark:text-slate-200"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Salario bruto anual (€)</label>
            <input type="number" value={form.salario_base} onChange={e=>set('salario_base',e.target.value)} placeholder="24000"
              className="w-full bg-slate-50 dark:bg-slate-700 rounded-xl px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 outline-none focus:border-indigo-400 text-slate-700 dark:text-slate-200"/>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-2">Color avatar</label>
          <div className="flex gap-2 flex-wrap">
            {COLORES.map(c=>(
              <button key={c} onClick={()=>set('avatar_color',c)}
                className={`w-8 h-8 rounded-full transition-all ${form.avatar_color===c?'ring-2 ring-offset-2 ring-indigo-500 scale-110':''}`}
                style={{background:c}}/>
            ))}
          </div>
        </div>
      </div>

      <button onClick={guardar} disabled={loading}
        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg">
        <UserPlus className="w-5 h-5"/>
        {loading ? 'Creando cuenta...' : 'Crear empleado'}
      </button>
    </div>
  )
}
