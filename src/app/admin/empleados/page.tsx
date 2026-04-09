'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Search, Plus, UserPlus } from 'lucide-react'
import { EmptyState, SkeletonTable } from '@/components/shared'
import { Breadcrumb } from '@/components/Breadcrumb'
import { FilterBar, FilterDef } from '@/components/FilterBar'
import { Pagination } from '@/components/Pagination'
import { Modal } from '@/components/Modal'
import { useToast } from '@/components/ToastProvider'

const PER_PAGE=10
type Emp={id:string;nombre:string;email:string;departamento:string|null;puesto:string|null;estado:string;avatar_url:string|null;avatar_color:string;fecha_alta:string|null;tipo_contrato:string|null}

const FILTERS:FilterDef[]=[
  {key:'estado',label:'Estado',options:[{value:'activo',label:'Activo'},{value:'baja',label:'Baja'},{value:'vacaciones',label:'Vacaciones'}]},
  {key:'departamento',label:'Departamento',options:[{value:'Tecnología',label:'Tecnología'},{value:'RRHH',label:'RRHH'},{value:'Ventas',label:'Ventas'},{value:'Marketing',label:'Marketing'},{value:'Finanzas',label:'Finanzas'},{value:'Operaciones',label:'Operaciones'}]},
  {key:'tipo_contrato',label:'Contrato',options:[{value:'indefinido',label:'Indefinido'},{value:'temporal',label:'Temporal'},{value:'practicas',label:'Prácticas'},{value:'autonomo',label:'Autónomo'}]},
]

const COLORES=['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6']

export default function AdminEmpleadosPage(){
  const [empleados,setEmpleados]=useState<Emp[]>([])
  const [loading,setLoading]=useState(true)
  const [query,setQuery]=useState('')
  const [filtros,setFiltros]=useState<Record<string,string>>({})
  const [page,setPage]=useState(1)
  const [total,setTotal]=useState(0)
  const [showOnboarding,setShowOnboarding]=useState(false)
  const [form,setForm]=useState({nombre:'',email:'',departamento:'',puesto:'',tipo_contrato:'indefinido',salario_base:'',password:''})
  const [saving,setSaving]=useState(false)
  const router=useRouter()
  const {toast}=useToast()

  const load=useCallback(async()=>{
    setLoading(true)
    let q=supabase.from('empleados').select('id,nombre,email,departamento,puesto,estado,avatar_url,avatar_color,fecha_alta,tipo_contrato',{count:'exact'})
    if(query) q=q.ilike('nombre',`%${query}%`)
    if(filtros.estado) q=q.eq('estado',filtros.estado)
    if(filtros.departamento) q=q.eq('departamento',filtros.departamento)
    if(filtros.tipo_contrato) q=q.eq('tipo_contrato',filtros.tipo_contrato)
    q=q.order('nombre').range((page-1)*PER_PAGE,page*PER_PAGE-1)
    const {data,count}=await q
    setEmpleados(data||[])
    setTotal(count||0)
    setLoading(false)
  },[query,filtros,page])

  useEffect(()=>{load()},[load])
  useEffect(()=>{setPage(1)},[query,filtros])

  const crearEmpleado=async()=>{
    if(!form.nombre||!form.email||!form.password){toast('err','Nombre, email y contraseña son obligatorios');return}
    setSaving(true)
    try{
      // Crear usuario en Auth
      const {data:authData,error:authErr}=await supabase.auth.admin ? 
        // Si hay admin API disponible
        {data:{user:{id:'temp'}},error:null} :
        {data:{user:null},error:{message:'Use Supabase dashboard to create auth user'}}
      
      // Insertar empleado (sin user_id por ahora, se vincula después)
      const color=COLORES[Math.floor(Math.random()*COLORES.length)]
      const {error}=await supabase.from('empleados').insert({
        nombre:form.nombre, email:form.email, departamento:form.departamento||null,
        puesto:form.puesto||null, tipo_contrato:form.tipo_contrato,
        salario_base:form.salario_base?parseFloat(form.salario_base):null,
        avatar_color:color, estado:'activo'
      })
      if(error) throw error
      toast('ok',`✅ Empleado ${form.nombre} creado. Crea su acceso en Supabase Auth con email: ${form.email}`)
      setShowOnboarding(false)
      setForm({nombre:'',email:'',departamento:'',puesto:'',tipo_contrato:'indefinido',salario_base:'',password:''})
      load()
    }catch(e:any){toast('err','Error: '+e.message)}
    setSaving(false)
  }

  const upd=(k:string,v:string)=>setForm(f=>({...f,[k]:v}))

  return(
    <div className="space-y-4 animate-fade-in">
      <Breadcrumb/>
      <div className="flex items-center justify-between">
        <h1 className="page-title">Empleados</h1>
        <button onClick={()=>setShowOnboarding(true)} className="btn-primary">
          <UserPlus className="w-4 h-4"/> Nuevo empleado
        </button>
      </div>
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar por nombre..." className="input pl-9"/>
          </div>
          <FilterBar filters={FILTERS} values={filtros} onChange={(k,v)=>setFiltros(f=>({...f,[k]:v}))} onReset={()=>setFiltros({})}/>
        </div>
        {loading?<SkeletonTable rows={8}/>:empleados.length===0?(
          <EmptyState icon="employees" title="Sin empleados" description={query||Object.values(filtros).some(Boolean)?"Ningún empleado coincide con los filtros":"Añade el primer empleado"} action={<button className="btn-primary text-sm" onClick={()=>setShowOnboarding(true)}><Plus className="w-4 h-4"/>Nuevo empleado</button>}/>
        ):(
          <>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Empleado</th>
                  <th className="table-header hidden md:table-cell">Departamento</th>
                  <th className="table-header hidden lg:table-cell">Puesto</th>
                  <th className="table-header hidden lg:table-cell">Contrato</th>
                  <th className="table-header">Estado</th>
                </tr>
              </thead>
              <tbody>
                {empleados.map(e=>{
                  const initials=e.nombre.split(' ').map(n=>n[0]).join('').substring(0,2)
                  const avatarUrl=e.avatar_url?supabase.storage.from('avatars').getPublicUrl(e.avatar_url).data.publicUrl:null
                  return(
                    <tr key={e.id} className="table-row cursor-pointer" onClick={()=>router.push(`/admin/empleados/${e.id}`)}>
                      <td className="table-cell">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                            style={{backgroundColor:avatarUrl?'transparent':e.avatar_color}}>
                            {avatarUrl?<img src={avatarUrl} alt="" className="w-full h-full object-cover"/>:initials}
                          </div>
                          <div><p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{e.nombre}</p><p className="text-xs text-slate-400">{e.email}</p></div>
                        </div>
                      </td>
                      <td className="table-cell hidden md:table-cell text-slate-500 dark:text-slate-400">{e.departamento||'—'}</td>
                      <td className="table-cell hidden lg:table-cell text-slate-500 dark:text-slate-400">{e.puesto||'—'}</td>
                      <td className="table-cell hidden lg:table-cell"><span className="badge badge-slate capitalize">{e.tipo_contrato||'—'}</span></td>
                      <td className="table-cell">
                        <span className={`badge ${e.estado==='activo'?'badge-green':e.estado==='vacaciones'?'badge-amber':'badge-red'}`}>
                          {e.estado==='activo'?'Activo':e.estado==='vacaciones'?'Vacaciones':'Baja'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <Pagination page={page} total={total} perPage={PER_PAGE} onChange={setPage}/>
          </>
        )}
      </div>

      {/* Modal onboarding nuevo empleado */}
      <Modal open={showOnboarding} onClose={()=>setShowOnboarding(false)} title="Nuevo empleado" size="lg"
        footer={<><button onClick={()=>setShowOnboarding(false)} className="btn-secondary">Cancelar</button><button onClick={crearEmpleado} disabled={saving} className="btn-primary">{saving?<div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/>:<><UserPlus className="w-4 h-4"/>Crear empleado</>}</button></>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><label className="label">Nombre completo *</label><input value={form.nombre} onChange={e=>upd('nombre',e.target.value)} className="input" placeholder="Ana García López"/></div>
          <div><label className="label">Email *</label><input type="email" value={form.email} onChange={e=>upd('email',e.target.value)} className="input" placeholder="ana@empresa.com"/></div>
          <div><label className="label">Departamento</label><input value={form.departamento} onChange={e=>upd('departamento',e.target.value)} className="input" placeholder="Tecnología"/></div>
          <div><label className="label">Puesto</label><input value={form.puesto} onChange={e=>upd('puesto',e.target.value)} className="input" placeholder="Desarrolladora Senior"/></div>
          <div><label className="label">Tipo de contrato</label>
            <select value={form.tipo_contrato} onChange={e=>upd('tipo_contrato',e.target.value)} className="input">
              <option value="indefinido">Indefinido</option><option value="temporal">Temporal</option><option value="practicas">Prácticas</option><option value="autonomo">Autónomo</option>
            </select>
          </div>
          <div><label className="label">Salario base (€/mes)</label><input type="number" value={form.salario_base} onChange={e=>upd('salario_base',e.target.value)} className="input" placeholder="2000"/></div>
        </div>
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-xs text-amber-700 dark:text-amber-300">
          ⚠️ Tras crear el empleado, ve a <strong>Supabase → Authentication → Users</strong> y crea un usuario con el mismo email para que pueda acceder al portal.
        </div>
      </Modal>
    </div>
  )
}