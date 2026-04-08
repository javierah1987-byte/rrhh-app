'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Empleado } from '@/lib/supabase'
import { iniciales, BADGE_ESTADO_EMPLEADO, formatFecha } from '@/lib/utils'
import { LogOut, Briefcase, Calendar, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PerfilPage() {
  const [empleado, setEmpleado] = useState<Empleado | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const cargar = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: emp } = await supabase.from('empleados').select('*').eq('user_id', user.id).single()
    setEmpleado(emp)
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div className="p-4 space-y-4 pt-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skeleton h-16 rounded-xl" />
      ))}
    </div>
  )

  return (
    <div className="p-4 pt-6">
      <div className="flex flex-col items-center mb-6">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3"
          style={{ backgroundColor: empleado?.avatar_color }}
        >
          {iniciales(empleado?.nombre || '')}
        </div>
        <h1 className="text-xl font-bold text-gray-900">{empleado?.nombre}</h1>
        <p className="text-sm text-gray-500">{empleado?.email}</p>
        <span className={`badge mt-2 ${BADGE_ESTADO_EMPLEADO[empleado?.estado || 'activo']}`}>
          {empleado?.estado}
        </span>
      </div>

      <div className="card divide-y divide-gray-50 mb-4">
        {[
          { icon: Briefcase, label: 'Puesto', value: empleado?.puesto },
          { icon: Briefcase, label: 'Departamento', value: empleado?.departamento },
          { icon: Briefcase, label: 'Tipo contrato', value: empleado?.tipo_contrato },
          { icon: Calendar, label: 'Fecha de alta', value: empleado?.fecha_alta ? formatFecha(empleado.fecha_alta) : '' },
          { icon: Clock, label: 'Jornada', value: `${empleado?.jornada_horas}h / día` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3 px-4 py-3">
            <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-500 w-32 flex-shrink-0">{label}</span>
            <span className="text-sm font-medium text-gray-900">{value}</span>
          </div>
        ))}
      </div>

      <button onClick={logout} className="btn-secondary w-full flex items-center justify-center gap-2 py-3">
        <LogOut className="w-4 h-4" /> Cerrar sesión
      </button>
    </div>
  )
}