// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Settings, Save, Building2, Mail, Phone, Globe, MapPin, Clock, Users, CheckCircle } from 'lucide-react'

export default function ConfigPage() {
  const [empresa, setEmpresa] = useState({ nombre:'ACME Corp', email:'admin@acme.com', telefono:'', web:'', ciudad:'Madrid', cif:'B12345678' })
  const [config, setConfig]   = useState({ horas_jornada:8, dias_vacaciones:22, zona_horaria:'Europe/Madrid', notif_email:true, notif_push:false })
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [tab, setTab]         = useState('empresa')

  const guardar = async () => {
    setSaving(true)
    await new Promise(r=>setTimeout(r,800)) // simulación
    setSaving(false); setSaved(true)
    setTimeout(()=>setSaved(false),3000)
  }

  return (
    <div className="p-4 lg:p-6 max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-500"/> Configuración
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Ajustes de la empresa y preferencias del sistema</p>
        </div>
        <button onClick={guardar} disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
          {saved ? <><CheckCircle className="w-4 h-4"/> Guardado</> : saving ? 'Guardando...' : <><Save className="w-4 h-4"/> Guardar</>}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
        {[['empresa','🏢 Empresa'],['laboral','⏰ Jornada laboral'],['notificaciones','🔔 Notificaciones']].map(([id,lbl])=>(
          <button key={id} onClick={()=>setTab(id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tab===id?'text-indigo-600 border-indigo-500':'text-slate-400 border-transparent hover:text-slate-600'}`}>
            {lbl}
          </button>
        ))}
      </div>

      {tab==='empresa' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2"><Building2 className="w-4 h-4 text-indigo-500"/>Datos de la empresa</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {key:'nombre',   label:'Nombre empresa', icon:Building2, placeholder:'ACME Corp'},
              {key:'cif',      label:'CIF/NIF',         icon:Settings,  placeholder:'B12345678'},
              {key:'email',    label:'Email',           icon:Mail,      placeholder:'admin@empresa.com'},
              {key:'telefono', label:'Teléfono',        icon:Phone,     placeholder:'+34 900 000 000'},
              {key:'ciudad',   label:'Ciudad',          icon:MapPin,    placeholder:'Madrid'},
              {key:'web',      label:'Web',             icon:Globe,     placeholder:'www.empresa.com'},
            ].map(f=>{
              const Icon=f.icon
              return(
                <div key={f.key}>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5"/>{f.label}
                  </label>
                  <input value={empresa[f.key]||''} onChange={e=>setEmpresa({...empresa,[f.key]:e.target.value})}
                    placeholder={f.placeholder}
                    className="w-full bg-slate-50 dark:bg-slate-700 rounded-xl px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-600 outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-200"/>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab==='laboral' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-indigo-500"/>Jornada y vacaciones</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Horas jornada diaria</label>
              <input type="number" value={config.horas_jornada} onChange={e=>setConfig({...config,horas_jornada:+e.target.value})} min={1} max={12}
                className="w-full bg-slate-50 dark:bg-slate-700 rounded-xl px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-600 outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-200"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Días de vacaciones/año</label>
              <input type="number" value={config.dias_vacaciones} onChange={e=>setConfig({...config,dias_vacaciones:+e.target.value})} min={20} max={30}
                className="w-full bg-slate-50 dark:bg-slate-700 rounded-xl px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-600 outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-200"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Zona horaria</label>
              <select value={config.zona_horaria} onChange={e=>setConfig({...config,zona_horaria:e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-700 rounded-xl px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-600 outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-200">
                <option value="Europe/Madrid">Europe/Madrid (CET)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="America/New_York">America/New_York (EST)</option>
              </select>
            </div>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 text-sm text-indigo-700 dark:text-indigo-300">
            <p className="font-medium mb-1">📋 Configuración actual</p>
            <p>Jornada laboral: <strong>{config.horas_jornada}h/día</strong> · Vacaciones: <strong>{config.dias_vacaciones} días/año</strong> · Zona: <strong>{config.zona_horaria}</strong></p>
          </div>
        </div>
      )}

      {tab==='notificaciones' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">🔔 Preferencias de notificación</h3>
          {[
            {key:'notif_email', label:'Notificaciones por email', desc:'Recibe alertas de solicitudes, gastos y eventos por email'},
            {key:'notif_push',  label:'Notificaciones push', desc:'Notificaciones en tiempo real en el navegador (requiere permiso)'},
          ].map(n=>(
            <div key={n.key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{n.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{n.desc}</p>
              </div>
              <button onClick={()=>setConfig({...config,[n.key]:!config[n.key]})}
                className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ml-4 ${config[n.key]?'bg-indigo-500':'bg-slate-300 dark:bg-slate-600'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${config[n.key]?'translate-x-7':'translate-x-1'}`}/>
              </button>
            </div>
          ))}
          <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
            <p className="text-xs font-medium text-slate-500 mb-2">Alertas automáticas del sistema</p>
            {['Solicitudes pendientes (recordatorio diario)','Contratos próximos a vencer (30 días)','Cumpleaños del equipo (7 días antes)','Gastos pendientes de aprobar'].map(a=>(
              <div key={a} className="flex items-center gap-2 py-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0"/>
                <span className="text-xs text-slate-500">{a}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}