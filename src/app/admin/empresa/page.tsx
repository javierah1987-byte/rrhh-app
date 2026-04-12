'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Building2, CheckCircle, Loader2, AlertCircle } from 'lucide-react'

type Empresa={id:string;nombre:string;cif:string|null;email:string|null;telefono:string|null;direccion:string|null;ciudad:string|null;codigo_postal:string|null;pais:string;plan:string;max_empleados:number;activa:boolean}

const PLAN_INFO:{[k:string]:{label:string;color:string;desc:string}}={
  starter:{label:'Starter',color:'bg-slate-100 text-slate-700',desc:'Hasta 10 empleados'},
  professional:{label:'Professional',color:'bg-indigo-100 text-indigo-700',desc:'Hasta 50 empleados'},
  enterprise:{label:'Enterprise',color:'bg-purple-100 text-purple-700',desc:'Empleados ilimitados'},
}

export default function EmpresaPage(){
  const [empresa,setEmpresa]=useState<Empresa|null>(null)
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)
  const [resultado,setRes]=useState<{ok:boolean;msg:string}|null>(null)
  const [form,setForm]=useState({nombre:'',cif:'',email:'',telefono:'',direccion:'',ciudad:'',codigo_postal:'',pais:'España'})
  const [totalEmps,setTotalEmps]=useState(0)

  const cargar=useCallback(async()=>{
    const{data:{user}}=await supabase.auth.getUser(); if(!user)return
    const{data:emp}=await supabase.from('empleados').select('empresa_id').eq('user_id',user.id).single()
    if(!emp?.empresa_id)return
    const[{data:empresa},{count}]=await Promise.all([
      supabase.from('empresas').select('*').eq('id',emp.empresa_id).single(),
      supabase.from('empleados').select('id',{count:'exact',head:true}).eq('empresa_id',emp.empresa_id),
    ])
    if(empresa){
      setEmpresa(empresa as Empresa)
      setForm({nombre:empresa.nombre,cif:empresa.cif||'',email:empresa.email||'',telefono:empresa.telefono||'',direccion:empresa.direccion||'',ciudad:empresa.ciudad||'',codigo_postal:empresa.codigo_postal||'',pais:empresa.pais||'España'})
    }
    setTotalEmps(count||0)
    setLoading(false)
  },[])
  useEffect(()=>{cargar()},[cargar])

  async function guardar(){
    if(!empresa||!form.nombre.trim())return
    setSaving(true);setRes(null)
    const{error}=await supabase.from('empresas').update({...form,updated_at:new Date().toISOString()}).eq('id',empresa.id)
    setSaving(false)
    setRes(error?{ok:false,msg:error.message}:{ok:true,msg:'Datos de empresa actualizados'})
    if(!error)setEmpresa(p=>p?{...p,...form}:p)
  }

  if(loading)return<div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>
  if(!empresa)return<div className="card p-12 text-center"><Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3"/><p className="text-slate-500">No se encontró la empresa</p></div>

  const plan=PLAN_INFO[empresa.plan]||PLAN_INFO.starter

  return(
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="page-header">
        <div><h1 className="page-title flex items-center gap-2"><Building2 className="w-5 h-5 text-indigo-500"/>Mi empresa</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Datos y configuración de la empresa</p></div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 dark:text-slate-100">Plan activo</h3>
          <span className={`badge font-semibold ${plan.color}`}>{plan.label}</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            {label:'Empleados',value:totalEmps+' / '+empresa.max_empleados},
            {label:'Plan',value:plan.desc},
            {label:'Estado',value:empresa.activa?'Activa':'Inactiva'},
          ].map((k,i)=>(
            <div key={i} className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-3 text-center">
              <p className="text-lg font-black text-slate-900 dark:text-slate-100">{k.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Datos de la empresa</h3>

        {resultado&&(
          <div className={`flex items-center gap-2 p-3 rounded-xl mb-4 text-sm ${resultado.ok?'bg-emerald-50 text-emerald-700 border border-emerald-200':'bg-red-50 text-red-700 border border-red-200'}`}>
            {resultado.ok?<CheckCircle className="w-4 h-4"/>:<AlertCircle className="w-4 h-4"/>}{resultado.msg}
          </div>
        )}

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="label">Nombre empresa *</label><input value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} placeholder="Mi Empresa S.L." className="input mt-1"/></div>
            <div><label className="label">CIF/NIF</label><input value={form.cif} onChange={e=>setForm(f=>({...f,cif:e.target.value}))} placeholder="B12345678" className="input mt-1"/></div>
            <div><label className="label">Email corporativo</label><input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="info@empresa.com" className="input mt-1"/></div>
            <div><label className="label">Teléfono</label><input value={form.telefono} onChange={e=>setForm(f=>({...f,telefono:e.target.value}))} placeholder="+34 91 000 0000" className="input mt-1"/></div>
            <div><label className="label">Ciudad</label><input value={form.ciudad} onChange={e=>setForm(f=>({...f,ciudad:e.target.value}))} placeholder="Madrid" className="input mt-1"/></div>
            <div className="col-span-2"><label className="label">Dirección</label><input value={form.direccion} onChange={e=>setForm(f=>({...f,direccion:e.target.value}))} placeholder="Calle Mayor 1" className="input mt-1"/></div>
          </div>
          <button onClick={guardar} disabled={saving||!form.nombre.trim()}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50">
            {saving?<><Loader2 className="w-4 h-4 animate-spin"/>Guardando…</>:<><CheckCircle className="w-4 h-4"/>Guardar cambios</>}
          </button>
        </div>
      </div>
    </div>
  )
}