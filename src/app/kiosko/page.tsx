'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Clock, Loader2, CheckCircle, LogIn, LogOut, Coffee } from 'lucide-react'

type Emp={id:string;nombre:string;avatar_color:string;departamento?:string}
type Estado='sin_fichar'|'fichado'|'pausa'

export default function KioskoPage(){
  const [hora,setHora]=useState(new Date())
  const [emps,setEmps]=useState<Emp[]>([])
  const [filtro,setFiltro]=useState('')
  const [loading,setLoading]=useState(true)
  const [fichando,setFichando]=useState<string|null>(null)
  const [estados,setEstados]=useState<Record<string,Estado>>({})
  const [ok,setOk]=useState<{nombre:string;accion:string}|null>(null)

  useEffect(()=>{const t=setInterval(()=>setHora(new Date()),1000);return()=>clearInterval(t)},[])

  useEffect(()=>{
    async function cargar(){
      const{data:e}=await supabase.from('empleados').select('id,nombre,avatar_color,departamento').eq('estado','activo').order('nombre')
      setEmps(e||[])
      
      const hoy=new Date().toISOString().split('T')[0]
      const{data:fs}=await supabase.from('fichajes').select('empleado_id,tipo,timestamp').eq('fecha',hoy).order('timestamp',{ascending:false})
      const est:Record<string,Estado>={}
      const seen=new Set<string>()
      fs?.forEach(f=>{
        if(!seen.has(f.empleado_id)){
          seen.add(f.empleado_id)
          est[f.empleado_id]=f.tipo==='entrada'?'fichado':f.tipo==='pausa_inicio'?'pausa':'sin_fichar'
        }
      })
      setEstados(est)
      setLoading(false)
    }
    cargar()
    const t=setInterval(cargar,30000)
    return()=>clearInterval(t)
  },[])

  async function fichar(emp:Emp){
    setFichando(emp.id)
    const est=estados[emp.id]||'sin_fichar'
    let tipo='entrada'
    if(est==='fichado')tipo='salida'
    else if(est==='pausa')tipo='pausa_fin'

    const hoy=new Date().toISOString().split('T')[0]
    await supabase.from('fichajes').insert({empleado_id:emp.id,tipo,fecha:hoy,timestamp:new Date().toISOString()})

    const newEst:Estado=tipo==='entrada'?'fichado':tipo==='salida'||tipo==='pausa_fin'?'sin_fichar':'pausa'
    setEstados(prev=>({...prev,[emp.id]:newEst}))
    
    const accion=tipo==='entrada'?'¡Buen día!':tipo==='salida'?'¡Hasta mañana!':'¡Buen descanso!'
    setOk({nombre:emp.nombre,accion})
    setFichando(null)
    setFiltro('')
    setTimeout(()=>setOk(null),3000)
  }

  const filtrados=emps.filter(e=>e.nombre.toLowerCase().includes(filtro.toLowerCase()))
  const presentes=Object.values(estados).filter(e=>e==='fichado').length

  return(
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <span className="text-white font-black text-lg">N</span>
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">Nexo HR</p>
            <p className="text-indigo-300 text-xs">Control de presencia</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white text-3xl font-black font-mono">{hora.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</p>
          <p className="text-indigo-300 text-sm capitalize">{hora.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})}</p>
        </div>
      </div>

      {/* OK Feedback */}
      {ok&&(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-10 text-center shadow-2xl max-w-sm">
            <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-4"/>
            <p className="text-2xl font-black text-slate-900 mb-1">{ok.nombre}</p>
            <p className="text-indigo-600 text-xl font-semibold">{ok.accion}</p>
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div className="flex items-center justify-center gap-8 px-8 py-3 bg-white/5">
        <div className="text-center">
          <p className="text-white font-black text-2xl">{presentes}</p>
          <p className="text-indigo-300 text-xs">En oficina</p>
        </div>
        <div className="w-px h-8 bg-white/20"/>
        <div className="text-center">
          <p className="text-white font-black text-2xl">{emps.length-presentes}</p>
          <p className="text-indigo-300 text-xs">Ausentes</p>
        </div>
        <div className="w-px h-8 bg-white/20"/>
        <div className="text-center">
          <p className="text-white font-black text-2xl">{emps.length>0?Math.round(presentes/emps.length*100):0}%</p>
          <p className="text-indigo-300 text-xs">Asistencia</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-8 py-4">
        <input
          type="text"
          placeholder="Buscar empleado..."
          value={filtro}
          onChange={e=>setFiltro(e.target.value)}
          className="w-full bg-white/10 text-white placeholder-indigo-300 border border-white/20 rounded-2xl px-5 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-white/30"
        />
      </div>

      {/* Grid empleados */}
      <div className="flex-1 overflow-auto px-8 pb-8">
        {loading?<div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin"/></div>:(
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filtrados.map(emp=>{
              const est=estados[emp.id]||'sin_fichar'
              const isPresente=est==='fichado'
              const isPausa=est==='pausa'
              const isFichando=fichando===emp.id
              return(
                <button
                  key={emp.id}
                  onClick={()=>fichar(emp)}
                  disabled={!!fichando}
                  className={`relative rounded-2xl p-4 text-center transition-all duration-200 disabled:opacity-50
                    ${isPresente?'bg-emerald-500/20 border-2 border-emerald-400/50 hover:bg-emerald-500/30':
                      isPausa?'bg-amber-500/20 border-2 border-amber-400/50 hover:bg-amber-500/30':
                      'bg-white/10 border-2 border-white/10 hover:bg-white/20'}`}
                >
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-xl mx-auto mb-2 shadow-lg"
                    style={{backgroundColor:emp.avatar_color||'#6366f1'}}>
                    {isFichando?<Loader2 className="w-7 h-7 animate-spin"/>:emp.nombre.charAt(0)}
                  </div>
                  {/* Nombre */}
                  <p className="text-white text-xs font-semibold leading-tight truncate">{emp.nombre.split(' ')[0]}</p>
                  <p className="text-white/60 text-xs truncate">{emp.nombre.split(' ').slice(1).join(' ')}</p>
                  {/* Estado */}
                  <div className={`mt-2 flex items-center justify-center gap-1 text-xs font-medium
                    ${isPresente?'text-emerald-300':isPausa?'text-amber-300':'text-white/40'}`}>
                    {isPresente?<><LogOut className="w-3 h-3"/>Salir</>:isPausa?<><Coffee className="w-3 h-3"/>Pausa</>:<><LogIn className="w-3 h-3"/>Entrar</>}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
