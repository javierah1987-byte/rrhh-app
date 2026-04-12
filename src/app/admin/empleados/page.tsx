'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, X, Loader2, Users, CheckCircle, Copy, Eye, EyeOff, RefreshCw, AlertCircle, Download } from 'lucide-react'

type Emp={id:string;nombre:string;email:string;rol:string;departamento:string|null;puesto:string|null;estado:string;avatar_color:string;fecha_alta:string;telefono:string|null;centros_trabajo?:{nombre:string;color:string};manager?:{nombre:string}}
type Centro={id:string;nombre:string;ciudad:string|null;color:string}

const ROL:{[k:string]:{label:string;desc:string;color:string;badge:string}}={
  owner:{label:'Owner',desc:'Acceso total + configuración empresa',color:'#6366f1',badge:'bg-indigo-100 text-indigo-700'},
  admin:{label:'Admin',desc:'Gestión completa de RRHH',color:'#8b5cf6',badge:'bg-purple-100 text-purple-700'},
  manager:{label:'Manager',desc:'Aprueba solicitudes de su equipo',color:'#10b981',badge:'bg-emerald-100 text-emerald-700'},
  empleado:{label:'Empleado',desc:'Solo sus propios datos',color:'#f59e0b',badge:'bg-amber-100 text-amber-700'},
}
const COLORES=['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#0891b2','#ec4899','#f97316','#14b8a6','#84cc16']
const genPass=()=>{const c='ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';return Array.from({length:12},()=>c[Math.floor(Math.random()*c.length)]).join('')}

export default function EmpleadosPage(){
  const [empleados,setEmpleados]=useState<Emp[]>([])
  const [centros,setCentros]=useState<Centro[]>([])
  const [managers,setManagers]=useState<Emp[]>([])
  const [loading,setLoading]=useState(true)
  const [modal,setModal]=useState(false)
  const [editando,setEditando]=useState<Emp|null>(null)
  const [saving,setSaving]=useState(false)
  const [resultado,setResultado]=useState<any>(null)
  const [showPass,setShowPass]=useState(false)
  const [filtro,setFiltro]=useState('')
  const [filtroRol,setFiltroRol]=useState('todos')
  const [form,setForm]=useState({nombre:'',email:'',telefono:'',rol:'empleado',departamento:'',puesto:'',jornada_horas:40,tipo_contrato:'Indefinido',fecha_alta:new Date().toISOString().split('T')[0],avatar_color:'#6366f1',centro_trabajo_id:'',manager_id:'',password_temporal:genPass(),estado:'activo'})

  const cargar=useCallback(async()=>{
    const[{data:emps},{data:cts}]=await Promise.all([
      supabase.from('empleados').select('*,centros_trabajo(nombre,color),manager:manager_id(nombre)').order('nombre'),
      supabase.from('centros_trabajo').select('id,nombre,ciudad,color').eq('activo',true).order('nombre'),
    ])
    setEmpleados((emps||[]) as Emp[])
    setCentros(cts||[])
    setManagers((emps||[]).filter((e:any)=>['owner','admin','manager'].includes(e.rol)) as Emp[])
    setLoading(false)
  },[])
  useEffect(()=>{cargar()},[cargar])

  function abrirNuevo(){
    setEditando(null);setResultado(null)
    setForm({nombre:'',email:'',telefono:'',rol:'empleado',departamento:'',puesto:'',jornada_horas:40,tipo_contrato:'Indefinido',fecha_alta:new Date().toISOString().split('T')[0],avatar_color:'#6366f1',centro_trabajo_id:centros[0]?.id||'',manager_id:'',password_temporal:genPass(),estado:'activo'})
    setModal(true)
  }

  function abrirEditar(emp:Emp){
    setEditando(emp);setResultado(null)
    setForm({nombre:emp.nombre,email:emp.email,telefono:emp.telefono||'',rol:emp.rol,departamento:emp.departamento||'',puesto:emp.puesto||'',jornada_horas:40,tipo_contrato:'Indefinido',fecha_alta:emp.fecha_alta,avatar_color:emp.avatar_color,centro_trabajo_id:'',manager_id:'',password_temporal:'',estado:emp.estado})
    setModal(true)
  }

  async function guardar(){
    if(!form.nombre.trim()||!form.email.trim())return
    setSaving(true);setResultado(null)
    if(editando){
      await supabase.from('empleados').update({nombre:form.nombre.trim(),email:form.email.toLowerCase().trim(),telefono:form.telefono||null,rol:form.rol,departamento:form.departamento||null,puesto:form.puesto||null,avatar_color:form.avatar_color,estado:form.estado,centro_trabajo_id:form.centro_trabajo_id||null,manager_id:form.manager_id||null}).eq('id',editando.id)
      setSaving(false);setModal(false);cargar();return
    }
    try{
      const{data:{session}}=await supabase.auth.getSession()
      const resp=await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL+'/functions/v1/crear-empleado',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+session?.access_token},
        body:JSON.stringify({nombre:form.nombre.trim(),email:form.email.toLowerCase().trim(),password_temporal:form.password_temporal,rol:form.rol,departamento:form.departamento||null,puesto:form.puesto||null,jornada_horas:form.jornada_horas,tipo_contrato:form.tipo_contrato,fecha_alta:form.fecha_alta,telefono:form.telefono||null,avatar_color:form.avatar_color,centro_trabajo_id:form.centro_trabajo_id||null,manager_id:form.manager_id||null,enviar_email:true})
      })
      const data=await resp.json()
      if(!resp.ok||data.error)setResultado({ok:false,error:data.error||'Error al crear el empleado'})
      else{setResultado({ok:true,empleado:data.empleado,reset_link:data.reset_link});cargar()}
    }catch(e:any){setResultado({ok:false,error:e.message})}
    setSaving(false)
  }

  const filtrados=empleados.filter(e=>(!filtro||e.nombre.toLowerCase().includes(filtro.toLowerCase())||e.email.toLowerCase().includes(filtro.toLowerCase()))&&(filtroRol==='todos'||e.rol===filtroRol))

  return(
    <div>
      <div className="page-header mb-5">
        <div><h1 className="page-title flex items-center gap-2"><Users className="w-5 h-5 text-indigo-500"/>Empleados</h1><p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{empleados.length} personas · {empleados.filter(e=>e.estado==='activo').length} activas</p></div>
        <button onClick={abrirNuevo} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4"/>Nuevo empleado</button>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <input type="text" placeholder="Buscar por nombre o email..." value={filtro} onChange={e=>setFiltro(e.target.value)} className="input flex-1 min-w-[200px]"/>
        <select value={filtroRol} onChange={e=>setFiltroRol(e.target.value)} className="input w-auto">
          <option value="todos">Todos los roles</option>
          {Object.entries(ROL).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {loading?<div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>
      :<div className="card overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {filtrados.map(emp=>{
            const rol=ROL[emp.rol]||ROL.empleado
            const ct=(emp as any).centros_trabajo
            const mgr=(emp as any).manager
            return(
              <div key={emp.id} onClick={()=>abrirEditar(emp)} className="flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{backgroundColor:emp.avatar_color}}>{emp.nombre.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{emp.nombre}</p>
                    <span className={"badge text-[10px] px-2 py-0.5 rounded-full font-semibold "+rol.badge}>{rol.label}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{emp.email}{emp.puesto?' · '+emp.puesto:''}{ct?' · '+ct.nombre:''}{mgr?' · 👤 '+mgr.nombre:''}</p>
                </div>
                <span className={"badge text-xs capitalize flex-shrink-0 "+(emp.estado==='activo'?'badge-green':emp.estado==='baja'?'badge-red':'badge-amber')}>{emp.estado}</span>
              </div>
            )
          })}
          {filtrados.length===0&&<div className="p-12 text-center"><Users className="w-10 h-10 text-slate-300 mx-auto mb-3"/><p className="text-slate-500">Sin resultados</p></div>}
        </div>
      </div>}

      {modal&&(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={e=>e.target===e.currentTarget&&!resultado?.ok&&setModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-slate-800 flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 z-10">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">{editando?'Editar empleado':'Nuevo empleado'}</h3>
              <button onClick={()=>setModal(false)}><X className="w-4 h-4 text-slate-400"/></button>
            </div>

            {resultado?.ok?(
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3"><CheckCircle className="w-7 h-7 text-emerald-600"/></div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-lg">¡Empleado creado!</h4>
                  <p className="text-sm text-slate-500 mt-1">{resultado.empleado?.nombre} · <span className="capitalize">{ROL[resultado.empleado?.rol]?.label||resultado.empleado?.rol}</span></p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-4 space-y-3 mb-4">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Credenciales de acceso</p>
                  {[{l:'Email',v:resultado.empleado?.email},{l:'Contraseña temporal',v:form.password_temporal}].map(({l,v})=>(
                    <div key={l} className="flex items-center justify-between gap-2">
                      <div><p className="text-[10px] text-slate-400">{l}</p><p className="text-sm font-mono text-slate-800 dark:text-slate-200">{v}</p></div>
                      <button onClick={()=>navigator.clipboard.writeText(v||'')} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"><Copy className="w-3.5 h-3.5 text-slate-400"/></button>
                    </div>
                  ))}
                </div>
                {resultado.reset_link&&(
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 mb-4">
                    <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1">🔗 Link de acceso directo (expira en 24h)</p>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 flex-1 truncate">{resultado.reset_link}</p>
                      <button onClick={()=>navigator.clipboard.writeText(resultado.reset_link)} className="p-1.5 rounded-lg bg-indigo-100 hover:bg-indigo-200 flex-shrink-0"><Copy className="w-3.5 h-3.5 text-indigo-600"/></button>
                    </div>
                    <p className="text-[10px] text-indigo-500 mt-1">Comparte este link con el empleado para acceso directo</p>
                  </div>
                )}
                <button onClick={()=>{setModal(false);setResultado(null)}} className="btn-primary w-full py-3">Cerrar</button>
              </div>
            ):(
              <div className="p-5 space-y-4">
                {resultado?.error&&<div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200"><AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5"/><p className="text-sm text-red-700 dark:text-red-300">{resultado.error}</p></div>}

                <div>
                  <label className="label mb-2 block">Rol de acceso *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(ROL).map(([key,cfg])=>(
                      <button key={key} type="button" onClick={()=>setForm(f=>({...f,rol:key}))}
                        className={"p-3 rounded-xl border-2 text-left transition-all "+(form.rol===key?'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20':'border-slate-200 dark:border-slate-600 hover:border-slate-300')}>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2.5 h-2.5 rounded-full" style={{background:cfg.color}}/>
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{cfg.label}</span>
                          {form.rol===key&&<CheckCircle className="w-3.5 h-3.5 text-indigo-500 ml-auto"/>}
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed">{cfg.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><label className="label">Nombre completo *</label><input value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} placeholder="Ana García López" className="input mt-1"/></div>
                  <div><label className="label">Email *</label><input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="ana@empresa.com" className="input mt-1" disabled={!!editando}/>{editando&&<p className="text-[10px] text-slate-400 mt-1">No se puede cambiar</p>}</div>
                  <div><label className="label">Teléfono</label><input value={form.telefono} onChange={e=>setForm(f=>({...f,telefono:e.target.value}))} placeholder="+34 600 000 000" className="input mt-1"/></div>
                  <div><label className="label">Departamento</label><input value={form.departamento} onChange={e=>setForm(f=>({...f,departamento:e.target.value}))} placeholder="Ventas" className="input mt-1"/></div>
                  <div><label className="label">Puesto</label><input value={form.puesto} onChange={e=>setForm(f=>({...f,puesto:e.target.value}))} placeholder="Comercial Senior" className="input mt-1"/></div>
                  <div><label className="label">Tipo contrato</label><select value={form.tipo_contrato} onChange={e=>setForm(f=>({...f,tipo_contrato:e.target.value}))} className="input mt-1">{['Indefinido','Temporal','Prácticas','Autónomo','Interino','Obra y servicio'].map(t=><option key={t}>{t}</option>)}</select></div>
                  <div><label className="label">Jornada (h/sem)</label><input type="number" value={form.jornada_horas} onChange={e=>setForm(f=>({...f,jornada_horas:+e.target.value}))} min="1" max="60" className="input mt-1"/></div>
                  <div><label className="label">Fecha de alta</label><input type="date" value={form.fecha_alta} onChange={e=>setForm(f=>({...f,fecha_alta:e.target.value}))} className="input mt-1"/></div>
                  {editando&&<div><label className="label">Estado</label><select value={form.estado} onChange={e=>setForm(f=>({...f,estado:e.target.value}))} className="input mt-1">{['activo','baja','vacaciones','inactivo'].map(s=><option key={s}>{s}</option>)}</select></div>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {centros.length>0&&<div><label className="label">Centro de trabajo</label><select value={form.centro_trabajo_id} onChange={e=>setForm(f=>({...f,centro_trabajo_id:e.target.value}))} className="input mt-1"><option value="">Sin asignar</option>{centros.map(c=><option key={c.id} value={c.id}>{c.nombre}{c.ciudad?' ('+c.ciudad+')':''}</option>)}</select></div>}
                  {['manager','empleado'].includes(form.rol)&&managers.length>0&&<div><label className="label">Manager directo</label><select value={form.manager_id} onChange={e=>setForm(f=>({...f,manager_id:e.target.value}))} className="input mt-1"><option value="">Sin asignar</option>{managers.filter(m=>!editando||m.id!==editando.id).map(m=><option key={m.id} value={m.id}>{m.nombre} ({ROL[m.rol]?.label})</option>)}</select></div>}
                </div>

                <div><label className="label">Color de avatar</label><div className="flex gap-2 mt-1 flex-wrap">{COLORES.map(col=><button key={col} type="button" onClick={()=>setForm(f=>({...f,avatar_color:col}))} className={"w-8 h-8 rounded-full border-2 transition-transform "+(form.avatar_color===col?'border-slate-900 dark:border-white scale-110':'border-transparent')} style={{background:col}}/>)}</div></div>

                {!editando&&(
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-700">
                    <label className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider block mb-2">🔑 Contraseña temporal</label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input type={showPass?'text':'password'} value={form.password_temporal} onChange={e=>setForm(f=>({...f,password_temporal:e.target.value}))} className="input w-full font-mono pr-9"/>
                        <button type="button" onClick={()=>setShowPass(p=>!p)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">{showPass?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button>
                      </div>
                      <button type="button" onClick={()=>setForm(f=>({...f,password_temporal:genPass()}))} className="p-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-700 flex-shrink-0"><RefreshCw className="w-4 h-4"/></button>
                      <button type="button" onClick={()=>navigator.clipboard.writeText(form.password_temporal)} className="p-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-700 flex-shrink-0"><Copy className="w-4 h-4"/></button>
                    </div>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-2">El empleado recibirá un link de acceso por email. También puedes compartir esta contraseña directamente.</p>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={()=>setModal(false)} className="btn-secondary flex-1">Cancelar</button>
                  <button type="button" onClick={guardar} disabled={saving||!form.nombre.trim()||!form.email.trim()} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                    {saving?<><Loader2 className="w-4 h-4 animate-spin"/>Creando cuenta…</>:editando?<><CheckCircle className="w-4 h-4"/>Guardar cambios</>:<><Plus className="w-4 h-4"/>Crear empleado y cuenta</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}