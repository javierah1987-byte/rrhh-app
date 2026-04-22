// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react'

export default function FichajeCorreccionesPage() {
  const [correcciones, setCorrecciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(null)

  const cargar = async () => {
    const { data } = await supabase.from('solicitudes')
      .select('*, empleados(nombre,puesto,avatar_color)')
      .eq('tipo', 'correccion_fichaje')
      .order('created_at', {ascending:false})
    setCorrecciones(data || [])
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  const aprobar = async id => {
    setSaving(id)
    await supabase.from('solicitudes').update({estado:'aprobada'}).eq('id', id)
    setSaving(null); cargar()
  }
  const rechazar = async id => {
    setSaving(id)
    await supabase.from('solicitudes').update({estado:'rechazada'}).eq('id', id)
    setSaving(null); cargar()
  }

  if (loading) return <div className="p-8 text-slate-400 animate-pulse text-sm">Cargando...</div>

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-500"/> Correcciones de fichaje
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Solicitudes de corrección enviadas por los empleados</p>
      </div>

      {correcciones.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-10 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-300 mx-auto mb-3"/>
          <p className="text-slate-500">No hay correcciones pendientes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {correcciones.map(c => {
            const emp = c.empleados
            return(
              <div key={c.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4 px-5 py-4 flex-wrap">
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                  style={{background:emp?.avatar_color||'#6366f1'}}>
                  {emp?.nombre?.charAt(0)||'?'}
                </div>
                <div className="flex-1 min-w-[180px]">
                  <p className="font-medium text-slate-700 dark:text-slate-200 text-sm">{emp?.nombre}</p>
                  <p className="text-xs text-slate-400">{c.comentario||'Sin comentario'}</p>
                  <p className="text-xs text-slate-400">{new Date(c.fecha_inicio).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'})}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${c.estado==='aprobada'?'bg-emerald-100 text-emerald-700':c.estado==='pendiente'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}`}>
                  {c.estado}
                </span>
                {c.estado==='pendiente' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={()=>aprobar(c.id)} disabled={saving===c.id}
                      className="p-1.5 bg-emerald-100 hover:bg-emerald-200 rounded-lg disabled:opacity-50">
                      <CheckCircle className="w-4 h-4 text-emerald-600"/>
                    </button>
                    <button onClick={()=>rechazar(c.id)} disabled={saving===c.id}
                      className="p-1.5 bg-red-100 hover:bg-red-200 rounded-lg disabled:opacity-50">
                      <XCircle className="w-4 h-4 text-red-500"/>
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}