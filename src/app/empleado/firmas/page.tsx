'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { PenLine, CheckCircle, X, Loader2, FileText, Clock, RotateCcw } from 'lucide-react'

type SF={id:string;estado:string;created_at:string;fecha_limite:string;mensaje:string|null;firmado_at:string|null;firma_tipo:string|null;documentos:{id:string;nombre:string}|null;solicitante:{nombre:string}|null}

export default function FirmasPage(){
  const [sols,setSols]=useState<SF[]>([])
  const [loading,setLoading]=useState(true)
  const [modal,setModal]=useState<SF|null>(null)
  const [firmando,setFirmando]=useState(false)
  const [modo,setModo]=useState<'canvas'|'texto'>('canvas')
  const [nombre,setNombre]=useState('')
  const [texto,setTexto]=useState('')
  const [dibujando,setDibujando]=useState(false)
  const [trazado,setTrazado]=useState(false)
  const canvasRef=useRef<HTMLCanvasElement>(null)
  const lastPt=useRef<{x:number;y:number}|null>(null)

  const cargar=useCallback(async()=>{
    const{data:{user}}=await supabase.auth.getUser();if(!user)return
    const{data:emp}=await supabase.from('empleados').select('id,nombre').eq('user_id',user.id).single();if(!emp)return
    setNombre((emp as any).nombre)
    const{data}=await supabase.from('solicitudes_firma')
      .select('*,documentos(id,nombre),solicitante:solicitante_id(nombre)')
      .eq('empleado_id',emp.id).order('created_at',{ascending:false})
    setSols((data||[]) as SF[]);setLoading(false)
  },[])
  useEffect(()=>{cargar()},[cargar])

  function initCanvas(){
    const c=canvasRef.current;if(!c)return
    const ctx=c.getContext('2d')!
    ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height)
    ctx.strokeStyle='#1e293b';ctx.lineWidth=2.5;ctx.lineCap='round';ctx.lineJoin='round'
  }
  function getPos(e:any,c:HTMLCanvasElement){
    const r=c.getBoundingClientRect(),sx=c.width/r.width,sy=c.height/r.height
    if(e.touches)return{x:(e.touches[0].clientX-r.left)*sx,y:(e.touches[0].clientY-r.top)*sy}
    return{x:(e.clientX-r.left)*sx,y:(e.clientY-r.top)*sy}
  }
  function startDraw(e:any){e.preventDefault();const c=canvasRef.current;if(!c)return;setDibujando(true);setTrazado(true);lastPt.current=getPos(e,c)}
  function draw(e:any){e.preventDefault();if(!dibujando||!canvasRef.current||!lastPt.current)return;const c=canvasRef.current,ctx=c.getContext('2d')!,pt=getPos(e,c);ctx.beginPath();ctx.moveTo(lastPt.current.x,lastPt.current.y);ctx.lineTo(pt.x,pt.y);ctx.stroke();lastPt.current=pt}
  function stopDraw(){setDibujando(false);lastPt.current=null}
  function limpiar(){initCanvas();setTrazado(false)}
  function abrirModal(s:SF){setModal(s);setModo('canvas');setTexto('');setTrazado(false);setTimeout(initCanvas,100)}

  async function firmar(){
    if(!modal)return
    if(modo==='canvas'&&!trazado)return
    if(modo==='texto'&&!texto.trim())return
    setFirmando(true)
    let img=''
    if(modo==='canvas'){img=canvasRef.current?.toDataURL('image/png')||''}
    else{
      const cv=document.createElement('canvas');cv.width=600;cv.height=150
      const ctx=cv.getContext('2d')!
      ctx.fillStyle='#fff';ctx.fillRect(0,0,600,150)
      ctx.fillStyle='#1e293b';ctx.font='italic 52px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='middle'
      ctx.fillText(texto,300,75);img=cv.toDataURL('image/png')
    }
    await supabase.from('solicitudes_firma').update({
      estado:'firmado',firma_imagen:img,firma_tipo:modo,
      firma_nombre:modo==='texto'?texto:nombre,firmado_at:new Date().toISOString()
    }).eq('id',modal.id)
    await cargar();setModal(null);setFirmando(false)
  }

  const pendientes=sols.filter(s=>s.estado==='pendiente').length

  return(
    <div className="max-w-2xl mx-auto">
      <div className="page-header mb-5">
        <div><h1 className="page-title flex items-center gap-2"><PenLine className="w-5 h-5 text-indigo-500"/>Firma electrónica</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{pendientes>0?`${pendientes} pendiente(s) de firma`:'Todos los documentos firmados'}</p></div>
      </div>

      {loading?<div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>
      :sols.length===0?<div className="card p-12 text-center"><PenLine className="w-10 h-10 text-slate-300 mx-auto mb-3"/><p className="text-slate-500">No tienes documentos pendientes de firma</p></div>
      :<div className="space-y-3">
        {sols.map(s=>{
          const doc=(s as any).documentos,sol=(s as any).solicitante
          const exp=new Date(s.fecha_limite)<new Date()&&s.estado==='pendiente'
          return(
            <div key={s.id} className="card p-4 flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.estado==='firmado'?'bg-emerald-50':'bg-indigo-50'}`}>
                {s.estado==='firmado'?<CheckCircle className="w-5 h-5 text-emerald-600"/>:<FileText className="w-5 h-5 text-indigo-600"/>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{doc?.nombre||'Documento'}</p>
                <p className="text-xs text-slate-400 mt-0.5">Solicitado por {sol?.nombre||'Admin'} · {new Date(s.created_at).toLocaleDateString('es-ES',{day:'numeric',month:'short'})}</p>
                {s.mensaje&&<p className="text-xs text-slate-500 mt-1 italic">"{s.mensaje}"</p>}
                {s.estado==='firmado'&&<p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3"/>Firmado el {new Date(s.firmado_at!).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'})}</p>}
                {exp&&<p className="text-xs text-red-500 mt-1 flex items-center gap-1"><Clock className="w-3 h-3"/>Plazo vencido</p>}
              </div>
              {s.estado==='pendiente'&&!exp&&<button onClick={()=>abrirModal(s)} className="btn-primary text-sm px-4 py-2 flex-shrink-0 flex items-center gap-1.5"><PenLine className="w-3.5 h-3.5"/>Firmar</button>}
              {s.estado==='firmado'&&<span className="badge badge-green text-xs flex-shrink-0">Firmado</span>}
            </div>
          )
        })}
      </div>}

      {modal&&(
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
              <div><h3 className="font-bold text-slate-900 dark:text-slate-100">Firmar documento</h3><p className="text-xs text-slate-400 mt-0.5">{(modal as any).documentos?.nombre}</p></div>
              <button onClick={()=>setModal(null)}><X className="w-4 h-4 text-slate-400"/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-2">
                {(['canvas','texto'] as const).map(m=>(
                  <button key={m} onClick={()=>setModo(m)} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${modo===m?'bg-indigo-600 text-white':'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                    {m==='canvas'?'✍️ Dibujar':'Aa Escribir'}
                  </button>
                ))}
              </div>
              {modo==='canvas'?(
                <div>
                  <div className="flex items-center justify-between mb-2"><p className="text-xs text-slate-500">Dibuja tu firma</p><button onClick={limpiar} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"><RotateCcw className="w-3 h-3"/>Borrar</button></div>
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden touch-none">
                    <canvas ref={canvasRef} width={560} height={160} className="w-full h-[120px] bg-white cursor-crosshair"
                      onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                      onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}/>
                  </div>
                  {!trazado&&<p className="text-xs text-slate-400 text-center mt-1">↑ Dibuja aquí tu firma</p>}
                </div>
              ):(
                <div>
                  <label className="label mb-1 block">Escribe tu nombre completo</label>
                  <input value={texto} onChange={e=>setTexto(e.target.value)} placeholder={nombre} className="input w-full text-lg" style={{fontFamily:'Georgia,serif',fontStyle:'italic'}}/>
                  {texto&&<div className="mt-2 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl"><p className="text-slate-400 text-xs mb-1">Vista previa:</p><p className="text-2xl text-slate-800 dark:text-slate-200" style={{fontFamily:'Georgia,serif',fontStyle:'italic'}}>{texto}</p></div>}
                </div>
              )}
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl"><p className="text-xs text-indigo-700 dark:text-indigo-300">Al firmar confirmas que has leído el documento. Válido según Reglamento eIDAS (UE) 910/2014.</p></div>
              <div className="flex gap-3">
                <button onClick={()=>setModal(null)} className="btn-secondary flex-1">Cancelar</button>
                <button onClick={firmar} disabled={firmando||(modo==='canvas'&&!trazado)||(modo==='texto'&&!texto.trim())} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                  {firmando?<><Loader2 className="w-4 h-4 animate-spin"/>Firmando…</>:<><CheckCircle className="w-4 h-4"/>Confirmar firma</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}