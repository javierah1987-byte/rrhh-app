'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { FileText, Calendar } from 'lucide-react'

type Baja = { id: string; tipo: string; fecha_inicio: string; fecha_fin_prevista: string | null; activa: boolean; numero_parte: string | null; observaciones: string | null }

const TIPO_LABEL: Record<string,string> = {
  enfermedad_comun: 'Enfermedad común',
  accidente_laboral: 'Accidente laboral',
  maternidad_paternidad: 'Maternidad/Paternidad',
  accidente_no_laboral: 'Accidente no laboral',
  cuidado_familiar: 'Cuidado familiar',
}

export default function BajasEmpleadoPage() {
  const [bajas, setBajas] = useState<Baja[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase.from('empleados').select('id').eq('user_id', data.user.id).single()
        .then(({ data: emp }) => {
          if (!emp) return
          supabase.from('bajas').select('*').eq('empleado_id', emp.id).order('fecha_inicio', { ascending: false })
            .then(({ data: b }) => { setBajas(b || []); setLoading(false) })
        })
    })
  }, [])

  if (loading) return (
    <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mis bajas</h1>
          <p className="text-sm text-slate-500 mt-1">Historial de bajas médicas</p>
        </div>
      </div>

      {bajas.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No tienes bajas registradas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bajas.map(baja => (
            <div key={baja.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${baja.activa ? 'bg-red-100' : 'bg-slate-100'}`}>
                    <FileText className={`w-4 h-4 ${baja.activa ? 'text-red-600' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900">{TIPO_LABEL[baja.tipo] || baja.tipo}</h3>
                      <span className={`badge ${baja.activa ? 'badge-red' : 'badge-slate'}`}>{baja.activa ? 'En curso' : 'Finalizada'}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Inicio: {new Date(baja.fecha_inicio).toLocaleDateString('es-ES')}</span>
                      {baja.fecha_fin_prevista && <span>Fin previsto: {new Date(baja.fecha_fin_prevista).toLocaleDateString('es-ES')}</span>}
                      {baja.numero_parte && <span>Parte: {baja.numero_parte}</span>}
                    </div>
                    {baja.observaciones && <p className="text-sm text-slate-600 mt-2">{baja.observaciones}</p>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}