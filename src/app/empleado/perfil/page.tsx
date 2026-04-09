'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ToastProvider'
import { Breadcrumb } from '@/components/Breadcrumb'
import { Camera, Save, Phone, MapPin, AlertCircle, CreditCard, FileText, Calendar, Briefcase } from 'lucide-react'

type Emp = { id:string; nombre:string; email:string; departamento:string|null; puesto:string|null; telefono:string|null; direccion:string|null; contacto_emergencia:string|null; numero_documento:string|null; fecha_nacimiento:string|null; num_cuenta:string|null; avatar_url:string|null; fecha_alta:string|null; tipo_contrato:string|null }

export default function EmpleadoPerfilPage() {
  const [emp,setEmp]=useState<Emp|null>(null)
  const [form,setForm]=useState<Partial<Emp>>({})
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)
  const [uploading,setUploading]=useState(false)
  const [avatarUrl,setAvatarUrl]=useState<string|null>(null)
  const fileRef=useRef<HTMLInputElement>(null)
  const {toast}=useToast()

  useEffect(()=>{
    const load=async()=>{
      const {data:{user}}=await supabase.auth.getUser()
      if(!user) return
      const {data}=await supabase.from('empleados').select('*').eq('user_id',user.id).single()
      if(data){ setEmp(data as any); setForm(data as any)
        if((data as any).avatar_url){ const {data:{publicUrl}}=supabase.storage.from('avatars').getPublicUrl((data as any).avatar_url); setAvatarUrl(publicUrl) }
      }
      setLoading(false)
    }
    load()
  },[])

  const onAvatar=async(e:React.ChangeEvent<HTMLInputElement>)=>{
    const f=e.target.files?.[0]; if(!f||!emp) return
    setUploading(true)
    const path=`${emp.id}/avatar.${f.name.split('.').pop()}`
    const {error}=await supabase.storage.from('avatars').upload(path,f,{upsert:true})
    if(error){toast('err','Error al subir la foto');setUploading(false);return}
    await supabase.from('empleados').update({avatar_url:path}).eq('id',emp.id)
    const {data:{publicUrl}}=supabase.storage.from('avatars').getPublicUrl(path)
    setAvatarUrl(publicUrl+'?t='+Date.now())
    toast('ok','Foto actualizada'); setUploading(false)
  }

  const save=async()=>{
    if(!emp) return; setSaving(true)
    const {error}=await supabase.from('empleados').update({telefono:form.telefono,direccion:form.direccion,contacto_emergencia:form.contacto_emergencia,numero_documento:form.numero_documento,fecha_nacimiento:form.fecha_nacimiento||null,num_cuenta:form.num_cuenta}).eq('id',emp.id)
    if(error) toast('err','Error al guardar'); else toast('ok','Perfil actualizado')
    setSaving(false)
  }

  const upd=(k:keyof Emp,v:string)=>setForm(f=>({...f,[k]:v}))
  const initials=emp?.nombre.split(' ').map(n=>n[0]).join('').substring(0,2)||'?'

  if(loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"/></div>

  return(
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <Breadcrumb/>
      <h1 className="page-title">Mi perfil</h1>
      <div className="card p-6 flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
            {avatarUrl?<img src={avatarUrl} alt="avatar" className="w-full h-full object-cover"/>:<span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{initials}</span>}
          </div>
          <button onClick={()=>fileRef.current?.click()} disabled={uploading}
            className="absolute -bottom-1 -right-1 w-7 h-7 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center shadow-md transition-colors">
            {uploading?<div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin"/>:<Camera className="w-3.5 h-3.5 text-white"/>}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatar}/>
        </div>
        <div>
          <p className="font-bold text-slate-900 dark:text-slate-100 text-lg">{emp?.nombre}</p>
          <p className="text-sm text-slate-500">{emp?.puesto||'—'} · {emp?.departamento||'—'}</p>
          <p className="text-xs text-slate-400 mt-0.5">{emp?.email}</p>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2"><Briefcase className="w-4 h-4 text-indigo-500"/>Datos laborales</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-xs text-slate-400 mb-0.5">Tipo contrato</p><p className="font-medium text-slate-800 dark:text-slate-200">{emp?.tipo_contrato||'—'}</p></div>
          <div><p className="text-xs text-slate-400 mb-0.5">Fecha de alta</p><p className="font-medium text-slate-800 dark:text-slate-200">{emp?.fecha_alta?new Date(emp.fecha_alta).toLocaleDateString('es-ES'):'—'}</p></div>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <h2 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-500"/>Datos personales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="label">Teléfono</label><div className="relative"><Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/><input type="tel" value={form.telefono||''} onChange={e=>upd('telefono',e.target.value)} className="input pl-9" placeholder="+34 600 000 000"/></div></div>
          <div><label className="label">Fecha nacimiento</label><div className="relative"><Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/><input type="date" value={form.fecha_nacimiento||''} onChange={e=>upd('fecha_nacimiento',e.target.value)} className="input pl-9"/></div></div>
          <div className="md:col-span-2"><label className="label">Dirección</label><div className="relative"><MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/><input type="text" value={form.direccion||''} onChange={e=>upd('direccion',e.target.value)} className="input pl-9" placeholder="Calle, número, ciudad"/></div></div>
          <div><label className="label">DNI / NIE</label><div className="relative"><FileText className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/><input type="text" value={form.numero_documento||''} onChange={e=>upd('numero_documento',e.target.value)} className="input pl-9" placeholder="12345678X"/></div></div>
          <div><label className="label">IBAN</label><div className="relative"><CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/><input type="text" value={form.num_cuenta||''} onChange={e=>upd('num_cuenta',e.target.value)} className="input pl-9" placeholder="ES00 0000 …"/></div></div>
          <div className="md:col-span-2"><label className="label">Contacto de emergencia</label><div className="relative"><AlertCircle className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/><input type="text" value={form.contacto_emergencia||''} onChange={e=>upd('contacto_emergencia',e.target.value)} className="input pl-9" placeholder="Nombre — Teléfono — Parentesco"/></div></div>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving?<div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/>:<><Save className="w-4 h-4"/>Guardar cambios</>}
        </button>
      </div>
    </div>
  )
}