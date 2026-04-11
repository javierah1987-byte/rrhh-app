'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Breadcrumb } from '@/components/Breadcrumb'
import { Plus, X, Receipt, Loader2, CheckCircle, Clock, Camera } from 'lucide-react'

type Gasto={id:string;fecha:string;categoria:string;descripcion:string;importe:number;ticket_url:string|null;estado:'pendiente'|'aprobado'|'rechazado';comentario_admin:string|null;created_at:string}

const CATEGORIAS:Record<string,{label:string;emoji:string}>={transporte:{label:'Transporte',emoji:'🚗'},comida:{label:'Comida',emoji:'🍽️'},alojamiento:{label:'Alojamiento',emoji:'🏨'},material:{label:'Material',emoji:'📦'},telefono:{label:'Teléfono',emoji:'📱'},formacion:{label:'Formación',emoji:'📚'},otro:{label:'Otro',emoji:'📎'}}
const ESTADO_STYLE:Record<string,string>={pendiente:'badge-amber',aprobado:'badge-green',rechazado:'badge-red'}

export default function GastosPage(){
  const [gastos,setGastos]=useState<Gasto[]>([])
  const [loading,setLoading]=useState(true)
  const [empId,setEmpId]=useState('')
  const [modal,setModal]=useState(false)
  const [saving,setSaving]=useState(false)
  const [ticketFile,setTicketFile]=useState<File|null>(null)
  const [form,setForm]=useState({fecha:new Date().toISOString().slice(0,10),categoria:'transporte',descripcion:'',importe:''})

  const totalPendiente=gastos.filter(g=>g.estado==='pendiente').reduce((s,g)=>s+g.importe,0)
  const totalAprobado=gastos.filter(g=>g.estado==='aprobado').reduce((s,g)=>s+g.importe,0)

  const cargar=useCallback(async()=>{
    const{data:{user}}=await supabase.auth.getUser(); if(!user)return
    const{data:emp}=await supabase.from('empleados').select('id').eq('user_id',user.id).single(); if(!emp)return
    setEmpId(emp.id)
    const{data}=await supabase.from('gastos').select('*').eq('empleado_id',emp.id).order('fecha',{ascending:false})
    setGastos(data||[]); setLoading(false)
  },[])

  useEffect(()=>{cargar()},[cargar])

  async function crear(){
    if(!empId||!form.descripcion.trim()||!form.importe)return; setSaving(true)
    let ticket_url=null
    if(ticketFile){const ext=ticketFile.name.split('.').pop();const path=`${empId}/${Date.now()}.${ext}`;const{data:up}=await supabase.storage.from('tickets').upload(path,ticketFile);if(up)ticket_url=up.path}
    await supabase.from('gastos').insert({empleado_id:empId,fecha:form.fecha,categoria:form.categoria,descripcion:form.descripcion.trim(),importe:parseFloat(form.importe),ticket_url,estado:'pendiente'})
    const{data:admin}=await supabase.from('empleados').select('id').eq('rol','admin').limit(1).maybeSingle()
    if(admin)await supabase.from('notificaciones').insert({empleado_id:admin.id,titulo:'Nuevo gasto para revisar',mensaje:CATEGORIAS[form.categoria].emoji+' '+CATEGORIAS[form.categoria].label+' · '+parseFloat(form.importe).toFixed(2)+' €',tipo:'info',enlace:'/admin/gastos'})
    setSaving(false); setModal(false)
    setForm({fecha:new Date().toISOString().slice(0,10),categoria:'transporte',descripcion:'',importe:''}); setTicketFile(null)
    cargar()
  }

  return(
    <div className="p-4 pb-24 lg:pb-4">
      <Breadcrumb/>
      <div className="flex items-center justify-between pt-2 mb-5">
        <div><h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Gastos</h1><p className="text-xs text-slate-400 mt-0.5">Registra y haz seguimiento de tus gastos profesionales</p></div>
        <button onClick={()=>setModal(true)} className="btn-primary flex items-center gap-1.5 py-2"><Plus className="w-4 h-4"/>Añadir gasto</button>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="card p-4"><p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/>Pendiente</p><p className="text-2xl font-black text-amber-600 dark:text-amber-400">{totalPendiente.toFixed(2)} €</p></div>
        <div className="card p-4"><p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><CheckCircle className="w-3 h-3"/>Aprobado</p><p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalAprobado.toFixed(2)} €</p></div>
      </div>
      {loading?<div className="space-y-3">{[1,2].map(i=><div key={i} className="skeleton h-16 rounded-xl"/>)}</div>
      :gastos.length===0?<div className="card p-12 text-center"><Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3"/><p className="text-slate-500 font-medium">Sin gastos registrados</p></div>
      :<div className="space-y-2">{gastos.map(g=>{const cat=CATEGORIAS[g.categoria]||{label:g.categoria,emoji:'📎'};return(
        <div key={g.id} className={`card p-4 flex items-center gap-3 ${g.estado==='pendiente'?'ring-1 ring-amber-200 dark:ring-amber-800':''}`}>
          <span className="text-2xl flex-shrink-0">{cat.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{cat.label}</span>
              <span className={`badge text-xs capitalize ${ESTADO_STYLE[g.estado]}`}>{g.estado}</span>
              {g.ticket_url&&<span className="text-[10px] text-slate-400 flex items-center gap-0.5"><Camera className="w-3 h-3"/>ticket</span>}
            </div>
            <p className="text-xs text-slate-500 truncate">{g.descripcion}</p>
            {g.comentario_admin&&<p className={`text-xs mt-1 ${g.estado==='aprobado'?'text-emerald-600':'text-red-500'}`}>{g.comentario_admin}</p>}
          </div>
          <p className="font-black text-slate-900 dark:text-slate-100 flex-shrink-0">{g.importe.toFixed(2)} €</p>
        </div>
      )})}</div>}
      {modal&&(
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-t-2xl w-full max-w-[460px] p-5 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Nuevo gasto</h3>
              <button onClick={()=>setModal(false)}><X className="w-4 h-4 text-slate-400"/></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Fecha</label><input type="date" value={form.fecha} max={new Date().toISOString().slice(0,10)} onChange={e=>setForm(f=>({...f,fecha:e.target.value}))} className="input"/></div>
                <div><label className="label">Importe (€)</label><input type="number" min="0.01" step="0.01" placeholder="0.00" value={form.importe} onChange={e=>setForm(f=>({...f,importe:e.target.value}))} className="input"/></div>
              </div>
              <div>
                <label className="label">Categoría</label>
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {Object.entries(CATEGORIAS).map(([k,v])=>(
                    <button key={k} onClick={()=>setForm(f=>({...f,categoria:k}))} className={`flex flex-col items-center p-2 rounded-xl border-2 text-xs transition-colors ${form.categoria===k?'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20':'border-slate-200 dark:border-slate-700'}`}>
                      <span className="text-xl mb-0.5">{v.emoji}</span>
                      <span className={`leading-tight text-center ${form.categoria===k?'text-indigo-700 dark:text-indigo-300 font-semibold':'text-slate-500'}`}>{v.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div><label className="label">Descripción</label><input type="text" value={form.descripcion} onChange={e=>setForm(f=>({...f,descripcion:e.target.value}))} placeholder="Ej: Taxi al aeropuerto, almuerzo cliente..." className="input"/></div>
              <div>
                <label className="label">Ticket <span className="text-slate-400 font-normal">(opcional)</span></label>
                <label className="flex items-center gap-2 cursor-pointer mt-1 px-4 py-2 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl hover:border-indigo-300 transition-colors">
                  <Camera className="w-4 h-4 text-slate-400"/>
                  <span className="text-sm text-slate-500">{ticketFile?ticketFile.name:'Seleccionar imagen o PDF'}</span>
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={e=>setTicketFile(e.target.files?.[0]||null)}/>
                </label>
              </div>
              <button onClick={crear} disabled={saving||!form.descripcion.trim()||!form.importe} className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50">
                {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<Receipt className="w-4 h-4"/>}{saving?'Guardando…':'Registrar gasto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}