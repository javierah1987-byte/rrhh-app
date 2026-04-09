'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Bell, Plus, Trash2, Calendar } from 'lucide-react'

type Aviso = { id: string; titulo: string; contenido: string | null; fecha: string; activo: boolean }

export default function AvisosPage() {
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadAvisos() }, [])

  async function loadAvisos() {
    const { data } = await supabase.from('avisos').select('*').order('fecha', { ascending: false })
    setAvisos(data || [])
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('avisos').insert({ titulo, contenido, fecha: new Date().toISOString().slice(0,10), activo: true })
    setTitulo(''); setContenido(''); setShowForm(false); setSaving(false)
    loadAvisos()
  }

  async function toggleActivo(aviso: Aviso) {
    await supabase.from('avisos').update({ activo: !aviso.activo }).eq('id', aviso.id)
    loadAvisos()
  }

  async function handleDelete(id: string) {
    await supabase.from('avisos').delete().eq('id', id)
    loadAvisos()
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Avisos</h1>
          <p className="text-sm text-slate-500 mt-1">Comunicaciones internas para el equipo</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus className="w-4 h-4" />{showForm ? 'Cancelar' : 'Nuevo aviso'}
        </button>
      </div>

      {showForm && (
        <div className="card p-6 mb-5">
          <h3 className="font-semibold text-slate-900 mb-4">Crear aviso</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="label">Título</label>
              <input value={titulo} onChange={e=>setTitulo(e.target.value)} className="input" placeholder="Título del aviso" required />
            </div>
            <div>
              <label className="label">Contenido</label>
              <textarea value={contenido} onChange={e=>setContenido(e.target.value)} className="input" rows={4} placeholder="Descripción del aviso..." />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Guardando…' : 'Publicar aviso'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>
      ) : avisos.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No hay avisos publicados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {avisos.map(aviso => (
            <div key={aviso.id} className={`card p-5 ${!aviso.activo ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${aviso.activo ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                    <Bell className={`w-4 h-4 ${aviso.activo ? 'text-indigo-600' : 'text-slate-400'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900">{aviso.titulo}</h3>
                      <span className={`badge ${aviso.activo ? 'badge-indigo' : 'badge-slate'}`}>{aviso.activo ? 'Activo' : 'Inactivo'}</span>
                    </div>
                    {aviso.contenido && <p className="text-sm text-slate-600 mb-2">{aviso.contenido}</p>}
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Calendar className="w-3 h-3" />
                      {new Date(aviso.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleActivo(aviso)} className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-colors ${aviso.activo ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50'}`}>
                    {aviso.activo ? 'Desactivar' : 'Activar'}
                  </button>
                  <button onClick={() => handleDelete(aviso.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}