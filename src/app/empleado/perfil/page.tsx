'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { iniciales, formatFecha, diasEntre } from '@/lib/utils'
import { differenceInYears, parseISO } from 'date-fns'
import { LogOut } from 'lucide-react'

export default function PerfilPage() {
  const router = useRouter()
  const [empleado, setEmpleado] = useState<any>(null)
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: emp } = await supabase.from('empleados').select('*').eq('user_id', user.id).single()
      if (!emp) return
      setEmpleado(emp)
      const { data: sols } = await supabase.from('solicitudes').select('*').eq('empleado_id', emp.id)
      setSolicitudes(sols || [])
      setLoading(false)
    }
    init()
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const diasVacUsados = solicitudes.filter((s: yany) => s.tipo === 'vacaciones' && s.estado === 'aprobada').reduce((acc: number, s: any) => acc + diasEntre(s.fecha_inicio, s.fecha_fin), 0)
  const pendientes = solicitudes.filter((s: any) => s.estado === 'pendiente').length
  const antiguedad = empleado?.fecha_alta ? differenceInYears(new Date(), parseISO(empleado.fecha_alta)) : 0

  if (loading) return <div className="p-4 space-y-4 pt-8">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>

  return (
    <div className="p-4 pt-6">
      <div className="flex flex-col items-center mb-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3" style={{backgroundColor: empleado?.avatar_color}}>
          {iniciales(empleado?.nombre || '')}
        </div>
        <h1 className="text-xl font-bold text-gray-900">{empleado?.nombre}</h1>
        <p className="text-sm text-gray-500">{empleado?.puesto} &bull; {empleado?.departamento}</p>
      </div>

      <div className="card p-4 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Datos laborales</h2>
        <div className="space-y-2">
          {[{label:'Email',value:empleado?.email},{label:'Departamento',value:empleado?.departamento},{label:'Puesto', value:empleado?.puesto},{label:'Jornada',value:`${empleado?.jornada_horas}h / semana`},{label:'Contrato',value:empleado?.tipo_contrato},{label:'Fecha alta',value:empleado?.fecha_alta?formatFecha(empleado.fecha_alta):'✔},{label:'Antigüedad',value:antiguedad>0?`${antiguedad} año${antiguedad!==1?'s':''}`:'< 1 año'}].map(row=>(
            <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span className="text-sm text-gray-500">{row.label}</span>
              <span className="text-sm font-medium text-gray-900">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Resumen {new Date().getFullYear()}</h2>
        <div className="grid grid-cols-2 gap-3">
          {[{label:'Vacaciones usadas',value:`${diasVacUsados} días`,color:'text-indigo-600'},{label:'Días disponibles',value:`${22-diasVacUsados} días`,color:'text-emerald-600'},{label:'Pendientes',value:pendientes,color:'text-amber-600'},{label:'Total solicitudes',value:solicitudes.length,color:'text-gray-700'}].map(item=>(
            <div key={item.label} className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">{item.label}</p>
              <p className={`text-lg font-bold mt-0.5 ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <button onClick={logout} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium">
        <LogOut className="w-4 h-4" />Cerrar sesión
      </button>
    </div>
  )
}
