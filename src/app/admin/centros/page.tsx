'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Building2, Plus, X, Loader2, MapPin, Users, Edit3, CheckCircle } from 'lucide-react'

type Centro={id:string;nombre:string;direccion:string|null;ciudad:string|null;codigo_postal:string|null;pais:string;telefono:string|null;email_contacto:string|null;activo:boolean;color:string;created_at:string;responsable_id:string|null;total_empleados?:number}
const COLORES=['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#0891b2','#ec4899','#14b8a6']

export default function CentrosTrabajoPage(){
  const [centros,setCentros]=useState<Centro[]>([])
  const [loading,setLoading]=useState(true)
  const [modal,setModal]=useState(false)
  const [editando,setEditando]=useState<Centro|null>(null)
  const [saving,setSaving]=useState(false)
  const [form,setForm]=useState({nombre:'',direccion:'',ciudad:'',codigo_postal:'',telefono:'',email_contacto:'',color:'#6366f1',activo:true})

  const cargar=useCallback(async()=>{
    const{data}=await supabase.from('centros_trabajo').select('*').order('nombre')
    const{data:emps}=await supabase.from('empleados').select('centro_trabajo_id')
    const counts:Record<string,number>={}
    emps?.forEach(e=>{if(e.centro_trabajo_id)counts[e.centro_trabajo_id]=(counts[e.centro_trabajo_id]||0)+1})
    setCentros((data||[]).map(c=>({...c,total_empleados:counts[c.id]||0})))
    setLoading(false)
  },[])
  useEffect(()=>{cargar()},[cargar])

  function abrirModal(c?:Centro){
    if(c){setEditando(c);setForm({nombre:c.nombre,direccion:c.direccion||'',ciudad:c.ciudad||'',codigo_postal:c.codigo_postal||'',telefono:c.telefono||'',email_contacto:c.email_contacto||'',color:c.color,activo:c.activo})}
    else{setEditando(null);setForm({nombre:'',direccion:'',ciudad:'',codigo_postal:'',telefono:'',email_contacto:'',color:'#6366f1',activo:true})}
    setModal(true)
  }

  async function guardar(){
    if(!form.nombre.trim())return;setSaving(true)
    if(editando){await supabase.from('centros_trabajo').update({...form}).eq('id',editando.id)}
    else{await supabase.from('centros_trabajo').insert({...form})}
    setSaving(false);setModal(false);cargar()
  }

  async function toggleActivo(id:string,activo:boolean){
    await supabase.from('centros_trabajo').update({activo:!activo}).eq('id',id)
    setCentros(p=>p.map(c=>c.id===id?{...c,activo:!activo}:c))
  }

  return(
    <div>
      <div className="page-header mb-5">
        <div><h1 className="page-title flex items-center gap-2"><Building2 className="w-5 h-5 text-indigo-500"/>Centros de trabajo</h1><p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Sedes y delegaciones de tu empresa</p></div>
        <button onClick={()=>abrirModal()} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4"/>Nuevo centro</button>
      </div>
      {loading?(<div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>)
      :(<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {centros.map(c=>(
          <div key={c.id} className={"card p-5 "+(c.activo?'':'opacity-60')}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:c.color}}><Building2 className="w-5 h-5 text-white"/></div>
                <div><h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{c.nombre}</h3>{c.ciudad&&<p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3"/>{c.ciudad}</p>}</div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={()=>abrirModal(c)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"><Edit3 className="w-3.5 h-3.5 text-slate-400"/></button>
                <button onClick={()=>toggleActivo(c.id,c.activo)} className={"p-1.5 rounded-lg "+(c.activo?'hover:bg-red-50':'hover:bg-emerald-50')}><div className={"w-3.5 h-3.5 rounded-full "+(c.activo?'bg-emerald-500':'bg-slate-300')}/></button>
              </div>
            </div>
            <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
              {c.direccion&&<p>{c.direccion}{c.codigo_postal?' · '+c.codigo_postal:''}</p>}
              {c.telefono&&<p>Tel: {c.telefono}</p>}
              {c.email_contacto&&<p>{c.email_contacto}</p>}
            </div>
            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <Users className="w-3.5 h-3.5 text-slate-400"/>
              <span className="text-xs text-slate-500">{c.total_empleados||0} empleados</span>
              <span className={"ml-auto badge text-[10px] "+(c.activo?'badge-green':'bg-slate-100 dark:bg-slate-700 text-slate-500')}>{c.activo?'Activo':'Inactivo'}</span>
            </div>
          </div>
        ))}
        {centros.length===0&&<div className="col-span-full card p-12 text-center"><Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3"/><p className="text-slate-500">Sin centros de trabajo</p></div>}
      </div>)}

      {modal&&(
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5"><h3 className="font-bold text-slate-900 dark:text-slate-100">{editando?'Editar centro':'Nuevo centro de trabajo'}</h3><button onClick={()=>setModal(false)}><X className="w-4 h-4 text-slate-400"/></button></div>
            <div className="space-y-3">
              <div><label className="label">Nombre *</label><input value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} placeholder="Sede Central" className="input"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Ciudad</label><input value={form.ciudad} onChange={e=>setForm(f=>({...f,ciudad:e.target.value}))} placeholder="Madrid" className="input"/></div>
                <div><label className="label">Código postal</label><input value={form.codigo_postal} onChange={e=>setForm(f=>({...f,codigo_postal:e.target.value}))} placeholder="28001" className="input"/></div>
              </div>
              <div><label className="label">Dirección</label><input value={form.direccion} onChange={e=>setForm(f=>({...f,direccion:e.target.value}))} placeholder="Calle Mayor 1" className="input"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Teléfono</label><input value={form.telefono} onChange={e=>setForm(f=>({...f,telefono:e.target.value}))} placeholder="+34 910 000 000" className="input"/></div>
                <div><label className="label">Email</label><input value={form.email_contacto} onChange={e=>setForm(f=>({...f,email_contacto:e.target.value}))} placeholder="sede@empresa.com" className="input"/></div>
              </div>
              <div>
                <label className="label">Color identificativo</label>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {COLORES.map(col=>(<button key={col} onClick={()=>setForm(f=>({...f,color:col}))} className={"w-8 h-8 rounded-full border-2 transition-transform "+(form.color===col?'border-slate-900 dark:border-white scale-110':'border-transparent')} style={{background:col}}/>))}
                </div>
              </div>
              <button onClick={guardar} disabled={saving||!form.nombre.trim()} className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50 mt-2">
                {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<CheckCircle className="w-4 h-4"/>}{saving?'Guardando…':editando?'Guardar cambios':'Crear centro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}