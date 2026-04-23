// @ts-nocheck
'use client'
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Users, PauseCircle, PlayCircle, Trash2 } from 'lucide-react'

const PLAN_COLORS = { starter:'#6366f1', professional:'#10b981', enterprise:'#f59e0b', fichaje:'#0891b2' }
const PLAN_ICONS_MAP = { starter:'★', professional:'⚡', enterprise:'♛', fichaje:'🛡' }
const CAT_LABELS = { tiempo:'⏰ Tiempo', ausencias:'📅 Ausencias', equipo:'👥 Equipo', reclutamiento:'💼 Reclutamiento',
  admin:'⚙️ Admin', comunicacion:'💬 Comunicación', cumplimiento:'🔒 Cumplimiento',
  premium:'💎 Premium', objetivos:'🎯 Objetivos', tareas:'✅ Tareas', formacion:'📚 Formación' }

export default function EmpCard({ emp, planes, features, planFeats, overrides, configs, expanded, setExpanded,
  cambiarPlan, toggleOv, suspender, borrar, saving, compact }) {
  const getPlanId = () => configs.find(c=>c.empresa_id===emp.id)?.plan_id || emp.plan
  const getPlanFIds = (planId) => planFeats.filter(pf=>pf.plan_id===planId).map(pf=>pf.feature_id)
  const hasOv = (fid) => overrides.some(o=>o.empresa_id===emp.id&&o.feature_id===fid)

  const planId = getPlanId()
  const plan = planes.find(p=>p.id===planId)
  const planColor = emp.suspendida ? '#ef4444' : (plan ? PLAN_COLORS[plan.id]||'#64748b' : '#64748b')
  const isOpen = expanded === emp.id
  const planFIds = plan ? getPlanFIds(plan.id) : []
  const extra = overrides.filter(o=>o.empresa_id===emp.id&&!planFIds.includes(o.feature_id)).length

  const cardClass = emp.suspendida
    ? 'rounded-xl border border-red-300 bg-red-50/50 overflow-hidden transition-all'
    : (compact
      ? 'rounded-xl border border-slate-200 bg-white overflow-hidden transition-all'
      : 'rounded-xl border border-slate-200 bg-white overflow-hidden transition-all shadow-sm')

  const pauseClass = emp.suspendida
    ? 'p-1.5 rounded-lg transition-colors text-emerald-500 hover:bg-emerald-50'
    : 'p-1.5 rounded-lg transition-colors text-amber-400 hover:bg-amber-50'

  return (
    <div className={cardClass}>
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50/50"
        onClick={()=>setExpanded(isOpen?null:emp.id)}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white flex-shrink-0 text-sm"
          style={{background:planColor}}>
          {emp.suspendida ? '⏸' : emp.nombre.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm truncate">{emp.nombre}</p>
          <p className="text-slate-400 text-xs truncate">{emp.email}</p>
        </div>
        {emp.suspendida ? (
          <span className="text-[10px] bg-red-100 text-red-700 border border-red-300 px-2 py-0.5 rounded-full font-bold flex-shrink-0">
            ⏸ SUSP.
          </span>
        ) : (
          <>
            <select value={planId||'starter'}
              onClick={e=>e.stopPropagation()}
              onChange={e=>cambiarPlan(emp.id,e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none bg-white flex-shrink-0 font-medium"
              style={{color:planColor}}>
              {planes.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            <span className="flex items-center gap-0.5 text-slate-400 text-xs flex-shrink-0">
              <Users className="w-3 h-3"/>{emp.max_empleados||'?'}
            </span>
            {extra > 0 && <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-bold">+{extra}</span>}
          </>
        )}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button onClick={e=>{e.stopPropagation();suspender(emp.id,emp.nombre,emp.suspendida,false)}}
            className={pauseClass}>
            {emp.suspendida ? <PlayCircle className="w-3.5 h-3.5"/> : <PauseCircle className="w-3.5 h-3.5"/>}
          </button>
          <button onClick={e=>{e.stopPropagation();borrar(emp.id,emp.nombre,false)}}
            className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 className="w-3.5 h-3.5"/>
          </button>
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400"/> : <ChevronDown className="w-4 h-4 text-slate-400"/>}
        </div>
      </div>
      {isOpen && emp.suspendida && (
        <div className="border-t border-red-200 px-4 py-3 bg-red-50/50">
          <p className="text-sm text-red-600 font-medium">Servicio suspendido</p>
          {emp.motivo_suspension && <p className="text-xs text-red-400 mt-0.5">Motivo: {emp.motivo_suspension}</p>}
          {emp.fecha_suspension && <p className="text-xs text-slate-400 mt-0.5">{new Date(emp.fecha_suspension).toLocaleDateString('es-ES')}</p>}
          <button onClick={()=>suspender(emp.id,emp.nombre,true,false)}
            className="mt-2 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
            <PlayCircle className="w-3.5 h-3.5"/> Reactivar
          </button>
        </div>
      )}
      {isOpen && !emp.suspendida && (
        <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/30">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Features</p>
            {Object.keys(CAT_LABELS).map(cat => {
              const feats = features.filter(f=>f.categoria===cat)
              if (!feats.length) return null
              return (
                <div key={cat}>
                  <span className="text-[10px] text-slate-400">{CAT_LABELS[cat]}</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {feats.map(f => {
                      const inPlan = planFIds.includes(f.id)
                      const inOv = hasOv(f.id)
                      const active = inPlan || inOv
                      const isSav = saving === emp.id+'-'+f.id
                      const btnClass = active
                        ? (inPlan
                            ? 'flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-indigo-50 text-indigo-700 border-indigo-200 transition-all'
                            : 'flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-emerald-50 text-emerald-700 border-emerald-200 transition-all')
                        : 'flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-white text-slate-400 border-slate-200 hover:border-slate-300 transition-all'
                      return (
                        <button key={f.id} onClick={()=>toggleOv(emp.id,f.id)}
                          disabled={isSav} className={btnClass}>
                          {active ? <CheckCircle className="w-2.5 h-2.5"/> : <XCircle className="w-2.5 h-2.5"/>}
                          {f.nombre}
                          {inPlan && !inOv && <span className="text-[9px] opacity-60">plan</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}