// @ts-nocheck
'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { UserPlus, ArrowLeft, CheckCircle } from 'lucide-react'

const DEPTOS = ['Dirección','Ventas','RRHH','Tecnología','Operaciones','Marketing','Finanzas','Producción','Logística','Administración']
const COLORES = ['#6366f1','#8b5cf6','#ec4899','#f43f5e','#f97316','#eab308','#22c55e','#14b8a6','#3b82f6','#06b6d4']

export default function NuevoEmpleadoPage() {
  const [form, setForm] = useState({
    nombre:'', email:'', password:'', puesto:'', departamento:'Ventas',
    rol:'empleado', tipo_contrato:'indefinido', jornada_horas:'40',
    salario_base:'', telefono:'', ciudad:'', avatar_color: COLORES[0]
  })
  const [loading, setLoading] = useState(false)
  const [ok, setOk]           = useState(false)
  const [error, setError]     = useState('')
  const router = useRouter()

  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const guardar = async () => {
    if (!form.nombre || !form.email || !form.password) { setError('Nombre, email y contraseña son obligatorios'); return }
    setLoading(true); setError('')

    // 1. Crear usuario en Supabase Auth usando admin API (service role) — necesita service_role
    // Como no tenemos service_role en cliente, usamos Edge Function o guardamos pendiente
    // Por ahora creamos solo el registro de empleado (el usuario debe hacer login la 1ª vez)
    
    // Obtener empresa_id del admin actual
    const { data:{ user } } = await supabase.auth.getUser()
    const { data: adminEmp } = await supabase.from('empleados').select('empresa_id').eq('user_id', user.id).single()
    
    // Buscar si ya existe auth user con ese email
    // Insertar empleado (el usuario deberá registrarse con ese email)
    const { error: empErr } = await supabase.from('empleados').insert({
      nombre: form.nombre,
      email: form.email,
      puesto: form.puesto,
      departamento: form.departamento,
      rol: form.rol,
      tipo_contrato: form.tipo_contrato,
      jornada_horas: form.jornada_horas ? +form.jornada_horas : 40,
      salario_base: form.salario_base ? +form.salario_base : null,
      telefono: form.telefono || null,
      ciudad: form.ciudad || null,
      avatar_color: form.avatar_color,
      empresa_id: adminEmp?.empresa_id,
      estado: 'activo',
      fecha_alta: new Date().toISOString().split('T')[0],
    })

    if (empErr) { setError('Error al crear empleado: ' + empErr.message); setLoading(false); return }
    setOk(true); setLoading(false)
  }

  if (ok) return (
    <div className="p-6 max-w-lg mx-auto text-center py-16">
      <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4"/>
      <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">Empleado creado</h2>
      <p className="text-slate-400 text-sm mb-6">
        {form.nombre} ha sido añadido. Envíale el email <strong>{form.email}</strong> para que active su cuenta.
      </p>
      <div className="flex gap-3 justify-center">
        <button onClick={()=>{setOk(false);setForm(f=>({...f,nombre:'',email:'',password:'',puesto:'',telefono:'',ciudad:'',salario_base:''}))}}
          className="px-5 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-500">
          Añadir otro
        </button>
        <button onClick={()=>router.push('/admin/empleados')}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold">
          Ver empleados
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

      {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">{error}</div>}

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
        <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Datos personales</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {k:'nombre',label:'Nombre completo *',ph:'Juan García López'},
            {k:'email', label:'Email *',ph:'juan@empresa.com'},
            {k:'password',label:'Contraseña inicial *',ph:'Mínimo 6 caracteres'},
            {k:'telefono',label:'Teléfono',ph:'+34 600 000 000'},
            {k:'ciudad',label:'Ciudad',ph:'Madrid'},
          ].map(f=>(
            <div key={f.k} className={f.k==='nombre'?'sm:col-span-2':''}>
              <label className="block text-xs font-medium text-slate-500 mb-1">{f.label}</label>
              <input type={f.k==='password'?'password':'text'} value={form[f.k]} onChange={e=>set(f.k,e.target.value)}
                placeholder={f.ph}
                className="w-full bg-slate-50 dark:bg-slate-700 rounded-xl px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 outline-none focus:border-indigo-400 text-slate-700 dark:text-slate-200"/>
            </div>
          ))}
        </div>
      </div>

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
            <label className="block text-xs font-medium text-slate-500 mb-1">Rol</label>
            <select value={form.rol} onChange={e=>set('rol',e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-700 rounded-xl px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 outline-none focus:border-indigo-400 text-slate-700 dark:text-slate-200">
              <option value="empleado">Empleado</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
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
            <label className="block text-xs font-medium text-slate-500 mb-1">Horas semana</label>
            <input type="number" value={form.jornada_horas} onChange={e=>set('jornada_horas',e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-700 rounded-xl px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 outline-none focus:border-indigo-400 text-slate-700 dark:text-slate-200"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Salario base anual (€)</label>
            <input type="number" value={form.salario_base} onChange={e=>set('salario_base',e.target.value)} placeholder="24000"
              className="w-full bg-slate-50 dark:bg-slate-700 rounded-xl px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 outline-none focus:border-indigo-400 text-slate-700 dark:text-slate-200"/>
          </div>
        </div>
        {/* Color avatar */}
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
        {loading ? 'Guardando...' : 'Crear empleado'}
      </button>
    </div>
  )
}