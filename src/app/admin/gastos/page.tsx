// @ts-nocheck
'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Receipt, CheckCircle2, XCircle, Clock, TrendingUp, X, FileText } from 'lucide-react'

const CAT_COLOR = {formacion:'#6366f1',transporte:'#10b981',comida:'#f59e0b',material:'#8b5cf6',alojamiento:'#0891b2',otro:'#64748b'}

export default function AdminGastosPage() {
  const [gastos, setGastos]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [filtro, setFiltro]     = useState('pendiente')
  const [saving, setSaving]     = useState(null)
  const [modalRech, setModalRech] = useState(null)
  const [motivo, setMotivo]     = useState('')

  const cargar = useCallback(async () => {
    const q = supabase.from('gastos')
      .select('*, empleados(nombre,puesto,avatar_color)')
      .order('fecha', {ascending:false})
    const { data } = filtro==='todos' ? await q : await q.eq('estado',filtro)
    setGastos(data||[])
    setLoading(false)
  }, [filtro])

  useEffect(()=>{setLoading(true);cargar()},[cargar])

  const aprobar = async id => {
    setSaving(id)
    await supabase.from('gastos').update({estado:'aprobado'}).eq('id',id)
    setSaving(null); cargar()
  }
  const rechazar = async (id, mot) => {
    setSaving(id)
    await supabase.from('gastos').update({estado:'rechazado'}).eq('id',id)
    setSaving(null); setModalRech(null); setMotivo(''); cargar()
  }

  const totalPend = gastos.filter(g=>g.estado==='pendiente').reduce((s,g)=>s+(g.importe||0),0)
  const totalAprob = gastos.filter(g=>g.estado==='aprobado').reduce((s,g)=>s+(g.importe||0),0)

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-500"/> Gestión de gastos
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Revisa y aprueba los gastos del equipo</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2.5 text-right">
            <p className="text-xs text-amber-600">Por aprobar</p>
            <p className="text-lg font-black text-amber-700">{totalPend.toFixed(2)}€</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-2.5 text-right">
            <p className="text-xs text-emerald-600">Aprobado mes</p>
            <p className="text-lg font-black text-emerald-700">{totalAprob.toFixed(2)}€</p>
          </div>
        </div>
      </div>

      {/* Filtro */}
      <div className="flex gap-2">
        {['pendiente','aprobado','rechazado','todos'].map(f=>(
          <button key={f} onClick={()=>setFiltro(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${filtro===f?'bg-indigo-600 text-white':'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
            {f==='todos'?'Todos':f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm animate-pulse py-8 text-center">Cargando gastos...</div>
      ) : gastos.length===0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-10 text-center">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3"/>
          <p className="text-slate-500 text-sm">No hay gastos {filtro!=='todos'?filtro+'s':''}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {gastos.map(g=>{
              const emp = g.empleados
              const catColor = CAT_COLOR[g.categoria]||'#64748b'
              const isPending = g.estado==='pendiente'
              return (
                <div key={g.id} className="flex items-center gap-4 px-5 py-3.5 flex-wrap gap-y-2 hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                    style={{background:emp?.avatar_color||'#6366f1'}}>
                    {emp?.nombre?.charAt(0)||'?'}
                  </div>
                  {/* Info empleado */}
                  <div className="min-w-[120px]">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{emp?.nombre}</p>
                    <p className="text-xs text-slate-400">{new Date(g.fecha).toLocaleDateString('es-ES',{day:'numeric',month:'short'})}</p>
                  </div>
                  {/* Categoría */}
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium capitalize flex-shrink-0"
                    style={{background:catColor+'20',color:catColor}}>
                    {g.categoria||'otro'}
                  </span>
                  {/* Descripción */}
                  <p className="flex-1 min-w-[150px] text-sm text-slate-600 dark:text-slate-300 truncate">{g.descripcion||'Sin descripción'}</p>
                  {/* Importe */}
                  <p className="font-bold text-slate-700 dark:text-slate-200 flex-shrink-0 tabular-nums">{(g.importe||0).toFixed(2)}€</p>
                  {/* Estado */}
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${g.estado==='aprobado'?'bg-emerald-100 text-emerald-700':g.estado==='pendiente'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}`}>
                    {g.estado}
                  </span>
                  {/* Acciones */}
                  {isPending && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={()=>aprobar(g.id)} disabled={saving===g.id}
                        className="p-1.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/60 rounded-lg transition-colors disabled:opacity-50"
                        title="Aprobar">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600"/>
                      </button>
                      <button onClick={()=>{setModalRech(g.id);setMotivo('')}} disabled={saving===g.id}
                        className="p-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/60 rounded-lg transition-colors disabled:opacity-50"
                        title="Rechazar">
                        <XCircle className="w-4 h-4 text-red-500"/>
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal rechazo */}
      {modalRech && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-700 dark:text-slate-200">Rechazar gasto</h3>
              <button onClick={()=>setModalRech(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <textarea value={motivo} onChange={e=>setMotivo(e.target.value)} rows={3}
              placeholder="Motivo del rechazo (opcional)..."
              className="w-full bg-slate-50 dark:bg-slate-700 rounded-xl px-4 py-3 text-sm border border-slate-200 dark:border-slate-600 outline-none focus:border-red-400 resize-none text-slate-700 dark:text-slate-200"/>
            <div className="flex gap-2 mt-4">
              <button onClick={()=>setModalRech(null)} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700">Cancelar</button>
              <button onClick={()=>rechazar(modalRech,motivo)}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors">
                {saving===modalRech?'Rechazando...':'Rechazar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}