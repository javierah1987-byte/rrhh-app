'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Send, MessageSquare } from 'lucide-react'

type Msg = { id:string; remitente_id:string; destinatario_id:string; contenido:string; leido:boolean; created_at:string }
type Admin = { id:string; nombre:string; avatar_color:string }

export default function EmpMensajesPage() {
  const [empId, setEmpId] = useState<string|null>(null)
  const [admin, setAdmin] = useState<Admin|null>(null)
  const [mensajes, setMensajes] = useState<Msg[]>([])
  const [texto, setTexto] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase.from('empleados').select('id').eq('user_id', data.user.id).single()
        .then(async ({ data: emp }) => {
          if (!emp) return
          setEmpId(emp.id)
          const { data: adminData } = await supabase.from('empleados').select('id,nombre,avatar_color').eq('rol','admin').single()
          setAdmin(adminData)
          const { data: msgs } = await supabase.from('mensajes').select('*')
            .or(`remitente_id.eq.${emp.id},destinatario_id.eq.${emp.id}`)
            .order('created_at')
          setMensajes(msgs||[])
          // Marcar como leídos
          await supabase.from('mensajes').update({leido:true}).eq('destinatario_id',emp.id)
        })
    })
    const ch = supabase.channel('mensajes-emp')
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'mensajes'},async () => {
        const { data: msgs } = await supabase.from('mensajes').select('*').order('created_at')
        setMensajes(msgs||[])
      }).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:'smooth'}) }, [mensajes])

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim() || !empId || !admin) return
    setSending(true)
    await supabase.from('mensajes').insert({ remitente_id:empId, destinatario_id:admin.id, contenido:texto })
    setTexto('')
    setSending(false)
  }

  function formatHora(ts:string) { return new Date(ts).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}) }
  function formatFecha(ts:string) { return new Date(ts).toLocaleDateString('es-ES',{day:'numeric',month:'short'}) }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mensajes</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Comunicación con Recursos Humanos</p>
        </div>
      </div>

      <div className="card overflow-hidden flex flex-col" style={{height:'calc(100vh - 200px)'}}>
        {/* Header */}
        {admin && (
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{backgroundColor:admin.avatar_color||'#6366f1'}}>
              {admin.nombre.split(' ').map((n:string)=>n[0]).join('').substring(0,2)}
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{admin.nombre}</p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400">Administrador · Recursos Humanos</p>
            </div>
          </div>
        )}

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {mensajes.length===0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="w-10 h-10 text-slate-300 mb-3"/>
              <p className="text-slate-500">Sin mensajes aún</p>
              <p className="text-slate-400 text-sm mt-1">Envía un mensaje a RRHH</p>
            </div>
          )}
          {mensajes.map((msg,i) => {
            const esMio = msg.remitente_id === empId
            const prevMsg = mensajes[i-1]
            const mismaFecha = prevMsg && msg.created_at.slice(0,10)===prevMsg.created_at.slice(0,10)
            return (
              <div key={msg.id}>
                {!mismaFecha && <p className="text-center text-xs text-slate-400 my-2">{formatFecha(msg.created_at)}</p>}
                <div className={`flex ${esMio?'justify-end':'justify-start'}`}>
                  <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${esMio?'bg-emerald-500 text-white rounded-br-sm':'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-sm'}`}>
                    <p>{msg.contenido}</p>
                    <p className={`text-[10px] mt-1 ${esMio?'text-emerald-100':'text-slate-400'}`}>{formatHora(msg.created_at)}</p>
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
            placeholder="Escribe tu mensaje a RRHH…" disabled={sending}/>
          <button type="submit" disabled={!texto.trim()||sending} className="btn-accent px-4 py-2">
            <Send className="w-4 h-4"/>
          </button>
        </form>
      </div>
    </div>
  )
}