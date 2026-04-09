'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Send, MessageSquare, Circle } from 'lucide-react'

type Emp = { id:string; nombre:string; avatar_color:string; puesto:string }
type Msg = { id:string; remitente_id:string; destinatario_id:string; contenido:string; leido:boolean; created_at:string }

export default function AdminMensajesPage() {
  const [empleados, setEmpleados] = useState<Emp[]>([])
  const [adminId, setAdminId] = useState<string|null>(null)
  const [seleccionado, setSeleccionado] = useState<Emp|null>(null)
  const [mensajes, setMensajes] = useState<Msg[]>([])
  const [texto, setTexto] = useState('')
  const [sending, setSending] = useState(false)
  const [noLeidos, setNoLeidos] = useState<Record<string,number>>({})
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase.from('empleados').select('id').eq('user_id', data.user.id).single()
        .then(({ data: emp }) => { if (emp) setAdminId(emp.id) })
    })
    supabase.from('empleados').select('id,nombre,avatar_color,puesto').neq('rol','admin').order('nombre')
      .then(({ data }) => setEmpleados(data||[]))
    // Escuchar nuevos mensajes en tiempo real
    const ch = supabase.channel('mensajes-admin')
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'mensajes'},() => {
        if (seleccionado) cargarMensajes(seleccionado.id)
        cargarNoLeidos()
      }).subscribe()
    cargarNoLeidos()
    return () => { supabase.removeChannel(ch) }
  }, [])

  useEffect(() => {
    if (seleccionado) { cargarMensajes(seleccionado.id); marcarLeidos(seleccionado.id) }
  }, [seleccionado])

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:'smooth'}) }, [mensajes])

  async function cargarNoLeidos() {
    const { data } = await supabase.from('mensajes').select('remitente_id').eq('leido',false)
    const counts: Record<string,number> = {}
    data?.forEach((m:any) => { counts[m.remitente_id] = (counts[m.remitente_id]||0)+1 })
    setNoLeidos(counts)
  }

  async function cargarMensajes(empId: string) {
    const { data } = await supabase.from('mensajes').select('*')
      .or(`remitente_id.eq.${empId},destinatario_id.eq.${empId}`)
      .order('created_at')
    setMensajes(data||[])
  }

  async function marcarLeidos(empId: string) {
    await supabase.from('mensajes').update({leido:true}).eq('remitente_id',empId)
    setNoLeidos(prev => ({...prev,[empId]:0}))
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim() || !seleccionado || !adminId) return
    setSending(true)
    await supabase.from('mensajes').insert({ remitente_id:adminId, destinatario_id:seleccionado.id, contenido:texto })
    setTexto('')
    await cargarMensajes(seleccionado.id)
    setSending(false)
  }

  function getInitials(nombre:string) { return nombre.split(' ').map(n=>n[0]).join('').substring(0,2) }
  function formatHora(ts:string) { return new Date(ts).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}) }
  function formatFecha(ts:string) { return new Date(ts).toLocaleDateString('es-ES',{day:'numeric',month:'short'}) }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mensajes internos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Comunícate directamente con el equipo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-[calc(100vh-180px)]">
        {/* Lista empleados */}
        <div className="card overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Conversaciones</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {empleados.map(emp => (
              <button key={emp.id} onClick={()=>setSeleccionado(emp)}
                className={`w-full flex items-center gap-3 px-4 py-3 border-b border-slate-50 dark:border-slate-700/50 transition-colors ${seleccionado?.id===emp.id?'bg-indigo-50 dark:bg-indigo-900/30':'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{backgroundColor:emp.avatar_color||'#6366f1'}}>
                  {getInitials(emp.nombre)}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{emp.nombre}</p>
                  <p className="text-xs text-slate-400 capitalize">{emp.puesto}</p>
                </div>
                {(noLeidos[emp.id]||0) > 0 && (
                  <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{noLeidos[emp.id]}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="lg:col-span-2 card overflow-hidden flex flex-col">
          {!seleccionado ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageSquare className="w-12 h-12 text-slate-300 mb-3"/>
              <p className="text-slate-500 font-medium">Selecciona un empleado</p>
              <p className="text-slate-400 text-sm mt-1">Elige una conversación de la lista</p>
            </div>
          ) : (
            <>
              {/* Header chat */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-700">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{backgroundColor:seleccionado.avatar_color||'#6366f1'}}>
                  {getInitials(seleccionado.nombre)}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{seleccionado.nombre}</p>
                  <p className="text-xs text-slate-400 capitalize">{seleccionado.puesto}</p>
                </div>
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {mensajes.length===0 && <p className="text-center text-slate-400 text-sm py-8">Inicia la conversación</p>}
                {mensajes.map((msg,i) => {
                  const esAdmin = msg.remitente_id === adminId
                  const prevMsg = mensajes[i-1]
                  const mismaFecha = prevMsg && msg.created_at.slice(0,10)===prevMsg.created_at.slice(0,10)
                  return (
                    <div key={msg.id}>
                      {!mismaFecha && <p className="text-center text-xs text-slate-400 my-2">{formatFecha(msg.created_at)}</p>}
                      <div className={`flex ${esAdmin?'justify-end':'justify-start'}`}>
                        <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${esAdmin?'bg-indigo-600 text-white rounded-br-sm':'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-sm'}`}>
                          <p>{msg.contenido}</p>
                          <p className={`text-[10px] mt-1 ${esAdmin?'text-indigo-200':'text-slate-400'}`}>{formatHora(msg.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef}/>
              </div>

              {/* Input */}
              <form onSubmit={enviar} className="flex items-center gap-3 px-5 py-4 border-t border-slate-100 dark:border-slate-700">
                <input value={texto} onChange={e=>setTexto(e.target.value)} className="input flex-1"
                  placeholder={`Escribe a ${seleccionado.nombre}…`} disabled={sending}/>
                <button type="submit" disabled={!texto.trim()||sending} className="btn-primary px-4 py-2">
                  <Send className="w-4 h-4"/>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}