'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Building2, Save, Loader2, CheckCircle, AlertCircle, Globe, Phone, MapPin, FileText, Users } from 'lucide-react'

type Empresa = {
  id: string; nombre: string; cif: string|null; email_contacto: string|null
  telefono: string|null; direccion: string|null; ciudad: string|null
  codigo_postal: string|null; pais: string; logo_url: string|null
  sector: string|null; tamanho: string|null; web: string|null
  created_at: string
}

export default function EmpresaPage() {
  const [empresa, setEmpresa]   = useState<Empresa|null>(null)
  const [loading, setLoading]   = useState(true)
  const [saving,  setSaving]    = useState(false)
  const [ok,      setOk]        = useState('')
  const [err,     setErr]       = useState('')
  const [form,    setForm]      = useState<Partial<Empresa>>({})
  const [stats,   setStats]     = useState({ empleados: 0, fichajes_mes: 0, documentos: 0 })

  const cargar = useCallback(async () => {
    // Obtener empresa del usuario autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: emp } = await supabase.from('empleados').select('empresa_id').eq('user_id', user.id).single()
    
    let empresaData: Empresa|null = null
    if ((emp as any)?.empresa_id) {
      const { data: e } = await supabase.from('empresas').select('*').eq('id', (emp as any).empresa_id).single()
      empresaData = e as Empresa|null
    }
    if (!empresaData) {
      const { data: e } = await supabase.from('empresas').select('*').limit(1).single()
      empresaData = e as Empresa|null
    }
    
    if (empresaData) {
      setEmpresa(empresaData)
      setForm(empresaData)
    }

    // Stats
    const hoy = new Date()
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString()
    const [{ count: c1 }, { count: c2 }, { count: c3 }] = await Promise.all([
      supabase.from('empleados').select('*',{count:'exact',head:true}).eq('estado','activo'),
      supabase.from('fichajes').select('*',{count:'exact',head:true}).gte('created_at',inicioMes),
      supabase.from('documentos').select('*',{count:'exact',head:true}),
    ])
    setStats({ empleados: c1||0, fichajes_mes: c2||0, documentos: c3||0 })
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const upd = (k: keyof Empresa) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  async function guardar() {
    if (!empresa) return
    setSaving(true); setErr(''); setOk('')
    const { error } = await supabase.from('empresas').update({
      nombre: form.nombre, cif: form.cif, email_contacto: form.email_contacto,
      telefono: form.telefono, direccion: form.direccion, ciudad: form.ciudad,
      codigo_postal: form.codigo_postal, pais: form.pais, sector: form.sector,
      tamanho: form.tamanho, web: form.web,
    }).eq('id', empresa.id)
    if (error) setErr('Error al guardar: ' + error.message)
    else { setOk('Datos guardados correctamente'); await cargar(); setTimeout(()=>setOk(''),3000) }
    setSaving(false)
  }

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin border-4 border-indigo-200 border-t-indigo-600"/></div>
  if (!empresa) return <div className="card p-8 text-center text-slate-500">No se encontró empresa configurada</div>

  return (
    <div className="max-w-2xl mx-auto">
      <div className="page-header mb-5">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-500"/>Mi empresa
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Datos e información de {empresa.nombre}</p>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon:Users,    label:'Empleados',   value:stats.empleados,    color:'text-indigo-600 bg-indigo-50' },
          { icon:FileText, label:'Documentos',  value:stats.documentos,   color:'text-emerald-600 bg-emerald-50' },
          { icon:Building2,label:'Fichajes mes',value:stats.fichajes_mes, color:'text-amber-600 bg-amber-50' },
        ].map(s => (
          <div key={s.label} className={`card p-4 text-center ${s.color.split(' ')[1]}`}>
            <p className={`text-2xl font-black ${s.color.split(' ')[0]}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {ok && <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 rounded-xl mb-4 text-sm text-emerald-700"><CheckCircle className="w-4 h-4"/>{ok}</div>}
      {err && <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl mb-4 text-sm text-red-700"><AlertCircle className="w-4 h-4"/>{err}</div>}

      <div className="card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Nombre de la empresa *</label>
            <input value={form.nombre||''} onChange={upd('nombre')} className="input w-full mt-1"/>
          </div>
          <div>
            <label className="label">CIF/NIF</label>
            <input value={form.cif||''} onChange={upd('cif')} placeholder="B12345678" className="input w-full mt-1"/>
          </div>
          <div>
            <label className="label">Sector</label>
            <select value={form.sector||''} onChange={upd('sector')} className="input w-full mt-1">
              <option value="">Sin especificar</option>
              {['Tecnología','Inmobiliaria','Construcción','Salud','Educación','Comercio','Hostelería','Transporte','Industria','Servicios','Otro'].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Email de contacto</label>
            <input type="email" value={form.email_contacto||''} onChange={upd('email_contacto')} className="input w-full mt-1"/>
          </div>
          <div>
            <label className="label">Teléfono</label>
            <input value={form.telefono||''} onChange={upd('telefono')} placeholder="+34 xxx xxx xxx" className="input w-full mt-1"/>
          </div>
          <div>
            <label className="label">Web</label>
            <input value={form.web||''} onChange={upd('web')} placeholder="https://empresa.com" className="input w-full mt-1"/>
          </div>
          <div>
            <label className="label">Tamaño</label>
            <select value={form.tamanho||''} onChange={upd('tamanho')} className="input w-full mt-1">
              <option value="">Sin especificar</option>
              {['1-10','11-50','51-200','201-500','500+'].map(t=><option key={t}>{t} empleados</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Dirección</label>
            <input value={form.direccion||''} onChange={upd('direccion')} placeholder="Calle, número, piso" className="input w-full mt-1"/>
          </div>
          <div>
            <label className="label">Ciudad</label>
            <input value={form.ciudad||''} onChange={upd('ciudad')} className="input w-full mt-1"/>
          </div>
          <div>
            <label className="label">Código Postal</label>
            <input value={form.codigo_postal||''} onChange={upd('codigo_postal')} className="input w-full mt-1"/>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700">
          <p className="text-xs text-slate-400">Empresa creada el {new Date(empresa.created_at).toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})}</p>
          <button onClick={guardar} disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin"/>Guardando…</> : <><Save className="w-4 h-4"/>Guardar cambios</>}
          </button>
        </div>
      </div>
    </div>
  )
}